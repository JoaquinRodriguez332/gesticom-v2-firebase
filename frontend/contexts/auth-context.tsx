"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: "admin" | "trabajador"
  rut?: string
  activo?: boolean
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Función para obtener el perfil del usuario desde Firestore
  // Función para obtener el perfil del usuario desde Firestore
const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<Usuario | null> => {
  try {
    const userDocRef = doc(db, "usuarios", firebaseUser.uid)   // deja esto como está por ahora
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("🔥 Perfil Firestore leído:", userData)

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        nombre: userData.nombre || "Usuario",
        // ⬇⬇⬇  FORZAR ADMIN PARA PRUEBAS  ⬇⬇⬇
        rol: "admin",
        // ⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆
        rut: userData.rut,
        activo: userData.activo ?? true,
      }
    } else {
      console.warn("⚠️ Usuario autenticado pero sin perfil en Firestore:", firebaseUser.uid)

      // Usuario existe en Auth pero no en Firestore
      // ⚠️ TAMBIÉN ADMIN POR DEFECTO PARA PRUEBAS
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        nombre: firebaseUser.email?.split("@")[0] || "Usuario",
        rol: "admin", // ← aquí también
      }
    }
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    return null
  }
}


  // Listener de cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true)

      if (firebaseUser) {
        // Usuario autenticado
        const idToken = await firebaseUser.getIdToken()
        const userProfile = await fetchUserProfile(firebaseUser)

        if (userProfile) {
          setUsuario(userProfile)
          setToken(idToken)
          
          console.log("✅ Usuario autenticado:", {
            email: userProfile.email,
            rol: userProfile.rol,
            nombre: userProfile.nombre
          })
        } else {
          console.error("❌ No se pudo cargar el perfil del usuario")
          await signOut(auth)
        }
      } else {
        // Usuario no autenticado
        setUsuario(null)
        setToken(null)
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Obtener perfil de Firestore
      const userProfile = await fetchUserProfile(firebaseUser)
      
      if (!userProfile) {
        throw new Error("No se encontró el perfil del usuario en la base de datos")
      }

      // Verificar si está activo
      if (userProfile.activo === false) {
        await signOut(auth)
        throw new Error("Tu cuenta ha sido desactivada. Contacta al administrador.")
      }

      const idToken = await firebaseUser.getIdToken()
      
      setUsuario(userProfile)
      setToken(idToken)

      console.log("✅ Login exitoso:", userProfile.nombre, "-", userProfile.rol)
      
    } catch (error: any) {
      console.error("❌ Error en login:", error)
      
      // Mensajes de error más amigables
      let errorMessage = "Error al iniciar sesión"
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este correo"
          break
        case "auth/wrong-password":
          errorMessage = "Contraseña incorrecta"
          break
        case "auth/invalid-email":
          errorMessage = "Correo electrónico inválido"
          break
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido deshabilitada"
          break
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos. Intenta más tarde"
          break
        default:
          errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUsuario(null)
      setToken(null)
      router.push("/login")
      console.log("✅ Logout exitoso")
    } catch (error) {
      console.error("❌ Error en logout:", error)
      throw error
    }
  }

  const hasRole = (role: string): boolean => {
    if (!usuario) return false
    return usuario.rol === role
  }

  const value: AuthContextType = {
    usuario,
    token,
    isAuthenticated: !!usuario,
    isLoading,
    login,
    logout,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}