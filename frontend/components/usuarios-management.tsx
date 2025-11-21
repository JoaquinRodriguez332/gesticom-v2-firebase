"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Trash2, Users, Shield, User, Mail, Calendar, Activity } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import CrearUsuarioForm from "./crear-usuario-form"
import EditarUsuarioForm from "./editar-usuario-form"

// ID es string
interface Usuario { id: string; nombre: string; rut: string; email: string; rol: string; activo: boolean; fecha_creacion: any; ultimo_acceso: any }

export default function UsuariosManagement() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showCrear, setShowCrear] = useState(false)
  const [userEdit, setUserEdit] = useState<Usuario | null>(null)
  const { token, hasRole } = useAuth()
  const { toast } = useToast()

  const fetchUsuarios = async () => {
    if (!token) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data.map((u: any) => ({ ...u, id: String(u.id) })))
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchUsuarios() }, [token])

  if (!hasRole(["admin", "dueño"])) return <div className="p-8 text-center">Acceso Restringido</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between"><CardTitle>Usuarios</CardTitle><Button onClick={() => setShowCrear(true)}><Plus className="mr-2 h-4 w-4"/>Nuevo</Button></div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {usuarios.map(u => (
              <Card key={u.id}><CardContent className="p-4 flex justify-between">
                <div>
                  <h3 className="font-bold">{u.nombre} <Badge>{u.rol}</Badge></h3>
                  <p className="text-sm text-gray-500">{u.email} - {u.rut}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setUserEdit(u)}><Edit className="h-4 w-4"/></Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCrear} onOpenChange={setShowCrear}>
        <DialogContent><CrearUsuarioForm onUsuarioCreado={() => { fetchUsuarios(); setShowCrear(false) }} onClose={() => setShowCrear(false)} /></DialogContent>
      </Dialog>

      <Dialog open={!!userEdit} onOpenChange={() => setUserEdit(null)}>
        <DialogContent>{userEdit && <EditarUsuarioForm usuario={userEdit} onUsuarioActualizado={() => { fetchUsuarios(); setUserEdit(null) }} onClose={() => setUserEdit(null)} />}</DialogContent>
      </Dialog>
    </div>
  )
}