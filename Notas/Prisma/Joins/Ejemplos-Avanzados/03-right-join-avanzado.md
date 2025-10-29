# RIGHT JOIN - Ejemplos Avanzados

Ejemplos complejos de RIGHT JOIN, mostrando TODOS los registros secundarios incluso sin relaciones principales. Útil para auditorías y detección de registros huérfanos.

## Ejemplo 1: Auditoría de integridad completa (todas las órdenes)

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

## Ejemplo 2: Productos sin asignar (RIGHT JOIN real en SQL)

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

## Ejemplo 3: Reviews con productos eliminados

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

## Ejemplo 4: Migración - Asignar cliente por defecto (con transacción)

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

## Comparación: RIGHT JOIN vs LEFT JOIN invertido

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

## Tips para RIGHT JOIN con SQL

### 1. Usa RIGHT JOIN cuando audites registros secundarios

```sql
-- Ver TODAS las transacciones, tengan o no usuario válido
FROM "User" u
RIGHT JOIN "Transaction" t ON u.id = t.userId
```

### 2. Identifica registros huérfanos rápido

```sql
-- Transacciones sin usuario
WHERE u.id IS NULL
```

### 3. Combina con COALESCE

```sql
SELECT
  COALESCE(u.name, 'Sin usuario') AS cliente,
  o.total
FROM "User" u
RIGHT JOIN "Order" o ON u.id = o.userId
```

### 4. Prioriza problemas en el ORDER BY

```sql
ORDER BY
  CASE
    WHEN u.id IS NULL THEN 1  -- Huérfanos primero
    WHEN o.status = 'error' THEN 2
    ELSE 3
  END
```

## Casos de uso principales

1. **Auditoría de integridad**: Encontrar registros sin referencias válidas
2. **Migración de datos**: Identificar y corregir relaciones rotas
3. **Limpieza de base de datos**: Detectar datos huérfanos para eliminar o asignar
4. **Reportes de calidad de datos**: Métricas de completitud de información
5. **Detección de errores**: Órdenes, transacciones o logs sin usuario válido

## Patrón de auditoría recomendado

```typescript
async auditoriaCampo<T>(tabla: string, campo: string, relacionId: string) {
  const resultado = await prisma.$queryRawUnsafe(`
    SELECT
      t.id,
      t.${campo},
      r.id AS relacion_id,
      CASE
        WHEN r.id IS NULL THEN '⚠️ Referencia inválida'
        ELSE '✅ OK'
      END AS estado
    FROM "${tabla}" t
    LEFT JOIN "RelatedTable" r ON t.${relacionId} = r.id
    WHERE r.id IS NULL
  `);

  return resultado;
}

// Uso:
await auditoriaCampo('Order', 'userId', 'userId');
await auditoriaCampo('Product', 'categoryId', 'categoryId');
```

## Ventajas de RIGHT JOIN

✅ Detecta todos los registros secundarios (incluso huérfanos)
✅ Útil para auditorías de integridad referencial
✅ Identifica datos que necesitan limpieza
✅ Facilita migraciones seguras de datos

## Cuándo NO usar RIGHT JOIN

❌ Cuando solo necesitas datos válidos → Usa INNER JOIN
❌ Para listados normales de usuarios → Usa LEFT JOIN invertido
❌ En consultas de negocio regulares → Reserva RIGHT JOIN para auditorías
