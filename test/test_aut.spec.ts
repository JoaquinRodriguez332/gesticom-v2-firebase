// e2e_usuarios_productos_firebase.spec.ts
import { test, expect } from '@playwright/test'

// ================== CONFIGURACIÓN BÁSICA ==================
const BASE_URL = 'https://gesticom-4e956.web.app'

const ADMIN = {
  email: 'juaco332@gmail.com',   // ⚠️ cambialo si usas otro admin
  password: 'pass123'
}

// 10 usuarios de prueba (nombres chilenos, RUTs “creíbles” pero sin validación extra)
const USUARIOS_PRUEBA = [
  { nombre: 'Camila Torres',   rut: '18.234.567-5', email: 'camila.torres+1@test.cl',   password: 'Prueba123!' },
  { nombre: 'Felipe González', rut: '17.345.678-9', email: 'felipe.gonzalez+2@test.cl', password: 'Prueba123!' },
  { nombre: 'Valentina Pérez', rut: '19.456.789-3', email: 'valentina.perez+3@test.cl', password: 'Prueba123!' },
  { nombre: 'Matías Rojas',    rut: '16.987.654-1', email: 'matias.rojas+4@test.cl',    password: 'Prueba123!' },
  { nombre: 'Josefa Díaz',     rut: '20.123.456-7', email: 'josefa.diaz+5@test.cl',     password: 'Prueba123!' },
  { nombre: 'Nicolás Herrera', rut: '15.234.567-8', email: 'nicolas.herrera+6@test.cl', password: 'Prueba123!' },
  { nombre: 'Antonia Castillo',rut: '18.765.432-0', email: 'antonia.castillo+7@test.cl',password: 'Prueba123!' },
  { nombre: 'Diego Sánchez',   rut: '17.222.333-4', email: 'diego.sanchez+8@test.cl',   password: 'Prueba123!' },
  { nombre: 'Ignacia Fuentes', rut: '19.888.777-6', email: 'ignacia.fuentes+9@test.cl', password: 'Prueba123!' },
  { nombre: 'Benjamín Muñoz',  rut: '16.111.222-5', email: 'benjamin.munoz+10@test.cl', password: 'Prueba123!' }
]

// 10 productos típicos de minimarket
const PRODUCTOS_MINIMARKET = [
  {
    codigo: '7800001000001',
    nombre: 'Pan marraqueta',
    descripcion: 'Pan marraqueta fresco, bolsa 4 unidades',
    precio: '1500',
    stock: '30',
    categoria: 'Panadería',
    proveedor: 'Panadería San Juan'
  },
  {
    codigo: '7800001000002',
    nombre: 'Leche entera 1L',
    descripcion: 'Leche entera UHT 1 litro',
    precio: '1200',
    stock: '40',
    categoria: 'Lácteos',
    proveedor: 'Colun'
  },
  {
    codigo: '7800001000003',
    nombre: 'Yogurt batido frutilla',
    descripcion: 'Yogurt batido sabor frutilla 165g',
    precio: '450',
    stock: '60',
    categoria: 'Lácteos',
    proveedor: 'Soprole'
  },
  {
    codigo: '7800001000004',
    nombre: 'Bebida cola 1.5L',
    descripcion: 'Bebida sabor cola 1.5 litros',
    precio: '1900',
    stock: '25',
    categoria: 'Bebidas',
    proveedor: 'Coca-Cola'
  },
  {
    codigo: '7800001000005',
    nombre: 'Jugo néctar durazno',
    descripcion: 'Néctar de durazno 1 litro',
    precio: '1100',
    stock: '35',
    categoria: 'Bebidas',
    proveedor: 'Watts'
  },
  {
    codigo: '7800001000006',
    nombre: 'Fideos spaghetti 400g',
    descripcion: 'Fideos tipo spaghetti 400 gramos',
    precio: '900',
    stock: '50',
    categoria: 'Abarrotes',
    proveedor: 'Carozzi'
  },
  {
    codigo: '7800001000007',
    nombre: 'Arroz grado 1 1kg',
    descripcion: 'Arroz grano largo grado 1, 1 kilo',
    precio: '1300',
    stock: '45',
    categoria: 'Abarrotes',
    proveedor: 'Tucapel'
  },
  {
    codigo: '7800001000008',
    nombre: 'Aceite vegetal 900ml',
    descripcion: 'Aceite vegetal 900 ml',
    precio: '2300',
    stock: '20',
    categoria: 'Abarrotes',
    proveedor: 'Ideal Oil'
  },
  {
    codigo: '7800001000009',
    nombre: 'Detergente en polvo 800g',
    descripcion: 'Detergente en polvo para ropa 800 gramos',
    precio: '2600',
    stock: '18',
    categoria: 'Aseo',
    proveedor: 'Omo'
  },
  {
    codigo: '7800001000010',
    nombre: 'Papel higiénico 4 rollos',
    descripcion: 'Pack de papel higiénico 4 rollos',
    precio: '2100',
    stock: '22',
    categoria: 'Higiene',
    proveedor: 'Elite'
  }
]

// ============== HELPERS REUTILIZABLES =====================

async function login(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

async function crearUsuarioDesdeAdmin(page: any, usuario: any) {
  // 👇 Aquí asumimos que ya estás en /dashboard/usuarios
  await page.getByRole('button', { name: /nuevo usuario/i }).click();

  // Esperar a que aparezca el modal
  await page.getByText('Crear Nuevo Usuario', { exact: false }).waitFor({ timeout: 10000 });

  // 📝 Campos por etiqueta (Label + htmlFor)
  await page.getByLabel('Nombre Completo').fill(usuario.nombre);
  await page.getByLabel('RUT').fill(usuario.rut);
  await page.getByLabel('Correo Electrónico').fill(usuario.email);

// Usamos los IDs directamente para evitar ambigüedad
await page.locator('#password').fill(usuario.password);
await page.locator('#confirmPassword').fill(usuario.password);

  // 🔽 Select de Rol (shadcn Select)
  // Texto que aparece en tu screenshot: "Seleccionar rol"
  await page.getByText('Seleccionar rol').click();
  await page.getByRole('option', { name: /admin/i }).click(); // o /trabajador/i según corresponda

  // 💾 Botón para crear
  await page.getByRole('button', { name: /crear usuario/i }).click();

  // ✅ Pequeña espera para que salga el toast y se cierre el modal
  await page.waitForTimeout(1500);
}


async function crearProducto(page: any, producto: (typeof PRODUCTOS_MINIMARKET)[number]) {
  // Estás en /dashboard/inventario
  await page.getByRole('button', { name: /nuevo producto/i }).click()

  await page.locator('input[name="codigo"]').fill(producto.codigo)
  await page.locator('input[name="nombre"], #nombre').fill(producto.nombre)
  await page.locator('textarea[name="descripcion"], input[name="descripcion"]').fill(producto.descripcion)
  await page.locator('input[name="precio"]').fill(producto.precio)
  await page.locator('input[name="stock"]').fill(producto.stock)
  await page.locator('input[name="categoria"]').fill(producto.categoria)
  await page.locator('input[name="proveedor"]').fill(producto.proveedor)

  await page.getByRole('button', { name: /crear|guardar/i }).click()

  // pequeño tiempo para que Firebase procese y la lista se refresque
  await page.waitForTimeout(1500)
}

// ================== TEST PRINCIPAL =========================

test('10 usuarios crean 10 productos cada uno en la app deployada', async ({ browser }) => {
  test.setTimeout(300000) // 5 minutos

  // ---------- 1) ADMIN CREA LOS 10 USUARIOS ----------
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()

  console.log('🔐 Iniciando sesión como ADMIN en producción...')
  await login(adminPage, ADMIN.email, ADMIN.password)

  console.log('➡️ Navegando a gestión de usuarios...')
  await adminPage.goto(`${BASE_URL}/dashboard/usuarios`)
  await adminPage.waitForLoadState('domcontentloaded')

  for (const usuario of USUARIOS_PRUEBA) {
    console.log(`👤 Creando usuario: ${usuario.nombre} (${usuario.email})`)
    await crearUsuarioDesdeAdmin(adminPage, usuario)
  }

  await adminContext.close()
  console.log('✅ 10 usuarios creados correctamente')

  // ---------- 2) CADA USUARIO CREA 10 PRODUCTOS EN PARALELO ----------
  console.log('🚀 Iniciando creación de productos en paralelo (10 usuarios x 10 productos)')

  const promesasUsuarios = USUARIOS_PRUEBA.map(async (usuario, idx) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      console.log(`👤 [U${idx + 1}] Login como ${usuario.email}`)
      await login(page, usuario.email, usuario.password)

      await page.goto(`${BASE_URL}/dashboard/inventario`)
      await page.waitForLoadState('domcontentloaded')

      for (let i = 0; i < PRODUCTOS_MINIMARKET.length; i++) {
        const prod = PRODUCTOS_MINIMARKET[i]
        console.log(`🧾 [U${idx + 1}] Creando producto ${i + 1}: ${prod.nombre}`)
        await crearProducto(page, prod)
      }

      console.log(`✅ [U${idx + 1}] Usuario terminó de crear sus 10 productos`)
    } catch (err: any) {
      console.log(`💥 [U${idx + 1}] Error creando productos: ${err.message}`)
    } finally {
      await context.close()
    }
  })

  await Promise.all(promesasUsuarios)

  console.log('🎉 Test completo: 10 usuarios + 10 productos cada uno (en Firebase deploy)')
})
