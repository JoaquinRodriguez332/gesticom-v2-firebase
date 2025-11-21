"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { productosApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function EliminarProductoForm({ onProductoEliminado }: any) {
  const [id, setId] = useState("")
  const { token } = useAuth()
  const { toast } = useToast()

  const handleEliminar = async () => {
    if (!token || !id) return
    try {
      await productosApi.delete(id, token)
      toast({ title: "Producto eliminado" })
      onProductoEliminado()
      setId("")
    } catch (e) { toast({ title: "Error", variant: "destructive" }) }
  }

  return (
    <Card className="mt-6 border-destructive/50">
      <CardHeader><CardTitle className="text-destructive">Eliminar Producto por ID</CardTitle></CardHeader>
      <CardContent className="flex gap-2">
        <Input placeholder="ID del producto (Firebase ID)" value={id} onChange={e => setId(e.target.value)} />
        <Button variant="destructive" onClick={handleEliminar}>Eliminar</Button>
      </CardContent>
    </Card>
  )
}