# Consultas Avanzadas con Prisma

## Operadores de filtrado

### Comparación

```typescript
// Igual (=)
await this.product.findMany({
  where: {
    price: 100
  }
});

// No igual (!=)
await this.product.findMany({
  where: {
    price: {
      not: 100
    }
  }
});

// Mayor que (>)
await this.product.findMany({
  where: {
    price: {
      gt: 100  // greater than
    }
  }
});

// Mayor o igual que (>=)
await this.product.findMany({
  where: {
    price: {
      gte: 100  // greater than or equal
    }
  }
});

// Menor que (<)
await this.product.findMany({
  where: {
    price: {
      lt: 100  // less than
    }
  }
});

// Menor o igual que (<=)
await this.product.findMany({
  where: {
    price: {
      lte: 100  // less than or equal
    }
  }
});
```

### Rangos

```typescript
// Entre dos valores
await this.product.findMany({
  where: {
    price: {
      gte: 50,
      lte: 200
    }
  }
});
```

### Lista de valores (IN)

```typescript
// Buscar por múltiples valores
await this.product.findMany({
  where: {
    id: {
      in: [1, 2, 3, 4, 5]
    }
  }
});

// No en la lista (NOT IN)
await this.product.findMany({
  where: {
    id: {
      notIn: [1, 2, 3]
    }
  }
});
```

## Operadores de texto

### Contiene (LIKE)

```typescript
// Contiene texto (case sensitive)
await this.product.findMany({
  where: {
    name: {
      contains: 'laptop'
    }
  }
});

// Contiene texto (case insensitive)
await this.product.findMany({
  where: {
    name: {
      contains: 'laptop',
      mode: 'insensitive'
    }
  }
});
```

### Empieza con

```typescript
await this.product.findMany({
  where: {
    name: {
      startsWith: 'Mac'
    }
  }
});
```

### Termina con

```typescript
await this.product.findMany({
  where: {
    name: {
      endsWith: 'Pro'
    }
  }
});
```

## Operadores lógicos

### AND (Y)

```typescript
// Múltiples condiciones (todas deben cumplirse)
await this.product.findMany({
  where: {
    AND: [
      { available: true },
      { price: { gte: 100 } },
      { name: { contains: 'laptop' } }
    ]
  }
});

// Sintaxis simplificada (por defecto es AND)
await this.product.findMany({
  where: {
    available: true,
    price: { gte: 100 },
    name: { contains: 'laptop' }
  }
});
```

### OR (O)

```typescript
// Al menos una condición debe cumplirse
await this.product.findMany({
  where: {
    OR: [
      { price: { lt: 50 } },
      { price: { gt: 500 } }
    ]
  }
});
```

### NOT (NO)

```typescript
// Negar una condición
await this.product.findMany({
  where: {
    NOT: {
      available: false
    }
  }
});

// Negar múltiples condiciones
await this.product.findMany({
  where: {
    NOT: [
      { price: { lt: 10 } },
      { available: false }
    ]
  }
});
```

### Combinación compleja

```typescript
// (available = true AND price >= 100) OR (name contiene "premium")
await this.product.findMany({
  where: {
    OR: [
      {
        AND: [
          { available: true },
          { price: { gte: 100 } }
        ]
      },
      {
        name: { contains: 'premium' }
      }
    ]
  }
});
```

## Relaciones

### Filtrar por relaciones

```typescript
// Schema con relaciones
model Order {
  id        Int       @id @default(autoincrement())
  total     Float
  productId Int
  product   Product   @relation(fields: [productId], references: [id])
}

model Product {
  id     Int     @id @default(autoincrement())
  name   String
  orders Order[]
}

// Obtener productos que tienen órdenes
await this.product.findMany({
  where: {
    orders: {
      some: {}  // Al menos una orden
    }
  }
});

// Obtener productos sin órdenes
await this.product.findMany({
  where: {
    orders: {
      none: {}  // Sin órdenes
    }
  }
});

// Obtener productos con órdenes mayores a 100
await this.product.findMany({
  where: {
    orders: {
      some: {
        total: { gt: 100 }
      }
    }
  }
});
```

### Incluir relaciones (JOIN)

```typescript
// Incluir órdenes relacionadas
await this.product.findMany({
  include: {
    orders: true
  }
});

// Incluir con filtro
await this.product.findMany({
  include: {
    orders: {
      where: {
        total: { gt: 100 }
      }
    }
  }
});
```

## Agregaciones

### Operaciones agregadas

```typescript
// Contar
const count = await this.product.count();

// Aggregate (múltiples operaciones)
const result = await this.product.aggregate({
  _count: true,           // Cantidad de registros
  _avg: { price: true },  // Promedio de precios
  _sum: { price: true },  // Suma de precios
  _min: { price: true },  // Precio mínimo
  _max: { price: true }   // Precio máximo
});

console.log(result);
// {
//   _count: 50,
//   _avg: { price: 125.50 },
//   _sum: { price: 6275 },
//   _min: { price: 10 },
//   _max: { price: 999 }
// }
```

### Agrupar (Group By)

```typescript
// Agrupar por campo
const groupedByAvailability = await this.product.groupBy({
  by: ['available'],
  _count: true,
  _avg: {
    price: true
  }
});

// Resultado:
// [
//   { available: true, _count: 45, _avg: { price: 130 } },
//   { available: false, _count: 5, _avg: { price: 80 } }
// ]
```

## Búsqueda full-text

```typescript
// Requiere configuración en el schema
model Product {
  id    Int    @id @default(autoincrement())
  name  String

  @@index([name], type: Hash) // o type: BTree según la DB
}

// Búsqueda de texto
await this.product.findMany({
  where: {
    name: {
      search: 'laptop gaming'
    }
  }
});
```

## Transacciones

### Transacción simple

```typescript
async transferInventory(fromId: number, toId: number, quantity: number) {
  return await this.$transaction(async (prisma) => {
    // Reducir del origen
    const from = await prisma.product.update({
      where: { id: fromId },
      data: {
        stock: {
          decrement: quantity
        }
      }
    });

    // Aumentar en el destino
    const to = await prisma.product.update({
      where: { id: toId },
      data: {
        stock: {
          increment: quantity
        }
      }
    });

    return { from, to };
  });
}
```

### Transacción con múltiples operaciones

```typescript
async createOrderWithItems(orderData, items) {
  return await this.$transaction([
    // Crear la orden
    this.order.create({
      data: orderData
    }),
    // Actualizar inventario de productos
    ...items.map(item =>
      this.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    )
  ]);
}
```

## Raw Queries (Consultas SQL directas)

```typescript
// Para casos muy específicos o consultas SQL complejas
async rawQuery() {
  const products = await this.$queryRaw`
    SELECT * FROM Product
    WHERE price > 100
    AND available = true
  `;
  return products;
}

// Execute para INSERT/UPDATE/DELETE
async rawExecute() {
  const result = await this.$executeRaw`
    UPDATE Product
    SET price = price * 1.1
    WHERE available = true
  `;
  return result; // Devuelve el número de filas afectadas
}
```

## Distinct

```typescript
// Valores únicos de un campo
const uniquePrices = await this.product.findMany({
  distinct: ['price'],
  select: {
    price: true
  }
});
```

## Ejemplo complejo real

```typescript
// Buscar productos disponibles, con precio entre 50 y 500,
// que contengan "laptop" en el nombre, ordenados por precio,
// con paginación
async searchProducts(searchDto) {
  const {
    search,
    minPrice = 0,
    maxPrice = 999999,
    page = 1,
    limit = 10
  } = searchDto;

  return await this.product.findMany({
    where: {
      AND: [
        { available: true },
        {
          price: {
            gte: minPrice,
            lte: maxPrice
          }
        },
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    },
    orderBy: {
      price: 'asc'
    },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      name: true,
      price: true,
      available: true
    }
  });
}
```
