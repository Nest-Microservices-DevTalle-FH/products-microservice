# INNER JOIN

## ¿Qué es?

El **INNER JOIN** devuelve únicamente los registros que tienen coincidencias en **AMBAS** tablas. Es el tipo de JOIN más restrictivo.

## Analogía

Imagina una fiesta donde solo pueden entrar **parejas**:
- Si vienes con pareja → Entras ✅
- Si vienes solo → No entras ❌

## Diagrama Visual

```
Tabla A (Clientes)    Tabla B (Órdenes)
┌──────────────┐      ┌──────────────┐
│ 1. Juan      │──────│ Laptop       │  ✅ Coincide
│ 2. María     │──────│ Teclado      │  ✅ Coincide
│ 3. Pedro     │      └──────────────┘
└──────────────┘
                      ┌──────────────┐
                      │ Monitor      │  ❌ Sin cliente
                      └──────────────┘

RESULTADO INNER JOIN:
┌──────────────┬──────────────┐
│ Juan         │ Laptop       │
│ María        │ Teclado      │
└──────────────┴──────────────┘

❌ Pedro NO aparece (no tiene órdenes)
❌ Monitor NO aparece (no tiene cliente)
```

## Ejemplo SQL tradicional

```sql
SELECT clientes.nombre, ordenes.producto
FROM clientes
INNER JOIN ordenes ON clientes.id = ordenes.clienteId;
```

## En Prisma

Prisma no tiene una sintaxis directa para INNER JOIN, pero puedes lograrlo con `where`:

### Schema

```prisma
model Cliente {
  id      Int     @id @default(autoincrement())
  nombre  String
  ordenes Orden[]
}

model Orden {
  id         Int     @id @default(autoincrement())
  producto   String
  clienteId  Int
  cliente    Cliente @relation(fields: [clienteId], references: [id])
}
```

### Método 1: Filtrar clientes que tienen órdenes

```typescript
// Solo clientes que tienen al menos una orden
const clientesConOrdenes = await prisma.cliente.findMany({
  where: {
    ordenes: {
      some: {}  // Al menos una orden
    }
  },
  include: {
    ordenes: true
  }
});

console.log(clientesConOrdenes);
// [
//   {
//     id: 1,
//     nombre: "Juan",
//     ordenes: [
//       { id: 1, producto: "Laptop", clienteId: 1 },
//       { id: 2, producto: "Mouse", clienteId: 1 }
//     ]
//   },
//   {
//     id: 2,
//     nombre: "María",
//     ordenes: [
//       { id: 3, producto: "Teclado", clienteId: 2 }
//     ]
//   }
// ]
// ❌ Pedro NO aparece porque no tiene órdenes
```

### Método 2: Desde las órdenes (más parecido a INNER JOIN)

```typescript
// Todas las órdenes con su cliente
const ordenesConCliente = await prisma.orden.findMany({
  include: {
    cliente: true
  }
});

console.log(ordenesConCliente);
// [
//   {
//     id: 1,
//     producto: "Laptop",
//     clienteId: 1,
//     cliente: { id: 1, nombre: "Juan" }
//   },
//   {
//     id: 2,
//     producto: "Mouse",
//     clienteId: 1,
//     cliente: { id: 1, nombre: "Juan" }
//   },
//   {
//     id: 3,
//     producto: "Teclado",
//     clienteId: 2,
//     cliente: { id: 2, nombre: "María" }
//   }
// ]
```

## Ejemplos prácticos

### Ejemplo 1: Productos con al menos una orden

```typescript
// Schema extendido
model Product {
  id       Int         @id @default(autoincrement())
  name     String
  price    Float
  ordenes  OrderItem[]
}

model OrderItem {
  id         Int     @id @default(autoincrement())
  cantidad   Int
  productId  Int
  product    Product @relation(fields: [productId], references: [id])
}

// Solo productos que se han vendido
const productosVendidos = await prisma.product.findMany({
  where: {
    ordenes: {
      some: {}  // Al menos un item de orden
    }
  },
  include: {
    ordenes: true
  }
});
```

### Ejemplo 2: Usuarios con publicaciones

```typescript
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}

model Post {
  id      Int    @id @default(autoincrement())
  title   String
  userId  Int
  user    User   @relation(fields: [userId], references: [id])
}

// Solo usuarios que han publicado algo
const usuariosActivos = await prisma.user.findMany({
  where: {
    posts: {
      some: {}
    }
  },
  include: {
    posts: true
  }
});
```

### Ejemplo 3: Productos de una categoría específica

```typescript
model Product {
  id         Int      @id @default(autoincrement())
  name       String
  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String
  products Product[]
}

// Solo categorías que tienen productos
const categoriasConProductos = await prisma.category.findMany({
  where: {
    products: {
      some: {}
    }
  },
  include: {
    products: true
  }
});

// O desde productos (más natural)
const productosConCategoria = await prisma.product.findMany({
  include: {
    category: true  // Siempre incluirá la categoría porque es requerida
  }
});
```

## Casos de uso comunes

### 1. Dashboard - Clientes con compras

```typescript
async obtenerClientesActivos() {
  return await prisma.cliente.findMany({
    where: {
      ordenes: {
        some: {
          createdAt: {
            gte: new Date('2024-01-01')  // Desde enero 2024
          }
        }
      }
    },
    include: {
      ordenes: {
        where: {
          createdAt: {
            gte: new Date('2024-01-01')
          }
        }
      }
    }
  });
}
```

### 2. Reporte de ventas - Productos vendidos

```typescript
async obtenerProductosVendidos() {
  return await prisma.product.findMany({
    where: {
      ordenes: {
        some: {}
      }
    },
    include: {
      _count: {
        select: { ordenes: true }
      }
    },
    orderBy: {
      ordenes: {
        _count: 'desc'  // Más vendidos primero
      }
    }
  });
}
```

### 3. Validación - Verificar relación

```typescript
async verificarClienteTieneOrdenes(clienteId: number): Promise<boolean> {
  const cliente = await prisma.cliente.findFirst({
    where: {
      id: clienteId,
      ordenes: {
        some: {}
      }
    }
  });

  return cliente !== null;
}
```

## Comparación con otros JOINs

| Aspecto | INNER JOIN | LEFT JOIN |
|---------|------------|-----------|
| Registros de tabla A sin relación | ❌ No aparecen | ✅ Sí aparecen |
| Registros de tabla B sin relación | ❌ No aparecen | ❌ No aparecen |
| Caso de uso | Solo coincidencias | Todos de A |
| Ejemplo | Clientes con órdenes | Todos los clientes |

## Ventajas y desventajas

### ✅ Ventajas
- Resultados más específicos y relevantes
- Mejor rendimiento (menos datos)
- Ideal para reportes de actividad

### ❌ Desventajas
- Excluye información que podría ser útil
- Puede perder contexto (clientes sin órdenes)
- No sirve para listar "todos"

## Tips y mejores prácticas

1. **Usa INNER JOIN cuando:**
   - Solo necesitas registros con relación activa
   - Estás generando reportes de actividad
   - Quieres optimizar el rendimiento

2. **NO uses INNER JOIN cuando:**
   - Necesitas ver el total de registros
   - Quieres identificar registros sin relación
   - Haces listados completos

3. **Optimización:**
   ```typescript
   // ✅ Bien - Solo trae lo necesario
   await prisma.cliente.findMany({
     where: { ordenes: { some: {} } },
     select: {
       nombre: true,
       ordenes: {
         select: { producto: true }
       }
     }
   });

   // ❌ Mal - Trae todo
   await prisma.cliente.findMany({
     where: { ordenes: { some: {} } },
     include: { ordenes: true }
   });
   ```

## Ejemplos avanzados con múltiples tablas

### Schema completo para ejemplos

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

### Ejemplo 1: Usuarios que compraron productos de una categoría específica

**Con Prisma (anidado):**
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

**Con SQL directo ($queryRaw):**
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

### Ejemplo 2: Productos más vendidos con detalles completos

**Con Prisma:**
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

**Con SQL directo:**
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

### Ejemplo 3: Reporte de ventas por categoría y usuario

**Con SQL directo (consulta compleja):**
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

### Ejemplo 4: Análisis de comportamiento de compra (3+ tablas)

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

### Comparación: Prisma vs SQL directo

| Aspecto | Prisma (anidado) | SQL Directo ($queryRaw) |
|---------|------------------|-------------------------|
| **Legibilidad** | ✅ Fácil de leer | ⚠️ Requires conocer SQL |
| **Type-safety** | ✅ Totalmente tipado | ❌ Requires tipado manual |
| **Performance** | ⚠️ Puede hacer múltiples queries | ✅ Una sola query optimizada |
| **Agregaciones** | ⚠️ Limitado, procesar en JS | ✅ Nativo en SQL |
| **Mantenibilidad** | ✅ Fácil de mantener | ⚠️ Más complejo |
| **Flexibilidad** | ⚠️ Limitado a API Prisma | ✅ Total flexibilidad |

### Cuándo usar SQL directo

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

## Resumen

**INNER JOIN** = Solo registros con coincidencias en ambas tablas

En Prisma: `where: { relacion: { some: {} } }`

En SQL directo: `INNER JOIN tabla ON condicion`

**Ejemplo mental**: Una fiesta solo para parejas - si no tienes pareja, no entras.
