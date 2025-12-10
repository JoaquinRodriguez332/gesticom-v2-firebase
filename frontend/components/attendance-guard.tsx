"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { horariosApi, type RegistroHorario } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, Coffee, Lock, LogIn } from "lucide-react"

type EstadoRazon = "sin_entrada" | "en_colacion" | "salida_marcada" | null

interface EstadoBloqueo {
  bloqueado: boolean
  razon: EstadoRazon
}

async function getRegistroHoy(usuarioId: string): Promise<RegistroHorario | null> {
  // Traemos algunos registros recientes y buscamos el de hoy
  const registros = await horariosApi.getMisRegistros(usuarioId, 10)
  const hoy = new Date().toISOString().slice(0, 10)
  return registros.find((r) => r.fecha === hoy) ?? null
}

export default function AttendanceGuard({ children }: { children: React.ReactNode }) {
  const { usuario, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState<EstadoBloqueo>({
    bloqueado: false,
    razon: null,
  })

  useEffect(() => {
    const verificarAcceso = async () => {
      // Si no hay sesión aún, no bloqueamos aquí (eso lo maneja tu auth)
      if (!isAuthenticated || !usuario) {
        setLoading(false)
        return
      }

      // IMPORTANTE: permitir SIEMPRE la página de horarios
      // para que el usuario pueda marcar entrada/fin colación/salida
      if (pathname === "/dashboard/horarios") {
        setEstado({ bloqueado: false, razon: null })
        setLoading(false)
        return
      }

      try {
        const registroHoy = await getRegistroHoy(usuario.id)

        // A) No marcó entrada
        if (!registroHoy || !registroHoy.hora_entrada) {
          setEstado({ bloqueado: true, razon: "sin_entrada" })
        }
        // B) Está en colación (inicio sí, fin no)
        else if (registroHoy.hora_inicio_colacion && !registroHoy.hora_fin_colacion) {
          setEstado({ bloqueado: true, razon: "en_colacion" })
        }
        // C) Ya marcó salida
        else if (registroHoy.hora_salida) {
          setEstado({ bloqueado: true, razon: "salida_marcada" })
        }
        // D) Todo ok
        else {
          setEstado({ bloqueado: false, razon: null })
        }
      } catch (error) {
        console.error("Error verificando asistencia:", error)
        // Si hay error al consultar, por seguridad podrías decidir bloquear
        // o dejar pasar. Aquí lo dejamos pasar para no romper el sistema:
        setEstado({ bloqueado: false, razon: null })
      } finally {
        setLoading(false)
      }
    }

    verificarAcceso()
  }, [pathname, isAuthenticated, usuario])

  // Mientras carga el estado de asistencia, no mostramos nada
  if (loading) return null

  // Si está bloqueado, mostramos pantalla de bloqueo
  if (estado.bloqueado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-red-100">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
              <Lock className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Acceso Restringido</CardTitle>
            <CardDescription>
              No puedes acceder a este módulo en tu estado actual.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            {estado.razon === "sin_entrada" && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-orange-800">
                <p className="font-medium flex items-center justify-center gap-2">
                  <LogIn className="h-5 w-5" /> No has marcado entrada
                </p>
                <p className="text-sm mt-1">
                  Debes iniciar tu jornada en el módulo de Horarios para usar el sistema.
                </p>
              </div>
            )}

            {estado.razon === "en_colacion" && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800">
                <p className="font-medium flex items-center justify-center gap-2">
                  <Coffee className="h-5 w-5" /> Estás en hora de colación
                </p>
                <p className="text-sm mt-1">
                  Marca el fin de tu descanso en el módulo de Horarios para continuar.
                </p>
              </div>
            )}

            {estado.razon === "salida_marcada" && (
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-gray-800">
                <p className="font-medium flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" /> Jornada finalizada
                </p>
                <p className="text-sm mt-1">
                  Ya marcaste tu salida por hoy. No puedes seguir usando los módulos.
                </p>
              </div>
            )}

            <Button
              className="w-full h-12 text-lg"
              onClick={() => router.push("/dashboard/horarios")}
            >
              Ir a Control de Asistencia
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si no hay bloqueo, renderizamos normalmente el dashboard
  return <>{children}</>
}
