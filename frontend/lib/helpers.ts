// lib/helpers.ts

/**
 * Obtiene el estado visual del stock de un producto
 */
export const getStockStatus = (stock: number) => {
  if (stock === 0) {
    return { 
      color: "destructive" as const, 
      text: "Sin Stock",
      icon: "🚫" 
    }
  }
  if (stock <= 5) {
    return { 
      color: "destructive" as const, 
      text: "Stock Crítico",
      icon: "⚠️" 
    }
  }
  if (stock <= 15) {
    return { 
      color: "secondary" as const, 
      text: "Stock Medio",
      icon: "📦" 
    }
  }
  return { 
    color: "default" as const, 
    text: "Stock Alto",
    icon: "✅" 
  }
}

/**
 * Formatea una fecha a formato chileno legible
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Nunca"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"
    
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return "Error al formatear"
  }
}

/**
 * Formatea un precio a formato CLP
 */
export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio)
}

/**
 * Valida formato de RUT chileno
 */
export const validarRUT = (rut: string): boolean => {
  const rutLimpio = rut.replace(/[^0-9kK]/g, '')
  if (rutLimpio.length < 2) return false
  
  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toUpperCase()
  
  // Algoritmo módulo 11
  let suma = 0
  let multiplicador = 2
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  
  const dvEsperado = 11 - (suma % 11)
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString()
  
  return dv === dvCalculado
}

/**
 * Formatea un RUT con puntos y guión
 */
export const formatRUT = (rut: string): string => {
  const cleaned = rut.replace(/[^0-9kK]/g, "")
  if (cleaned.length <= 1) return cleaned
  
  const number = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()
  const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  
  return `${formattedNumber}-${dv}`
}

/**
 * Valida formato de email
 */
export const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Trunca un texto a un número máximo de caracteres
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}