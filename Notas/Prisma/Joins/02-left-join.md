# LEFT JOIN (LEFT OUTER JOIN)

## ¿Qué es?

El **LEFT JOIN** devuelve **TODOS** los registros de la tabla izquierda (tabla principal), y los registros coincidentes de la tabla derecha. Si no hay coincidencia, los valores de la tabla derecha serán `null`.

## Analogía

Imagina una lista de asistencia a clase:
- Todos los estudiantes aparecen en la lista ✅
- Si trajeron tarea, se marca ✅
- Si no trajeron tarea, aparece vacío ⬜

**Todos los estudiantes aparecen**, tengan o no tarea.

## Diagrama Visual

```
Tabla A (Clientes)    Tabla B (Órdenes)
┌──────────────┐      ┌──────────────┐
│ 1. Juan      │──────│ Laptop       │  ✅ Coincide
│ 2. María     │──────│ Teclado      │  ✅ Coincide
│ 3. Pedro     │      └──────────────┘  ⚠️ Sin orden
└──────────────┘

RESULTADO LEFT JOIN:
┌──────────────┬──────────────┐
│ Juan         │ Laptop       │  ✅ Con orden
│ María        │ Teclado      │  ✅ Con orden
│ Pedro        │ null         │  ⚠️ Sin orden (pero aparece)
└──────────────┴──────────────┘

✅ TODOS los clientes aparecen
⚠️ Pedro aparece con null porque no tiene órdenes
```

## Ejemplo SQL tradicional

```sql
SELECT clientes.nombre, ordenes.producto
FROM clientes
LEFT JOIN ordenes ON clientes.id = ordenes.clienteId;
```

## En Prisma

En Prisma, el comportamiento por defecto de `include` es como un LEFT JOIN:

### Schema

```prisma
model Cliente {
  id      Int     @id @default(autoincrement())
  nombre  String
  email   String
  ordenes Orden[]
}

model Orden {
  id         Int      @id @default(autoincrement())
  producto   String
  total      Float
  clienteId  Int
  cliente    Cliente  @relation(fields: [clienteId], references: [id])
  createdAt  DateTime @default(now())
}
```

### Implementación básica

```typescript
// TODOS los clientes, con sus órdenes si las tienen
const todosLosClientes = await prisma.cliente.findMany({
  include: {
    ordenes: true
  }
});

console.log(todosLosClientes);
// [
//   {
//     id: 1,
//     nombre: "Juan",
//     email: "juan@mail.com",
//     ordenes: [
//       { id: 1, producto: "Laptop", total: 999.99 },
//       { id: 2, producto: "Mouse", total: 25.50 }
//     ]
//   },
//   {
//     id: 2,
//     nombre: "María",
//     email: "maria@mail.com",
//     ordenes: [
//       { id: 3, producto: "Teclado", total: 75.00 }
//     ]
//   },
//   {
//     id: 3,
//     nombre: "Pedro",
//     email: "pedro@mail.com",
//     ordenes: []  // ← Array vacío, no null
//   }
// ]
```

## Ejemplos prácticos

### Ejemplo 1: Productos con sus órdenes

```typescript
model Product {
  id          Int         @id @default(autoincrement())
  name        String
  price       Float
  available   Boolean     @default(true)
  orderItems  OrderItem[]
}

model OrderItem {
  id         Int     @id @default(autoincrement())
  quantity   Int
  productId  Int
  product    Product @relation(fields: [productId], references: [id])
}

// TODOS los productos disponibles, tengan o no ventas
const todosLosProductos = await prisma.product.findMany({
  where: {
    available: true
  },
  include: {
    orderItems: true
  }
});

// Identificar productos sin ventas
const productosSinVentas = todosLosProductos.filter(
  producto => producto.orderItems.length === 0
);

console.log(`Productos sin ventas: ${productosSinVentas.length}`);
```

### Ejemplo 2: Usuarios con sus publicaciones

```typescript
model User {
  id        Int       @id @default(autoincrement())
  name      String
  email     String    @unique
  posts     Post[]
  createdAt DateTime  @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  published Boolean  @default(false)
}

// TODOS los usuarios con sus posts publicados
const todosLosUsuarios = await prisma.user.findMany({
  include: {
    posts: {
      where: {
        published: true
      }
    },
    _count: {
      select: { posts: true }
    }
  }
});

// Formatear resultado
const usuariosFormateados = todosLosUsuarios.map(usuario => ({
  nombre: usuario.name,
  totalPosts: usuario._count.posts,
  tienePosts: usuario.posts.length > 0,
  posts: usuario.posts
}));
```

### Ejemplo 3: Categorías con productos

```typescript
model Category {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  products    Product[]
}

model Product {
  id         Int      @id @default(autoincrement())
  name       String
  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])
}

// TODAS las categorías con cantidad de productos
const todasLasCategorias = await prisma.category.findMany({
  include: {
    _count: {
      select: { products: true }
    },
    products: {
      take: 5  // Solo primeros 5 productos
    }
  }
});

// Análisis de categorías
const analisis = todasLasCategorias.map(cat => ({
  categoria: cat.name,
  totalProductos: cat._count.products,
  tieneProductos: cat._count.products > 0,
  estado: cat._count.products === 0 ? 'Vacía' : 'Activa'
}));

console.log(analisis);
// [
//   { categoria: "Electrónica", totalProductos: 25, tieneProductos: true, estado: "Activa" },
//   { categoria: "Ropa", totalProductos: 0, tieneProductos: false, estado: "Vacía" },
//   { categoria: "Hogar", totalProductos: 10, tieneProductos: true, estado: "Activa" }
// ]
```

## Casos de uso comunes

### 1. Dashboard completo

```typescript
async obtenerEstadisticasClientes() {
  const clientes = await prisma.cliente.findMany({
    include: {
      ordenes: {
        where: {
          createdAt: {
            gte: new Date('2024-01-01')
          }
        }
      },
      _count: {
        select: {
          ordenes: true
        }
      }
    }
  });

  return clientes.map(cliente => ({
    id: cliente.id,
    nombre: cliente.nombre,
    totalOrdenes: cliente._count.ordenes,
    ordenesEsteAño: cliente.ordenes.length,
    estado: cliente.ordenes.length > 0 ? 'Activo' : 'Inactivo'
  }));
}
```

### 2. Reporte de inventario

```typescript
async reporteInventario() {
  const productos = await prisma.product.findMany({
    include: {
      orderItems: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      },
      _count: {
        select: {
          orderItems: true
        }
      }
    }
  });

  return productos.map(producto => {
    const ventasRecientes = producto.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return {
      nombre: producto.name,
      precio: producto.price,
      ventasTotales: producto._count.orderItems,
      ventasUltimos30Dias: ventasRecientes,
      rendimiento: ventasRecientes > 0 ? 'Bueno' : 'Sin ventas'
    };
  });
}
```

### 3. Lista de verificación

```typescript
async verificarCompletitudPerfiles() {
  const usuarios = await prisma.user.findMany({
    include: {
      profile: true,  // Relación uno a uno
      posts: true,
      comments: true
    }
  });

  return usuarios.map(usuario => ({
    id: usuario.id,
    nombre: usuario.name,
    tieneProfile: usuario.profile !== null,
    tienePosts: usuario.posts.length > 0,
    tieneComments: usuario.comments.length > 0,
    completitud:
      (usuario.profile ? 1 : 0) +
      (usuario.posts.length > 0 ? 1 : 0) +
      (usuario.comments.length > 0 ? 1 : 0)
  }));
}
```

## Comparación con INNER JOIN

### Datos de ejemplo:

**Clientes:**
- 1: Juan
- 2: María
- 3: Pedro

**Órdenes:**
- Laptop (cliente 1)
- Mouse (cliente 1)
- Teclado (cliente 2)

### INNER JOIN (solo con órdenes):
```typescript
const resultado = await prisma.cliente.findMany({
  where: { ordenes: { some: {} } },
  include: { ordenes: true }
});
// Resultado: Juan (2 órdenes), María (1 orden)
// ❌ Pedro NO aparece
```

### LEFT JOIN (todos los clientes):
```typescript
const resultado = await prisma.cliente.findMany({
  include: { ordenes: true }
});
// Resultado: Juan (2 órdenes), María (1 orden), Pedro (0 órdenes)
// ✅ Pedro SÍ aparece
```

## Identificar registros sin relación

```typescript
// Clientes sin órdenes
const clientesSinOrdenes = await prisma.cliente.findMany({
  where: {
    ordenes: {
      none: {}  // Ninguna orden
    }
  }
});

// Productos sin ventas en los últimos 90 días
const productosSinVentas = await prisma.product.findMany({
  where: {
    orderItems: {
      none: {
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    }
  }
});
```

## Agregaciones con LEFT JOIN

```typescript
// Suma de órdenes por cliente (incluye clientes sin órdenes)
const clientesConTotales = await prisma.cliente.findMany({
  include: {
    ordenes: {
      select: {
        total: true
      }
    }
  }
});

const resultados = clientesConTotales.map(cliente => ({
  nombre: cliente.nombre,
  totalGastado: cliente.ordenes.reduce((sum, orden) => sum + orden.total, 0),
  cantidadOrdenes: cliente.ordenes.length
}));

console.log(resultados);
// [
//   { nombre: "Juan", totalGastado: 1025.49, cantidadOrdenes: 2 },
//   { nombre: "María", totalGastado: 75.00, cantidadOrdenes: 1 },
//   { nombre: "Pedro", totalGastado: 0, cantidadOrdenes: 0 }
// ]
```

## Ventajas y desventajas

### ✅ Ventajas
- Muestra el panorama completo
- Identifica registros sin relación
- Ideal para dashboards y reportes generales
- No pierdes información de la tabla principal

### ❌ Desventajas
- Puede devolver más datos de los necesarios
- Requires manejo de valores nulos (arrays vacíos)
- Puede ser más lento que INNER JOIN

## Tips y mejores prácticas

1. **Usa LEFT JOIN cuando:**
   - Necesitas listar todos los registros principales
   - Quieres identificar registros sin relación
   - Haces dashboards o reportes generales

2. **Optimiza con select:**
   ```typescript
   // ✅ Mejor rendimiento
   await prisma.cliente.findMany({
     select: {
       nombre: true,
       ordenes: {
         select: {
           producto: true,
           total: true
         }
       }
     }
   });
   ```

3. **Cuenta sin traer todos los datos:**
   ```typescript
   await prisma.cliente.findMany({
     include: {
       _count: {
         select: { ordenes: true }
       }
     }
   });
   ```

## Ejemplos avanzados con múltiples tablas y SQL directo

### Ejemplo 1: Reporte completo de clientes con actividad (3 tablas)

**Con Prisma:**
```typescript
async reporteCompletoClientes() {
  const clientes = await prisma.user.findMany({
    include: {
      orders: {
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      },
      reviews: true,
      _count: {
        select: {
          orders: true,
          reviews: true
        }
      }
    }
  });

  return clientes.map(cliente => ({
    id: cliente.id,
    nombre: cliente.name,
    email: cliente.email,
    totalOrdenes: cliente._count.orders,
    totalReviews: cliente._count.reviews,
    gastoTotal: cliente.orders.reduce((sum, order) =>
      sum + order.orderItems.reduce((s, item) => s + (item.price * item.quantity), 0),
      0
    ),
    categoriasCompradas: [...new Set(
      cliente.orders.flatMap(order =>
        order.orderItems.map(item => item.product.category.name)
      )
    )],
    estado: cliente._count.orders === 0 ? 'Sin actividad' : 'Activo'
  }));
}
```

**Con SQL directo:**
```typescript
async reporteCompletoClientesSQL() {
  const resultado = await prisma.$queryRaw`
    SELECT
      u.id,
      u.name AS nombre,
      u.email,
      -- Órdenes
      COUNT(DISTINCT o.id) AS total_ordenes,
      COALESCE(SUM(o.total), 0) AS gasto_total,
      COALESCE(AVG(o.total), 0) AS ticket_promedio,
      -- Productos y categorías
      COUNT(DISTINCT oi.productId) AS productos_comprados,
      COUNT(DISTINCT p.categoryId) AS categorias_diferentes,
      STRING_AGG(DISTINCT c.name, ', ') AS categorias_lista,
      -- Reviews
      COUNT(DISTINCT r.id) AS total_reviews,
      COALESCE(AVG(r.rating), 0) AS calificacion_promedio,
      -- Estado
      CASE
        WHEN COUNT(o.id) = 0 THEN 'Sin actividad'
        WHEN COUNT(o.id) < 3 THEN 'Nuevo'
        WHEN COUNT(o.id) < 10 THEN 'Activo'
        ELSE 'VIP'
      END AS estado,
      -- Temporalidad
      MAX(o.createdAt) AS ultima_compra,
      DATE_PART('day', NOW() - MAX(o.createdAt)) AS dias_inactivo
    FROM "User" u
    LEFT JOIN "Order" o ON u.id = o.userId
    LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
    LEFT JOIN "Product" p ON oi.productId = p.id
    LEFT JOIN "Category" c ON p.categoryId = c.id
    LEFT JOIN "Review" r ON u.id = r.userId
    GROUP BY u.id, u.name, u.email
    ORDER BY gasto_total DESC NULLS LAST
  `;

  return resultado;
}

// Resultado incluye TODOS los clientes, incluso sin compras:
// [
//   {
//     id: 1,
//     nombre: "Juan",
//     email: "juan@mail.com",
//     total_ordenes: 15,
//     gasto_total: 12450.00,
//     ticket_promedio: 830.00,
//     productos_comprados: 35,
//     categorias_diferentes: 5,
//     categorias_lista: "Electrónica, Hogar, Deportes",
//     total_reviews: 8,
//     calificacion_promedio: 4.5,
//     estado: "VIP",
//     ultima_compra: "2024-11-20",
//     dias_inactivo: 5
//   },
//   {
//     id: 3,
//     nombre: "Pedro",
//     email: "pedro@mail.com",
//     total_ordenes: 0,          // ← Sin órdenes
//     gasto_total: 0,             // ← Todo en 0
//     ticket_promedio: 0,
//     productos_comprados: 0,
//     categorias_diferentes: 0,
//     categorias_lista: null,     // ← null
//     total_reviews: 0,
//     calificacion_promedio: 0,
//     estado: "Sin actividad",
//     ultima_compra: null,
//     dias_inactivo: null
//   }
// ]
```

### Ejemplo 2: Dashboard de productos con métricas (4 tablas)

```typescript
async dashboardProductos() {
  // TODOS los productos con sus métricas (incluso sin ventas)
  const resultado = await prisma.$queryRaw`
    SELECT
      p.id,
      p.name AS producto,
      p.price AS precio_actual,
      c.name AS categoria,
      -- Métricas de ventas
      COALESCE(COUNT(DISTINCT oi.id), 0) AS veces_vendido,
      COALESCE(SUM(oi.quantity), 0) AS cantidad_total_vendida,
      COALESCE(SUM(oi.price * oi.quantity), 0) AS ingresos_generados,
      -- Métricas de clientes
      COALESCE(COUNT(DISTINCT o.userId), 0) AS clientes_unicos,
      -- Métricas de reviews
      COALESCE(COUNT(DISTINCT r.id), 0) AS total_reviews,
      COALESCE(AVG(r.rating), 0) AS rating_promedio,
      -- Análisis de precio
      CASE
        WHEN COUNT(oi.id) > 0 THEN
          ROUND(AVG(oi.price), 2)
        ELSE p.price
      END AS precio_promedio_venta,
      -- Clasificación
      CASE
        WHEN COUNT(oi.id) = 0 THEN 'Sin ventas'
        WHEN COUNT(oi.id) < 5 THEN 'Bajo'
        WHEN COUNT(oi.id) < 20 THEN 'Medio'
        ELSE 'Alto'
      END AS nivel_demanda,
      -- Última actividad
      MAX(o.createdAt) AS ultima_venta
    FROM "Product" p
    INNER JOIN "Category" c ON p.categoryId = c.id
    LEFT JOIN "OrderItem" oi ON p.id = oi.productId
    LEFT JOIN "Order" o ON oi.orderId = o.id
    LEFT JOIN "Review" r ON p.id = r.productId
    WHERE p.available = true
    GROUP BY p.id, p.name, p.price, c.name
    ORDER BY ingresos_generados DESC NULLS LAST
  `;

  return resultado;
}
```

### Ejemplo 3: Análisis de categorías con penetración de mercado

```typescript
async analisisCategoriasCompleto() {
  // Todas las categorías con análisis detallado
  const resultado = await prisma.$queryRaw`
    SELECT
      c.id AS categoria_id,
      c.name AS categoria,
      -- Productos
      COUNT(DISTINCT p.id) AS total_productos,
      COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END) AS productos_vendidos,
      ROUND(
        COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END)::NUMERIC /
        NULLIF(COUNT(DISTINCT p.id), 0) * 100,
        2
      ) AS porcentaje_productos_activos,
      -- Ventas
      COALESCE(SUM(oi.quantity), 0) AS unidades_vendidas,
      COALESCE(SUM(oi.price * oi.quantity), 0) AS ingresos_totales,
      -- Clientes
      COUNT(DISTINCT o.userId) AS clientes_alcanzados,
      -- Reviews
      COUNT(DISTINCT r.id) AS total_reviews,
      COALESCE(AVG(r.rating), 0) AS satisfaccion_promedio,
      -- Temporalidad
      MIN(o.createdAt) AS primera_venta,
      MAX(o.createdAt) AS ultima_venta,
      DATE_PART('day', MAX(o.createdAt) - MIN(o.createdAt)) AS dias_activos,
      -- Estado de salud
      CASE
        WHEN COUNT(DISTINCT p.id) = 0 THEN 'Sin productos'
        WHEN COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END) = 0 THEN 'Sin ventas'
        WHEN COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END)::FLOAT /
             COUNT(DISTINCT p.id) < 0.3 THEN 'Bajo rendimiento'
        WHEN COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END)::FLOAT /
             COUNT(DISTINCT p.id) < 0.7 THEN 'Medio rendimiento'
        ELSE 'Alto rendimiento'
      END AS estado_salud
    FROM "Category" c
    LEFT JOIN "Product" p ON c.id = p.categoryId
    LEFT JOIN "OrderItem" oi ON p.id = oi.productId
    LEFT JOIN "Order" o ON oi.orderId = o.id
    LEFT JOIN "Review" r ON p.id = r.productId
    GROUP BY c.id, c.name
    ORDER BY ingresos_totales DESC NULLS LAST
  `;

  return resultado;
}

// Resultado muestra TODAS las categorías:
// [
//   {
//     categoria_id: 1,
//     categoria: "Electrónica",
//     total_productos: 45,
//     productos_vendidos: 38,
//     porcentaje_productos_activos: 84.44,
//     unidades_vendidas: 1250,
//     ingresos_totales: 125000.00,
//     clientes_alcanzados: 450,
//     total_reviews: 234,
//     satisfaccion_promedio: 4.3,
//     primera_venta: "2024-01-05",
//     ultima_venta: "2024-11-28",
//     dias_activos: 328,
//     estado_salud: "Alto rendimiento"
//   },
//   {
//     categoria_id: 5,
//     categoria: "Jardinería",    // ← Categoría sin ventas
//     total_productos: 8,
//     productos_vendidos: 0,       // ← Cero ventas
//     porcentaje_productos_activos: 0.00,
//     unidades_vendidas: 0,
//     ingresos_totales: 0.00,
//     clientes_alcanzados: 0,
//     total_reviews: 0,
//     satisfaccion_promedio: 0.00,
//     primera_venta: null,
//     ultima_venta: null,
//     dias_activos: null,
//     estado_salud: "Sin ventas"
//   }
// ]
```

### Ejemplo 4: Reporte de tendencias temporales (5 tablas)

```typescript
async reporteTendenciasMensual(año: number) {
  const resultado = await prisma.$queryRaw`
    WITH meses AS (
      SELECT generate_series(1, 12) AS mes
    ),
    ventas_por_mes AS (
      SELECT
        DATE_PART('month', o.createdAt) AS mes,
        u.id AS user_id,
        COUNT(DISTINCT o.id) AS ordenes,
        SUM(oi.quantity) AS unidades,
        SUM(oi.price * oi.quantity) AS ingresos,
        COUNT(DISTINCT p.categoryId) AS categorias
      FROM "Order" o
      INNER JOIN "User" u ON o.userId = u.id
      INNER JOIN "OrderItem" oi ON o.id = oi.orderId
      INNER JOIN "Product" p ON oi.productId = p.id
      WHERE DATE_PART('year', o.createdAt) = ${año}
        AND o.status = 'completed'
      GROUP BY DATE_PART('month', o.createdAt), u.id
    )
    SELECT
      m.mes,
      TO_CHAR(TO_DATE(m.mes::TEXT, 'MM'), 'Month') AS nombre_mes,
      -- Usuarios activos
      COUNT(DISTINCT v.user_id) AS usuarios_activos,
      -- Métricas de ventas
      COALESCE(SUM(v.ordenes), 0) AS total_ordenes,
      COALESCE(SUM(v.unidades), 0) AS unidades_vendidas,
      COALESCE(SUM(v.ingresos), 0) AS ingresos_totales,
      -- Promedios
      COALESCE(AVG(v.ingresos), 0) AS ingreso_promedio_por_usuario,
      COALESCE(AVG(v.ordenes), 0) AS ordenes_promedio_por_usuario,
      -- Diversidad
      COALESCE(AVG(v.categorias), 0) AS categorias_promedio_por_usuario,
      -- Comparación con mes anterior
      LAG(COALESCE(SUM(v.ingresos), 0)) OVER (ORDER BY m.mes) AS ingresos_mes_anterior,
      CASE
        WHEN LAG(SUM(v.ingresos)) OVER (ORDER BY m.mes) IS NULL THEN NULL
        ELSE ROUND(
          ((COALESCE(SUM(v.ingresos), 0) -
            LAG(COALESCE(SUM(v.ingresos), 0)) OVER (ORDER BY m.mes)) /
           NULLIF(LAG(COALESCE(SUM(v.ingresos), 0)) OVER (ORDER BY m.mes), 0)) * 100,
          2
        )
      END AS crecimiento_porcentual
    FROM meses m
    LEFT JOIN ventas_por_mes v ON m.mes = v.mes
    GROUP BY m.mes
    ORDER BY m.mes
  `;

  return resultado;
}
```

### Ventajas de LEFT JOIN en SQL directo

1. **COALESCE para valores nulos**: Maneja automáticamente los nulos
2. **NULLS LAST**: Ordena registros sin datos al final
3. **Agregaciones con LEFT JOIN**: Incluye registros con 0
4. **STRING_AGG**: Concatena valores relacionados

### Tips específicos para LEFT JOIN con SQL

```typescript
// ✅ Usar COALESCE para evitar NULL
SELECT
  u.name,
  COALESCE(COUNT(o.id), 0) AS ordenes  -- 0 en lugar de NULL
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId
GROUP BY u.id, u.name

// ✅ Filtrar después del JOIN (WHERE en tabla principal)
SELECT *
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId
WHERE u.active = true  -- Filtra usuarios, mantiene LEFT JOIN

// ❌ Evitar WHERE en tabla del LEFT JOIN (convierte a INNER)
SELECT *
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId
WHERE o.status = 'completed'  -- ⚠️ Esto elimina usuarios sin órdenes!

// ✅ Correcto: Usar condición en el JOIN
SELECT *
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId AND o.status = 'completed'
```

## Resumen

**LEFT JOIN** = Todos los registros de la tabla principal + coincidencias de la relacionada

En Prisma: Por defecto con `include`

En SQL directo: `LEFT JOIN tabla ON condicion` (con COALESCE para NULL)

**Ejemplo mental**: Lista de asistencia - todos los estudiantes aparecen, tengan o no tarea.
