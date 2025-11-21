"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { productosApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function CrearProductoForm({ onProductoAgregado }: any) {
  const [form, setForm] = useState({ codigo: "", nombre: "", descripcion: "", precio: 0, stock: 0, categoria: "", proveedor: "" })
  const { token } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!token) return
    try {
      await productosApi.create(form, token)
      toast({ title: "Producto creado" })
      onProductoAgregado()
      setForm({ codigo: "", nombre: "", descripcion: "", precio: 0, stock: 0, categoria: "", proveedor: "" })
    } catch (e) { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.name === "precio" || e.target.name === "stock" ? Number(e.target.value) : e.target.value })

  return (
    <Card><CardHeader><CardTitle>Nuevo Producto</CardTitle></CardHeader><CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="codigo" placeholder="Código" value={form.codigo} onChange={handleChange} required />
        <Input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
        <div className="grid grid-cols-2 gap-4">
          <Input name="precio" type="number" placeholder="Precio" value={form.precio || ""} onChange={handleChange} required />
          <Input name="stock" type="number" placeholder="Stock" value={form.stock || ""} onChange={handleChange} required />
        </div>
        <Input name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
        <Input name="proveedor" placeholder="Proveedor" value={form.proveedor} onChange={handleChange} required />
        <Button type="submit" className="w-full">Crear</Button>
      </form>
    </CardContent></Card>
  )
}