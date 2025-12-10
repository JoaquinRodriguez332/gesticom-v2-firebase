"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  Package,
  DollarSign,
  AlertTriangle,
  Download,
  Calendar,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { reportesApi, productosApi, type ReporteVentas, type ReporteInventario, type ReporteHorarios } from "@/lib/api"

// 🔹 Importamos las funciones reales de exportación
import {
  exportVentasDiarias,
  exportInventarioCategoria,
  exportAsistencia,
} from "@/lib/export-csv"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

// Función para formatear CLP
const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ReportesPage() {
  const { usuario, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [periodo, setPeriodo] = useState("30")

  // Estados para reportes
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas | null>(null)
  const [reporteInventario, setReporteInventario] = useState<ReporteInventario | null>(null)
  const [reporteHorarios, setReporteHorarios] = useState<ReporteHorarios | null>(null)
  const [productosStockCritico, setProductosStockCritico] = useState<any[]>([])

  // Establecer fechas por defecto
  useEffect(() => {
    const hoy = new Date()
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

    setFechaFin(hoy.toISOString().split("T")[0])
    setFechaInicio(hace30Dias.toISOString().split("T")[0])
  }, [])

  // Cargar reportes
  const cargarReportes = useCallback(async () => {
    if (!usuario?.id) return

    setIsLoading(true)
    try {
      console.log("📊 Cargando reportes completos...")

      const [ventas, inventario, horarios, stockCritico] = await Promise.all([
        reportesApi.getReporteVentas(fechaInicio, fechaFin),
        reportesApi.getReporteInventario(),
        reportesApi.getReporteHorarios(fechaInicio, fechaFin),
        reportesApi.getProductosStockCritico(),
      ])

      setReporteVentas(ventas)
      setReporteInventario(inventario)
      setReporteHorarios(horarios)
      setProductosStockCritico(stockCritico)

      console.log("✅ Reportes cargados correctamente")
    } catch (error) {
      console.error("❌ Error al cargar reportes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [usuario?.id, fechaInicio, fechaFin])

  // Cargar al montar y cuando cambien las fechas
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    } else if (isAuthenticated && usuario?.id && fechaInicio && fechaFin) {
      cargarReportes()
    }
  }, [authLoading, isAuthenticated, usuario?.id, fechaInicio, fechaFin, cargarReportes, router])

  // Actualizar fechas según período seleccionado
  useEffect(() => {
    if (periodo) {
      const hoy = new Date()
      const dias = parseInt(periodo)
      const inicio = new Date(hoy.getTime() - dias * 24 * 60 * 60 * 1000)

      setFechaFin(hoy.toISOString().split("T")[0])
      setFechaInicio(inicio.toISOString().split("T")[0])
    }
  }, [periodo])

  // 🔹 Exportar reportes (misma lógica que tu ejemplo funcional)
  const exportarReporte = (tipo: string) => {
    console.log(`📥 Exportando reporte: ${tipo}`)

    if (tipo === "ventas-dia") {
      if (reporteVentas?.ventas_por_dia && reporteVentas.ventas_por_dia.length > 0) {
        exportVentasDiarias(reporteVentas.ventas_por_dia)
      } else {
        alert("No hay datos de ventas para exportar")
      }
    } else if (tipo === "inventario-categoria") {
      if (
        reporteInventario?.inventario_por_categoria &&
        reporteInventario.inventario_por_categoria.length > 0
      ) {
        exportInventarioCategoria(reporteInventario.inventario_por_categoria)
      } else {
        alert("No hay datos de inventario por categoría para exportar")
      }
    } else if (tipo === "asistencia") {
      if (
        reporteHorarios?.asistencia_por_usuario &&
        reporteHorarios.asistencia_por_usuario.length > 0
      ) {
        exportAsistencia(reporteHorarios.asistencia_por_usuario)
      } else {
        alert("No hay registros de asistencia para exportar")
      }
    } else {
      alert("Función de exportación no configurada para este tipo.")
    }
  }

  // Formatear fecha legible
  const formatearFecha = (fecha: string): string => {
    try {
      return new Date(fecha).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      })
    } catch {
      return fecha
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-8 w-8" /> Reportes y Análisis
              </h1>
              <p className="text-gray-600 mt-1">Estadísticas completas del negocio</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={cargarReportes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {/* FILTROS DE PERÍODO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
            <CardDescription>Selecciona el rango de fechas para analizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="periodo">Período Rápido</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                    <SelectItem value="180">Últimos 6 meses</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fecha-fin">Fecha Fin</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={cargarReportes} className="w-full" disabled={isLoading}>
                  {isLoading ? "Cargando..." : "Aplicar Filtros"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-16 w-16 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Generando reportes...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPIs PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ventas Totales */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCLP(reporteVentas?.ventas_totales || 0)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {reporteVentas?.cantidad_ventas || 0} ventas
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Productos Vendidos */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reporteVentas?.productos_vendidos || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Promedio: {formatCLP(reporteVentas?.promedio_venta || 0)}
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Valor Inventario */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {reporteInventario?.valor_inventario_total || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {reporteInventario?.total_productos || 0} productos
                      </p>
                    </div>
                    <BarChart3 className="h-10 w-10 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Stock Crítico */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reporteInventario?.productos_stock_critico || 0}
                      </p>
                      <p className="text-sm text-red-500 mt-1">
                        {reporteInventario?.productos_sin_stock || 0} sin stock
                      </p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* TABS DE REPORTES */}
            <Tabs defaultValue="ventas" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ventas">📊 Ventas</TabsTrigger>
                <TabsTrigger value="inventario">📦 Inventario</TabsTrigger>
                <TabsTrigger value="horarios">⏰ Horarios</TabsTrigger>
              </TabsList>

              {/* REPORTE DE VENTAS */}
              <TabsContent value="ventas" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico Ventas por Día */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Ventas por Día</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportarReporte("ventas-dia")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {reporteVentas?.ventas_por_dia && reporteVentas.ventas_por_dia.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={reporteVentas.ventas_por_dia}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" tickFormatter={formatearFecha} />
                            <YAxis />
                            <Tooltip
                              formatter={(value: any) => [formatCLP(value), "Ventas"]}
                              labelFormatter={formatearFecha}
                            />
                            <Bar dataKey="total" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay datos de ventas en este período</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Vendedores */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rendimiento por Vendedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reporteVentas?.ventas_por_vendedor &&
                        reporteVentas.ventas_por_vendedor.length > 0 ? (
                          reporteVentas.ventas_por_vendedor.slice(0, 5).map((vendedor, index) => (
                            <div
                              key={vendedor.vendedor}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                    index === 0 ? "bg-yellow-500" : "bg-blue-500"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{vendedor.vendedor}</p>
                                  <p className="text-sm text-gray-600">
                                    {vendedor.cantidad} productos
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {formatCLP(vendedor.total)}
                                </p>
                                {index === 0 && <Badge className="mt-1">🏆 Top</Badge>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No hay datos de vendedores</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Productos Más Vendidos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-gray-700">#</th>
                            <th className="text-left p-3 font-medium text-gray-700">Producto</th>
                            <th className="text-right p-3 font-medium text-gray-700">Cantidad</th>
                            <th className="text-right p-3 font-medium text-gray-700">
                              Total Vendido
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteVentas?.productos_mas_vendidos &&
                          reporteVentas.productos_mas_vendidos.length > 0 ? (
                            reporteVentas.productos_mas_vendidos.map((producto, index) => (
                              <tr
                                key={producto.producto_nombre}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-medium">{producto.producto_nombre}</td>
                                <td className="p-3 text-right">{producto.cantidad}</td>
                                <td className="p-3 text-right font-medium text-green-600">
                                  {formatCLP(producto.total)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-gray-500">
                                No hay productos vendidos en este período
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* REPORTE DE INVENTARIO */}
              <TabsContent value="inventario" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Inventario por Categoría */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Inventario por Categoría</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportarReporte("inventario-categoria")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {reporteInventario?.inventario_por_categoria &&
                      reporteInventario.inventario_por_categoria.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={reporteInventario.inventario_por_categoria}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ categoria, valor }) =>
                                `${categoria}: ${formatCLP(valor)}`
                              }
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="valor"
                            >
                              {reporteInventario.inventario_por_categoria.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCLP(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay datos de categorías</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Productos con Mayor Valor */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Productos por Valor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reporteInventario?.productos_mayor_valor &&
                        reporteInventario.productos_mayor_valor.length > 0 ? (
                          reporteInventario.productos_mayor_valor
                            .slice(0, 5)
                            .map((producto, index) => (
                              <div
                                key={producto.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{producto.nombre}</p>
                                  <p className="text-sm text-gray-600">
                                    {producto.stock} unidades • {producto.categoria}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-purple-600">
                                    {formatCLP(producto.valor_total)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatCLP(producto.precio)} c/u
                                  </p>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No hay productos disponibles</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stock Crítico */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Productos con Stock Crítico
                    </CardTitle>
                    <CardDescription>Productos con 5 o menos unidades disponibles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {productosStockCritico.length > 0 ? (
                        productosStockCritico.map((producto) => (
                          <div
                            key={producto.id}
                            className={`p-4 rounded-lg border-2 ${
                              producto.stock === 0
                                ? "bg-red-50 border-red-200"
                                : "bg-orange-50 border-orange-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {producto.stock === 0 ? "🚫" : "⚠️"}
                                </span>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {producto.nombre}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Código: {producto.codigo} • {producto.categoria}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Proveedor: {producto.proveedor}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    producto.stock === 0 ? "destructive" : "secondary"
                                  }
                                >
                                  {producto.stock === 0 ? "Sin Stock" : "Stock Crítico"}
                                </Badge>
                                <p className="text-sm text-gray-600 mt-1">
                                  {producto.stock} unidades
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">¡Excelente!</h3>
                          <p>No hay productos con stock crítico</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* REPORTE DE HORARIOS */}
              <TabsContent value="horarios" className="space-y-6">
                {/* KPIs de Asistencia */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Registros</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {reporteHorarios?.total_registros || 0}
                          </p>
                        </div>
                        <Clock className="h-10 w-10 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Activos Hoy</p>
                        <p className="text-2xl font-bold text-green-600">
                          {reporteHorarios?.usuarios_activos_hoy || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Promedio Entrada</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {reporteHorarios?.promedio_entrada || "--:--"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">En Colación</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {reporteHorarios?.usuarios_en_colacion || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Asistencia por Usuario */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Asistencia por Usuario</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportarReporte("asistencia")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-gray-700">Usuario</th>
                            <th className="text-right p-3 font-medium text-gray-700">Total Días</th>
                            <th className="text-right p-3 font-medium text-gray-700">
                              Días Completos
                            </th>
                            <th className="text-right p-3 font-medium text-gray-700">
                              Promedio Llegada
                            </th>
                            <th className="text-center p-3 font-medium text-gray-700">
                              Cumplimiento
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteHorarios?.asistencia_por_usuario &&
                          reporteHorarios.asistencia_por_usuario.length > 0 ? (
                            reporteHorarios.asistencia_por_usuario.map((usuario) => {
                              const porcentaje =
                                usuario.total_dias > 0
                                  ? Math.round(
                                      (usuario.dias_completos / usuario.total_dias) * 100,
                                    )
                                  : 0

                              return (
                                <tr
                                  key={usuario.usuario_id}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="p-3 font-medium">
                                    {usuario.usuario_nombre}
                                  </td>
                                  <td className="p-3 text-right">{usuario.total_dias}</td>
                                  <td className="p-3 text-right">
                                    {usuario.dias_completos}
                                  </td>
                                  <td className="p-3 text-right">
                                    {usuario.promedio_llegada}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge
                                      variant={
                                        porcentaje >= 80
                                          ? "default"
                                          : porcentaje >= 50
                                          ? "secondary"
                                          : "destructive"
                                      }
                                    >
                                      {porcentaje}%
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-500">
                                No hay registros de horarios
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
