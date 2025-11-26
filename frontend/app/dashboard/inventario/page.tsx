"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Package } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header" // ✅ Usamos el header estándar
import CrearProductoForm from "@/components/crear-producto-form"
import InventarioList from "@/components/inventario-list"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function InventarioPage() {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()
  const [mostrarCrearForm, setMostrarCrearForm] = useState(false)
  const [reloadList, setReloadList] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Protección de ruta: Solo admin o roles autorizados deberían ver esto
  // (Opcional: Si quieres que todos vean inventario, quita este bloque)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRole("admin")) {
       // Si es trabajador y no tiene permiso, lo devolvemos (ajusta según tu lógica)
       // router.push("/dashboard") 
    }
  }, [isLoading, isAuthenticated, hasRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleProductoAgregado = () => {
    setReloadList(!reloadList)
    setMostrarCrearForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Global */}
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 2. Barra de herramientas superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <Package className="h-6 w-6" />
                Gestión de Inventario
              </h1>
              <p className="text-sm text-gray-500">
                Administra tus productos, stock y precios.
              </p>
            </div>
          </div>

          <Button onClick={() => setMostrarCrearForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* 3. Lista de Productos (Ya conectada a Firebase) */}
        <InventarioList reload={reloadList} />
      </main>

      {/* 4. Modal para crear producto */}
      <Dialog open={mostrarCrearForm} onOpenChange={setMostrarCrearForm}>
        <DialogContent className="max-w-2xl">
          {/* El título ya está dentro del componente CrearProductoForm en tu código original, 
              pero si lo necesitas fuera, puedes descomentar esto:
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
          </DialogHeader> 
          */}
          <CrearProductoForm onProductoAgregado={handleProductoAgregado} />
        </DialogContent>
      </Dialog>
    </div>
  )
}