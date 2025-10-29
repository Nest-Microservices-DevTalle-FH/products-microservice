# LEFT JOIN - Ejemplos Avanzados

Ejemplos complejos de LEFT JOIN con múltiples tablas, mostrando TODOS los registros principales incluso sin relaciones.

## Ejemplo 1: Reporte completo de clientes con actividad (5 tablas)

### Con Prisma

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

### Con SQL directo

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

## Ejemplo 2: Dashboard de productos con métricas (4 tablas)

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

## Ejemplo 3: Análisis de categorías con penetración de mercado

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

## Ejemplo 4: Reporte de tendencias temporales con CTEs (5 tablas)

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

## Ventajas de LEFT JOIN en SQL directo

1. **COALESCE para valores nulos**: Maneja automáticamente los nulos
   ```sql
   COALESCE(SUM(o.total), 0) -- Devuelve 0 si es NULL
   ```

2. **NULLS LAST**: Ordena registros sin datos al final
   ```sql
   ORDER BY ingresos DESC NULLS LAST
   ```

3. **Agregaciones con LEFT JOIN**: Incluye registros con 0
   ```sql
   COUNT(DISTINCT o.id) -- Cuenta 0 para clientes sin órdenes
   ```

4. **STRING_AGG**: Concatena valores relacionados
   ```sql
   STRING_AGG(DISTINCT c.name, ', ') -- "Cat1, Cat2, Cat3"
   ```

## Tips específicos para LEFT JOIN con SQL

### ✅ Usar COALESCE para evitar NULL

```sql
SELECT
  u.name,
  COALESCE(COUNT(o.id), 0) AS ordenes  -- 0 en lugar de NULL
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId
GROUP BY u.id, u.name
```

### ✅ Filtrar después del JOIN (WHERE en tabla principal)

```sql
SELECT *
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId
WHERE u.active = true  -- Filtra usuarios, mantiene LEFT JOIN
```

### ❌ Evitar WHERE en tabla del LEFT JOIN (convierte a INNER)

```sql
SELECT *
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId
WHERE o.status = 'completed'  -- ⚠️ Esto elimina usuarios sin órdenes!
```

### ✅ Correcto: Usar condición en el JOIN

```sql
SELECT *
FROM "User" u
LEFT JOIN "Order" o ON u.id = o.userId AND o.status = 'completed'
```

## Casos de uso principales

1. **Dashboards completos**: Mostrar todos los registros principales con sus métricas
2. **Reportes ejecutivos**: Identificar qué falta o está inactivo
3. **Análisis de cobertura**: Productos sin ventas, clientes inactivos
4. **KPIs de actividad**: Tasas de conversión, engagement
5. **Tendencias temporales**: Comparar periodos con y sin actividad
