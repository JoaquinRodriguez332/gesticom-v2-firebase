"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock, CheckCircle, Coffee, RotateCcw, LogOut, Calendar, RefreshCw } from "lucide-react"
import { useColacionStatus } from "@/hooks/useColacionStatus"
import { horariosApi, type RegistroHorario, ApiError } from "@/lib/api"
import DashboardHeader from "@/components/dashboard-header"
import emailjs from '@emailjs/browser'

export default function HorariosPage() {
  const { usuario, isAuthenticated, isLoading } = useAuth()
  const [registros, setRegistros] = useState<RegistroHorario[]>([])
  const [botonesDeshabilitados, setBotonesDeshabilitados] = useState<Record<string, boolean>>({})
  const [procesando, setProcesando] = useState<Record<string, boolean>>({})
  const [cargandoRegistros, setCargandoRegistros] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { iniciarColacion, terminarColacion } = useColacionStatus()

  // Definición de los botones con orden lógico
  const tipos = [
    {
      tipo: "entrada",
      label: "Marcar Entrada",
      icon: CheckCircle,
      color: "bg-green-600 hover:bg-green-700",
      colorDeshabilitado: "bg-gray-400",
      description: "Inicio de jornada laboral",
      emoji: "✅",
    },
    {
      tipo: "inicio_colacion",
      label: "Iniciar Colación",
      icon: Coffee,
      color: "bg-orange-500 hover:bg-orange-600",
      colorDeshabilitado: "bg-gray-400",
      description: "Pausa para comer (Bloquea ventas)",
      emoji: "🍽️",
    },
    {
      tipo: "fin_colacion",
      label: "Terminar Colación",
      icon: RotateCcw,
      color: "bg-blue-500 hover:bg-blue-600",
      colorDeshabilitado: "bg-gray-400",
      description: "Vuelta al trabajo",
      emoji: "🔄",
    },
    {
      tipo: "salida",
      label: "Marcar Salida",
      icon: LogOut,
      color: "bg-red-600 hover:bg-red-700",
      colorDeshabilitado: "bg-gray-400",
      description: "Fin de jornada laboral",
      emoji: "🚪",
    },
  ]

  // 🔥 Función para marcar asistencia con mejor manejo de errores
// 🔥 Función para marcar asistencia con mejor manejo de errores
 // 🔥 Función para marcar asistencia con EmailJS integrado
  const marcar = async (tipo: string) => {
    // 1. Validaciones básicas
    if (!usuario?.id) {
      toast({ variant: "destructive", title: "Error", description: "Inicia sesión nuevamente." })
      return
    }
    if (botonesDeshabilitados[tipo]) return
    if (procesando[tipo]) return

    setProcesando((prev) => ({ ...prev, [tipo]: true }))

    try {
      // 2. Guardar en Base de Datos (Firebase)
      await horariosApi.marcar(usuario.id, tipo as any)

      // ---------------------------------------------------------
      // 3. ENVIAR CORREO (Configuración dinámica)
      // ---------------------------------------------------------
      const fechaHora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
      
      const textos: Record<string, string> = {
        entrada: "Entrada ☀️",
        inicio_colacion: "Inicio de Colación 🍽️",
        fin_colacion: "Fin de Colación 🔄",
        salida: "Salida 🏠"
      };

      // AQUI ESTÁ EL CAMBIO: Usamos usuario.email
      // Si por alguna razón el usuario no tiene email, usamos uno de respaldo
      const emailParaEnviar = usuario.email || "joaquin.rodriguez.9905@gmail.com";

      const templateParams = {
        nombre_usuario: usuario.nombre || "Usuario",
        tipo_marca: textos[tipo] || tipo,
        hora: fechaHora,
        email_destino: emailParaEnviar // <--- Ahora es dinámico
      };

      // 👇 Reemplaza 'TU_PUBLIC_KEY_AQUI' por tu clave real
      await emailjs.send('+++++', '++++++', templateParams, '++++++');
      
      console.log(`✅ Correo enviado a ${emailParaEnviar}`);
      // ---------------------------------------------------------

      // 4. Feedback al usuario (Toast y actualización)
      const tipoInfo = tipos.find((t) => t.tipo === tipo)
      
      if (tipo === "inicio_colacion") {
          const horaActual = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
          iniciarColacion(horaActual)
          toast({ title: "Colación Iniciada", description: "Ventas bloqueadas", duration: 4000 })
      } else if (tipo === "fin_colacion") {
          terminarColacion()
          toast({ title: "Colación Terminada", description: "Ventas habilitadas", duration: 4000 })
      } else {
          toast({ title: "Marca Registrada", description: "Se ha enviado un comprobante a tu correo.", duration: 3000 })
      }

      await cargarRegistros()

    } catch (error) {
      console.error(`❌ Error general:`, error)
      // A veces falla el correo pero sí marca en la BD. 
      // Si es ApiError (error de BD), mostramos error. Si es de correo, no bloqueamos al usuario.
      if (error instanceof ApiError) {
         toast({ variant: "destructive", title: "Error", description: error.message })
      } else {
         // Si falló el correo pero marcó la asistencia, avisamos que fue parcial
         toast({ title: "Marca registrada", description: "Nota: No se pudo enviar el correo de respaldo.", className: "bg-yellow-50 text-yellow-900" })
         await cargarRegistros() // Recargamos igual porque sí se marcó en BD
      }
    } finally {
      setProcesando((prev) => ({ ...prev, [tipo]: false }))
    }
  }

  // 🔥 Función optimizada para cargar registros con useCallback
  const cargarRegistros = useCallback(async () => {
    if (!usuario?.id) {
      console.warn("⚠️ No hay usuario autenticado")
      return
    }

    setCargandoRegistros(true)

    try {
      console.log("📅 Cargando registros para usuario:", usuario.id)

      const data = await horariosApi.getMisRegistros(usuario.id, 10)
      
      console.log(`✅ Registros cargados: ${data.length}`)
      setRegistros(data)

      // Calcular qué botones deben estar deshabilitados
      const hoy = new Date().toISOString().slice(0, 10)
      const hoyRegistro = data.find((r) => r.fecha === hoy)

      // Lógica de habilitación de botones basada en el orden correcto
      const nuevosEstados: Record<string, boolean> = {
        // Entrada: Solo deshabilitado si ya se marcó
        entrada: !!hoyRegistro?.hora_entrada,
        
        // Inicio colación: Solo disponible si ya se marcó entrada y no se ha iniciado colación
        inicio_colacion: !hoyRegistro?.hora_entrada || !!hoyRegistro?.hora_inicio_colacion,
        
        // Fin colación: Solo disponible si ya se inició colación y no se ha terminado
        fin_colacion: !hoyRegistro?.hora_inicio_colacion || !!hoyRegistro?.hora_fin_colacion,
        
        // Salida: Solo disponible si ya se marcó entrada y no se ha marcado salida
        salida: !hoyRegistro?.hora_entrada || !!hoyRegistro?.hora_salida,
      }

      setBotonesDeshabilitados(nuevosEstados)

      console.log("🔘 Estados de botones:", nuevosEstados)

    } catch (error) {
      console.error("❌ Error al cargar registros:", error)
      
      toast({
        variant: "destructive",
        title: "Error al cargar datos",
        description: "No se pudieron cargar los registros. Intenta recargar la página.",
      })
    } finally {
      setCargandoRegistros(false)
    }
  }, [usuario?.id, toast])

  // Formatear fecha legible
  const formatearFecha = (fecha: string): string => {
    try {
      const fechaObj = new Date(fecha + "T12:00:00.000Z")
      
      if (isNaN(fechaObj.getTime())) {
        return fecha
      }

      const hoy = new Date().toISOString().slice(0, 10)
      const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

      if (fecha === hoy) return "Hoy"
      if (fecha === ayer) return "Ayer"

      return fechaObj.toLocaleDateString("es-CL", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    } catch {
      return fecha
    }
  }

  // 🔥 Effect para cargar datos iniciales y redirigir si no está autenticado
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("❌ Usuario no autenticado, redirigiendo...")
        router.push("/login")
      } else if (usuario?.id) {
        cargarRegistros()
      }
    }
  }, [isAuthenticated, isLoading, usuario?.id, router, cargarRegistros])

  // 🔥 Pantalla de carga mientras verifica autenticación
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <DashboardHeader />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* TÍTULO Y NAVEGACIÓN */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7" /> Control de Asistencia
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Registra tus entradas, salidas y colaciones del día
              </p>
            </div>
          </div>

          {/* Botón de recarga manual */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarRegistros()}
            disabled={cargandoRegistros}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${cargandoRegistros ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* INFORMACIÓN DEL USUARIO */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuario actual</p>
                <p className="font-semibold text-gray-900">{usuario?.nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString("es-CL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTONES DE ACCIÓN */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Marcar Asistencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tipos.map((t) => {
              const isDisabled = botonesDeshabilitados[t.tipo]
              const isProcesando = procesando[t.tipo]

              return (
                <Card
                  key={t.tipo}
                  className={`transition-all border-2 ${
                    isDisabled
                      ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed"
                      : "hover:shadow-lg cursor-pointer bg-white border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => !isDisabled && !isProcesando && marcar(t.tipo)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-4 rounded-xl text-white transition-colors ${
                          isDisabled || isProcesando ? t.colorDeshabilitado : t.color
                        }`}
                      >
                        {isProcesando ? (
                          <RefreshCw className="h-6 w-6 animate-spin" />
                        ) : (
                          <t.icon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{t.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                        {isDisabled && !isProcesando && (
                          <span className="text-xs font-medium text-green-600 mt-2 block">
                            ✓ Completado
                          </span>
                        )}
                        {isProcesando && (
                          <span className="text-xs font-medium text-blue-600 mt-2 block">
                            Procesando...
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* TABLA DE HISTORIAL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Historial de Asistencia
            </CardTitle>
            <CardDescription>
              Tus últimos {registros.length} registros de asistencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cargandoRegistros ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500">Cargando registros...</p>
                </div>
              </div>
            ) : registros.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay registros disponibles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Comienza marcando tu entrada para crear tu primer registro
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Entrada
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        I. Colación
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        F. Colación
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Salida
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registros.map((reg, index) => (
                      <tr
                        key={reg.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index === 0 ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {formatearFecha(reg.fecha)}
                            {index === 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                Hoy
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${reg.hora_entrada ? "text-green-600" : "text-gray-400"}`}>
                            {reg.hora_entrada || "--:--"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${reg.hora_inicio_colacion ? "text-orange-600" : "text-gray-400"}`}>
                            {reg.hora_inicio_colacion || "--:--"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${reg.hora_fin_colacion ? "text-blue-600" : "text-gray-400"}`}>
                            {reg.hora_fin_colacion || "--:--"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${reg.hora_salida ? "text-red-600" : "text-gray-400"}`}>
                            {reg.hora_salida || "--:--"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}