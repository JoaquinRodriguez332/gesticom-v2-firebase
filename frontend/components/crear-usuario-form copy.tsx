"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Save, X, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Importamos API y clases
import { usuariosApi, ApiError } from "@/lib/api"

interface Props {
  onUsuarioCreado: () => void
  onClose: () => void
}

interface FormData {
  nombre: string
  rut: string
  email: string
  password: string
  confirmPassword: string
  rol: "admin" | "trabajador" | ""
}

const CrearUsuarioForm: React.FC<Props> = ({ onUsuarioCreado, onClose }) => {
  const [form, setForm] = useState<FormData>({
    nombre: "",
    rut: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const formatRUT = (rut: string) => {
    const cleaned = rut.replace(/[^0-9kK]/g, "")
    if (cleaned.length <= 1) return cleaned
    const number = cleaned.slice(0, -1)
    const dv = cleaned.slice(-1).toUpperCase()
    const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return `${formattedNumber}-${dv}`
  }

  const handleRUTChange = (value: string) => {
    const formatted = formatRUT(value)
    handleChange("rut", formatted)
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!form.nombre.trim()) errors.push("El nombre es requerido")
    if (!form.rut.trim()) errors.push("El RUT es requerido")
    if (!form.email.trim()) errors.push("El email es requerido")
    if (!form.password) errors.push("La contraseña es requerida")
    if (!form.confirmPassword) errors.push("Confirmar contraseña es requerido")
    if (!form.rol) errors.push("El rol es requerido")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (form.email && !emailRegex.test(form.email)) {
      errors.push("El formato del email es inválido")
    }

    const rutRegex = /^[0-9.]+-[0-9kK]$/
    if (form.rut && !rutRegex.test(form.rut)) {
      errors.push("El formato del RUT es inválido")
    }

    if (form.password.length < 6) { // Firebase pide min 6
      errors.push("La contraseña debe tener al menos 6 caracteres")
    }

    if (form.password !== form.confirmPassword) {
      errors.push("Las contraseñas no coinciden")
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
      // 1. Guardar datos en Firestore usando la API
      await usuariosApi.create({
        nombre: form.nombre.trim(),
        rut: formatRUT(form.rut.trim()),
        email: form.email.trim(),
        rol: form.rol,
        // Nota: No enviamos la password a Firestore (texto plano) por seguridad.
        // La password se usaría aquí si estuviéramos creando el Auth user.
      })

      toast({
        title: "Usuario creado",
        description: "El usuario se ha guardado en la base de datos.",
      })

      onUsuarioCreado()
    } catch (error) {
      console.error("Error al crear usuario:", error)
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Error al crear usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (El resto del formulario visual sigue igual, solo cambia la lógica de arriba) ... */}
        {/* Te lo dejo resumido, los inputs son los mismos que tenías */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              placeholder="Juan Pérez"
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              placeholder="12.345.678-9"
              value={form.rut}
              onChange={(e) => handleRUTChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@gesticom.cl"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rol">Rol</Label>
          <Select value={form.rol} onValueChange={(value) => handleChange("rol", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trabajador">Trabajador</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
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
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Usuario
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CrearUsuarioForm