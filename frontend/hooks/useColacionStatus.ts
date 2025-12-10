// hooks/useColacionStatus.ts
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { horariosApi } from "@/lib/api"

export function useColacionStatus() {
  const [enColacion, setEnColacion] = useState(false)
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const { usuario } = useAuth()

  // Verificar estado al cargar
  useEffect(() => {
    const verificarEstado = async () => {
      if (!usuario?.id) return

      try {
        const estado = await horariosApi.getEstadoColacion(usuario.id)
        setEnColacion(estado.en_colacion)
        setHoraInicio(estado.hora_inicio || null)
      } catch (error) {
        console.error("Error al verificar estado de colación:", error)
      }
    }

    verificarEstado()

    // Verificar cada 30 segundos
    const interval = setInterval(verificarEstado, 30000)
    return () => clearInterval(interval)
  }, [usuario?.id])

  const iniciarColacion = (hora: string) => {
    setEnColacion(true)
    setHoraInicio(hora)
  }

  const terminarColacion = () => {
    setEnColacion(false)
    setHoraInicio(null)
  }

  return {
    enColacion,
    horaInicio,
    iniciarColacion,
    terminarColacion,
  }
}