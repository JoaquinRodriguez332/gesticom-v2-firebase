"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { productosApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function ActualizarProductoForm({ producto, onProductoActualizado, onClose }: any) {
  const [form, setForm] = useState({ ...producto })
  const { token } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!token) return
    try {
      await productosApi.update(producto.id, form, token)
      toast({ title: "Actualizado" })
      onProductoActualizado()
    } catch (e) { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.name === "precio" || e.target.name === "stock" ? Number(e.target.value) : e.target.value })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold">Editar {producto.nombre}</h3>
      <Input name="nombre" value={form.nombre} onChange={handleChange} required />
      <div className="grid grid-cols-2 gap-4">
        <Input name="precio" type="number" value={form.precio} onChange={handleChange} required />
        <Input name="stock" type="number" value={form.stock} onChange={handleChange} required />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}