"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing, Package, DollarSign, Check, Trash2, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { notificacionesApi, type Notificacion } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NotificacionesPanel: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const { isAuthenticated } = useAuth()

  const fetchNotificaciones = async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const data = await notificacionesApi.getAll()
      setNotificaciones(data)
    } catch (error) {
      console.error("Error cargando notificaciones:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificaciones()
    const interval = setInterval(fetchNotificaciones, 30000) // Cada 30 seg
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const marcarComoLeida = async (id: string) => {
    try {
      await notificacionesApi.markAsRead(id)
      // Actualización optimista local
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, estado: "leida" } : n)))
    } catch (error) {
      console.error(error)
    }
  }

  const eliminarNotificacion = async (id: string) => {
    try {
      await notificacionesApi.delete(id)
      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case "alerta": return <Package className="h-4 w-4" />
      case "error": return <Package className="h-4 w-4" /> // Sin stock
      case "info": return <DollarSign className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getEstiloIcono = (tipo: string) => {
    switch (tipo) {
      case "error": return "bg-red-100 text-red-600"
      case "alerta": return "bg-orange-100 text-orange-600"
      case "info": return "bg-blue-100 text-blue-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const notificacionesActivas = notificaciones.filter((n) => n.estado === "activa")
  const listaMostrar = showAll ? notificaciones : notificaciones.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent border-0 hover:bg-gray-100">
          {notificacionesActivas.length > 0 ? (
            <BellRing className="h-5 w-5 text-gray-600 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 text-gray-600" />
          )}
          {notificacionesActivas.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
            >
              {notificacionesActivas.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 shadow-xl border-gray-200">
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <span className="font-bold">Notificaciones</span>
          {notificacionesActivas.length > 0 && <Badge variant="secondary">{notificacionesActivas.length} nuevas</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading && notificaciones.length === 0 ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-gray-900 mx-auto" /></div>
        ) : notificaciones.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            <Bell className="h-8 w-8 mx-auto opacity-20" />
            <p className="text-sm">Todo tranquilo por aquí</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {listaMostrar.map((notif) => (
              <DropdownMenuItem key={notif.id} className="p-0 focus:bg-transparent cursor-default">
                <div className={`w-full border-b p-3 transition-colors ${notif.estado === 'activa' ? 'bg-blue-50/50' : 'bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full flex-shrink-0 ${getEstiloIcono(notif.tipo)}`}>
                      {getIcono(notif.tipo)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm leading-snug ${notif.estado === 'activa' ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {notif.mensaje}
                      </p>
                      
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-400">Hace un momento</span>
                        <div className="flex gap-1">
                          {notif.estado === "activa" && (
                            <Button 
                              variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600"
                              onClick={(e) => { e.preventDefault(); marcarComoLeida(notif.id) }}
                              title="Marcar como leída"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => { e.preventDefault(); eliminarNotificacion(notif.id) }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificacionesPanel