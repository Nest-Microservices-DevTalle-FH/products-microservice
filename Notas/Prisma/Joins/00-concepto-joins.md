# ¿Qué son los JOINs?

## Concepto básico

Un **JOIN** es una operación que combina filas de dos o más tablas basándose en una columna relacionada entre ellas. Es la forma de "unir" información que está distribuida en diferentes tablas.

## Analogía del mundo real

Imagina que tienes dos libretas:

**Libreta 1 - Clientes:**
| ID | Nombre |
|----|--------|
| 1  | Juan   |
| 2  | María  |
| 3  | Pedro  |

**Libreta 2 - Órdenes:**
| ID | ClienteID | Producto |
|----|-----------|----------|
| 1  | 1         | Laptop   |
| 2  | 1         | Mouse    |
| 3  | 2         | Teclado  |
| 4  | 99        | Monitor  |

Un JOIN te permite ver: "¿Qué cliente hizo qué orden?"

## Tipos de JOINs

### 1. INNER JOIN (Intersección)
Devuelve solo los registros que tienen coincidencias en **AMBAS** tablas.

**Resultado:**
```
Juan    - Laptop
Juan    - Mouse
María   - Teclado
```

Pedro no aparece porque no tiene órdenes.
La orden del cliente 99 no aparece porque ese cliente no existe.

### 2. LEFT JOIN (Izquierda completa)
Devuelve **TODOS** los registros de la tabla izquierda, y los coincidentes de la derecha.

**Resultado:**
```
Juan    - Laptop
Juan    - Mouse
María   - Teclado
Pedro   - null      ← Pedro aparece aunque no tenga órdenes
```

### 3. RIGHT JOIN (Derecha completa)
Devuelve **TODOS** los registros de la tabla derecha, y los coincidentes de la izquierda.

**Resultado:**
```
Juan    - Laptop
Juan    - Mouse
María   - Teclado
null    - Monitor   ← La orden aparece aunque el cliente no exista
```

### 4. FULL JOIN (Unión completa)
Devuelve **TODOS** los registros cuando hay coincidencia en la tabla izquierda **O** derecha.

**Resultado:**
```
Juan    - Laptop
Juan    - Mouse
María   - Teclado
Pedro   - null      ← Pedro sin órdenes
null    - Monitor   ← Orden sin cliente
```

## Diagrama de Venn

```
INNER JOIN:        LEFT JOIN:         RIGHT JOIN:        FULL JOIN:
    ┌───┐              ┌───┐              ┌───┐              ┌───┐
    │ A │              │ A │              │ A │              │ A │
    │ ┌─┴─┐            │ ┌─┴─┐            │ ┌─┴─┐            │ ┌─┴─┐
    └─┤ ■ │            ■─┤ ■ │            └─┤ ■ │            ■─┤ ■ │
      └─┬─┘              └─┬─┘              └─┬─┘              └─┬─┘
        │ B │              │ B │              ■ B │              ■ B │
        └───┘              └───┘              └───┘              └───┘

   Solo el centro     Todo A + centro     Todo B + centro    Todo A + B + centro
```

## ¿Cuándo usar cada uno?

| JOIN | Cuándo usarlo |
|------|---------------|
| **INNER JOIN** | Cuando solo quieres registros que tienen coincidencia en ambas tablas |
| **LEFT JOIN** | Cuando quieres todos los registros de la tabla principal, tengan o no relación |
| **RIGHT JOIN** | Cuando quieres todos los registros de la tabla relacionada (menos común) |
| **FULL JOIN** | Cuando quieres absolutamente todo, con o sin relación (menos común) |

## En Prisma

Prisma no usa la sintaxis SQL tradicional de JOINs, pero el concepto es el mismo:

```typescript
// INNER JOIN (por defecto con 'include')
await prisma.cliente.findMany({
  include: {
    ordenes: true  // Solo clientes que tienen órdenes aparecerán con órdenes
  }
});

// LEFT JOIN (el comportamiento natural de Prisma)
await prisma.cliente.findMany({
  include: {
    ordenes: true  // Todos los clientes, con sus órdenes si las tienen
  }
});
```

## Ejemplo visual completo

### Schema de ejemplo:

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

### Datos:

**Clientes:**
```
1 - Juan
2 - María
3 - Pedro
```

**Órdenes:**
```
1 - Laptop  (cliente 1 - Juan)
2 - Mouse   (cliente 1 - Juan)
3 - Teclado (cliente 2 - María)
```

### Resultados según tipo de JOIN:

**INNER JOIN** - Solo clientes con órdenes:
```json
[
  { "nombre": "Juan", "ordenes": ["Laptop", "Mouse"] },
  { "nombre": "María", "ordenes": ["Teclado"] }
]
```

**LEFT JOIN** - Todos los clientes:
```json
[
  { "nombre": "Juan", "ordenes": ["Laptop", "Mouse"] },
  { "nombre": "María", "ordenes": ["Teclado"] },
  { "nombre": "Pedro", "ordenes": [] }
]
```

En las siguientes secciones veremos cada JOIN en detalle con ejemplos prácticos usando Prisma.
