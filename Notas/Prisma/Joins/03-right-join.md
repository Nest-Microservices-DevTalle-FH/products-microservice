# RIGHT JOIN (RIGHT OUTER JOIN)

## ¿Qué es?

El **RIGHT JOIN** devuelve **TODOS** los registros de la tabla derecha (tabla secundaria), y los registros coincidentes de la tabla izquierda. Si no hay coincidencia, los valores de la tabla izquierda serán `null`.

Es exactamente lo **opuesto** al LEFT JOIN.

## Analogía

Imagina un inventario de almacén:
- Todos los productos del inventario aparecen ✅
- Si tienen proveedor asignado, se muestra ✅
- Si no tienen proveedor, aparece vacío ⬜

**Todos los productos aparecen**, tengan o no proveedor.

## Diagrama Visual

```
Tabla A (Clientes)    Tabla B (Órdenes)
┌──────────────┐      ┌──────────────┐
│ 1. Juan      │──────│ Laptop       │  ✅ Coincide
│ 2. María     │──────│ Teclado      │  ✅ Coincide
│ 3. Pedro     │      │ Monitor      │  ⚠️ Sin cliente (orden huérfana)
└──────────────┘      └──────────────┘

RESULTADO RIGHT JOIN:
┌──────────────┬──────────────┐
│ Juan         │ Laptop       │  ✅ Con cliente
│ María        │ Teclado      │  ✅ Con cliente
│ null         │ Monitor      │  ⚠️ Sin cliente (pero aparece)
└──────────────┴──────────────┘

✅ TODAS las órdenes aparecen
⚠️ La orden "Monitor" aparece con cliente null
```

## Ejemplo SQL tradicional

```sql
SELECT clientes.nombre, ordenes.producto
FROM clientes
RIGHT JOIN ordenes ON clientes.id = ordenes.clienteId;
```

## ⚠️ Limitación en Prisma

**Prisma NO soporta RIGHT JOIN directamente**, pero puedes simular el comportamiento:

1. **Invirtiendo la consulta** (hacer LEFT JOIN desde la otra tabla)
2. **Usando queries separadas**

### Schema

```prisma
model Cliente {
  id      Int     @id @default(autoincrement())
  nombre  String
  email   String
  ordenes Orden[]
}

model Orden {
  id         Int       @id @default(autoincrement())
  producto   String
  total      Float
  clienteId  Int?      // ← Nullable para permitir órdenes sin cliente
  cliente    Cliente?  @relation(fields: [clienteId], references: [id])
}
```

## Simulación de RIGHT JOIN en Prisma

### Método 1: Invertir la consulta (Recomendado)

```typescript
// RIGHT JOIN: Todas las órdenes con su cliente (si existe)
// Equivale a: SELECT * FROM ordenes RIGHT JOIN clientes...
const todasLasOrdenes = await prisma.orden.findMany({
  include: {
    cliente: true  // LEFT JOIN desde órdenes
  }
});

console.log(todasLasOrdenes);
// [
//   {
//     id: 1,
//     producto: "Laptop",
//     total: 999.99,
//     clienteId: 1,
//     cliente: { id: 1, nombre: "Juan", email: "juan@mail.com" }
//   },
//   {
//     id: 2,
//     producto: "Mouse",
//     total: 25.50,
//     clienteId: 1,
//     cliente: { id: 1, nombre: "Juan", email: "juan@mail.com" }
//   },
//   {
//     id: 3,
//     producto: "Teclado",
//     total: 75.00,
//     clienteId: 2,
//     cliente: { id: 2, nombre: "María", email: "maria@mail.com" }
//   },
//   {
//     id: 4,
//     producto: "Monitor",
//     total: 299.99,
//     clienteId: null,
//     cliente: null  // ← Orden sin cliente
//   }
// ]
```

### Método 2: Identificar registros huérfanos

```typescript
// Órdenes sin cliente asignado
const ordenesHuerfanas = await prisma.orden.findMany({
  where: {
    clienteId: null
  }
});

console.log(`Órdenes sin cliente: ${ordenesHuerfanas.length}`);
```

## Ejemplos prácticos

### Ejemplo 1: Productos en órdenes

```typescript
model Product {
  id         Int         @id @default(autoincrement())
  name       String
  price      Float
  orderItems OrderItem[]
}

model OrderItem {
  id         Int      @id @default(autoincrement())
  quantity   Int
  productId  Int?     // ← Nullable
  product    Product? @relation(fields: [productId], references: [id])
  orderId    Int
}

// TODOS los items de orden con su producto (si existe)
const todosLosItems = await prisma.orderItem.findMany({
  include: {
    product: true
  }
});

// Identificar items sin producto
const itemsSinProducto = todosLosItems.filter(item => item.product === null);

console.log(`Items sin producto: ${itemsSinProducto.length}`);
```

### Ejemplo 2: Comentarios con usuario

```typescript
model User {
  id       Int       @id @default(autoincrement())
  name     String
  comments Comment[]
}

model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  userId    Int?     // ← Nullable (comentario anónimo)
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

// TODOS los comentarios con su autor (si existe)
const todosLosComentarios = await prisma.comment.findMany({
  include: {
    user: true
  },
  orderBy: {
    createdAt: 'desc'
  }
});

// Clasificar comentarios
const clasificados = todosLosComentarios.map(comment => ({
  texto: comment.text,
  autor: comment.user?.name ?? 'Anónimo',
  tipoAutor: comment.user ? 'Registrado' : 'Anónimo'
}));

console.log(clasificados);
// [
//   { texto: "Gran producto", autor: "Juan", tipoAutor: "Registrado" },
//   { texto: "Excelente servicio", autor: "Anónimo", tipoAutor: "Anónimo" },
//   { texto: "Muy rápido", autor: "María", tipoAutor: "Registrado" }
// ]
```

### Ejemplo 3: Auditoría de relaciones

```typescript
model Category {
  id       Int       @id @default(autoincrement())
  name     String
  products Product[]
}

model Product {
  id         Int       @id @default(autoincrement())
  name       String
  categoryId Int?      // ← Nullable
  category   Category? @relation(fields: [categoryId], references: [id])
}

// TODOS los productos con su categoría (si existe)
const todosLosProductos = await prisma.product.findMany({
  include: {
    category: true
  }
});

// Productos sin categoría (necesitan revisión)
const productosSinCategoria = todosLosProductos.filter(
  producto => producto.category === null
);

console.log('⚠️ Productos sin categoría:');
productosSinCategoria.forEach(producto => {
  console.log(`- ID: ${producto.id}, Nombre: ${producto.name}`);
});
```

## Casos de uso comunes

### 1. Auditoría de integridad referencial

```typescript
async auditarOrdenesHuerfanas() {
  // Todas las órdenes
  const ordenes = await prisma.orden.findMany({
    include: {
      cliente: true
    }
  });

  // Órdenes sin cliente
  const huerfanas = ordenes.filter(orden => orden.cliente === null);

  if (huerfanas.length > 0) {
    console.log('⚠️ Órdenes huérfanas detectadas:');
    huerfanas.forEach(orden => {
      console.log(`- Orden ${orden.id}: ${orden.producto} ($${orden.total})`);
    });

    return {
      total: ordenes.length,
      huerfanas: huerfanas.length,
      porcentaje: (huerfanas.length / ordenes.length) * 100
    };
  }

  return { total: ordenes.length, huerfanas: 0 };
}
```

### 2. Reporte de registros sin relación

```typescript
async reporteProductosSinCategoria() {
  const productos = await prisma.product.findMany({
    include: {
      category: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  const sinCategoria = productos.filter(p => p.category === null);
  const conCategoria = productos.filter(p => p.category !== null);

  return {
    total: productos.length,
    conCategoria: conCategoria.length,
    sinCategoria: sinCategoria.length,
    necesitanRevision: sinCategoria.map(p => ({
      id: p.id,
      nombre: p.name,
      precio: p.price
    }))
  };
}
```

### 3. Migración de datos

```typescript
async asignarClientePorDefecto() {
  // Obtener cliente "Por Defecto"
  const clienteDefault = await prisma.cliente.findFirst({
    where: { nombre: 'Cliente General' }
  });

  if (!clienteDefault) {
    throw new Error('Cliente por defecto no existe');
  }

  // Encontrar órdenes huérfanas
  const ordenesHuerfanas = await prisma.orden.findMany({
    where: {
      clienteId: null
    }
  });

  console.log(`Asignando ${ordenesHuerfanas.length} órdenes huérfanas...`);

  // Actualizar todas
  const resultado = await prisma.orden.updateMany({
    where: {
      clienteId: null
    },
    data: {
      clienteId: clienteDefault.id
    }
  });

  console.log(`✅ ${resultado.count} órdenes actualizadas`);
  return resultado;
}
```

## Comparación con LEFT JOIN

| Aspecto | LEFT JOIN | RIGHT JOIN |
|---------|-----------|------------|
| **Tabla completa** | Izquierda (principal) | Derecha (secundaria) |
| **Registros nulos** | De la tabla derecha | De la tabla izquierda |
| **En Prisma** | Por defecto con `include` | Invertir la consulta |
| **Caso de uso** | Listar principales | Listar secundarios |
| **Ejemplo** | Todos los clientes | Todas las órdenes |

### Ejemplo comparativo:

```typescript
// LEFT JOIN: Todos los clientes (con o sin órdenes)
const clientes = await prisma.cliente.findMany({
  include: { ordenes: true }
});
// Resultado: Juan, María, Pedro
// Pedro aparece sin órdenes

// RIGHT JOIN: Todas las órdenes (con o sin cliente)
const ordenes = await prisma.orden.findMany({
  include: { cliente: true }
});
// Resultado: Laptop, Mouse, Teclado, Monitor
// Monitor aparece sin cliente
```

## Ventajas y desventajas

### ✅ Ventajas
- Identifica registros secundarios huérfanos
- Útil para auditorías de integridad
- Detecta problemas de migración de datos

### ❌ Desventajas
- Menos intuitivo que LEFT JOIN
- No soportado directamente en Prisma
- Requires invertir la lógica de la consulta

### ⚠️ Cuándo puede ser útil

1. **Datos huérfanos**: Órdenes sin cliente, productos sin categoría
2. **Auditoría**: Verificar integridad referencial
3. **Migración**: Identificar registros que necesitan limpieza
4. **Reportes**: Listar todos los registros secundarios

## Tips y mejores prácticas

1. **En Prisma, piensa en LEFT JOIN:**
   ```typescript
   // En lugar de pensar "RIGHT JOIN desde clientes a órdenes"
   // Piensa "LEFT JOIN desde órdenes a clientes"
   const ordenes = await prisma.orden.findMany({
     include: { cliente: true }
   });
   ```

2. **Usa nullable solo cuando sea necesario:**
   ```prisma
   model Orden {
     clienteId Int?      // Solo si órdenes anónimas son válidas
     cliente   Cliente?
   }
   ```

3. **Validación en el servicio:**
   ```typescript
   async createOrder(data: CreateOrderDto) {
     // Validar que el cliente existe
     if (data.clienteId) {
       const cliente = await prisma.cliente.findUnique({
         where: { id: data.clienteId }
       });

       if (!cliente) {
         throw new NotFoundException('Cliente no encontrado');
       }
     }

     return prisma.orden.create({ data });
   }
   ```

4. **Identificar registros problemáticos:**
   ```typescript
   // Middleware para loggear órdenes huérfanas
   async logOrdenesHuerfanas() {
     const count = await prisma.orden.count({
       where: { clienteId: null }
     });

     if (count > 0) {
       console.warn(`⚠️ Hay ${count} órdenes sin cliente`);
     }
   }
   ```

## Ejemplos avanzados con múltiples tablas y SQL directo

### Ejemplo 1: Auditoría de integridad completa (todas las órdenes)

```typescript
async auditoriaIntegridadOrdenes() {
  // TODAS las órdenes con información de cliente, productos y pagos
  const resultado = await prisma.$queryRaw`
    SELECT
      o.id AS orden_id,
      o.total,
      o.status,
      o.createdAt AS fecha_orden,
      -- Cliente (puede ser null)
      u.id AS cliente_id,
      u.name AS cliente_nombre,
      u.email AS cliente_email,
      -- Productos
      COUNT(DISTINCT oi.productId) AS productos_diferentes,
      SUM(oi.quantity) AS cantidad_total,
      -- Categorías
      STRING_AGG(DISTINCT c.name, ', ') AS categorias,
      -- Estado de integridad
      CASE
        WHEN u.id IS NULL THEN '⚠️ Orden huérfana (sin cliente)'
        WHEN COUNT(oi.id) = 0 THEN '⚠️ Orden vacía (sin productos)'
        WHEN o.status = 'pending' AND
             DATE_PART('day', NOW() - o.createdAt) > 7 THEN '⚠️ Pendiente hace más de 7 días'
        ELSE '✅ OK'
      END AS estado_integridad
    FROM "Order" o
    LEFT JOIN "User" u ON o.userId = u.id          -- Puede no tener cliente
    LEFT JOIN "OrderItem" oi ON o.id = oi.orderId  -- Puede no tener items
    LEFT JOIN "Product" p ON oi.productId = p.id   -- Puede no tener producto
    LEFT JOIN "Category" c ON p.categoryId = c.id
    GROUP BY o.id, o.total, o.status, o.createdAt, u.id, u.name, u.email
    ORDER BY
      CASE
        WHEN u.id IS NULL THEN 1
        WHEN COUNT(oi.id) = 0 THEN 2
        ELSE 3
      END,
      o.createdAt DESC
  `;

  return resultado;
}

// Resultado prioriza problemas:
// [
//   {
//     orden_id: 145,
//     total: 299.99,
//     status: "completed",
//     fecha_orden: "2024-11-15",
//     cliente_id: null,           // ⚠️ Sin cliente
//     cliente_nombre: null,
//     cliente_email: null,
//     productos_diferentes: 2,
//     cantidad_total: 3,
//     categorias: "Electrónica",
//     estado_integridad: "⚠️ Orden huérfana (sin cliente)"
//   },
//   {
//     orden_id: 98,
//     total: 0.00,
//     status: "pending",
//     fecha_orden: "2024-11-20",
//     cliente_id: 15,
//     cliente_nombre: "Carlos",
//     cliente_email: "carlos@mail.com",
//     productos_diferentes: 0,    // ⚠️ Sin productos
//     cantidad_total: 0,
//     categorias: null,
//     estado_integridad: "⚠️ Orden vacía (sin productos)"
//   },
//   {
//     orden_id: 200,
//     total: 150.00,
//     status: "completed",
//     fecha_orden: "2024-11-25",
//     cliente_id: 5,
//     cliente_nombre: "Ana",
//     cliente_email: "ana@mail.com",
//     productos_diferentes: 3,
//     cantidad_total: 5,
//     categorias: "Hogar, Cocina",
//     estado_integridad: "✅ OK"
//   }
// ]
```

### Ejemplo 2: Productos sin asignar (RIGHT JOIN real en SQL)

```typescript
async productosYSusOrdenes() {
  // TODOS los productos con información de ventas (incluso los nunca vendidos)
  const resultado = await prisma.$queryRaw`
    SELECT
      p.id AS producto_id,
      p.name AS producto_nombre,
      p.price AS precio,
      c.name AS categoria,
      p.available AS disponible,
      -- Información de órdenes
      COUNT(DISTINCT oi.id) AS veces_ordenado,
      COUNT(DISTINCT o.id) AS ordenes_diferentes,
      SUM(oi.quantity) AS cantidad_total_vendida,
      SUM(oi.price * oi.quantity) AS ingresos_totales,
      -- Clientes
      COUNT(DISTINCT o.userId) AS clientes_unicos,
      STRING_AGG(DISTINCT u.name, ', ') AS lista_clientes,
      -- Última actividad
      MAX(o.createdAt) AS ultima_venta,
      DATE_PART('day', NOW() - MAX(o.createdAt)) AS dias_sin_ventas,
      -- Estado
      CASE
        WHEN COUNT(o.id) = 0 THEN 'Nunca vendido'
        WHEN DATE_PART('day', NOW() - MAX(o.createdAt)) > 90 THEN 'Inactivo 90+ días'
        WHEN DATE_PART('day', NOW() - MAX(o.createdAt)) > 30 THEN 'Inactivo 30+ días'
        ELSE 'Activo'
      END AS estado_venta
    FROM "OrderItem" oi
    RIGHT JOIN "Product" p ON oi.productId = p.id  -- RIGHT JOIN aquí
    LEFT JOIN "Category" c ON p.categoryId = c.id
    LEFT JOIN "Order" o ON oi.orderId = o.id
    LEFT JOIN "User" u ON o.userId = u.id
    WHERE p.available = true
    GROUP BY p.id, p.name, p.price, c.name, p.available
    ORDER BY
      CASE
        WHEN COUNT(o.id) = 0 THEN 1
        ELSE 2
      END,
      cantidad_total_vendida DESC NULLS LAST
  `;

  return resultado;
}
```

### Ejemplo 3: Reviews con productos eliminados

```typescript
async reviewsConProductosEliminados() {
  // TODAS las reviews, incluso si el producto ya no existe
  const resultado = await prisma.$queryRaw`
    SELECT
      r.id AS review_id,
      r.rating,
      r.comment,
      r.createdAt AS fecha_review,
      -- Usuario
      u.id AS usuario_id,
      u.name AS usuario_nombre,
      -- Producto (puede ser null si fue eliminado)
      p.id AS producto_id,
      p.name AS producto_nombre,
      p.available AS producto_disponible,
      c.name AS categoria,
      -- Estado
      CASE
        WHEN p.id IS NULL THEN '⚠️ Producto eliminado'
        WHEN p.available = false THEN '⚠️ Producto no disponible'
        ELSE '✅ Producto activo'
      END AS estado_producto
    FROM "Review" r
    INNER JOIN "User" u ON r.userId = u.id
    RIGHT JOIN "Product" p ON r.productId = p.id  -- RIGHT JOIN: todas las reviews
    LEFT JOIN "Category" c ON p.categoryId = c.id
    ORDER BY
      CASE
        WHEN p.id IS NULL THEN 1
        WHEN p.available = false THEN 2
        ELSE 3
      END,
      r.createdAt DESC
  `;

  return resultado;
}
```

### Ejemplo 4: Migración - Asignar cliente por defecto

```typescript
async migrarOrdenesHuerfanas() {
  return await prisma.$transaction(async (tx) => {
    // 1. Encontrar todas las órdenes sin cliente
    const ordenesHuerfanas = await tx.$queryRaw`
      SELECT
        o.id,
        o.total,
        o.createdAt,
        COUNT(oi.id) AS items_count,
        SUM(oi.quantity) AS total_productos
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
      LEFT JOIN "User" u ON o.userId = u.id
      WHERE u.id IS NULL  -- Sin cliente
      GROUP BY o.id, o.total, o.createdAt
      HAVING COUNT(oi.id) > 0  -- Solo órdenes con productos
    `;

    console.log(`Encontradas ${ordenesHuerfanas.length} órdenes huérfanas`);

    // 2. Crear o encontrar cliente "Sistema"
    const clienteSistema = await tx.user.upsert({
      where: { email: 'sistema@interno.com' },
      update: {},
      create: {
        name: 'Cliente Sistema',
        email: 'sistema@interno.com'
      }
    });

    // 3. Asignar cliente sistema a todas las órdenes huérfanas
    const resultado = await tx.$executeRaw`
      UPDATE "Order"
      SET userId = ${clienteSistema.id}
      WHERE userId IS NULL
        AND id IN (
          SELECT o.id
          FROM "Order" o
          INNER JOIN "OrderItem" oi ON o.id = oi.orderId
          GROUP BY o.id
          HAVING COUNT(oi.id) > 0
        )
    `;

    return {
      ordenesEncontradas: ordenesHuerfanas.length,
      ordenesActualizadas: resultado,
      clienteSistemaId: clienteSistema.id
    };
  });
}
```

### Comparación: RIGHT JOIN vs LEFT JOIN invertido

```typescript
// RIGHT JOIN en SQL
const queryRightJoin = await prisma.$queryRaw`
  SELECT o.*, u.name
  FROM "User" u
  RIGHT JOIN "Order" o ON u.id = o.userId
`;

// Equivalente: LEFT JOIN invertido en Prisma
const queryLeftJoin = await prisma.orden.findMany({
  include: {
    cliente: true  // LEFT JOIN desde órdenes
  }
});

// Ambos dan el mismo resultado: TODAS las órdenes
```

### Tips para RIGHT JOIN con SQL

1. **Usa RIGHT JOIN cuando audites registros secundarios:**
```sql
-- Ver TODAS las transacciones, tengan o no usuario válido
FROM "User" u
RIGHT JOIN "Transaction" t ON u.id = t.userId
```

2. **Identifica registros huérfanos rápido:**
```sql
-- Transacciones sin usuario
WHERE u.id IS NULL
```

3. **Combina con COALESCE:**
```sql
SELECT
  COALESCE(u.name, 'Sin usuario') AS cliente,
  o.total
FROM "User" u
RIGHT JOIN "Order" o ON u.id = o.userId
```

## Resumen

**RIGHT JOIN** = Todos los registros de la tabla secundaria + coincidencias de la principal

En Prisma: **Invertir la consulta** (usar LEFT JOIN desde la tabla secundaria)

En SQL directo: `RIGHT JOIN tabla ON condicion` (menos común, preferir LEFT JOIN invertido)

**Ejemplo mental**: Lista de productos en almacén - todos los productos aparecen, tengan o no proveedor asignado.

💡 **Tip importante**: En Prisma, casi siempre usarás LEFT JOIN invirtiendo la tabla desde la que consultas.
