// lib/api.ts
import axios, { AxiosRequestConfig } from "axios";
import { getAuth } from "firebase/auth";

// --------- Axios base ---------
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
});

// Interceptor: adjunta token de Firebase si existe
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const t = await user.getIdToken();
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${t}`,
    };
  }
  return config;
});

// --------- Error tipado ---------
export class ApiError extends Error {
  status?: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// --------- Tipos ---------
export type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  proveedor: string;
};

// Normaliza id a string por si backend envía number
export function normalizeProducto(p: any): Producto {
  return {
    id: String(p.id),
    codigo: p.codigo ?? "",
    nombre: p.nombre ?? "",
    descripcion: p.descripcion ?? "",
    precio: Number(p.precio ?? 0),
    stock: Number(p.stock ?? 0),
    categoria: p.categoria ?? "",
    proveedor: p.proveedor ?? "",
  };
}

// Helper para headers con token opcional (si lo pasas manual)
function withToken(token?: string): AxiosRequestConfig {
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
}

// --------- APIs ---------
export const productosApi = {
  async getAll(search?: string, token?: string): Promise<Producto[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await api.get(`/productos${qs}`, withToken(token));
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(normalizeProducto);
  },

  async create(payload: Omit<Producto, "id">, token?: string) {
    const res = await api.post(`/productos`, payload, withToken(token));
    return normalizeProducto(res.data);
  },

  async update(id: string | number, payload: Partial<Omit<Producto, "id">>, token?: string) {
    const res = await api.put(`/productos/${id}`, payload, withToken(token));
    return normalizeProducto(res.data);
  },

  async delete(id: string | number, token?: string) {
    const res = await api.delete(`/productos/${id}`, withToken(token));
    return res.data;
  },
};

export const usuariosApi = {
  async getAll(params?: Record<string, string>, token?: string) {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    const res = await api.get(`/usuarios${qs}`, withToken(token));
    return res.data;
  },

  async create(payload: any, token?: string) {
    const res = await api.post(`/usuarios`, payload, withToken(token));
    return res.data;
  },

  async update(id: string | number, payload: any, token?: string) {
    const res = await api.put(`/usuarios/${id}`, payload, withToken(token));
    return res.data;
  },

  async delete(id: string | number, token?: string) {
    const res = await api.delete(`/usuarios/${id}`, withToken(token));
    return res.data;
  },

  async toggleStatus(id: string | number, token?: string) {
    const res = await api.put(`/usuarios/${id}/toggle-status`, undefined, withToken(token));
    return res.data;
  },
};

// Exporta la instancia por si la necesitas
export { api };
