"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, ShieldAlert, Lock } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import UsuariosManagement from "@/components/usuarios-management"

export default function UsuariosPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  // 1. Redirección si no está logueado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // 2. Redirección de seguridad (Solo Admins)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      console.warn("🚫 Acceso denegado: Solo administradores")
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Protección extra de renderizado
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Lock className="h-16 w-16 mx-auto text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Acceso Restringido</h2>
          <p className="text-gray-600">Solo administradores pueden acceder a esta sección</p>
          <Button onClick={() => router.push("/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Barra de título y navegación */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="h-10 w-10"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gestión de Personal
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Zona administrativa: Control de accesos y roles.
            </p>
          </div>
        </div>

        {/* Componente Principal de Gestión */}
        <UsuariosManagement />
        
      </main>
    </div>
  )
}