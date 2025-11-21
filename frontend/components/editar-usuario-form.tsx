"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function EditarUsuarioForm({ usuario, onUsuarioActualizado, onClose }: any) {
  const [form, setForm] = useState({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
  const { token } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, rut: usuario.rut })
    })
    if (res.ok) {
      toast({ title: "Usuario actualizado" })
      onUsuarioActualizado()
    } else {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold">Editar Usuario</h2>
      <Input placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
      <Input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
      <Select value={form.rol} onValueChange={v => setForm({...form, rol: v})}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="vendedor">Vendedor</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="w-full">Guardar Cambios</Button>
    </form>
  )
}