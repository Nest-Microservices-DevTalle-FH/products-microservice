# Operaciones CRUD con Prisma

## Configuración inicial

### Importar Prisma Client

```typescript
import { PrismaClient } from 'generated/prisma/client';

const prisma = new PrismaClient();
```

### Integración con NestJS

En este proyecto, extendemos `PrismaClient` en el servicio:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  onModuleInit() {
    this.$connect();  // Conecta a la base de datos al inicializar el módulo
  }
}
```

## CREATE - Crear registros

### Crear un registro

```typescript
// Crear un producto
async create(createProductDto: CreateProductDto) {
  return this.product.create({
    data: createProductDto
  });
}

// Ejemplo con todos los campos
async create(data) {
  return this.product.create({
    data: {
      name: 'Laptop',
      price: 999.99,
      available: true
    }
  });
}
```

### Crear múltiples registros

```typescript
async createMany() {
  return this.product.createMany({
    data: [
      { name: 'Laptop', price: 999.99 },
      { name: 'Mouse', price: 25.50 },
      { name: 'Keyboard', price: 75.00 }
    ]
  });
}
```

### Crear o actualizar (Upsert)

```typescript
async upsertProduct(id: number, data) {
  return this.product.upsert({
    where: { id },
    update: data,
    create: data
  });
}
```

## READ - Leer registros

### Obtener todos los registros

```typescript
async findAll() {
  return this.product.findMany();
}
```

### Obtener con filtros

```typescript
async findAvailableProducts() {
  return this.product.findMany({
    where: {
      available: true
    }
  });
}
```

### Obtener un registro por ID

```typescript
// findUnique - para campos únicos (@id o @unique)
async findOne(id: number) {
  return this.product.findUnique({
    where: { id }
  });
}

// findFirst - devuelve el primer resultado que coincida
async findOne(id: number) {
  return this.product.findFirst({
    where: { id }
  });
}
```

### Obtener con excepción si no existe

```typescript
async findOneOrThrow(id: number) {
  return this.product.findUniqueOrThrow({
    where: { id }
  });
}
// Lanza PrismaClientKnownRequestError si no encuentra el registro
```

### Paginación

```typescript
async findAll(paginationDto: PaginationDto) {
  const { limit = 10, page = 1 } = paginationDto;

  // Contar total de registros
  const totalProducts = await this.product.count({
    where: { available: true }
  });

  // Obtener registros paginados
  const products = await this.product.findMany({
    skip: (page - 1) * limit,  // Saltar registros
    take: limit,                // Límite de registros
    where: { available: true }
  });

  return {
    data: products,
    meta: {
      page,
      total: totalProducts,
      lastPage: Math.ceil(totalProducts / limit)
    }
  };
}
```

### Seleccionar campos específicos

```typescript
async findAllNamesAndPrices() {
  return this.product.findMany({
    select: {
      name: true,
      price: true
    }
  });
}
```

### Ordenar resultados

```typescript
async findAllSorted() {
  return this.product.findMany({
    orderBy: {
      price: 'desc'  // 'asc' o 'desc'
    }
  });
}

// Ordenar por múltiples campos
async findAllSortedMultiple() {
  return this.product.findMany({
    orderBy: [
      { available: 'desc' },
      { price: 'asc' }
    ]
  });
}
```

## UPDATE - Actualizar registros

### Actualizar un registro

```typescript
async update(id: number, updateProductDto: UpdateProductDto) {
  return this.product.update({
    where: { id },
    data: updateProductDto
  });
}

// Ejemplo completo
async update(id: number, data) {
  return this.product.update({
    where: { id },
    data: {
      name: 'Nuevo nombre',
      price: 150.00
    }
  });
}
```

### Actualizar múltiples registros

```typescript
async updateMany() {
  return this.product.updateMany({
    where: {
      price: { lt: 100 }  // Productos con precio menor a 100
    },
    data: {
      available: true
    }
  });
}
```

### Incrementar/Decrementar valores

```typescript
async incrementPrice(id: number, amount: number) {
  return this.product.update({
    where: { id },
    data: {
      price: {
        increment: amount
      }
    }
  });
}

async decrementPrice(id: number, amount: number) {
  return this.product.update({
    where: { id },
    data: {
      price: {
        decrement: amount
      }
    }
  });
}
```

## DELETE - Eliminar registros

### Eliminar un registro (Hard Delete)

```typescript
async remove(id: number) {
  return this.product.delete({
    where: { id }
  });
}
```

### Eliminar múltiples registros

```typescript
async removeMany() {
  return this.product.deleteMany({
    where: {
      available: false
    }
  });
}
```

### Soft Delete (Borrado lógico)

En lugar de eliminar físicamente, marcamos como no disponible:

```typescript
async remove(id: number) {
  return this.product.update({
    where: { id },
    data: {
      available: false
    }
  });
}

// Recuperar un producto eliminado
async restore(id: number) {
  return this.product.update({
    where: { id },
    data: {
      available: true
    }
  });
}
```

## Contar registros

```typescript
// Contar todos
async count() {
  return this.product.count();
}

// Contar con filtros
async countAvailable() {
  return this.product.count({
    where: {
      available: true
    }
  });
}
```

## Ejemplo completo de servicio

```typescript
@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  onModuleInit() {
    this.$connect();
  }

  // CREATE
  create(createProductDto: CreateProductDto) {
    return this.product.create({ data: createProductDto });
  }

  // READ
  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;

    const totalProducts = await this.product.count({
      where: { available: true }
    });

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true }
      }),
      meta: {
        page,
        total: totalProducts,
        lastPage: Math.ceil(totalProducts / limit)
      }
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }

    return product;
  }

  // UPDATE
  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);  // Verificar que existe

    return this.product.update({
      where: { id },
      data: updateProductDto
    });
  }

  // DELETE (Soft delete)
  async remove(id: number) {
    await this.findOne(id);  // Verificar que existe

    return this.product.update({
      where: { id },
      data: { available: false }
    });
  }
}
```
