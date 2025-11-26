"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Users,
  Shield,
  User,
  Mail,
  Calendar,
  Activity,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { usuariosApi, ApiError } from "@/lib/api"
import { formatDate } from "@/lib/helpers"
import { useDebounce } from "@/hooks/use-debounce"
import CrearUsuarioForm from "./crear-usuario-form"
import EditarUsuarioForm from "./editar-usuario-form"

interface Usuario {
  id: string 
  nombre: string
  rut: string
  email: string
  rol: "admin" | "trabajador"
  activo: boolean
  fecha_creacion: string
  ultimo_acceso: string | null
  creado_por_nombre: string | null
}

const UsuariosManagement: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroRol, setFiltroRol] = useState<string>("all")
  const [filtroActivo, setFiltroActivo] = useState<string>("all")
  
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null)
  const [usuarioToggle, setUsuarioToggle] = useState<Usuario | null>(null)
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null)
  const [showCrearForm, setShowCrearForm] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const { hasRole } = useAuth()
  const { toast } = useToast()

  // Debounce para búsqueda
  const debouncedBusqueda = useDebounce(busqueda, 300)

  const fetchUsuarios = async () => {
    setIsLoading(true)
    try {
      const data = await usuariosApi.getAll(debouncedBusqueda, filtroRol, filtroActivo)
      setUsuarios(data as unknown as Usuario[])
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [debouncedBusqueda, filtroRol, filtroActivo])

  const handleToggleStatus = async () => {
    if (!usuarioToggle) return

    try {
      await usuariosApi.toggleStatus(usuarioToggle.id, usuarioToggle.activo)

      toast({
        title: "Estado actualizado",
        description: `El usuario ahora está ${!usuarioToggle.activo ? 'activo' : 'inactivo'}.`,
      })

      fetchUsuarios()
    } catch (error) {
      console.error("Error al cambiar estado:", error)
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Error al cambiar estado",
        variant: "destructive",
      })
    } finally {
      setUsuarioToggle(null)
    }
  }

  const handleEliminar = async () => {
    if (!usuarioEliminar) return

    try {
      await usuariosApi.delete(usuarioEliminar.id)

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      })

      fetchUsuarios()
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Error al eliminar usuario",
        variant: "destructive",
      })
    } finally {
      setUsuarioEliminar(null)
    }
  }

  const getRolBadge = (rol: string) => {
    return rol === "admin" ? (
      <Badge variant="default" className="bg-purple-100 text-purple-800">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        Trabajador
      </Badge>
    )
  }

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Activo
      </Badge>
    ) : (
      <Badge variant="destructive">Inactivo</Badge>
    )
  }

  if (!hasRole("admin")) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
            <p className="text-muted-foreground">No tienes permisos para acceder a la gestión de usuarios.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Gestión de Usuarios</CardTitle>
            </div>
            <Button onClick={() => setShowCrearForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, RUT o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroRol} onValueChange={setFiltroRol}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="trabajador">Trabajador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroActivo} onValueChange={setFiltroActivo}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de usuarios */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {usuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                usuarios.map((usuario) => (
                  <Card key={usuario.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{usuario.nombre}</h3>
                            {getRolBadge(usuario.rol)}
                            {getStatusBadge(usuario.activo)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{usuario.rut}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{usuario.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Creado: {formatDate(usuario.fecha_creacion)}</span>
                            </div>
                            {usuario.ultimo_acceso && (
                              <div className="flex items-center space-x-1">
                                <Activity className="h-3 w-3" />
                                <span>Último acceso: {formatDate(usuario.ultimo_acceso)}</span>
                              </div>
                            )}
                          </div>

                          {usuario.creado_por_nombre && (
                            <p className="text-xs text-muted-foreground">
                              Creado por: {usuario.creado_por_nombre}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => setUsuarioEditar(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsuarioToggle(usuario)}
                            className={
                              usuario.activo
                                ? "text-orange-600 hover:text-orange-700"
                                : "text-green-600 hover:text-green-700"
                            }
                          >
                            {usuario.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsuarioEliminar(usuario)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <Dialog open={showCrearForm} onOpenChange={setShowCrearForm}>
        <DialogContent className="max-w-2xl">
          <CrearUsuarioForm
            onUsuarioCreado={() => {
              fetchUsuarios()
              setShowCrearForm(false)
            }}
            onClose={() => setShowCrearForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!usuarioEditar} onOpenChange={() => setUsuarioEditar(null)}>
        <DialogContent className="max-w-2xl">
          {usuarioEditar && (
            <EditarUsuarioForm
              usuario={usuarioEditar as any} 
              onUsuarioActualizado={() => {
                fetchUsuarios()
                setUsuarioEditar(null)
              }}
              onClose={() => setUsuarioEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!usuarioToggle} onOpenChange={() => setUsuarioToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {usuarioToggle?.activo ? "¿Desactivar usuario?" : "¿Activar usuario?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {usuarioToggle?.activo
                ? `¿Estás seguro de que quieres desactivar a ${usuarioToggle?.nombre}?`
                : `¿Estás seguro de que quieres activar a ${usuarioToggle?.nombre}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={
                usuarioToggle?.activo ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
              }
            >
              {usuarioToggle?.activo ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!usuarioEliminar} onOpenChange={() => setUsuarioEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a {usuarioEliminar?.nombre}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default UsuariosManagement