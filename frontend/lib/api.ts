// lib/api.ts
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc, writeBatch,  setDoc   } from "firebase/firestore"
import { db } from "@/lib/firebase"

// ---------------------- Tipos comunes y Errores ----------------------

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

// ---------------------- Interfaces de Productos ----------------------

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

// ---------------------- Interfaces de Usuarios ----------------------

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

// ---------------------- Interfaces de Ventas ----------------------

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
  fecha: string
  vendedor_email: string
  estado: "completada" | "anulada"
  items: VentaItem[]
  createdAt?: any
  updatedAt?: any
}

export type CreateVentaData = Omit<Venta, "id" | "createdAt" | "updatedAt">

// ---------------------- Colecciones ----------------------

const productosCollection = collection(db, "productos")
const usuariosCollection = collection(db, "usuarios")
const ventasCollection = collection(db, "ventas")

// ---------------------- API: Productos ----------------------

export const productosApi = {
  async getAll(search?: string): Promise<Producto[]> {
    const snapshot = await getDocs(productosCollection)
    let productos: Producto[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any
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
      productos = productos.filter((p) => p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s))
    }

    productos.sort((a, b) => a.nombre.localeCompare(b.nombre))

    return productos
  },

  async getById(id: string): Promise<Producto | null> {
    const ref = doc(db, "productos", id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data() as any
    return {
      id: snap.id,
      codigo: data.codigo || "",
      nombre: data.nombre || "",
      descripcion: data.descripcion || "",
      precio: Number(data.precio || 0),
      stock: Number(data.stock || 0),
      categoria: data.categoria || "",
      proveedor: data.proveedor || "",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
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

    return {
      id: snap.id,
      codigo: data.codigo || "",
      nombre: data.nombre || "",
      descripcion: data.descripcion || "",
      precio: Number(data.precio || 0),
      stock: Number(data.stock || 0),
      categoria: data.categoria || "",
      proveedor: data.proveedor || "",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
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

// ---------------------- API: Usuarios ----------------------

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
  console.log("📝 usuariosApi.create() - Inicio")
  console.log("📦 Datos recibidos:", data)

  try {
    // Extraemos uid si viene
    const { uid, ...rest } = data

    // Si trae uid, lo usamos como ID del documento.
    // Si no trae uid, se crea doc con ID automático.
    const ref = uid 
      ? doc(usuariosCollection, uid) 
      : doc(usuariosCollection)

    console.log("🔥 Guardando documento en Firestore... (setDoc)")

    await setDoc(ref, {
      ...rest,
      uid: uid || null,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log("✅ setDoc() exitoso - ID:", uid || ref.id)

  } catch (error) {
    console.error("❌ Error en usuariosApi.create():", error)
    throw error
  }
},


  async update(id: string, data: any): Promise<void> {
    const ref = doc(db, "usuarios", id)
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  },

  async toggleStatus(id: string, currentStatus: boolean): Promise<void> {
    const ref = doc(db, "usuarios", id)
    await updateDoc(ref, {
      activo: !currentStatus,
      updatedAt: serverTimestamp(),
    })
  },

  async delete(id: string): Promise<void> {
    const ref = doc(db, "usuarios", id)
    await deleteDoc(ref)
  }
}

// ---------------------- API: Ventas ----------------------

export const ventasApi = {
  async getAll(): Promise<Venta[]> {
    const snapshot = await getDocs(ventasCollection)
    const ventas: Venta[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      ventas.push({
        id: docSnap.id,
        total: Number(data.total || 0),
        fecha: data.fecha || new Date().toISOString(),
        vendedor_email: data.vendedor_email || "",
        estado: data.estado || "completada",
        items: data.items || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    })

    // Ordenar por fecha descendente (más recientes primero)
    ventas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return ventas
  },

  async getById(id: string): Promise<Venta | null> {
    const ref = doc(db, "ventas", id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    
    const data = snap.data()
    return {
      id: snap.id,
      total: Number(data.total || 0),
      fecha: data.fecha || new Date().toISOString(),
      vendedor_email: data.vendedor_email || "",
      estado: data.estado || "completada",
      items: data.items || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  },

  async create(payload: CreateVentaData): Promise<Venta> {
    if (!payload.items || payload.items.length === 0) {
      throw new ApiError("La venta debe tener al menos un producto", 400)
    }

    // Usar batch para actualizar stock de múltiples productos atómicamente
    const batch = writeBatch(db)

    try {
      // 1. Crear la venta
      const ventaRef = doc(ventasCollection)
      batch.set(ventaRef, {
        ...payload,
        total: Number(payload.total),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // 2. Actualizar el stock de cada producto
      for (const item of payload.items) {
        const productoRef = doc(db, "productos", item.producto_id)
        const productoSnap = await getDoc(productoRef)
        
        if (!productoSnap.exists()) {
          throw new ApiError(`Producto ${item.producto_nombre} no encontrado`, 404)
        }

        const productoData = productoSnap.data()
        const nuevoStock = Number(productoData.stock || 0) - item.cantidad

        if (nuevoStock < 0) {
          throw new ApiError(`Stock insuficiente para ${item.producto_nombre}`, 400)
        }

        batch.update(productoRef, {
          stock: nuevoStock,
          updatedAt: serverTimestamp(),
        })
      }

      // 3. Ejecutar todas las operaciones
      await batch.commit()

      // 4. Obtener la venta creada
      const ventaSnap = await getDoc(ventaRef)
      const data = ventaSnap.data()!

      return {
        id: ventaSnap.id,
        total: Number(data.total || 0),
        fecha: data.fecha || new Date().toISOString(),
        vendedor_email: data.vendedor_email || "",
        estado: data.estado || "completada",
        items: data.items || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    } catch (error) {
      console.error("Error en transacción de venta:", error)
      throw error instanceof ApiError ? error : new ApiError("Error al procesar la venta", 500)
    }
  },

  async anular(id: string): Promise<void> {
    const ventaRef = doc(db, "ventas", id)
    const ventaSnap = await getDoc(ventaRef)

    if (!ventaSnap.exists()) {
      throw new ApiError("Venta no encontrada", 404)
    }

    const ventaData = ventaSnap.data()

    if (ventaData.estado === "anulada") {
      throw new ApiError("La venta ya está anulada", 400)
    }

    // Usar batch para devolver el stock
    const batch = writeBatch(db)

    try {
      // 1. Marcar venta como anulada
      batch.update(ventaRef, {
        estado: "anulada",
        updatedAt: serverTimestamp(),
      })

      // 2. Devolver el stock de cada producto
      for (const item of ventaData.items) {
        const productoRef = doc(db, "productos", item.producto_id)
        const productoSnap = await getDoc(productoRef)

        if (productoSnap.exists()) {
          const productoData = productoSnap.data()
          const nuevoStock = Number(productoData.stock || 0) + item.cantidad

          batch.update(productoRef, {
            stock: nuevoStock,
            updatedAt: serverTimestamp(),
          })
        }
      }

      await batch.commit()
    } catch (error) {
      console.error("Error al anular venta:", error)
      throw new ApiError("Error al anular la venta", 500)
    }
  },

  async delete(id: string): Promise<void> {
    // Solo permitir eliminar ventas anuladas
    const ventaRef = doc(db, "ventas", id)
    const ventaSnap = await getDoc(ventaRef)

    if (!ventaSnap.exists()) {
      throw new ApiError("Venta no encontrada", 404)
    }

    const ventaData = ventaSnap.data()

    if (ventaData.estado !== "anulada") {
      throw new ApiError("Solo se pueden eliminar ventas anuladas", 400)
    }

    await deleteDoc(ventaRef)
  }
}