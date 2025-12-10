"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import DashboardHeader from "@/components/dashboard-header"
import { Package, ShoppingCart, Clock, Users, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import DashboardMetrics from "@/components/dashboard-metrics"

export default function DashboardPage() {
  const { usuario, isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  const navegarA = (ruta: string) => {
    router.push(ruta)
  }

  // 🎯 DEFINIR MÓDULOS SEGÚN ROL
  const modulosDisponibles = [
    // ✅ TODOS pueden ver Inventario
    {
      ruta: "/dashboard/inventario",
      icono: Package,
      titulo: "Inventario",
      descripcion: "Gestión de productos",
      color: "blue",
      disponible: isAdmin
    },
    // ✅ TODOS pueden ver Ventas
    {
      ruta: "/dashboard/ventas",
      icono: ShoppingCart,
      titulo: "Ventas",
      descripcion: "Registro de ventas",
      color: "green",
      disponible: true
    },
    // ✅ TODOS pueden ver Horarios
    {
      ruta: "/dashboard/horarios",
      icono: Clock,
      titulo: "Horarios",
      descripcion: "Control de asistencia",
      color: "purple",
      disponible: true
    },
    // 🔒 SOLO ADMIN: Usuarios
    {
      ruta: "/dashboard/usuarios",
      icono: Users,
      titulo: "Usuarios",
      descripcion: "Gestión de personal",
      color: "orange",
      disponible: isAdmin
    },
    // 🔒 SOLO ADMIN: Reportes
    {
      ruta: "/dashboard/reportes",
      icono: BarChart3,
      titulo: "Reportes",
      descripcion: "Análisis y estadísticas",
      color: "indigo",
      disponible: isAdmin
    },
  ]

  // Filtrar solo los disponibles
  const modulos = modulosDisponibles.filter(m => m.disponible)

  // Separar en dos grupos
  const modulosOperativos = modulos.slice(0, 3) // Inventario, Ventas, Horarios
  const modulosAdmin = modulos.slice(3) // Usuarios, Reportes (si existe)

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "hover:border-blue-300" },
      green: { bg: "bg-green-50", text: "text-green-600", hover: "hover:border-green-300" },
      purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "hover:border-purple-300" },
      orange: { bg: "bg-orange-50", text: "text-orange-600", hover: "hover:border-orange-300" },
      indigo: { bg: "bg-indigo-50", text: "text-indigo-600", hover: "hover:border-indigo-300" },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* === SECCIÓN 1: RESUMEN DEL SISTEMA === */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Resumen del Sistema</h2>
          <DashboardMetrics /> 
        </section>

        {/* === SECCIÓN 2: MÓDULOS DEL SISTEMA === */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Módulos del Sistema</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">{usuario.nombre}</span>
              <span>•</span>
              <span className={isAdmin ? "text-purple-600 font-semibold" : "text-gray-600"}>
                {isAdmin ? "👑 Administrador" : "👤 Trabajador"}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            
            {/* Módulos Operativos (Todos los usuarios) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {modulosOperativos.map((modulo) => {
                const Icon = modulo.icono
                const colors = getColorClasses(modulo.color)
                
                return (
                  <Card 
                    key={modulo.ruta}
                    className={`hover:shadow-lg transition-all cursor-pointer border-gray-200 ${colors.hover} group`}
                    onClick={() => navegarA(modulo.ruta)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-8 h-48">
                      <div className={`h-14 w-14 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">{modulo.titulo}</h3>
                      <p className="text-sm text-gray-500 mt-1">{modulo.descripcion}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Módulos Administrativos (Solo Admin) */}
            {modulosAdmin.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {modulosAdmin.map((modulo) => {
                  const Icon = modulo.icono
                  const colors = getColorClasses(modulo.color)
                  
                  return (
                    <Card 
                      key={modulo.ruta}
                      className={`hover:shadow-lg transition-all cursor-pointer border-gray-200 ${colors.hover} group`}
                      onClick={() => navegarA(modulo.ruta)}
                    >
                      <CardContent className="flex flex-col items-center justify-center p-8 h-48">
                        <div className={`h-14 w-14 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{modulo.titulo}</h3>
                        <p className="text-sm text-gray-500 mt-1">{modulo.descripcion}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

          </div>
          
          {/* Info del usuario */}
          <div className="text-center mt-8 text-sm text-gray-400">
            <p>
              {isAdmin 
                ? "🔓 Acceso completo a todos los módulos del sistema" 
                : "📋 Acceso a módulos operativos (Inventario, Ventas, Horarios)"}
            </p>
          </div>

        </section>
      </main>
    </div>
  )
}
