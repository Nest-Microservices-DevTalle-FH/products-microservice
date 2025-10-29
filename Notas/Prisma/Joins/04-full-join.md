# FULL JOIN (FULL OUTER JOIN)

## ¿Qué es?

El **FULL JOIN** devuelve **TODOS** los registros cuando hay una coincidencia en la tabla izquierda **O** en la tabla derecha. Es la combinación de LEFT JOIN + RIGHT JOIN.

Es el JOIN más inclusivo de todos.

## Analogía

Imagina una reunión de ex-alumnos:
- Aparecen todos los que confirmaron asistencia ✅
- Aparecen todos los que llegaron ✅
- Aparecen los que confirmaron pero no llegaron ⚠️
- Aparecen los que llegaron sin confirmar ⚠️

**Todos aparecen**, tengan o no coincidencia.

## Diagrama Visual

```
Tabla A (Clientes)    Tabla B (Órdenes)
┌──────────────┐      ┌──────────────┐
│ 1. Juan      │──────│ Laptop       │  ✅ Coincide
│ 2. María     │──────│ Teclado      │  ✅ Coincide
│ 3. Pedro     │      │ Monitor      │  ⚠️ Sin cliente
└──────────────┘      └──────────────┘

RESULTADO FULL JOIN:
┌──────────────┬──────────────┐
│ Juan         │ Laptop       │  ✅ Coincidencia perfecta
│ María        │ Teclado      │  ✅ Coincidencia perfecta
│ Pedro        │ null         │  ⚠️ Cliente sin órdenes
│ null         │ Monitor      │  ⚠️ Orden sin cliente
└──────────────┴──────────────┘

✅ TODOS los clientes aparecen
✅ TODAS las órdenes aparecen
⚠️ Se muestran todos los "huecos"
```

## Ejemplo SQL tradicional

```sql
SELECT clientes.nombre, ordenes.producto
FROM clientes
FULL OUTER JOIN ordenes ON clientes.id = ordenes.clienteId;
```

## ⚠️ Limitación en Prisma

**Prisma NO soporta FULL JOIN directamente**, pero puedes simularlo combinando múltiples consultas.

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
  clienteId  Int?      // ← Nullable para órdenes huérfanas
  cliente    Cliente?  @relation(fields: [clienteId], references: [id])
}
```

## Simulación de FULL JOIN en Prisma

### Método 1: Combinar LEFT y RIGHT JOIN

```typescript
async fullJoinClientesOrdenes() {
  // LEFT JOIN: Todos los clientes (con o sin órdenes)
  const todosLosClientes = await prisma.cliente.findMany({
    include: {
      ordenes: true
    }
  });

  // RIGHT JOIN: Todas las órdenes huérfanas (sin cliente)
  const ordenesHuerfanas = await prisma.orden.findMany({
    where: {
      clienteId: null
    }
  });

  // Combinar resultados
  const resultado = [
    ...todosLosClientes.map(cliente => ({
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      ordenes: cliente.ordenes.map(o => ({
        id: o.id,
        producto: o.producto,
        total: o.total
      }))
    })),
    {
      clienteId: null,
      clienteNombre: null,
      ordenes: ordenesHuerfanas.map(o => ({
        id: o.id,
        producto: o.producto,
        total: o.total
      }))
    }
  ];

  return resultado;
}

// Resultado:
// [
//   {
//     clienteId: 1,
//     clienteNombre: "Juan",
//     ordenes: [
//       { id: 1, producto: "Laptop", total: 999.99 },
//       { id: 2, producto: "Mouse", total: 25.50 }
//     ]
//   },
//   {
//     clienteId: 2,
//     clienteNombre: "María",
//     ordenes: [
//       { id: 3, producto: "Teclado", total: 75.00 }
//     ]
//   },
//   {
//     clienteId: 3,
//     clienteNombre: "Pedro",
//     ordenes: []  // Cliente sin órdenes
//   },
//   {
//     clienteId: null,
//     clienteNombre: null,
//     ordenes: [
//       { id: 4, producto: "Monitor", total: 299.99 }  // Orden sin cliente
//     ]
//   }
// ]
```

### Método 2: Query Raw (SQL directo)

⚠️ Solo funciona con bases de datos que soportan FULL JOIN (PostgreSQL, SQL Server)

```typescript
async fullJoinRaw() {
  // ❌ SQLite NO soporta FULL JOIN
  // ✅ PostgreSQL SÍ soporta FULL JOIN

  const resultado = await prisma.$queryRaw`
    SELECT
      c.id as cliente_id,
      c.nombre as cliente_nombre,
      o.id as orden_id,
      o.producto,
      o.total
    FROM "Cliente" c
    FULL OUTER JOIN "Orden" o ON c.id = o."clienteId"
  `;

  return resultado;
}
```

## Ejemplos prácticos

### Ejemplo 1: Auditoría completa

```typescript
async auditoriaCompleta() {
  // Obtener todos los clientes con sus órdenes
  const clientes = await prisma.cliente.findMany({
    include: {
      ordenes: true,
      _count: {
        select: { ordenes: true }
      }
    }
  });

  // Obtener órdenes sin cliente
  const ordenesHuerfanas = await prisma.orden.findMany({
    where: {
      clienteId: null
    }
  });

  // Análisis
  const clientesSinOrdenes = clientes.filter(c => c._count.ordenes === 0);
  const clientesConOrdenes = clientes.filter(c => c._count.ordenes > 0);

  return {
    resumen: {
      totalClientes: clientes.length,
      clientesActivos: clientesConOrdenes.length,
      clientesInactivos: clientesSinOrdenes.length,
      ordenesHuerfanas: ordenesHuerfanas.length
    },
    detalles: {
      clientesSinOrdenes: clientesSinOrdenes.map(c => ({
        id: c.id,
        nombre: c.nombre,
        estado: '⚠️ Sin actividad'
      })),
      ordenesHuerfanas: ordenesHuerfanas.map(o => ({
        id: o.id,
        producto: o.producto,
        total: o.total,
        estado: '⚠️ Sin cliente asignado'
      }))
    }
  };
}

// Resultado:
// {
//   resumen: {
//     totalClientes: 3,
//     clientesActivos: 2,
//     clientesInactivos: 1,
//     ordenesHuerfanas: 1
//   },
//   detalles: {
//     clientesSinOrdenes: [
//       { id: 3, nombre: "Pedro", estado: "⚠️ Sin actividad" }
//     ],
//     ordenesHuerfanas: [
//       { id: 4, producto: "Monitor", total: 299.99, estado: "⚠️ Sin cliente asignado" }
//     ]
//   }
// }
```

### Ejemplo 2: Reporte de integridad

```typescript
model Category {
  id       Int       @id @default(autoincrement())
  name     String
  products Product[]
}

model Product {
  id         Int       @id @default(autoincrement())
  name       String
  price      Float
  categoryId Int?
  category   Category? @relation(fields: [categoryId], references: [id])
}

async reporteIntegridadCategorias() {
  // Todas las categorías con productos
  const categorias = await prisma.category.findMany({
    include: {
      products: true,
      _count: {
        select: { products: true }
      }
    }
  });

  // Productos sin categoría
  const productosSinCategoria = await prisma.product.findMany({
    where: {
      categoryId: null
    }
  });

  // Análisis
  const categoriasVacias = categorias.filter(c => c._count.products === 0);
  const categoriasActivas = categorias.filter(c => c._count.products > 0);

  return {
    estado: {
      categorias: {
        total: categorias.length,
        activas: categoriasActivas.length,
        vacias: categoriasVacias.length
      },
      productos: {
        total: await prisma.product.count(),
        conCategoria: await prisma.product.count({
          where: { categoryId: { not: null } }
        }),
        sinCategoria: productosSinCategoria.length
      }
    },
    problemas: {
      categoriasVacias: categoriasVacias.map(c => ({
        id: c.id,
        nombre: c.name,
        accion: 'Considerar eliminar o asignar productos'
      })),
      productosSinCategoria: productosSinCategoria.map(p => ({
        id: p.id,
        nombre: p.name,
        precio: p.price,
        accion: 'Asignar categoría'
      }))
    },
    salud: {
      porcentaje: Math.round(
        ((categoriasActivas.length / categorias.length) * 100 +
         ((await prisma.product.count() - productosSinCategoria.length) /
          await prisma.product.count()) * 100) / 2
      ),
      estado: function() {
        if (this.porcentaje >= 90) return '✅ Excelente';
        if (this.porcentaje >= 70) return '⚠️ Aceptable';
        return '❌ Necesita atención';
      }
    }
  };
}
```

### Ejemplo 3: Migración y limpieza

```typescript
async limpiezaCompleta() {
  console.log('🔍 Iniciando auditoría completa...');

  // Paso 1: Identificar problemas
  const clientes = await prisma.cliente.findMany({
    include: {
      ordenes: true,
      _count: { select: { ordenes: true } }
    }
  });

  const ordenesHuerfanas = await prisma.orden.findMany({
    where: { clienteId: null }
  });

  const clientesInactivos = clientes.filter(c => c._count.ordenes === 0);

  console.log(`\n📊 Resultados:`);
  console.log(`- Clientes inactivos: ${clientesInactivos.length}`);
  console.log(`- Órdenes huérfanas: ${ordenesHuerfanas.length}`);

  // Paso 2: Opciones de limpieza
  const opciones = {
    // Opción 1: Asignar cliente por defecto a órdenes huérfanas
    async asignarClienteDefault() {
      const clienteDefault = await prisma.cliente.upsert({
        where: { email: 'default@sistema.com' },
        update: {},
        create: {
          nombre: 'Cliente Sistema',
          email: 'default@sistema.com'
        }
      });

      const resultado = await prisma.orden.updateMany({
        where: { clienteId: null },
        data: { clienteId: clienteDefault.id }
      });

      console.log(`✅ ${resultado.count} órdenes asignadas al cliente default`);
      return resultado;
    },

    // Opción 2: Eliminar órdenes huérfanas
    async eliminarOrdenesHuerfanas() {
      const resultado = await prisma.orden.deleteMany({
        where: { clienteId: null }
      });

      console.log(`🗑️ ${resultado.count} órdenes huérfanas eliminadas`);
      return resultado;
    },

    // Opción 3: Marcar clientes inactivos
    async marcarClientesInactivos() {
      // Requiere agregar campo "activo" al schema
      const ids = clientesInactivos.map(c => c.id);

      console.log(`⚠️ ${ids.length} clientes marcados como inactivos`);
      console.log('IDs:', ids.join(', '));
      return ids;
    }
  };

  return {
    analisis: {
      clientesInactivos: clientesInactivos.length,
      ordenesHuerfanas: ordenesHuerfanas.length
    },
    acciones: opciones
  };
}
```

## Casos de uso comunes

### 1. Dashboard de métricas completo

```typescript
async dashboardCompleto() {
  // Recopilar toda la información
  const clientes = await prisma.cliente.findMany({
    include: {
      ordenes: true,
      _count: { select: { ordenes: true } }
    }
  });

  const ordenesHuerfanas = await prisma.orden.findMany({
    where: { clienteId: null }
  });

  const totalOrdenes = await prisma.orden.count();
  const totalClientes = clientes.length;

  // Calcular métricas
  const clientesActivos = clientes.filter(c => c._count.ordenes > 0).length;
  const clientesInactivos = totalClientes - clientesActivos;
  const ordenesValidas = totalOrdenes - ordenesHuerfanas.length;

  return {
    metricas: {
      clientes: {
        total: totalClientes,
        activos: clientesActivos,
        inactivos: clientesInactivos,
        tasaActividad: Math.round((clientesActivos / totalClientes) * 100)
      },
      ordenes: {
        total: totalOrdenes,
        validas: ordenesValidas,
        huerfanas: ordenesHuerfanas.length,
        tasaIntegridad: Math.round((ordenesValidas / totalOrdenes) * 100)
      }
    },
    alertas: [
      ...(clientesInactivos > 0 ? [{
        tipo: 'warning',
        mensaje: `${clientesInactivos} clientes sin órdenes`
      }] : []),
      ...(ordenesHuerfanas.length > 0 ? [{
        tipo: 'error',
        mensaje: `${ordenesHuerfanas.length} órdenes sin cliente`
      }] : [])
    ]
  };
}
```

### 2. Validación de migración

```typescript
async validarMigracion() {
  console.log('🔄 Validando migración de datos...\n');

  // Verificar todos los registros
  const [clientes, ordenes] = await Promise.all([
    prisma.cliente.findMany({
      include: { _count: { select: { ordenes: true } } }
    }),
    prisma.orden.findMany()
  ]);

  const clientesSinOrdenes = clientes.filter(c => c._count.ordenes === 0);
  const ordenesHuerfanas = ordenes.filter(o => o.clienteId === null);

  const esValido =
    clientesSinOrdenes.length === 0 &&
    ordenesHuerfanas.length === 0;

  if (esValido) {
    console.log('✅ Migración válida - Todas las relaciones correctas');
  } else {
    console.log('❌ Problemas detectados:');
    if (clientesSinOrdenes.length > 0) {
      console.log(`   - ${clientesSinOrdenes.length} clientes sin órdenes`);
    }
    if (ordenesHuerfanas.length > 0) {
      console.log(`   - ${ordenesHuerfanas.length} órdenes sin cliente`);
    }
  }

  return {
    valido: esValido,
    detalles: {
      clientesSinOrdenes,
      ordenesHuerfanas
    }
  };
}
```

## Comparación con otros JOINs

| JOIN | Clientes sin órdenes | Órdenes sin cliente | Total registros |
|------|----------------------|---------------------|-----------------|
| **INNER** | ❌ No | ❌ No | Solo coincidencias |
| **LEFT** | ✅ Sí | ❌ No | Todos de izquierda |
| **RIGHT** | ❌ No | ✅ Sí | Todos de derecha |
| **FULL** | ✅ Sí | ✅ Sí | Absolutamente todo |

## Ventajas y desventajas

### ✅ Ventajas
- Vista completa de todos los datos
- Identifica todos los problemas de integridad
- Útil para auditorías exhaustivas
- No pierdes ningún registro

### ❌ Desventajas
- Más complejo de implementar en Prisma
- Puede devolver mucha información
- Requires procesamiento adicional
- Menos eficiente que otros JOINs

## Tips y mejores prácticas

1. **Usa FULL JOIN cuando:**
   - Necesitas una auditoría completa
   - Estás migrando datos
   - Quieres identificar todos los problemas
   - Haces limpieza de base de datos

2. **NO uses FULL JOIN cuando:**
   - Solo necesitas datos válidos (usa INNER)
   - Solo necesitas registros principales (usa LEFT)
   - El rendimiento es crítico

3. **Implementación eficiente:**
   ```typescript
   // Usa Promise.all para paralelizar
   const [clientes, ordenesHuerfanas] = await Promise.all([
     prisma.cliente.findMany({ include: { ordenes: true } }),
     prisma.orden.findMany({ where: { clienteId: null } })
   ]);
   ```

## Ejemplos avanzados con múltiples tablas y SQL directo

### Ejemplo 1: Auditoría 360° del sistema (FULL JOIN real en SQL)

```typescript
async auditoria360Sistema() {
  // FULL JOIN: Ver TODO - usuarios con/sin órdenes Y órdenes con/sin usuario
  const resultado = await prisma.$queryRaw`
    SELECT
      -- Usuario
      u.id AS usuario_id,
      u.name AS usuario_nombre,
      u.email,
      u.createdAt AS fecha_registro,
      -- Orden
      o.id AS orden_id,
      o.total,
      o.status AS orden_status,
      o.createdAt AS fecha_orden,
      -- Items de orden
      COUNT(DISTINCT oi.id) AS total_items,
      SUM(oi.quantity) AS cantidad_productos,
      -- Productos y categorías
      COUNT(DISTINCT p.id) AS productos_diferentes,
      STRING_AGG(DISTINCT c.name, ', ') AS categorias,
      -- Clasificación de problema
      CASE
        WHEN u.id IS NULL THEN '⚠️ CRÍTICO: Orden sin usuario'
        WHEN o.id IS NULL THEN '⚠️ Usuario sin órdenes (inactivo)'
        WHEN COUNT(oi.id) = 0 THEN '⚠️ Orden sin productos'
        WHEN o.status = 'pending' AND
             DATE_PART('day', NOW() - o.createdAt) > 30 THEN '⚠️ Orden pendiente > 30 días'
        ELSE '✅ Normal'
      END AS clasificacion,
      -- Prioridad de corrección
      CASE
        WHEN u.id IS NULL THEN 1  -- Máxima prioridad
        WHEN COUNT(oi.id) = 0 THEN 2
        WHEN o.id IS NULL THEN 3
        ELSE 4
      END AS prioridad
    FROM "User" u
    FULL OUTER JOIN "Order" o ON u.id = o.userId  -- FULL JOIN aquí
    LEFT JOIN "OrderItem" oi ON o.id = oi.orderId
    LEFT JOIN "Product" p ON oi.productId = p.id
    LEFT JOIN "Category" c ON p.categoryId = c.id
    GROUP BY u.id, u.name, u.email, u.createdAt, o.id, o.total, o.status, o.createdAt
    ORDER BY prioridad ASC, o.createdAt DESC NULLS LAST
  `;

  return resultado;
}

// Resultado muestra ABSOLUTAMENTE TODO:
// [
//   {
//     usuario_id: null,          // ⚠️ Orden huérfana
//     usuario_nombre: null,
//     email: null,
//     fecha_registro: null,
//     orden_id: 445,
//     total: 150.00,
//     orden_status: "completed",
//     fecha_orden: "2024-10-15",
//     total_items: 2,
//     cantidad_productos: 3,
//     productos_diferentes: 2,
//     categorias: "Electrónica",
//     clasificacion: "⚠️ CRÍTICO: Orden sin usuario",
//     prioridad: 1
//   },
//   {
//     usuario_id: 15,
//     usuario_nombre: "Pedro",
//     email: "pedro@mail.com",
//     fecha_registro: "2024-01-10",
//     orden_id: null,            // ⚠️ Usuario sin órdenes
//     total: null,
//     orden_status: null,
//     fecha_orden: null,
//     total_items: 0,
//     cantidad_productos: 0,
//     productos_diferentes: 0,
//     categorias: null,
//     clasificacion: "⚠️ Usuario sin órdenes (inactivo)",
//     prioridad: 3
//   },
//   {
//     usuario_id: 5,             // ✅ Todo OK
//     usuario_nombre: "Ana",
//     email: "ana@mail.com",
//     fecha_registro: "2024-02-20",
//     orden_id: 200,
//     total: 299.99,
//     orden_status: "completed",
//     fecha_orden: "2024-11-25",
//     total_items: 3,
//     cantidad_productos: 5,
//     productos_diferentes: 3,
//     categorias: "Hogar, Cocina",
//     clasificacion: "✅ Normal",
//     prioridad: 4
//   }
// ]
```

### Ejemplo 2: Reconciliación de datos entre sistemas

```typescript
async reconciliacionSistemas() {
  // Comparar datos del sistema actual con sistema legacy
  const resultado = await prisma.$queryRaw`
    WITH legacy_orders AS (
      -- Simula órdenes del sistema antiguo
      SELECT
        legacy_id,
        user_email,
        total_amount,
        order_date
      FROM legacy_orders_table
    ),
    current_orders AS (
      SELECT
        o.id,
        u.email,
        o.total,
        o.createdAt
      FROM "Order" o
      LEFT JOIN "User" u ON o.userId = u.id
    )
    SELECT
      -- Sistema Legacy
      lo.legacy_id,
      lo.user_email AS legacy_email,
      lo.total_amount AS legacy_total,
      lo.order_date AS legacy_date,
      -- Sistema Actual
      co.id AS current_id,
      co.email AS current_email,
      co.total AS current_total,
      co.createdAt AS current_date,
      -- Estado de sincronización
      CASE
        WHEN lo.legacy_id IS NULL THEN '🆕 Solo en sistema actual'
        WHEN co.id IS NULL THEN '⚠️ Solo en sistema legacy'
        WHEN ABS(lo.total_amount - co.total) > 0.01 THEN '⚠️ Diferencia en totales'
        ELSE '✅ Sincronizado'
      END AS sync_status,
      -- Diferencias
      COALESCE(co.total, 0) - COALESCE(lo.total_amount, 0) AS diferencia_total
    FROM legacy_orders lo
    FULL OUTER JOIN current_orders co
      ON lo.user_email = co.email
      AND lo.legacy_id::TEXT = co.id::TEXT
    ORDER BY
      CASE
        WHEN lo.legacy_id IS NULL OR co.id IS NULL THEN 1
        ELSE 2
      END
  `;

  return resultado;
}
```

### Ejemplo 3: Dashboard ejecutivo completo (5+ tablas)

```typescript
async dashboardEjecutivoCompleto() {
  const resultado = await prisma.$queryRaw`
    SELECT
      -- Usuarios
      COUNT(DISTINCT u.id) AS total_usuarios,
      COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN u.id END) AS usuarios_activos,
      COUNT(DISTINCT CASE WHEN o.id IS NULL THEN u.id END) AS usuarios_inactivos,
      -- Órdenes
      COUNT(DISTINCT o.id) AS total_ordenes,
      COUNT(DISTINCT CASE WHEN o.userId IS NULL THEN o.id END) AS ordenes_huerfanas,
      COALESCE(SUM(o.total), 0) AS ingresos_totales,
      -- Productos
      COUNT(DISTINCT p.id) AS total_productos,
      COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END) AS productos_vendidos,
      COUNT(DISTINCT CASE WHEN oi.id IS NULL THEN p.id END) AS productos_sin_ventas,
      -- Categorías
      COUNT(DISTINCT c.id) AS total_categorias,
      COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN c.id END) AS categorias_con_productos,
      -- Reviews
      COUNT(DISTINCT r.id) AS total_reviews,
      COALESCE(AVG(r.rating), 0) AS rating_promedio_global,
      -- Salud del sistema (0-100)
      ROUND(
        (
          -- Porcentaje usuarios activos (30 puntos)
          (COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN u.id END)::FLOAT /
           NULLIF(COUNT(DISTINCT u.id), 0) * 30) +
          -- Porcentaje órdenes válidas (30 puntos)
          ((COUNT(DISTINCT o.id) - COUNT(DISTINCT CASE WHEN o.userId IS NULL THEN o.id END))::FLOAT /
           NULLIF(COUNT(DISTINCT o.id), 0) * 30) +
          -- Porcentaje productos vendidos (20 puntos)
          (COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END)::FLOAT /
           NULLIF(COUNT(DISTINCT p.id), 0) * 20) +
          -- Rating promedio normalizado (20 puntos)
          (COALESCE(AVG(r.rating), 0) / 5.0 * 20)
        ),
        2
      ) AS salud_sistema_score,
      -- Clasificación
      CASE
        WHEN ROUND(
          (
            (COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN u.id END)::FLOAT /
             NULLIF(COUNT(DISTINCT u.id), 0) * 30) +
            ((COUNT(DISTINCT o.id) - COUNT(DISTINCT CASE WHEN o.userId IS NULL THEN o.id END))::FLOAT /
             NULLIF(COUNT(DISTINCT o.id), 0) * 30) +
            (COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END)::FLOAT /
             NULLIF(COUNT(DISTINCT p.id), 0) * 20) +
            (COALESCE(AVG(r.rating), 0) / 5.0 * 20)
          ),
          2
        ) >= 90 THEN '🟢 Excelente'
        WHEN ROUND(...) >= 70 THEN '🟡 Bueno'
        WHEN ROUND(...) >= 50 THEN '🟠 Regular'
        ELSE '🔴 Necesita atención'
      END AS estado_sistema
    FROM "User" u
    FULL OUTER JOIN "Order" o ON u.id = o.userId
    FULL OUTER JOIN "OrderItem" oi ON o.id = oi.orderId
    FULL OUTER JOIN "Product" p ON oi.productId = p.id OR p.id NOT IN (SELECT productId FROM "OrderItem")
    FULL OUTER JOIN "Category" c ON p.categoryId = c.id OR c.id NOT IN (SELECT categoryId FROM "Product")
    LEFT JOIN "Review" r ON p.id = r.productId
  `;

  return resultado;
}
```

### Ejemplo 4: Plan de acción automático

```typescript
async generarPlanAccion() {
  // Analiza TODO el sistema y genera plan de acción priorizado
  const resultado = await prisma.$queryRaw`
    WITH problemas AS (
      SELECT
        'usuarios_inactivos' AS tipo,
        COUNT(*) AS cantidad,
        1 AS prioridad,
        'Marketing: Reactivar usuarios' AS accion,
        ARRAY_AGG(u.id) AS ids_afectados
      FROM "User" u
      LEFT JOIN "Order" o ON u.id = o.userId
      WHERE o.id IS NULL
        AND u.createdAt < NOW() - INTERVAL '30 days'
      GROUP BY tipo, prioridad, accion

      UNION ALL

      SELECT
        'ordenes_huerfanas' AS tipo,
        COUNT(*) AS cantidad,
        1 AS prioridad,
        'Técnico: Asignar cliente por defecto' AS accion,
        ARRAY_AGG(o.id)
      FROM "Order" o
      LEFT JOIN "User" u ON o.userId = u.id
      WHERE u.id IS NULL
      GROUP BY tipo, prioridad, accion

      UNION ALL

      SELECT
        'productos_sin_categoria' AS tipo,
        COUNT(*) AS cantidad,
        2 AS prioridad,
        'Contenido: Categorizar productos' AS accion,
        ARRAY_AGG(p.id)
      FROM "Product" p
      LEFT JOIN "Category" c ON p.categoryId = c.id
      WHERE c.id IS NULL
      GROUP BY tipo, prioridad, accion

      UNION ALL

      SELECT
        'categorias_vacias' AS tipo,
        COUNT(*) AS cantidad,
        3 AS prioridad,
        'Contenido: Eliminar o asignar productos' AS accion,
        ARRAY_AGG(c.id)
      FROM "Category" c
      LEFT JOIN "Product" p ON c.id = p.categoryId
      WHERE p.id IS NULL
      GROUP BY tipo, prioridad, accion
    )
    SELECT
      tipo,
      cantidad,
      prioridad,
      accion,
      ARRAY_LENGTH(ids_afectados, 1) AS registros_afectados,
      -- Estimación de impacto
      CASE
        WHEN prioridad = 1 THEN 'Alto'
        WHEN prioridad = 2 THEN 'Medio'
        ELSE 'Bajo'
      END AS impacto,
      -- Estimación de esfuerzo
      CASE
        WHEN cantidad < 10 THEN 'Bajo (< 1 hora)'
        WHEN cantidad < 100 THEN 'Medio (1-4 horas)'
        ELSE 'Alto (> 4 horas)'
      END AS esfuerzo_estimado
    FROM problemas
    WHERE cantidad > 0
    ORDER BY prioridad ASC, cantidad DESC
  `;

  return resultado;
}

// Resultado:
// [
//   {
//     tipo: "ordenes_huerfanas",
//     cantidad: 15,
//     prioridad: 1,
//     accion: "Técnico: Asignar cliente por defecto",
//     registros_afectados: 15,
//     impacto: "Alto",
//     esfuerzo_estimado: "Medio (1-4 horas)"
//   },
//   {
//     tipo: "usuarios_inactivos",
//     cantidad: 250,
//     prioridad: 1,
//     accion: "Marketing: Reactivar usuarios",
//     registros_afectados: 250,
//     impacto: "Alto",
//     esfuerzo_estimado: "Alto (> 4 horas)"
//   },
//   ...
// ]
```

### Tips avanzados para FULL JOIN

1. **Usa CTEs (Common Table Expressions) para claridad:**
```sql
WITH tabla1 AS (...),
     tabla2 AS (...)
SELECT *
FROM tabla1
FULL OUTER JOIN tabla2 ON ...
```

2. **COALESCE para unificar IDs:**
```sql
SELECT
  COALESCE(u.id, o.userId, 0) AS id_unificado,
  u.name,
  o.total
FROM "User" u
FULL OUTER JOIN "Order" o ON u.id = o.userId
```

3. **Detecta el origen del registro:**
```sql
SELECT
  *,
  CASE
    WHEN u.id IS NOT NULL AND o.id IS NOT NULL THEN 'Ambos'
    WHEN u.id IS NOT NULL THEN 'Solo User'
    WHEN o.id IS NOT NULL THEN 'Solo Order'
    ELSE 'Ninguno'
  END AS origen
```

4. **Combina con agregaciones:**
```sql
-- Cuenta registros de cada tipo
SELECT
  COUNT(CASE WHEN u.id IS NOT NULL AND o.id IS NOT NULL THEN 1 END) AS coincidencias,
  COUNT(CASE WHEN u.id IS NOT NULL AND o.id IS NULL THEN 1 END) AS solo_usuarios,
  COUNT(CASE WHEN u.id IS NULL AND o.id IS NOT NULL THEN 1 END) AS solo_ordenes
FROM "User" u
FULL OUTER JOIN "Order" o ON u.id = o.userId
```

### Casos reales de uso de FULL JOIN

1. **Migración de datos**: Verificar que todos los registros migraron
2. **Auditoría externa**: Compliance y reportes regulatorios
3. **Reconciliación contable**: Verificar transacciones vs registros
4. **Análisis de calidad de datos**: Identificar gaps en información
5. **Dashboard ejecutivo**: Vista 360° del negocio

## Resumen

**FULL JOIN** = TODOS los registros de ambas tablas, tengan o no relación

En Prisma: **Combinar LEFT + RIGHT** (hacer dos consultas)

En SQL directo: `FULL OUTER JOIN tabla ON condicion` (el más completo)

**Ejemplo mental**: Lista de asistencia donde aparecen todos los invitados y todos los que llegaron, tengan o no confirmación.

💡 **Recuerda**: Es el JOIN menos común pero muy útil para auditorías y migraciones.
