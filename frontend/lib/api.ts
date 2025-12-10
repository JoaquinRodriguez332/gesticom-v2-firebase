import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  setDoc
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// ==========================================
// 1. UTILIDADES Y ERRORES
// ==========================================

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

// ==========================================
// 2. INTERFACES (Tipos de datos)
// ==========================================

// --- Productos ---
export interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  categoria?: string
  proveedor?: string
  createdAt?: any
  updatedAt?: any
}

export type CreateProductoData = Omit<Producto, "id" | "createdAt" | "updatedAt">
export type UpdateProductoData = Partial<CreateProductoData>

// --- Usuarios ---
export interface UsuarioApi {
  id: string
  nombre: string
  email: string
  rut?: string
  rol?: string
  activo?: boolean
  fecha_creacion?: string
  ultimo_acceso?: string | null
  creado_por_nombre?: string | null
}

// --- Ventas ---
export interface VentaItem {
  producto_id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Venta {
  id: string
  total: number
  fecha: string // ISO String
  vendedor_email: string
  estado: "completada" | "anulada"
  items: VentaItem[]
  createdAt?: any
  updatedAt?: any
}

export type CreateVentaData = Omit<Venta, "id" | "createdAt" | "updatedAt">

// --- Horarios ---
export interface RegistroHorario {
  id: string
  usuario_id: string
  fecha: string // YYYY-MM-DD
  hora_entrada: string | null
  hora_inicio_colacion: string | null
  hora_fin_colacion: string | null
  hora_salida: string | null
  createdAt?: any
  updatedAt?: any
}

// --- Notificaciones ---
export interface Notificacion {
  id: string
  mensaje: string
  tipo: "info" | "alerta" | "error"
  estado: "activa" | "leida"
  createdAt?: any
}

// --- Reportes (Interfaces para gráficos) ---
export interface ReporteVentas {
  ventas_totales: number
  cantidad_ventas: number
  productos_vendidos: number
  promedio_venta: number
  ventas_por_dia: Array<{ fecha: string; total: number; cantidad: number }>
  ventas_por_vendedor: Array<{ vendedor: string; total: number; cantidad: number }>
  productos_mas_vendidos: Array<{ producto_nombre: string; cantidad: number; total: number }>
}

export interface ReporteInventario {
  total_productos: number
  valor_inventario_total: number
  productos_stock_critico: number
  productos_sin_stock: number
  inventario_por_categoria: Array<{ categoria: string; cantidad: number; valor: number }>
  productos_mayor_valor: Array<{
    id: string
    nombre: string
    stock: number
    precio: number
    valor_total: number
    categoria: string
  }>
}

export interface ReporteHorarios {
  total_registros: number
  usuarios_activos_hoy: number
  promedio_entrada: string
  promedio_salida: string
  usuarios_en_colacion: number
  asistencia_por_usuario: Array<{
    usuario_id: string
    usuario_nombre: string
    total_dias: number
    dias_completos: number
    promedio_llegada: string
  }>
}


// ==========================================
// 3. COLECCIONES DE FIRESTORE
// ==========================================

const productosCollection = collection(db, "productos")
const usuariosCollection = collection(db, "usuarios")
const ventasCollection = collection(db, "ventas")
const horariosCollection = collection(db, "registros_horarios")
const notificacionesCollection = collection(db, "notificaciones")


// ==========================================
// 4. API DE PRODUCTOS
// ==========================================

export const productosApi = {
  async getAll(search?: string): Promise<Producto[]> {
    const snapshot = await getDocs(productosCollection)
    let productos: Producto[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      productos.push({
        id: docSnap.id,
        codigo: data.codigo || "",
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        precio: Number(data.precio || 0),
        stock: Number(data.stock || 0),
        categoria: data.categoria || "",
        proveedor: data.proveedor || "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    })

    if (search && search.trim()) {
      const s = search.toLowerCase()
      productos = productos.filter((p) =>
        p.nombre.toLowerCase().includes(s) ||
        p.codigo.toLowerCase().includes(s)
      )
    }

    productos.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return productos
  },

  async getById(id: string): Promise<Producto | null> {
    const ref = doc(db, "productos", id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data()
    return { id: snap.id, ...data } as Producto
  },

  async create(payload: CreateProductoData): Promise<Producto> {
    if (!payload.nombre || !payload.codigo) {
      throw new ApiError("Nombre y código son obligatorios", 400)
    }

    const docRef = await addDoc(productosCollection, {
      ...payload,
      precio: Number(payload.precio || 0),
      stock: Number(payload.stock || 0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const snap = await getDoc(docRef)
    const data = snap.data() as any

    return { id: snap.id, ...data }
  },

  async update(id: string, data: UpdateProductoData): Promise<void> {
    const ref = doc(db, "productos", id)
    const { id: _ignored, ...rest } = data as any

    await updateDoc(ref, {
      ...rest,
      ...(rest.precio !== undefined ? { precio: Number(rest.precio) } : {}),
      ...(rest.stock !== undefined ? { stock: Number(rest.stock) } : {}),
      updatedAt: serverTimestamp(),
    })
  },

  async delete(id: string): Promise<void> {
    const ref = doc(db, "productos", id)
    await deleteDoc(ref)
  },
}


// ==========================================
// 5. API DE USUARIOS
// ==========================================

export const usuariosApi = {
  async getAll(search?: string, rol?: string, activo?: string): Promise<UsuarioApi[]> {
    const snapshot = await getDocs(usuariosCollection)
    let usuarios: UsuarioApi[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      usuarios.push({
        id: docSnap.id,
        nombre: data.nombre || "",
        email: data.email || "",
        rut: data.rut || "",
        rol: data.rol || "trabajador",
        activo: data.activo ?? true,
        fecha_creacion: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        ultimo_acceso: data.lastLogin?.toDate ? data.lastLogin.toDate().toISOString() : null,
        creado_por_nombre: data.creado_por_nombre || "Sistema"
      })
    })

    // Filtrado en memoria
    if (search && search.trim()) {
      const s = search.toLowerCase()
      usuarios = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(s) ||
        (u.rut && u.rut.toLowerCase().includes(s)) ||
        u.email.toLowerCase().includes(s)
      )
    }

    if (rol && rol !== 'all') {
      usuarios = usuarios.filter(u => u.rol === rol)
    }

    if (activo && activo !== 'all') {
      const isActive = activo === 'true'
      usuarios = usuarios.filter(u => u.activo === isActive)
    }

    return usuarios
  },

  async create(data: any): Promise<void> {
    // 1. Referencia al documento usando el UID exacto del usuario (No uno aleatorio)
    const ref = doc(db, "usuarios", data.uid)

    // 2. Usamos setDoc para escribir/sobrescribir ese documento específico
    await setDoc(ref, {
      ...data,
      // Aseguramos que estos campos existan
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async update(id: string, data: any): Promise<void> {
    const ref = doc(db, "usuarios", id)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  },

  async toggleStatus(id: string, currentStatus: boolean): Promise<void> {
    const ref = doc(db, "usuarios", id)
    await updateDoc(ref, { activo: !currentStatus, updatedAt: serverTimestamp() })
  },

  // FUNCIÓN DE ELIMINAR ACTUALIZADA
  async delete(id: string): Promise<void> {
    // URL de tu Cloud Function (Reemplaza con la tuya si es distinta)
    const CLOUD_FUNCTION_URL = "https://southamerica-east1-gesticom-4e956.cloudfunctions.net/eliminarUsuarioCompleto";

    try {
      // 1. Intentamos borrar usando la Cloud Function (Borra Auth + DB)
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: "POST", // Usamos POST para enviar el body
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: id }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar usuario en el servidor")
      }

    } catch (error) {
      console.error("Fallo la eliminación en nube, intentando local...", error)

      // 2. PLAN B: Si falla la nube, al menos lo borramos de la tabla visual
      const ref = doc(db, "usuarios", id)
      await deleteDoc(ref)
    }
  }
} // <--- ESTA LLAVE ERA LA QUE FALTABA PARA CERRAR usuariosApi


// ==========================================
// 6. API DE VENTAS (Con Notificaciones Automáticas)
// ==========================================

export const ventasApi = {
  async getAll(): Promise<Venta[]> {
    const snapshot = await getDocs(ventasCollection)
    const ventas: Venta[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      ventas.push({ id: docSnap.id, ...data } as Venta)
    })

    // Ordenar por fecha descendente
    ventas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    return ventas
  },

  async create(payload: CreateVentaData): Promise<Venta> {
    if (!payload.items || payload.items.length === 0) {
      throw new ApiError("La venta debe tener al menos un producto", 400)
    }

    const batch = writeBatch(db)

    try {
      const ventaRef = doc(ventasCollection)
      // 1. RECORRER ITEMS Y ACTUALIZAR STOCK
      for (const item of payload.items) {
        const productoRef = doc(db, "productos", item.producto_id)
        const productoSnap = await getDoc(productoRef)
        if (!productoSnap.exists()) {
          throw new ApiError(`Producto ${item.producto_nombre} no encontrado`, 404)
        }

        const productoData = productoSnap.data()
        const nuevoStock = Number(productoData.stock || 0) - item.cantidad

        if (nuevoStock < 0) {
          throw new ApiError(`Stock insuficiente para ${item.producto_nombre}. Disponible: ${productoData.stock}`, 400)
        }

        // Actualizar stock
        batch.update(productoRef, { stock: nuevoStock, updatedAt: serverTimestamp() })

        // 🔔 GENERAR NOTIFICACIONES DE STOCK
        if (nuevoStock === 0) {
          const notifRef = doc(notificacionesCollection)
          batch.set(notifRef, {
            mensaje: `El producto "${item.producto_nombre}" se ha AGOTADO.`,
            tipo: "error", // Rojo
            estado: "activa",
            createdAt: serverTimestamp()
          })
        } else if (nuevoStock <= 5) {
          const notifRef = doc(notificacionesCollection)
          batch.set(notifRef, {
            mensaje: `Stock bajo: Quedan solo ${nuevoStock} unidades de "${item.producto_nombre}".`,
            tipo: "alerta", // Naranja
            estado: "activa",
            createdAt: serverTimestamp()
          })
        }
      }

      // 🔔 DETECTAR VENTA GRANDE (Opcional, ej: > $50.000)
      if (payload.total > 50000) {
        const notifRef = doc(notificacionesCollection)
        batch.set(notifRef, {
          mensaje: `💰 ¡Venta grande registrada! Total: $${payload.total.toLocaleString("es-CL")}`,
          tipo: "info", // Azul
          estado: "activa",
          createdAt: serverTimestamp()
        })
      }

      // 2. GUARDAR LA VENTA
      batch.set(ventaRef, {
        ...payload,
        total: Number(payload.total),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // 3. EJECUTAR TODO (Venta + Descuento Stock + Notificaciones)
      await batch.commit()

      const ventaSnap = await getDoc(ventaRef)
      const data = ventaSnap.data()!

      return { id: ventaSnap.id, ...data } as Venta

    } catch (error) {
      console.error("Error en transacción de venta:", error)
      if (error instanceof ApiError) throw error
      throw new ApiError("Error al procesar la venta", 500)
    }
  },

  async anular(id: string): Promise<void> {
    const ventaRef = doc(db, "ventas", id)
    const ventaSnap = await getDoc(ventaRef)

    if (!ventaSnap.exists()) throw new ApiError("Venta no encontrada", 404)
    const ventaData = ventaSnap.data()
    if (ventaData.estado === "anulada") throw new ApiError("La venta ya está anulada", 400)

    const batch = writeBatch(db)

    try {
      // 1. Marcar anulada
      batch.update(ventaRef, { estado: "anulada", updatedAt: serverTimestamp() })

      // 2. Devolver stock
      for (const item of ventaData.items) {
        const productoRef = doc(db, "productos", item.producto_id)
        const productoSnap = await getDoc(productoRef)

        if (productoSnap.exists()) {
          const productoData = productoSnap.data()
          const nuevoStock = Number(productoData.stock || 0) + item.cantidad
          batch.update(productoRef, { stock: nuevoStock, updatedAt: serverTimestamp() })
        }
      }

      // 3. Crear notificación de anulación
      const notifRef = doc(notificacionesCollection)
      batch.set(notifRef, {
        mensaje: `⚠️ Se ha ANULADO la venta por $${ventaData.total}. Stock devuelto.`,
        tipo: "alerta",
        estado: "activa",
        createdAt: serverTimestamp()
      })

      await batch.commit()
    } catch (error) {
      console.error("Error al anular venta:", error)
      throw new ApiError("Error al anular la venta", 500)
    }
  }
}


// ==========================================
// 7. API DE HORARIOS
// ==========================================

export const horariosApi = {
  // Obtener historial reciente de un usuario
  async getMisRegistros(usuarioId: string, limitCount = 10): Promise<RegistroHorario[]> {
    // 🔥 RECUERDA: Requiere índice compuesto (usuario_id ASC, fecha DESC)
    const q = query(
      horariosCollection,
      where("usuario_id", "==", usuarioId),
      orderBy("fecha", "desc"),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    const registros: RegistroHorario[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      registros.push({ id: docSnap.id, ...data } as RegistroHorario)
    })
    return registros
  },

  // Obtener el registro del día actual
  async getRegistroHoy(usuarioId: string): Promise<RegistroHorario | null> {
    const hoy = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const q = query(
      horariosCollection,
      where("usuario_id", "==", usuarioId),
      where("fecha", "==", hoy)
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const docSnap = snapshot.docs[0]
    return { id: docSnap.id, ...docSnap.data() } as RegistroHorario
  },

  // Marcar una acción (Entrada, Salida, etc.)
  async marcar(usuarioId: string, tipo: "entrada" | "inicio_colacion" | "fin_colacion" | "salida"): Promise<void> {
    const hoy = new Date().toISOString().slice(0, 10)
    const horaActual = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
    const campoHora = `hora_${tipo}`

    try {
      const registroHoy = await this.getRegistroHoy(usuarioId)

      if (registroHoy) {
        if (registroHoy[campoHora as keyof RegistroHorario]) {
          throw new ApiError(`Ya registrado hoy a las ${registroHoy[campoHora as keyof RegistroHorario]}`, 409)
        }
        const ref = doc(db, "registros_horarios", registroHoy.id)
        await updateDoc(ref, { [campoHora]: horaActual, updatedAt: serverTimestamp() })
      } else {
        if (tipo !== "entrada") { /* Opcional: Validar orden */ }
        await addDoc(horariosCollection, {
          usuario_id: usuarioId,
          fecha: hoy,
          hora_entrada: tipo === "entrada" ? horaActual : null,
          hora_inicio_colacion: null,
          hora_fin_colacion: null,
          hora_salida: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error(`❌ Error al marcar ${tipo}:`, error)
      throw error
    }
  },

  async getEstadoColacion(usuarioId: string): Promise<{ en_colacion: boolean; hora_inicio?: string }> {
    const registroHoy = await this.getRegistroHoy(usuarioId)
    if (!registroHoy) return { en_colacion: false }
    // Está en colación si inició Y no ha terminado
    const enColacion = !!registroHoy.hora_inicio_colacion && !registroHoy.hora_fin_colacion
    return { en_colacion: enColacion, hora_inicio: registroHoy.hora_inicio_colacion || undefined }
  },
}


// ==========================================
// 8. API DE NOTIFICACIONES (Gestión)
// ==========================================

export const notificacionesApi = {
  async getAll(): Promise<Notificacion[]> {
    // Ordenamos por fecha de creación (más nuevas primero)
    const q = query(notificacionesCollection, orderBy("createdAt", "desc"), limit(20))
    const snapshot = await getDocs(q)
    const notificaciones: Notificacion[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      notificaciones.push({
        id: docSnap.id,
        mensaje: data.mensaje || "",
        tipo: data.tipo || "info",
        estado: data.estado || "activa",
        createdAt: data.createdAt
      })
    })
    return notificaciones
  },

  async create(mensaje: string, tipo: "info" | "alerta" | "error"): Promise<void> {
    await addDoc(notificacionesCollection, {
      mensaje,
      tipo,
      estado: "activa",
      createdAt: serverTimestamp()
    })
  },

  async markAsRead(id: string): Promise<void> {
    const ref = doc(db, "notificaciones", id)
    await updateDoc(ref, { estado: "leida" })
  },

  async delete(id: string): Promise<void> {
    const ref = doc(db, "notificaciones", id)
    await deleteDoc(ref)
  }
}


// ==========================================
// 9. API DE REPORTES (Cálculos y Estadísticas)
// ==========================================
// ==========================================
// 9. API DE REPORTES (MEJORADA: NOMBRES REALES)
// ==========================================

export const reportesApi = {
  // 1. REPORTE DE VENTAS (CON NOMBRES REALES DE VENDEDORES)
  async getReporteVentas(fechaInicio?: string, fechaFin?: string): Promise<ReporteVentas> {
    const snapshot = await getDocs(ventasCollection)
    let ventas: Venta[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      ventas.push({ id: docSnap.id, ...data } as Venta)
    })

    // Filtrar por fechas
    if (fechaInicio || fechaFin) {
      const start = fechaInicio ? new Date(fechaInicio).getTime() : 0
      const end = fechaFin ? new Date(fechaFin).getTime() + 86400000 : Date.now()
      ventas = ventas.filter(v => {
        const t = new Date(v.fecha).getTime()
        return t >= start && t <= end
      })
    }

    ventas = ventas.filter(v => v.estado === "completada")

    // 🔥 OBTENER NOMBRES REALES DE VENDEDORES
    const usuariosSnap = await getDocs(usuariosCollection)
    const nombresMap = new Map<string, string>()
    usuariosSnap.forEach(doc => {
      const d = doc.data()
      nombresMap.set(d.email || "", d.nombre || "Usuario Desconocido")
    })

    const ventas_totales = ventas.reduce((sum, v) => sum + v.total, 0)
    const cantidad_ventas = ventas.length
    const productos_vendidos = ventas.reduce((sum, v) => sum + v.items.reduce((s, i) => s + i.cantidad, 0), 0)
    const promedio_venta = cantidad_ventas > 0 ? ventas_totales / cantidad_ventas : 0

    // Ventas por día
    const diasMap = new Map<string, { total: number; cantidad: number }>()
    ventas.forEach(v => {
      const dia = v.fecha.split("T")[0]
      const actual = diasMap.get(dia) || { total: 0, cantidad: 0 }
      diasMap.set(dia, { total: actual.total + v.total, cantidad: actual.cantidad + 1 })
    })
    const ventas_por_dia = Array.from(diasMap.entries())
      .map(([fecha, d]) => ({ fecha, ...d }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    // 🔥 VENTAS POR VENDEDOR (CON NOMBRE REAL)
    const vendMap = new Map<string, { total: number; cantidad: number }>()
    ventas.forEach(v => {
      const email = v.vendedor_email
      const actual = vendMap.get(email) || { total: 0, cantidad: 0 }
      vendMap.set(email, { total: actual.total + v.total, cantidad: actual.cantidad + 1 })
    })
    
    const ventas_por_vendedor = Array.from(vendMap.entries())
      .map(([email, d]) => ({
        vendedor: nombresMap.get(email) || email, // 🎯 NOMBRE REAL
        total: d.total,
        cantidad: d.cantidad
      }))
      .sort((a, b) => b.total - a.total)

    // Productos más vendidos
    const prodMap = new Map<string, { cantidad: number; total: number }>()
    ventas.forEach(v => {
      v.items.forEach(item => {
        const actual = prodMap.get(item.producto_nombre) || { cantidad: 0, total: 0 }
        prodMap.set(item.producto_nombre, { 
          cantidad: actual.cantidad + item.cantidad, 
          total: actual.total + item.subtotal 
        })
      })
    })
    const productos_mas_vendidos = Array.from(prodMap.entries())
      .map(([producto_nombre, d]) => ({ producto_nombre, ...d }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    return {
      ventas_totales,
      cantidad_ventas,
      productos_vendidos,
      promedio_venta,
      ventas_por_dia,
      ventas_por_vendedor,
      productos_mas_vendidos
    }
  },

  // 2. REPORTE DE INVENTARIO (Sin cambios)
  async getReporteInventario(): Promise<ReporteInventario> {
    const snapshot = await getDocs(productosCollection)
    const productos: Producto[] = []
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      productos.push({ id: docSnap.id, ...data } as any)
    })

    const total_productos = productos.length
    const valor_inventario_total = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0)
    const productos_stock_critico = productos.filter(p => p.stock <= 5 && p.stock > 0).length
    const productos_sin_stock = productos.filter(p => p.stock === 0).length

    const catMap = new Map<string, { cantidad: number; valor: number }>()
    productos.forEach(p => {
      const cat = p.categoria || "Sin Categoría"
      const actual = catMap.get(cat) || { cantidad: 0, valor: 0 }
      catMap.set(cat, { 
        cantidad: actual.cantidad + p.stock, 
        valor: actual.valor + (p.precio * p.stock) 
      })
    })
    const inventario_por_categoria = Array.from(catMap.entries())
      .map(([categoria, d]) => ({ categoria, ...d }))

    const productos_mayor_valor = [...productos]
      .sort((a, b) => (b.precio * b.stock) - (a.precio * a.stock))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        stock: p.stock,
        precio: p.precio,
        valor_total: p.precio * p.stock,
        categoria: p.categoria || "General"
      }))

    return {
      total_productos,
      valor_inventario_total,
      productos_stock_critico,
      productos_sin_stock,
      inventario_por_categoria,
      productos_mayor_valor
    }
  },

  // 3. REPORTE DE HORARIOS (Ya tiene nombres reales)
  async getReporteHorarios(fechaInicio?: string, fechaFin?: string): Promise<ReporteHorarios> {
    const snapshot = await getDocs(horariosCollection)
    let registros: RegistroHorario[] = []

    snapshot.forEach(docSnap => {
      registros.push({ id: docSnap.id, ...docSnap.data() } as any)
    })

    const usuariosSnap = await getDocs(usuariosCollection)
    const nombresMap = new Map<string, string>()
    usuariosSnap.forEach(doc => {
      const d = doc.data()
      nombresMap.set(doc.id, d.nombre || "Usuario Desconocido")
    })

    if (fechaInicio || fechaFin) {
      registros = registros.filter(r => {
        return (!fechaInicio || r.fecha >= fechaInicio) && (!fechaFin || r.fecha <= fechaFin)
      })
    }

    const hoy = new Date().toISOString().slice(0, 10)
    const hoyRegs = registros.filter(r => r.fecha === hoy)

    const usuarios_activos_hoy = hoyRegs.filter(r => r.hora_entrada).length
    const usuarios_en_colacion = hoyRegs.filter(r => r.hora_inicio_colacion && !r.hora_fin_colacion).length

    const entradas = registros.filter(r => r.hora_entrada).map(r => r.hora_entrada!)
    const salidas = registros.filter(r => r.hora_salida).map(r => r.hora_salida!)

    const calcularPromedio = (horas: string[]) => {
      if (horas.length === 0) return "--:--"
      const minutos = horas.reduce((sum, h) => {
        const [hr, min] = h.split(":").map(Number)
        return sum + (hr * 60) + min
      }, 0) / horas.length
      const h = Math.floor(minutos / 60)
      const m = Math.floor(minutos % 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const userMap = new Map<string, any>()
    registros.forEach(r => {
      const actual = userMap.get(r.usuario_id) || { total: 0, completos: 0 }
      userMap.set(r.usuario_id, {
        total: actual.total + 1,
        completos: actual.completos + (r.hora_entrada && r.hora_salida ? 1 : 0)
      })
    })

    const asistencia_por_usuario = Array.from(userMap.entries()).map(([uid, d]) => ({
      usuario_id: uid,
      usuario_nombre: nombresMap.get(uid) || "Usuario Eliminado", 
      total_dias: d.total,
      dias_completos: d.completos,
      promedio_llegada: "--:--"
    }))

    return {
      total_registros: registros.length,
      usuarios_activos_hoy,
      usuarios_en_colacion,
      promedio_entrada: calcularPromedio(entradas),
      promedio_salida: calcularPromedio(salidas),
      asistencia_por_usuario
    }
  },

  async getProductosStockCritico(): Promise<Producto[]> {
    const snapshot = await getDocs(productosCollection)
    const criticos: Producto[] = []
    snapshot.forEach(doc => {
      const d = doc.data() as any
      if (Number(d.stock) <= 5) criticos.push({ id: doc.id, ...d })
    })
    return criticos.sort((a, b) => a.stock - b.stock)
  }
}