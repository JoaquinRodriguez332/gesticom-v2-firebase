"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, Package } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { productosApi, type Producto } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import ActualizarProductoForm from "./actualizar-producto-form"
import EliminarProductoForm from "./eliminar-producto-form"

export default function InventarioList({ reload }: { reload: boolean }) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [prodEditar, setProdEditar] = useState<Producto | null>(null)
  const { token } = useAuth()

  const cargar = async () => {
    if (!token) return
    try {
      const data = await productosApi.getAll(token, busqueda)
      setProductos(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { cargar() }, [token, reload, busqueda])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Inventario</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div className="grid gap-4">
            {productos.map(p => (
              <Card key={p.id}><CardContent className="p-4 flex justify-between">
                <div>
                  <h3 className="font-bold">{p.nombre}</h3>
                  <p className="text-sm">Stock: {p.stock} | Precio: ${p.precio}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setProdEditar(p)}><Edit className="h-4 w-4"/></Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!prodEditar} onOpenChange={() => setProdEditar(null)}>
        <DialogContent>
          {prodEditar && <ActualizarProductoForm producto={prodEditar} onProductoActualizado={() => { cargar(); setProdEditar(null) }} onClose={() => setProdEditar(null)} />}
        </DialogContent>
      </Dialog>
      
      <EliminarProductoForm onProductoEliminado={cargar} />
    </div>
  )
}