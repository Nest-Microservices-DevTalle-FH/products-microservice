# Guía Completa de JOINs en Prisma

Esta guía explica cómo funcionan los diferentes tipos de JOINs y cómo implementarlos usando Prisma ORM.

## 📚 Contenido

### [0. Concepto de JOINs](./00-concepto-joins.md)
- ¿Qué son los JOINs?
- Analogía del mundo real
- Tipos de JOINs (visión general)
- Diagramas de Venn
- ¿Cuándo usar cada uno?
- Ejemplo visual completo

### [1. INNER JOIN](./01-inner-join.md)
- Concepto: Solo coincidencias en AMBAS tablas
- Diagrama visual
- Implementación en Prisma
- Ejemplos prácticos
- Casos de uso comunes
- Ventajas y desventajas

### [2. LEFT JOIN](./02-left-join.md)
- Concepto: TODOS de la tabla izquierda
- Diagrama visual
- Implementación en Prisma (comportamiento por defecto)
- Ejemplos prácticos
- Identificar registros sin relación
- Agregaciones con LEFT JOIN

### [3. RIGHT JOIN](./03-right-join.md)
- Concepto: TODOS de la tabla derecha
- Diagrama visual
- Limitaciones en Prisma
- Simulación invirtiendo la consulta
- Auditoría de registros huérfanos
- Casos de uso específicos

### [4. FULL JOIN](./04-full-join.md)
- Concepto: TODO de AMBAS tablas
- Diagrama visual
- Simulación combinando LEFT + RIGHT
- Auditoría completa
- Validación de migraciones
- Dashboard de métricas

## 🎯 Guía rápida de decisión

```
¿Qué necesitas?

┌─ Solo registros con relación activa
│  └─→ INNER JOIN
│
├─ Todos los registros principales
│  └─→ LEFT JOIN (por defecto en Prisma)
│
├─ Todos los registros secundarios
│  └─→ RIGHT JOIN (invertir consulta)
│
└─ Absolutamente todo (auditoría)
   └─→ FULL JOIN (combinar consultas)
```

## 📊 Tabla comparativa

| JOIN | SQL | Prisma | Tabla izquierda | Tabla derecha | Uso común |
|------|-----|--------|----------------|---------------|-----------|
| **INNER** | `INNER JOIN` | `where: { rel: { some: {} }}` | Solo con relación | Solo con relación | Reportes activos |
| **LEFT** | `LEFT JOIN` | `include: { rel: true }` | ✅ Todos | Solo relacionados | Listados completos |
| **RIGHT** | `RIGHT JOIN` | Invertir consulta | Solo relacionados | ✅ Todos | Auditoría secundaria |
| **FULL** | `FULL OUTER JOIN` | Combinar consultas | ✅ Todos | ✅ Todos | Auditoría total |

## 🚀 Ejemplos rápidos

### INNER JOIN
```typescript
// Solo clientes que tienen órdenes
const clientesConOrdenes = await prisma.cliente.findMany({
  where: {
    ordenes: { some: {} }
  },
  include: { ordenes: true }
});
```

### LEFT JOIN
```typescript
// TODOS los clientes (tengan o no órdenes)
const todosLosClientes = await prisma.cliente.findMany({
  include: { ordenes: true }
});
```

### RIGHT JOIN
```typescript
// TODAS las órdenes (tengan o no cliente)
const todasLasOrdenes = await prisma.orden.findMany({
  include: { cliente: true }
});
```

### FULL JOIN
```typescript
// TODO: clientes + órdenes huérfanas
const [clientes, ordenesHuerfanas] = await Promise.all([
  prisma.cliente.findMany({ include: { ordenes: true } }),
  prisma.orden.findMany({ where: { clienteId: null } })
]);
```

## 📖 Orden de lectura recomendado

### Para principiantes:
1. **Concepto de JOINs** - Entender la base
2. **LEFT JOIN** - El más común en Prisma
3. **INNER JOIN** - Para filtrar datos
4. **RIGHT JOIN** - Menos común
5. **FULL JOIN** - Casos especiales

### Para desarrollo:
1. **LEFT JOIN** - Tu día a día
2. **INNER JOIN** - Reportes y filtros
3. **RIGHT + FULL JOIN** - Auditorías

## 🎓 Ejemplos del proyecto

Basados en el schema del proyecto Products:

```prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Float
  available Boolean  @default(true)
  orders    Order[]
}

model Order {
  id         Int      @id @default(autoincrement())
  productId  Int
  quantity   Int
  product    Product  @relation(fields: [productId], references: [id])
}
```

### Ejemplo 1: Productos con ventas (INNER)
```typescript
const productosVendidos = await prisma.product.findMany({
  where: {
    orders: { some: {} }
  },
  include: {
    _count: { select: { orders: true } }
  }
});
```

### Ejemplo 2: Todos los productos (LEFT)
```typescript
const todosLosProductos = await prisma.product.findMany({
  include: {
    orders: true
  }
});
```

### Ejemplo 3: Todas las órdenes (RIGHT)
```typescript
const todasLasOrdenes = await prisma.order.findMany({
  include: {
    product: true
  }
});
```

## 💡 Tips generales

### 1. Performance
- **INNER JOIN**: Más rápido (menos datos)
- **LEFT JOIN**: Balance rendimiento/información
- **FULL JOIN**: Más lento (todos los datos)

### 2. Optimización
```typescript
// ✅ Bueno - Solo trae campos necesarios
await prisma.cliente.findMany({
  select: {
    nombre: true,
    ordenes: {
      select: { producto: true }
    }
  }
});

// ❌ Malo - Trae todo
await prisma.cliente.findMany({
  include: { ordenes: true }
});
```

### 3. Conteo sin traer datos
```typescript
// Solo contar, no traer registros completos
await prisma.cliente.findMany({
  include: {
    _count: { select: { ordenes: true } }
  }
});
```

## 🔗 Recursos adicionales

- [Documentación oficial de Prisma - Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Prisma Client API - Include](https://www.prisma.io/docs/concepts/components/prisma-client/select-fields#include-relations-and-select-relation-fields)
- [SQL JOINs Visualizer](http://joins.spathon.com/)

## ❓ FAQ

**P: ¿Cuál es el JOIN más usado en Prisma?**
R: LEFT JOIN (con `include`), porque generalmente quieres todos los registros principales.

**P: ¿Prisma tiene peor rendimiento que SQL puro?**
R: No significativamente. Prisma genera SQL optimizado y puedes usar `select` para mejorar.

**P: ¿Puedo hacer JOINs de múltiples tablas?**
R: Sí, puedes anidar `include`:
```typescript
prisma.cliente.findMany({
  include: {
    ordenes: {
      include: {
        productos: true
      }
    }
  }
});
```

**P: ¿Cuándo usar Raw SQL en lugar de Prisma?**
R: Solo para consultas muy complejas que Prisma no puede expresar fácilmente.

## 🎯 Resumen ejecutivo

| Si necesitas... | Usa... |
|----------------|--------|
| Solo registros activos | INNER JOIN |
| Lista completa de principales | LEFT JOIN |
| Lista completa de secundarios | RIGHT JOIN (invertir) |
| Auditoría total | FULL JOIN (combinar) |
| Mejor rendimiento | INNER JOIN |
| Más información | LEFT/FULL JOIN |

---

💡 **Tip final**: En el 80% de los casos usarás LEFT JOIN (el comportamiento por defecto de Prisma con `include`).
