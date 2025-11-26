"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
// Importar API
import { usuariosApi, ApiError } from "@/lib/api"

// INTERFAZ ACTUALIZADA (ID STRING)
interface Usuario {
  id: string 
  nombre: string
  rut: string
  email: string
  rol: "admin" | "trabajador"
  activo: boolean
}

interface Props {
  usuario: Usuario
  onUsuarioActualizado: () => void
  onClose: () => void
}

interface FormData {
  nombre: string
  email: string
  rol: "admin" | "trabajador"
}

const EditarUsuarioForm: React.FC<Props> = ({ usuario, onUsuarioActualizado, onClose }) => {
  const [form, setForm] = useState<FormData>({
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { usuario: currentUser } = useAuth()
  const { toast } = useToast()

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!form.nombre.trim()) errors.push("El nombre es requerido")
    if (!form.email.trim()) errors.push("El email es requerido")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (form.email && !emailRegex.test(form.email)) {
      errors.push("El formato del email es inválido")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: "Errores de validación",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Uso de la API actualizada
      await usuariosApi.update(usuario.id, {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        rol: form.rol,
      })

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se han guardado exitosamente",
      })

      onUsuarioActualizado()
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Error al actualizar usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Comparación de IDs como string
  const canEditRole = currentUser?.rol === "admin" && String(currentUser?.id) !== String(usuario.id)

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center space-x-2">
          <Edit className="h-5 w-5 text-primary" />
          <DialogTitle>Editar Usuario</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre Completo</Label>
          <Input id="nombre" value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rut">RUT</Label>
          <Input id="rut" value={usuario.rut} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">El RUT no se puede modificar</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rol">Rol</Label>
          <Select value={form.rol} onValueChange={(value) => handleChange("rol", value)} disabled={!canEditRole}>
            <SelectTrigger className={!canEditRole ? "bg-muted" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trabajador">Trabajador</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {!canEditRole && (
            <p className="text-xs text-muted-foreground">
              {String(currentUser?.id) === String(usuario.id)
                ? "No puedes cambiar tu propio rol"
                : "Solo los administradores pueden cambiar roles"}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditarUsuarioForm