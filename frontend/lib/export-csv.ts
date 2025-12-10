// lib/export-csv.ts
// CREAR ESTE NUEVO ARCHIVO

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar")
    return
  }

  // Obtener todas las columnas del primer objeto
  const headers = Object.keys(data[0])
  
  // Crear filas CSV
  const csvRows = [
    headers.join(","), // Encabezados
    ...data.map(row => 
      headers.map(field => {
        let value = row[field]
        
        // Formatear valores
        if (value === null || value === undefined) value = ""
        if (typeof value === "string" && value.includes(",")) {
          value = `"${value}"` // Escapar comas
        }
        
        return value
      }).join(",")
    )
  ]

  // Crear Blob y descargar
  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Funciones específicas para cada tipo de reporte
export const exportVentasDiarias = (ventasPorDia: any[]) => {
  const data = ventasPorDia.map(v => ({
    Fecha: v.fecha,
    "Total Ventas": v.total,
    "Cantidad Ventas": v.cantidad
  }))
  exportToCSV(data, "ventas_por_dia")
}

export const exportVendedores = (vendedores: any[]) => {
  const data = vendedores.map((v, i) => ({
    Posicion: i + 1,
    Vendedor: v.vendedor,
    "Total Ventas": v.total,
    "Productos Vendidos": v.cantidad
  }))
  exportToCSV(data, "rendimiento_vendedores")
}

export const exportProductosVendidos = (productos: any[]) => {
  const data = productos.map((p, i) => ({
    Posicion: i + 1,
    Producto: p.producto_nombre,
    "Cantidad Vendida": p.cantidad,
    "Total Generado": p.total
  }))
  exportToCSV(data, "productos_mas_vendidos")
}

export const exportInventarioCategoria = (categorias: any[]) => {
  const data = categorias.map(c => ({
    Categoria: c.categoria,
    "Cantidad Stock": c.cantidad,
    "Valor Total": c.valor
  }))
  exportToCSV(data, "inventario_por_categoria")
}

export const exportProductosValor = (productos: any[]) => {
  const data = productos.map((p, i) => ({
    Posicion: i + 1,
    Producto: p.nombre,
    Categoria: p.categoria,
    Stock: p.stock,
    "Precio Unitario": p.precio,
    "Valor Total": p.valor_total
  }))
  exportToCSV(data, "productos_mayor_valor")
}

export const exportStockCritico = (productos: any[]) => {
  const data = productos.map(p => ({
    Codigo: p.codigo,
    Producto: p.nombre,
    Categoria: p.categoria,
    Proveedor: p.proveedor,
    Stock: p.stock,
    Precio: p.precio,
    Estado: p.stock === 0 ? "SIN STOCK" : "STOCK CRITICO"
  }))
  exportToCSV(data, "productos_stock_critico")
}

export const exportAsistencia = (asistencia: any[]) => {
  const data = asistencia.map(a => ({
    Usuario: a.usuario_nombre,
    "Total Dias": a.total_dias,
    "Dias Completos": a.dias_completos,
    "Promedio Llegada": a.promedio_llegada,
    "Cumplimiento %": a.total_dias > 0 
      ? Math.round((a.dias_completos / a.total_dias) * 100)
      : 0
  }))
  exportToCSV(data, "asistencia_por_usuario")
}

// Exportación completa de reporte de ventas
export const exportReporteVentasCompleto = (reporte: any) => {
  const data = [{
    "Ventas Totales": reporte.ventas_totales,
    "Cantidad Ventas": reporte.cantidad_ventas,
    "Productos Vendidos": reporte.productos_vendidos,
    "Promedio por Venta": reporte.promedio_venta
  }]
  exportToCSV(data, "resumen_ventas")
}

// Exportación completa de reporte de inventario
export const exportReporteInventarioCompleto = (reporte: any) => {
  const data = [{
    "Total Productos": reporte.total_productos,
    "Valor Inventario Total": reporte.valor_inventario_total,
    "Productos Stock Critico": reporte.productos_stock_critico,
    "Productos Sin Stock": reporte.productos_sin_stock
  }]
  exportToCSV(data, "resumen_inventario")
}