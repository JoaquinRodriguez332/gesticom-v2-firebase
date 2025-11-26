"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, ShieldAlert } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header" // ✅ Header unificado
import UsuariosManagement from "@/components/usuarios-management"

export default function UsuariosPage() {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()

  // 1. Redirección si no está logueado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // 2. Redirección de seguridad (Solo Admins)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRole("admin")) {
      // Si un trabajador intenta entrar por URL directa, lo mandamos al dashboard
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, hasRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Protección extra de renderizado
  if (!isAuthenticated || !hasRole("admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Global */}
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

        {/* Componente Principal de Gestión (Tabla, Modales, etc.) */}
        <UsuariosManagement />
        
      </main>
    </div>
  )
}