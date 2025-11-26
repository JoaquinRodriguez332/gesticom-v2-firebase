"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import DashboardHeader from "@/components/dashboard-header"
import { Package, ShoppingCart, Clock, Users, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  const { usuario, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated || !usuario) {
    return null
  }

  // Función simple de navegación
  const navegarA = (ruta: string) => {
    router.push(ruta)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 1. Header (Manteniendo el que ya funciona) */}
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 2. Sección de Métricas (Tal cual tu diseño original) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Resumen del Sistema</h2>
    
        </div>

        {/* 3. Módulos del Sistema (Grilla centrada original) */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Módulos del Sistema</h2>
          
          <div className="flex flex-col items-center gap-8">
            
            {/* Primera Fila: 3 Tarjetas (Inventario, Ventas, Horarios) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
              
              {/* Inventario */}
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-gray-200"
                onClick={() => navegarA("/dashboard/inventario")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-40">
                  <div className="h-12 w-12 rounded-lg border flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Inventario</h3>
                  <p className="text-xs text-gray-500 mt-1">Gestión de productos</p>
                </CardContent>
              </Card>

              {/* Ventas */}
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-gray-200"
                onClick={() => navegarA("/dashboard/ventas")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-40">
                  <div className="h-12 w-12 rounded-lg border flex items-center justify-center mb-4">
                    <ShoppingCart className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Ventas</h3>
                  <p className="text-xs text-gray-500 mt-1">Registro de ventas</p>
                </CardContent>
              </Card>

              {/* Horarios */}
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-gray-200"
                onClick={() => navegarA("/dashboard/horarios")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-40">
                  <div className="h-12 w-12 rounded-lg border flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Horarios</h3>
                  <p className="text-xs text-gray-500 mt-1">Control de asistencia</p>
                </CardContent>
              </Card>
            </div>

            {/* Segunda Fila: 2 Tarjetas (Usuarios, Reportes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
              
              {/* Usuarios */}
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-gray-200"
                onClick={() => navegarA("/dashboard/usuarios")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-40">
                  <div className="h-12 w-12 rounded-lg border flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Usuarios</h3>
                  <p className="text-xs text-gray-500 mt-1">Gestión de personal</p>
                </CardContent>
              </Card>

              {/* Reportes */}
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-gray-200"
                onClick={() => navegarA("/dashboard/reportes")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-40">
                  <div className="h-12 w-12 rounded-lg border flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Reportes</h3>
                  <p className="text-xs text-gray-500 mt-1">Análisis y estadísticas</p>
                </CardContent>
              </Card>
            </div>

          </div>
          
          <div className="text-center mt-12 text-sm text-gray-500 space-y-1">
            <p>Haz clic en cualquier módulo para acceder a sus funciones</p>
            <p className="text-xs">
              Bienvenido, {usuario.nombre} • Rol: {usuario.rol}
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}