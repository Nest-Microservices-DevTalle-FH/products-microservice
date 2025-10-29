# FULL JOIN - Ejemplos Avanzados

Ejemplos complejos de FULL OUTER JOIN mostrando TODOS los registros de ambos lados de la relación. Ideal para auditorías completas, reconciliación de datos y análisis de calidad.

## Ejemplo 1: Auditoría 360° completa del sistema (6 tablas)

```typescript
async auditoria360Completa() {
  // FULL JOIN: Ver TODO el sistema, usuarios con/sin órdenes Y órdenes con/sin usuario
  const resultado = await prisma.$queryRaw`
    SELECT
      -- Usuarios
      u.id AS usuario_id,
      u.name AS usuario_nombre,
      u.email,
      u.createdAt AS fecha_registro,
      -- Órdenes
      o.id AS orden_id,
      o.total AS orden_total,
      o.status AS orden_status,
      o.createdAt AS fecha_orden,
      -- Productos y métricas
      COUNT(DISTINCT oi.id) AS total_items,
      COUNT(DISTINCT p.id) AS productos_diferentes,
      SUM(oi.quantity) AS cantidad_total,
      SUM(oi.price * oi.quantity) AS subtotal_calculado,
      -- Categorías
      COUNT(DISTINCT c.id) AS categorias_diferentes,
      STRING_AGG(DISTINCT c.name, ', ') AS lista_categorias,
      -- Reviews
      COUNT(DISTINCT r.id) AS total_reviews_usuario,
      AVG(r.rating) AS calificacion_promedio,
      -- Clasificación del problema
      CASE
        WHEN u.id IS NULL AND o.id IS NOT NULL THEN '🔴 CRÍTICO: Orden sin usuario'
        WHEN u.id IS NOT NULL AND o.id IS NULL THEN '🟡 Usuario sin actividad'
        WHEN COUNT(oi.id) = 0 THEN '🟠 Orden vacía (sin productos)'
        WHEN o.total != SUM(oi.price * oi.quantity) THEN '⚠️ Inconsistencia en total'
        WHEN o.status = 'pending' AND DATE_PART('day', NOW() - o.createdAt) > 30
          THEN '🟠 Orden pendiente > 30 días'
        ELSE '🟢 Normal'
      END AS estado,
      -- Prioridad de acción
      CASE
        WHEN u.id IS NULL AND o.id IS NOT NULL THEN 1  -- Máxima prioridad
        WHEN COUNT(oi.id) = 0 THEN 2
        WHEN o.total != COALESCE(SUM(oi.price * oi.quantity), 0) THEN 2
        WHEN u.id IS NOT NULL AND o.id IS NULL THEN 3
        ELSE 4
      END AS prioridad,
      -- Días desde actividad
      DATE_PART('day', NOW() - COALESCE(o.createdAt, u.createdAt)) AS dias_inactividad
    FROM "User" u
    FULL OUTER JOIN "Order" o ON u.id = o.userId  -- FULL JOIN principal
    LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
    LEFT JOIN "Product" p ON oi.productId = p.id
    LEFT JOIN "Category" c ON p.categoryId = c.id
    LEFT JOIN "Review" r ON u.id = r.userId
    GROUP BY
      u.id, u.name, u.email, u.createdAt,
      o.id, o.total, o.status, o.createdAt
    ORDER BY prioridad ASC, dias_inactividad DESC
  `;

  return resultado;
}

// Resultado muestra ABSOLUTAMENTE TODO:
// [
//   {
//     usuario_id: null,          // 🔴 Orden huérfana - prioridad 1
//     usuario_nombre: null,
//     email: null,
//     fecha_registro: null,
//     orden_id: 445,
//     orden_total: 150.00,
//     orden_status: "completed",
//     fecha_orden: "2024-10-15",
//     total_items: 2,
//     productos_diferentes: 2,
//     cantidad_total: 3,
//     subtotal_calculado: 150.00,
//     categorias_diferentes: 1,
//     lista_categorias: "Electrónica",
//     total_reviews_usuario: 0,
//     calificacion_promedio: null,
//     estado: "🔴 CRÍTICO: Orden sin usuario",
//     prioridad: 1,
//     dias_inactividad: 45
//   },
//   {
//     usuario_id: 15,            // 🟡 Usuario inactivo - prioridad 3
//     usuario_nombre: "Pedro",
//     email: "pedro@mail.com",
//     fecha_registro: "2024-01-10",
//     orden_id: null,
//     orden_total: null,
//     orden_status: null,
//     fecha_orden: null,
//     total_items: 0,
//     productos_diferentes: 0,
//     cantidad_total: 0,
//     subtotal_calculado: null,
//     categorias_diferentes: 0,
//     lista_categorias: null,
//     total_reviews_usuario: 0,
//     calificacion_promedio: null,
//     estado: "🟡 Usuario sin actividad",
//     prioridad: 3,
//     dias_inactividad: 294
//   },
//   {
//     usuario_id: 5,             // 🟢 Todo OK - prioridad 4
//     usuario_nombre: "Ana",
//     email: "ana@mail.com",
//     fecha_registro: "2024-02-20",
//     orden_id: 200,
//     orden_total: 299.99,
//     orden_status: "completed",
//     fecha_orden: "2024-11-25",
//     total_items: 3,
//     productos_diferentes: 3,
//     cantidad_total: 5,
//     subtotal_calculado: 299.99,
//     categorias_diferentes: 2,
//     lista_categorias: "Hogar, Cocina",
//     total_reviews_usuario: 4,
//     calificacion_promedio: 4.5,
//     estado: "🟢 Normal",
//     prioridad: 4,
//     dias_inactividad: 5
//   }
// ]
```

## Ejemplo 2: Reconciliación entre sistemas (migración de datos)

```typescript
async reconciliacionMigracionCompleta() {
  // Compara sistema legacy con sistema actual - detecta TODAS las discrepancias
  const resultado = await prisma.$queryRaw`
    WITH legacy_data AS (
      -- Simulación de datos del sistema antiguo
      SELECT
        legacy_user_id,
        user_email,
        legacy_order_id,
        order_total,
        order_date,
        product_count
      FROM legacy_system_export
    ),
    current_data AS (
      SELECT
        u.id AS current_user_id,
        u.email AS user_email,
        o.id AS current_order_id,
        o.total AS order_total,
        o.createdAt AS order_date,
        COUNT(oi.id) AS product_count
      FROM "User" u
      LEFT JOIN "Order" o ON u.id = o.userId
      LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
      GROUP BY u.id, u.email, o.id, o.total, o.createdAt
    )
    SELECT
      -- Sistema Legacy
      l.legacy_user_id,
      l.legacy_order_id,
      l.user_email AS legacy_email,
      l.order_total AS legacy_total,
      l.order_date AS legacy_date,
      l.product_count AS legacy_products,
      -- Sistema Actual
      c.current_user_id,
      c.current_order_id,
      c.user_email AS current_email,
      c.order_total AS current_total,
      c.order_date AS current_date,
      c.product_count AS current_products,
      -- Análisis de sincronización
      CASE
        WHEN l.legacy_order_id IS NULL THEN '🆕 Solo en sistema actual'
        WHEN c.current_order_id IS NULL THEN '⚠️ Solo en sistema legacy - NO MIGRADO'
        WHEN l.user_email != c.user_email THEN '❌ Email no coincide'
        WHEN ABS(l.order_total - c.order_total) > 0.01 THEN '⚠️ Diferencia en totales'
        WHEN l.product_count != c.product_count THEN '⚠️ Diferencia en cantidad productos'
        ELSE '✅ Sincronizado correctamente'
      END AS estado_sync,
      -- Diferencias numéricas
      COALESCE(c.order_total, 0) - COALESCE(l.order_total, 0) AS dif_total,
      COALESCE(c.product_count, 0) - COALESCE(l.product_count, 0) AS dif_productos,
      DATE_PART('day', c.order_date - l.order_date) AS dif_dias,
      -- Prioridad de corrección
      CASE
        WHEN l.legacy_order_id IS NOT NULL AND c.current_order_id IS NULL THEN 1
        WHEN ABS(l.order_total - c.order_total) > 0.01 THEN 2
        WHEN l.product_count != c.product_count THEN 3
        ELSE 4
      END AS prioridad_correccion,
      -- Acción recomendada
      CASE
        WHEN l.legacy_order_id IS NULL THEN 'Verificar si es orden nueva válida'
        WHEN c.current_order_id IS NULL THEN 'URGENTE: Re-ejecutar migración'
        WHEN ABS(l.order_total - c.order_total) > 0.01 THEN 'Recalcular totales'
        WHEN l.product_count != c.product_count THEN 'Verificar items de orden'
        ELSE 'Sin acción necesaria'
      END AS accion_recomendada
    FROM legacy_data l
    FULL OUTER JOIN current_data c
      ON l.user_email = c.user_email
      AND l.legacy_order_id::TEXT = c.current_order_id::TEXT
    ORDER BY prioridad_correccion ASC, ABS(dif_total) DESC
  `;

  return resultado;
}
```

## Ejemplo 3: Dashboard ejecutivo con métricas de calidad (5 tablas)

```typescript
async dashboardCalidadDatos() {
  // Dashboard completo mostrando salud del sistema
  const resultado = await prisma.$queryRaw`
    WITH metricas_usuarios AS (
      SELECT
        COUNT(*) AS total_usuarios,
        COUNT(o.id) AS usuarios_con_ordenes,
        COUNT(*) - COUNT(o.id) AS usuarios_sin_ordenes
      FROM "User" u
      FULL OUTER JOIN "Order" o ON u.id = o.userId
      WHERE u.id IS NOT NULL
    ),
    metricas_ordenes AS (
      SELECT
        COUNT(DISTINCT o.id) AS total_ordenes,
        COUNT(DISTINCT CASE WHEN o.userId IS NULL THEN o.id END) AS ordenes_huerfanas,
        COUNT(DISTINCT CASE WHEN COUNT(oi.id) = 0 THEN o.id END) AS ordenes_vacias,
        SUM(o.total) AS ingresos_totales
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
      GROUP BY o.id
    ),
    metricas_productos AS (
      SELECT
        COUNT(DISTINCT p.id) AS total_productos,
        COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END) AS productos_vendidos,
        COUNT(DISTINCT CASE WHEN p.categoryId IS NULL THEN p.id END) AS productos_sin_categoria
      FROM "Product" p
      FULL OUTER JOIN "OrderItem" oi ON p.id = oi.productId
    ),
    metricas_categorias AS (
      SELECT
        COUNT(DISTINCT c.id) AS total_categorias,
        COUNT(DISTINCT CASE WHEN p.id IS NULL THEN c.id END) AS categorias_vacias
      FROM "Category" c
      FULL OUTER JOIN "Product" p ON c.id = p.categoryId
    )
    SELECT
      -- Usuarios
      mu.total_usuarios,
      mu.usuarios_con_ordenes,
      mu.usuarios_sin_ordenes,
      ROUND((mu.usuarios_con_ordenes::FLOAT / NULLIF(mu.total_usuarios, 0)) * 100, 2)
        AS porcentaje_usuarios_activos,
      -- Órdenes
      mo.total_ordenes,
      mo.ordenes_huerfanas,
      mo.ordenes_vacias,
      ROUND(((mo.total_ordenes - mo.ordenes_huerfanas - mo.ordenes_vacias)::FLOAT /
        NULLIF(mo.total_ordenes, 0)) * 100, 2) AS porcentaje_ordenes_validas,
      mo.ingresos_totales,
      -- Productos
      mp.total_productos,
      mp.productos_vendidos,
      mp.productos_sin_categoria,
      ROUND((mp.productos_vendidos::FLOAT / NULLIF(mp.total_productos, 0)) * 100, 2)
        AS porcentaje_productos_activos,
      -- Categorías
      mc.total_categorias,
      mc.categorias_vacias,
      ROUND(((mc.total_categorias - mc.categorias_vacias)::FLOAT /
        NULLIF(mc.total_categorias, 0)) * 100, 2) AS porcentaje_categorias_activas,
      -- Score de salud global (0-100)
      ROUND(
        (
          (mu.usuarios_con_ordenes::FLOAT / NULLIF(mu.total_usuarios, 0) * 25) +
          ((mo.total_ordenes - mo.ordenes_huerfanas)::FLOAT / NULLIF(mo.total_ordenes, 0) * 30) +
          (mp.productos_vendidos::FLOAT / NULLIF(mp.total_productos, 0) * 25) +
          ((mc.total_categorias - mc.categorias_vacias)::FLOAT / NULLIF(mc.total_categorias, 0) * 20)
        ),
        2
      ) AS health_score,
      -- Clasificación
      CASE
        WHEN ROUND(
          (
            (mu.usuarios_con_ordenes::FLOAT / NULLIF(mu.total_usuarios, 0) * 25) +
            ((mo.total_ordenes - mo.ordenes_huerfanas)::FLOAT / NULLIF(mo.total_ordenes, 0) * 30) +
            (mp.productos_vendidos::FLOAT / NULLIF(mp.total_productos, 0) * 25) +
            ((mc.total_categorias - mc.categorias_vacias)::FLOAT / NULLIF(mc.total_categorias, 0) * 20)
          ),
          2
        ) >= 90 THEN '🟢 Excelente'
        WHEN ROUND(...) >= 75 THEN '🟡 Bueno'
        WHEN ROUND(...) >= 60 THEN '🟠 Regular'
        ELSE '🔴 Necesita atención urgente'
      END AS estado_sistema,
      -- Problemas críticos detectados
      (
        CASE WHEN mo.ordenes_huerfanas > 0 THEN 1 ELSE 0 END +
        CASE WHEN mo.ordenes_vacias > 0 THEN 1 ELSE 0 END +
        CASE WHEN mp.productos_sin_categoria > 5 THEN 1 ELSE 0 END +
        CASE WHEN mc.categorias_vacias > 2 THEN 1 ELSE 0 END +
        CASE WHEN mu.usuarios_sin_ordenes::FLOAT / mu.total_usuarios > 0.5 THEN 1 ELSE 0 END
      ) AS problemas_criticos_count
    FROM metricas_usuarios mu
    CROSS JOIN metricas_ordenes mo
    CROSS JOIN metricas_productos mp
    CROSS JOIN metricas_categorias mc
  `;

  return resultado[0];
}

// Resultado:
// {
//   total_usuarios: 500,
//   usuarios_con_ordenes: 380,
//   usuarios_sin_ordenes: 120,
//   porcentaje_usuarios_activos: 76.00,
//   total_ordenes: 1250,
//   ordenes_huerfanas: 15,
//   ordenes_vacias: 8,
//   porcentaje_ordenes_validas: 98.16,
//   ingresos_totales: 125450.00,
//   total_productos: 200,
//   productos_vendidos: 165,
//   productos_sin_categoria: 12,
//   porcentaje_productos_activos: 82.50,
//   total_categorias: 25,
//   categorias_vacias: 3,
//   porcentaje_categorias_activas: 88.00,
//   health_score: 86.17,
//   estado_sistema: "🟡 Bueno",
//   problemas_criticos_count: 2
// }
```

## Ejemplo 4: Plan de acción automatizado con CTEs

```typescript
async generarPlanAccionAutomatizado() {
  // Genera plan de acción priorizado basado en TODO el sistema
  const resultado = await prisma.$queryRaw`
    WITH problemas_usuarios AS (
      SELECT
        'usuarios_sin_actividad' AS tipo_problema,
        u.id AS registro_id,
        u.name AS descripcion,
        DATE_PART('day', NOW() - u.createdAt) AS dias_problema,
        3 AS prioridad,
        'Marketing' AS area_responsable,
        'Campaña de reactivación' AS accion_sugerida,
        'Medio' AS impacto_negocio
      FROM "User" u
      LEFT JOIN "Order" o ON u.id = o.userId
      WHERE o.id IS NULL
        AND u.createdAt < NOW() - INTERVAL '60 days'
    ),
    problemas_ordenes AS (
      SELECT
        CASE
          WHEN o.userId IS NULL THEN 'orden_sin_usuario'
          WHEN COUNT(oi.id) = 0 THEN 'orden_sin_productos'
          ELSE 'orden_total_inconsistente'
        END AS tipo_problema,
        o.id AS registro_id,
        CONCAT('Orden #', o.id, ' - Total: $', o.total) AS descripcion,
        DATE_PART('day', NOW() - o.createdAt) AS dias_problema,
        CASE
          WHEN o.userId IS NULL THEN 1
          WHEN COUNT(oi.id) = 0 THEN 2
          ELSE 3
        END AS prioridad,
        'Técnico' AS area_responsable,
        CASE
          WHEN o.userId IS NULL THEN 'Asignar cliente sistema o eliminar'
          WHEN COUNT(oi.id) = 0 THEN 'Agregar productos o cancelar orden'
          ELSE 'Recalcular total de orden'
        END AS accion_sugerida,
        CASE
          WHEN o.userId IS NULL THEN 'Alto'
          ELSE 'Medio'
        END AS impacto_negocio
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
      LEFT JOIN "User" u ON o.userId = u.id
      WHERE o.userId IS NULL
        OR COUNT(oi.id) = 0
        OR o.total != COALESCE(SUM(oi.price * oi.quantity), 0)
      GROUP BY o.id, o.total, o.createdAt, o.userId
    ),
    problemas_productos AS (
      SELECT
        CASE
          WHEN p.categoryId IS NULL THEN 'producto_sin_categoria'
          WHEN oi.id IS NULL AND DATE_PART('day', NOW() - p.createdAt) > 90
            THEN 'producto_nunca_vendido'
          ELSE 'producto_inactivo'
        END AS tipo_problema,
        p.id AS registro_id,
        CONCAT(p.name, ' - $', p.price) AS descripcion,
        COALESCE(DATE_PART('day', NOW() - MAX(o.createdAt)),
          DATE_PART('day', NOW() - p.createdAt)) AS dias_problema,
        CASE
          WHEN p.categoryId IS NULL THEN 2
          ELSE 4
        END AS prioridad,
        'Contenido' AS area_responsable,
        CASE
          WHEN p.categoryId IS NULL THEN 'Asignar categoría apropiada'
          WHEN oi.id IS NULL THEN 'Revisar precio o descontinuar'
          ELSE 'Crear promoción o rebaja'
        END AS accion_sugerida,
        'Bajo' AS impacto_negocio
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON p.id = oi.productId
      LEFT JOIN "Order" o ON oi.orderId = o.id
      WHERE p.categoryId IS NULL
        OR (oi.id IS NULL AND p.available = true)
      GROUP BY p.id, p.name, p.price, p.categoryId, p.createdAt, p.available, oi.id
    ),
    problemas_categorias AS (
      SELECT
        'categoria_vacia' AS tipo_problema,
        c.id AS registro_id,
        c.name AS descripcion,
        NULL::NUMERIC AS dias_problema,
        4 AS prioridad,
        'Contenido' AS area_responsable,
        'Asignar productos o eliminar categoría' AS accion_sugerida,
        'Bajo' AS impacto_negocio
      FROM "Category" c
      LEFT JOIN "Product" p ON c.id = p.categoryId
      WHERE p.id IS NULL
    ),
    todos_problemas AS (
      SELECT * FROM problemas_usuarios
      UNION ALL
      SELECT * FROM problemas_ordenes
      UNION ALL
      SELECT * FROM problemas_productos
      UNION ALL
      SELECT * FROM problemas_categorias
    )
    SELECT
      tipo_problema,
      COUNT(*) AS cantidad_registros,
      prioridad,
      area_responsable,
      accion_sugerida,
      impacto_negocio,
      -- Estimación de esfuerzo
      CASE
        WHEN COUNT(*) < 10 THEN 'Bajo (< 1 hora)'
        WHEN COUNT(*) < 50 THEN 'Medio (1-4 horas)'
        WHEN COUNT(*) < 200 THEN 'Alto (1-2 días)'
        ELSE 'Muy Alto (> 2 días)'
      END AS esfuerzo_estimado,
      -- Tiempo promedio del problema
      ROUND(AVG(COALESCE(dias_problema, 0)), 1) AS dias_promedio_problema,
      -- Urgencia compuesta
      CASE
        WHEN prioridad = 1 AND COUNT(*) > 10 THEN 'URGENTE'
        WHEN prioridad <= 2 THEN 'Alta'
        WHEN prioridad = 3 THEN 'Media'
        ELSE 'Baja'
      END AS urgencia,
      -- Lista de IDs afectados (primeros 10)
      STRING_AGG(registro_id::TEXT, ', ') FILTER (WHERE registro_id IS NOT NULL) AS ids_muestra
    FROM todos_problemas
    GROUP BY
      tipo_problema, prioridad, area_responsable,
      accion_sugerida, impacto_negocio
    HAVING COUNT(*) > 0
    ORDER BY
      prioridad ASC,
      COUNT(*) DESC,
      dias_promedio_problema DESC
  `;

  return resultado;
}

// Resultado:
// [
//   {
//     tipo_problema: "orden_sin_usuario",
//     cantidad_registros: 15,
//     prioridad: 1,
//     area_responsable: "Técnico",
//     accion_sugerida: "Asignar cliente sistema o eliminar",
//     impacto_negocio: "Alto",
//     esfuerzo_estimado: "Medio (1-4 horas)",
//     dias_promedio_problema: 45.3,
//     urgencia: "URGENTE",
//     ids_muestra: "445, 446, 447, 450, 455, ..."
//   },
//   {
//     tipo_problema: "orden_sin_productos",
//     cantidad_registros: 8,
//     prioridad: 2,
//     area_responsable: "Técnico",
//     accion_sugerida: "Agregar productos o cancelar orden",
//     impacto_negocio: "Medio",
//     esfuerzo_estimado: "Bajo (< 1 hora)",
//     dias_promedio_problema: 12.5,
//     urgencia: "Alta",
//     ids_muestra: "98, 102, 105, ..."
//   },
//   {
//     tipo_problema: "producto_sin_categoria",
//     cantidad_registros: 12,
//     prioridad: 2,
//     area_responsable: "Contenido",
//     accion_sugerida: "Asignar categoría apropiada",
//     impacto_negocio: "Bajo",
//     esfuerzo_estimado: "Medio (1-4 horas)",
//     dias_promedio_problema: 0.0,
//     urgencia: "Alta",
//     ids_muestra: "55, 67, 89, ..."
//   }
// ]
```

## Ejemplo 5: Análisis temporal con ventanas (Window Functions)

```typescript
async analisisTemporalCompleto(año: number) {
  // Análisis mensual completo mostrando TODOS los meses (incluso sin datos)
  const resultado = await prisma.$queryRaw`
    WITH meses_completos AS (
      SELECT
        generate_series AS mes,
        TO_CHAR(TO_DATE(generate_series::TEXT, 'MM'), 'Month') AS nombre_mes
      FROM generate_series(1, 12)
    ),
    datos_usuarios AS (
      SELECT
        DATE_PART('month', u.createdAt) AS mes,
        COUNT(DISTINCT u.id) AS usuarios_nuevos,
        COUNT(DISTINCT o.id) AS ordenes_mes,
        SUM(o.total) AS ingresos_mes
      FROM "User" u
      FULL OUTER JOIN "Order" o ON u.id = o.userId
        AND DATE_PART('year', o.createdAt) = ${año}
        AND DATE_PART('month', o.createdAt) = DATE_PART('month', u.createdAt)
      WHERE DATE_PART('year', u.createdAt) = ${año}
      GROUP BY DATE_PART('month', u.createdAt)
    )
    SELECT
      m.mes,
      m.nombre_mes,
      -- Datos del mes
      COALESCE(d.usuarios_nuevos, 0) AS usuarios_nuevos,
      COALESCE(d.ordenes_mes, 0) AS ordenes,
      COALESCE(d.ingresos_mes, 0) AS ingresos,
      -- Comparación con mes anterior (Window Function)
      LAG(COALESCE(d.usuarios_nuevos, 0)) OVER (ORDER BY m.mes) AS usuarios_mes_anterior,
      LAG(COALESCE(d.ordenes_mes, 0)) OVER (ORDER BY m.mes) AS ordenes_mes_anterior,
      LAG(COALESCE(d.ingresos_mes, 0)) OVER (ORDER BY m.mes) AS ingresos_mes_anterior,
      -- Crecimiento porcentual
      CASE
        WHEN LAG(d.usuarios_nuevos) OVER (ORDER BY m.mes) IS NULL OR
             LAG(d.usuarios_nuevos) OVER (ORDER BY m.mes) = 0 THEN NULL
        ELSE ROUND(
          ((COALESCE(d.usuarios_nuevos, 0) - LAG(COALESCE(d.usuarios_nuevos, 0)) OVER (ORDER BY m.mes))::FLOAT /
           LAG(COALESCE(d.usuarios_nuevos, 0)) OVER (ORDER BY m.mes)) * 100,
          2
        )
      END AS crecimiento_usuarios_pct,
      CASE
        WHEN LAG(d.ingresos_mes) OVER (ORDER BY m.mes) IS NULL OR
             LAG(d.ingresos_mes) OVER (ORDER BY m.mes) = 0 THEN NULL
        ELSE ROUND(
          ((COALESCE(d.ingresos_mes, 0) - LAG(COALESCE(d.ingresos_mes, 0)) OVER (ORDER BY m.mes))::FLOAT /
           LAG(COALESCE(d.ingresos_mes, 0)) OVER (ORDER BY m.mes)) * 100,
          2
        )
      END AS crecimiento_ingresos_pct,
      -- Promedio móvil (3 meses)
      ROUND(AVG(COALESCE(d.ingresos_mes, 0)) OVER (
        ORDER BY m.mes
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
      ), 2) AS promedio_movil_3meses,
      -- Tendencia
      CASE
        WHEN COALESCE(d.ingresos_mes, 0) = 0 THEN '⚪ Sin datos'
        WHEN COALESCE(d.ingresos_mes, 0) > LAG(COALESCE(d.ingresos_mes, 0)) OVER (ORDER BY m.mes)
          THEN '🟢 Creciendo'
        WHEN COALESCE(d.ingresos_mes, 0) < LAG(COALESCE(d.ingresos_mes, 0)) OVER (ORDER BY m.mes)
          THEN '🔴 Decreciendo'
        ELSE '🟡 Estable'
      END AS tendencia
    FROM meses_completos m
    FULL OUTER JOIN datos_usuarios d ON m.mes = d.mes
    ORDER BY m.mes
  `;

  return resultado;
}

// Resultado incluye TODOS los meses del año (incluso sin datos):
// [
//   { mes: 1, nombre_mes: "January", usuarios_nuevos: 45, ordenes: 120, ingresos: 15000, ... },
//   { mes: 2, nombre_mes: "February", usuarios_nuevos: 0, ordenes: 0, ingresos: 0, ... }, // Sin datos
//   { mes: 3, nombre_mes: "March", usuarios_nuevos: 67, ordenes: 180, ingresos: 22000, ... },
//   ...
// ]
```

## Comparación: FULL JOIN vs otros enfoques

```typescript
// ❌ INNER JOIN: Pierde registros sin relación
const inner = await prisma.user.findMany({
  where: {
    orders: { some: {} }
  },
  include: { orders: true }
});

// ⚠️ LEFT JOIN: Pierde órdenes sin usuario
const left = await prisma.user.findMany({
  include: { orders: true }
});

// ⚠️ RIGHT JOIN: Pierde usuarios sin órdenes
const right = await prisma.order.findMany({
  include: { user: true }
});

// ✅ FULL JOIN: No pierde NADA (requiere SQL directo)
const full = await prisma.$queryRaw`
  SELECT *
  FROM "User" u
  FULL OUTER JOIN "Order" o ON u.id = o.userId
`;
```

## Tips avanzados para FULL JOIN

### 1. Usa CTEs para organizar queries complejas

```sql
WITH problemas_criticos AS (...),
     problemas_medios AS (...),
     problemas_bajos AS (...)
SELECT * FROM problemas_criticos
UNION ALL
SELECT * FROM problemas_medios
```

### 2. COALESCE para unificar IDs y evitar nulls

```sql
SELECT
  COALESCE(u.id, o.userId, 0) AS id_unificado,
  COALESCE(u.name, 'Usuario desconocido') AS nombre,
  COALESCE(o.total, 0) AS total
FROM "User" u
FULL OUTER JOIN "Order" o ON u.id = o.userId
```

### 3. Detecta origen del registro

```sql
SELECT
  *,
  CASE
    WHEN u.id IS NOT NULL AND o.id IS NOT NULL THEN '✅ Ambas tablas'
    WHEN u.id IS NOT NULL THEN '👤 Solo User'
    WHEN o.id IS NOT NULL THEN '📦 Solo Order'
  END AS origen_dato
```

### 4. Window Functions para análisis temporal

```sql
SELECT
  mes,
  ingresos,
  LAG(ingresos) OVER (ORDER BY mes) AS mes_anterior,
  AVG(ingresos) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
    AS promedio_movil
```

### 5. Múltiples FULL JOINs con cuidado

```sql
-- ⚠️ Puede generar producto cartesiano
FROM tabla1 t1
FULL OUTER JOIN tabla2 t2 ON t1.id = t2.id
FULL OUTER JOIN tabla3 t3 ON t2.id = t3.id
-- ✅ Mejor: Usa CTEs y UNION
```

## Casos de uso principales

1. **Auditorías de integridad completas**: Encontrar TODOS los problemas
2. **Migración de datos**: Verificar que TODO migró correctamente
3. **Reconciliación contable**: Comparar sistemas financieros
4. **Dashboard ejecutivo**: Vista 360° sin pérdida de información
5. **Análisis de calidad de datos**: Detectar gaps y inconsistencias
6. **Plan de acción automatizado**: Priorizar correcciones basado en TODO el sistema

## Ventajas de FULL JOIN

✅ No pierde ningún registro de ninguna tabla
✅ Identifica problemas de integridad en ambos lados
✅ Vista completa del sistema para auditorías
✅ Facilita reconciliación entre sistemas
✅ Detecta tanto datos huérfanos como registros sin relaciones

## Cuándo NO usar FULL JOIN

❌ Cuando solo necesitas datos válidos → Usa INNER JOIN
❌ Para consultas de negocio normales → Usa LEFT o INNER
❌ Cuando el rendimiento es crítico → FULL JOIN es más costoso
❌ Si Prisma puede expresar la query → Usa API de Prisma
❌ Para reportes de usuario final → Filtrarías los nulls de todas formas

## Patrón recomendado para FULL JOIN

```typescript
// 1. Identificar el problema
async identificarProblemas() {
  const resultado = await prisma.$queryRaw`...FULL OUTER JOIN...`;
  return resultado.filter(r => r.estado !== '✅ Normal');
}

// 2. Cuantificar el impacto
async cuantificarImpacto(problemas) {
  return problemas.reduce((acc, p) => {
    acc[p.tipo_problema] = (acc[p.tipo_problema] || 0) + 1;
    return acc;
  }, {});
}

// 3. Generar plan de acción
async generarPlan(problemas) {
  return problemas
    .sort((a, b) => a.prioridad - b.prioridad)
    .map(p => ({
      problema: p.tipo_problema,
      accion: p.accion_sugerida,
      ids: p.ids_afectados
    }));
}

// 4. Ejecutar correcciones
async ejecutarCorrecciones(plan) {
  for (const item of plan) {
    await this.corregirProblema(item);
  }
}
```

## Resumen

FULL OUTER JOIN es el JOIN más completo: muestra **TODOS** los registros de **TODAS** las tablas involucradas, tengan o no relación entre sí.

En Prisma: **Combinar múltiples queries** o usar **$queryRaw con SQL directo**

Ideal para: **Auditorías completas, migraciones, reconciliaciones, dashboards ejecutivos**

💡 **Recuerda**: Es el JOIN menos usado pero el más poderoso para análisis de calidad e integridad de datos.
