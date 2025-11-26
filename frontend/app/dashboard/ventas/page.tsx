"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Package,
  Scan,
  History,
  Printer,
  CheckCircle,
  Receipt,
  ArrowLeft,
  Loader2
} from "lucide-react"

import DashboardHeader from "@/components/dashboard-header"
import { productosApi, ventasApi, type Producto, type Venta } from "@/lib/api"
import { formatearPrecio } from "@/lib/helpers"

// Interfaz local para el carrito
interface ItemCarrito {
  producto: Producto
  cantidad: number
  subtotal: number
}

export default function VentasPage() {
  const { usuario, isAuthenticated, isLoading: authLoading, hasRole } = useAuth()
  const router = useRouter()

  const [productos, setProductos] = useState<Producto[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  
  const [busqueda, setBusqueda] = useState("")
  const [codigoBarras, setCodigoBarras] = useState("")
  const [vistaActual, setVistaActual] = useState<"venta" | "historial">("venta")
  const [procesando, setProcesando] = useState(false)
  const [ventaCompletada, setVentaCompletada] = useState<Venta | null>(null)
  const [mostrarBoleta, setMostrarBoleta] = useState(false)

  // Carga inicial
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      cargarDatos()
    }
  }, [isAuthenticated, authLoading, router])

  const cargarDatos = async () => {
    try {
      const [productosData, ventasData] = await Promise.all([
        productosApi.getAll(),
        ventasApi.getAll()
      ])
      setProductos(productosData)
      setVentas(ventasData)
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({ 
        title: "Error", 
        description: "No se pudieron cargar los datos.", 
        variant: "destructive" 
      })
    }
  }

  // --- Lógica del Carrito ---

  const buscarPorCodigo = () => {
    if (!codigoBarras.trim()) return

    const producto = productos.find((p) => p.codigo === codigoBarras.trim())
    if (producto) {
      agregarAlCarrito(producto)
      setCodigoBarras("")
      toast({ title: "Producto agregado", description: producto.nombre })
    } else {
      toast({ 
        title: "No encontrado", 
        description: "Código no registrado", 
        variant: "destructive" 
      })
    }
  }

  const productosFiltrados = productos.filter(
    (producto) => 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      producto.codigo.includes(busqueda)
  )

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      toast({ 
        title: "Sin stock", 
        description: `No queda stock de ${producto.nombre}`, 
        variant: "destructive" 
      })
      return
    }

    const itemExistente = carrito.find((item) => item.producto.id === producto.id)

    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast({ 
          title: "Stock insuficiente", 
          description: "No puedes agregar más unidades de las disponibles.", 
          variant: "destructive" 
        })
        return
      }
      actualizarCantidad(producto.id, itemExistente.cantidad + 1)
    } else {
      const nuevoItem: ItemCarrito = {
        producto,
        cantidad: 1,
        subtotal: producto.precio,
      }
      setCarrito([...carrito, nuevoItem])
    }
  }

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId)
      return
    }

    const producto = productos.find((p) => p.id === productoId)
    if (producto && nuevaCantidad > producto.stock) {
      toast({ title: "Stock límite alcanzado", variant: "destructive" })
      return
    }

    setCarrito(
      carrito.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: item.producto.precio * nuevaCantidad,
            }
          : item,
      ),
    )
  }

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter((item) => item.producto.id !== productoId))
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0)
  }

  // --- Procesar Venta con Firebase ---

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast({ 
        title: "Carrito vacío", 
        description: "Agrega productos antes de procesar.", 
        variant: "destructive" 
      })
      return
    }

    setProcesando(true)
    try {
      const totalVenta = calcularTotal()
      
      const nuevaVenta = await ventasApi.create({
        total: totalVenta,
        fecha: new Date().toISOString(),
        vendedor_email: usuario?.email || "desconocido",
        estado: "completada",
        items: carrito.map(item => ({
          producto_id: item.producto.id,
          producto_nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio,
          subtotal: item.subtotal
        }))
      })

      setVentaCompletada(nuevaVenta)
      setMostrarBoleta(true)
      
      // Limpieza y recarga
      setCarrito([])
      cargarDatos()
      
      toast({ 
        title: "Venta exitosa", 
        description: "La venta se ha registrado correctamente." 
      })

    } catch (error) {
      console.error("Error al procesar venta:", error)
      toast({ 
        title: "Error", 
        description: "Hubo un problema al procesar la venta.", 
        variant: "destructive" 
      })
    } finally {
      setProcesando(false)
    }
  }

  const anularVenta = async (ventaId: string) => {
    if (!hasRole("admin")) {
      toast({
        title: "Permiso denegado",
        description: "Solo administradores pueden anular ventas",
        variant: "destructive"
      })
      return
    }

    if(!confirm("¿Estás seguro de anular esta venta? El stock será devuelto.")) return

    try {
      await ventasApi.anular(ventaId)
      toast({ 
        title: "Venta anulada", 
        description: "El stock ha sido restaurado." 
      })
      cargarDatos()
    } catch (error) {
      console.error(error)
      toast({ 
        title: "Error", 
        description: "No se pudo anular la venta.", 
        variant: "destructive" 
      })
    }
  }

  // --- Impresión ---

  const imprimirBoleta = () => {
    if (!ventaCompletada) return

    const ventana = window.open("", "_blank")
    if (!ventana) return

    const contenidoBoleta = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Boleta #${ventaCompletada.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 300px; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>GESTICOM</h2>
          <p>Boleta de Venta</p>
          <p>Ref: ${ventaCompletada.id.slice(0, 8)}</p>
          <p>${new Date(ventaCompletada.fecha).toLocaleString("es-CL")}</p>
          <p>Vendedor: ${ventaCompletada.vendedor_email}</p>
        </div>
        
        <div class="items">
          ${ventaCompletada.items
            .map(
              (item) => `
            <div class="item">
              <span>${item.cantidad}x ${item.producto_nombre}</span>
              <span>${formatearPrecio(item.subtotal)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        
        <div class="total">
          <div class="item">
            <span>TOTAL:</span>
            <span>${formatearPrecio(ventaCompletada.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
      </body>
      </html>
    `

    ventana.document.write(contenidoBoleta)
    ventana.document.close()
    ventana.print()
  }

  // Loading State
  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Barra Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Punto de Venta
              </h1>
              <p className="text-sm text-gray-500">Gestiona ventas y devoluciones</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={vistaActual === "venta" ? "default" : "outline"}
              onClick={() => setVistaActual("venta")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
            <Button
              variant={vistaActual === "historial" ? "default" : "outline"}
              onClick={() => setVistaActual("historial")}
            >
              <History className="h-4 w-4 mr-2" />
              Historial
            </Button>
          </div>
        </div>

        {vistaActual === "venta" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna Izquierda: Buscador y Catálogo */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Escáner */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Scan className="h-4 w-4 mr-2" /> Escáner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código de barras..."
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && buscarPorCodigo()}
                      autoFocus
                    />
                    <Button onClick={buscarPorCodigo}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Catálogo */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Package className="h-4 w-4 mr-2" /> Catálogo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Filtrar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="mb-4"
                  />
                  
                  <div className="h-[400px] overflow-y-auto pr-2 space-y-2">
                    {productosFiltrados.map((producto) => (
                      <div
                        key={producto.id}
                        onClick={() => agregarAlCarrito(producto)}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div>
                          <p className="font-medium text-sm">{producto.nombre}</p>
                          <p className="text-xs text-gray-500 font-mono">{producto.codigo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatearPrecio(producto.precio)}</p>
                          <Badge variant={producto.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                            Stock: {producto.stock}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {productosFiltrados.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No se encontraron productos</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Carrito */}
            <div className="space-y-6">
              <Card className="h-full flex flex-col border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Carrito</span>
                    <Badge variant="default">{carrito.length} Items</Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {carrito.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 min-h-[300px]">
                      <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                      <p>Carrito vacío</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                      {carrito.map((item) => (
                        <div key={item.producto.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.producto.nombre}</p>
                            <p className="text-xs text-gray-500">{formatearPrecio(item.producto.precio)} c/u</p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm w-8 text-center">{item.cantidad}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="font-bold text-sm">{formatearPrecio(item.subtotal)}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-400 hover:text-red-600" 
                              onClick={() => eliminarDelCarrito(item.producto.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 border-t mt-auto">
                    <div className="flex justify-between items-center mb-4 text-xl font-bold">
                      <span>Total</span>
                      <span>{formatearPrecio(calcularTotal())}</span>
                    </div>
                    <Button 
                      className="w-full h-12 text-lg" 
                      disabled={carrito.length === 0 || procesando}
                      onClick={procesarVenta}
                    >
                      {procesando ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Procesando...</>
                      ) : (
                        <><DollarSign className="h-5 w-5 mr-2" /> Pagar</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* VISTA HISTORIAL */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> Últimas Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ventas.map((venta) => (
                  <div 
                    key={venta.id} 
                    className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">#{venta.id.slice(0, 8)}...</span>
                        <Badge variant={venta.estado === "anulada" ? "destructive" : "default"}>
                          {venta.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        {new Date(venta.fecha).toLocaleString("es-CL")} 
                        <span>•</span> 
                        {venta.vendedor_email}
                      </p>
                      <div className="mt-2 text-sm text-gray-600">
                        {venta.items.map((it, idx) => (
                          <span key={idx} className="mr-3 block sm:inline">
                            {it.cantidad}x {it.producto_nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                      <span className="text-xl font-bold">{formatearPrecio(venta.total)}</span>
                      {hasRole("admin") && venta.estado === "completada" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700" 
                          onClick={() => anularVenta(venta.id)}
                        >
                          Anular Venta
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {ventas.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No hay ventas registradas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal Boleta */}
      <Dialog open={mostrarBoleta} onOpenChange={setMostrarBoleta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600 gap-2">
              <CheckCircle className="h-6 w-6" /> Venta Completada
            </DialogTitle>
          </DialogHeader>
          
          {ventaCompletada && (
            <div className="space-y-6 py-4">
              <div className="text-center bg-green-50 p-6 rounded-xl border border-green-100">
                <p className="text-sm text-green-800 font-medium mb-1">Total Pagado</p>
                <p className="text-4xl font-bold text-green-700">{formatearPrecio(ventaCompletada.total)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button className="w-full" variant="outline" onClick={imprimirBoleta}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                </Button>
                <Button className="w-full" onClick={() => setMostrarBoleta(false)}>
                  <Receipt className="h-4 w-4 mr-2" /> Nueva Venta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}