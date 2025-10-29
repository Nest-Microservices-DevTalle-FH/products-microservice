# INNER JOIN - Ejemplos Avanzados

Ejemplos complejos de INNER JOIN con múltiples tablas (3+) y consultas SQL directas usando Prisma.

## Schema completo para ejemplos

```prisma
model User {
  id       Int       @id @default(autoincrement())
  name     String
  email    String    @unique
  orders   Order[]
  reviews  Review[]
}

model Order {
  id         Int         @id @default(autoincrement())
  userId     Int
  total      Float
  status     String
  user       User        @relation(fields: [userId], references: [id])
  orderItems OrderItem[]
  createdAt  DateTime    @default(now())
}

model OrderItem {
  id         Int     @id @default(autoincrement())
  orderId    Int
  productId  Int
  quantity   Int
  price      Float
  order      Order   @relation(fields: [orderId], references: [id])
  product    Product @relation(fields: [productId], references: [id])
}

model Product {
  id         Int         @id @default(autoincrement())
  name       String
  price      Float
  categoryId Int
  category   Category    @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]
  reviews    Review[]
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String
  products Product[]
}

model Review {
  id        Int     @id @default(autoincrement())
  rating    Int
  comment   String
  userId    Int
  productId Int
  user      User    @relation(fields: [userId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}
```

## Ejemplo 1: Usuarios que compraron productos de una categoría específica

### Con Prisma (anidado)

```typescript
async usuariosQueCompraronCategoria(categoriaId: number) {
  const usuarios = await prisma.user.findMany({
    where: {
      orders: {
        some: {
          orderItems: {
            some: {
              product: {
                categoryId: categoriaId
              }
            }
          }
        }
      }
    },
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
      }
    }
  });

  return usuarios.map(user => ({
    id: user.id,
    nombre: user.name,
    totalOrdenes: user.orders.length,
    productos: user.orders.flatMap(order =>
      order.orderItems.map(item => ({
        nombre: item.product.name,
        categoria: item.product.category.name,
        cantidad: item.quantity
      }))
    )
  }));
}
```

### Con SQL directo ($queryRaw)

```typescript
async usuariosQueCompraronCategoriaSQL(categoriaId: number) {
  const resultado = await prisma.$queryRaw`
    SELECT DISTINCT
      u.id,
      u.name,
      u.email,
      COUNT(DISTINCT o.id) as total_ordenes,
      COUNT(DISTINCT oi.productId) as productos_diferentes
    FROM "User" u
    INNER JOIN "Order" o ON u.id = o.userId
    INNER JOIN "OrderItem" oi ON o.id = oi.orderId
    INNER JOIN "Product" p ON oi.productId = p.id
    INNER JOIN "Category" c ON p.categoryId = c.id
    WHERE c.id = ${categoriaId}
    GROUP BY u.id, u.name, u.email
    ORDER BY total_ordenes DESC
  `;

  return resultado;
}

// Resultado:
// [
//   {
//     id: 1,
//     name: "Juan",
//     email: "juan@mail.com",
//     total_ordenes: 5,
//     productos_diferentes: 12
//   },
//   {
//     id: 3,
//     name: "María",
//     email: "maria@mail.com",
//     total_ordenes: 3,
//     productos_diferentes: 8
//   }
// ]
```

## Ejemplo 2: Productos más vendidos con detalles completos

### Con Prisma

```typescript
async productosMasVendidos(limite: number = 10) {
  const productos = await prisma.product.findMany({
    where: {
      orderItems: {
        some: {}
      }
    },
    include: {
      category: true,
      orderItems: {
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      },
      reviews: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true
        }
      }
    }
  });

  // Procesar y ordenar
  const procesados = productos.map(producto => {
    const cantidadTotal = producto.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const ingresoTotal = producto.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const promedioRating = producto.reviews.length > 0
      ? producto.reviews.reduce((sum, r) => sum + r.rating, 0) / producto.reviews.length
      : 0;

    return {
      id: producto.id,
      nombre: producto.name,
      categoria: producto.category.name,
      cantidadVendida: cantidadTotal,
      ingresoTotal,
      promedioRating: Math.round(promedioRating * 10) / 10,
      totalReviews: producto._count.reviews,
      clientesUnicos: new Set(producto.orderItems.map(i => i.order.userId)).size
    };
  });

  return procesados
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, limite);
}
```

### Con SQL directo

```typescript
async productosMasVendidosSQL(limite: number = 10) {
  const resultado = await prisma.$queryRaw`
    SELECT
      p.id,
      p.name AS nombre,
      c.name AS categoria,
      SUM(oi.quantity) AS cantidad_vendida,
      SUM(oi.price * oi.quantity) AS ingreso_total,
      COUNT(DISTINCT o.userId) AS clientes_unicos,
      COUNT(DISTINCT o.id) AS total_ordenes,
      AVG(r.rating) AS promedio_rating,
      COUNT(DISTINCT r.id) AS total_reviews
    FROM "Product" p
    INNER JOIN "Category" c ON p.categoryId = c.id
    INNER JOIN "OrderItem" oi ON p.id = oi.productId
    INNER JOIN "Order" o ON oi.orderId = o.id
    LEFT JOIN "Review" r ON p.id = r.productId
    WHERE o.status = 'completed'
    GROUP BY p.id, p.name, c.name
    HAVING SUM(oi.quantity) > 0
    ORDER BY cantidad_vendida DESC
    LIMIT ${limite}
  `;

  return resultado;
}

// Resultado:
// [
//   {
//     id: 15,
//     nombre: "Laptop Gaming",
//     categoria: "Electrónica",
//     cantidad_vendida: 245,
//     ingreso_total: 244755.00,
//     clientes_unicos: 198,
//     total_ordenes: 235,
//     promedio_rating: 4.7,
//     total_reviews: 156
//   },
//   ...
// ]
```

## Ejemplo 3: Reporte de ventas por categoría y usuario

### Con SQL directo (consulta compleja)

```typescript
async reporteVentasPorCategoriaYUsuario(fechaInicio: Date, fechaFin: Date) {
  const resultado = await prisma.$queryRaw`
    SELECT
      u.id AS usuario_id,
      u.name AS usuario_nombre,
      c.id AS categoria_id,
      c.name AS categoria_nombre,
      COUNT(DISTINCT o.id) AS total_ordenes,
      COUNT(DISTINCT p.id) AS productos_diferentes,
      SUM(oi.quantity) AS cantidad_total,
      SUM(oi.price * oi.quantity) AS monto_gastado,
      MIN(o.createdAt) AS primera_compra,
      MAX(o.createdAt) AS ultima_compra,
      ROUND(AVG(r.rating), 2) AS promedio_satisfaccion
    FROM "User" u
    INNER JOIN "Order" o ON u.id = o.userId
    INNER JOIN "OrderItem" oi ON o.id = oi.orderId
    INNER JOIN "Product" p ON oi.productId = p.id
    INNER JOIN "Category" c ON p.categoryId = c.id
    LEFT JOIN "Review" r ON r.userId = u.id AND r.productId = p.id
    WHERE o.createdAt BETWEEN ${fechaInicio} AND ${fechaFin}
      AND o.status = 'completed'
    GROUP BY u.id, u.name, c.id, c.name
    HAVING SUM(oi.quantity) > 0
    ORDER BY monto_gastado DESC
  `;

  return resultado;
}

// Uso:
const reporte = await reporteVentasPorCategoriaYUsuario(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Resultado:
// [
//   {
//     usuario_id: 1,
//     usuario_nombre: "Juan",
//     categoria_id: 2,
//     categoria_nombre: "Electrónica",
//     total_ordenes: 8,
//     productos_diferentes: 15,
//     cantidad_total: 23,
//     monto_gastado: 15450.00,
//     primera_compra: "2024-01-15T10:30:00",
//     ultima_compra: "2024-11-20T14:22:00",
//     promedio_satisfaccion: 4.5
//   },
//   ...
// ]
```

## Ejemplo 4: Análisis de comportamiento de compra (6 tablas)

```typescript
async analisisComportamientoCompra() {
  // Solo usuarios que han comprado, revisado productos, y esos productos están en categorías activas
  const resultado = await prisma.$queryRaw`
    SELECT
      u.id,
      u.name,
      u.email,
      -- Métricas de compra
      COUNT(DISTINCT o.id) AS total_compras,
      SUM(o.total) AS gasto_total,
      AVG(o.total) AS ticket_promedio,
      -- Métricas de productos
      COUNT(DISTINCT oi.productId) AS productos_comprados,
      COUNT(DISTINCT p.categoryId) AS categorias_exploradas,
      -- Métricas de engagement
      COUNT(DISTINCT r.id) AS reviews_escritas,
      AVG(r.rating) AS calificacion_promedio_dada,
      -- Temporalidad
      DATE_PART('day', MAX(o.createdAt) - MIN(o.createdAt)) AS dias_como_cliente,
      DATE_PART('day', NOW() - MAX(o.createdAt)) AS dias_desde_ultima_compra,
      -- Clasificación
      CASE
        WHEN COUNT(DISTINCT o.id) >= 10 THEN 'VIP'
        WHEN COUNT(DISTINCT o.id) >= 5 THEN 'Frecuente'
        WHEN COUNT(DISTINCT o.id) >= 2 THEN 'Recurrente'
        ELSE 'Nuevo'
      END AS tipo_cliente
    FROM "User" u
    INNER JOIN "Order" o ON u.id = o.userId
    INNER JOIN "OrderItem" oi ON o.id = oi.orderId
    INNER JOIN "Product" p ON oi.productId = p.id
    INNER JOIN "Category" c ON p.categoryId = c.id
    INNER JOIN "Review" r ON u.id = r.userId
    WHERE o.status = 'completed'
      AND c.name IS NOT NULL
    GROUP BY u.id, u.name, u.email
    HAVING COUNT(DISTINCT o.id) > 0
      AND COUNT(DISTINCT r.id) > 0
    ORDER BY gasto_total DESC
  `;

  return resultado;
}
```

## Comparación: Prisma vs SQL directo

| Aspecto | Prisma (anidado) | SQL Directo ($queryRaw) |
|---------|------------------|-------------------------|
| **Legibilidad** | ✅ Fácil de leer | ⚠️ Requiere conocer SQL |
| **Type-safety** | ✅ Totalmente tipado | ❌ Requiere tipado manual |
| **Performance** | ⚠️ Puede hacer múltiples queries | ✅ Una sola query optimizada |
| **Agregaciones** | ⚠️ Limitado, procesar en JS | ✅ Nativo en SQL |
| **Mantenibilidad** | ✅ Fácil de mantener | ⚠️ Más complejo |
| **Flexibilidad** | ⚠️ Limitado a API Prisma | ✅ Total flexibilidad |

## Cuándo usar SQL directo

✅ **Usa SQL directo cuando:**
- Necesitas agregaciones complejas (SUM, AVG, GROUP BY)
- Joins de 3+ tablas con filtros complejos
- Performance crítico (reportes pesados)
- Queries analíticas complejas

❌ **NO uses SQL directo cuando:**
- Operaciones CRUD simples
- Prisma puede expresar la query claramente
- Necesitas mantener type-safety total
- Estás aprendiendo el sistema

## Tips de performance

1. **Usa índices en campos de JOIN:**
```prisma
model Product {
  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])

  @@index([categoryId])
}
```

2. **Limita los campos seleccionados:**
```typescript
// ✅ Mejor
select: { id: true, name: true }

// ❌ Evitar si no es necesario
include: { orders: true }
```

3. **Usa paginación en queries grandes:**
```sql
LIMIT ${limit} OFFSET ${offset}
```

4. **Aprovecha HAVING para filtrar después de agrupar:**
```sql
GROUP BY u.id
HAVING COUNT(o.id) > 5
```
