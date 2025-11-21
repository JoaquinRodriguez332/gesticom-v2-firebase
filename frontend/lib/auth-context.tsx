"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface Usuario {
  id: string // ID es string en Firebase
  nombre: string
  rut: string
  email: string
  rol: "admin" | "vendedor" | "dueño" | "trabajador"
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken()
        setToken(idToken)

        const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUsuario({
            id: firebaseUser.uid,
            nombre: data.nombre || "Usuario",
            rut: data.rut || "",
            email: firebaseUser.email || "",
            rol: data.rol || "vendedor",
          })
        }
      } else {
        setUsuario(null)
        setToken(null)
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    router.push("/inventario")
  }

  const logout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const hasRole = (roles: string | string[]) => {
    if (!usuario) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(usuario.rol)
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, isLoading, isAuthenticated: !!usuario, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}