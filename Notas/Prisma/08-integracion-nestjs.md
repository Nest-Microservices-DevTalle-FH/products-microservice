# Integración de Prisma con NestJS

## Configuración inicial

### 1. Instalar dependencias

```bash
npm install prisma --save-dev
npm install @prisma/client
```

### 2. Inicializar Prisma

```bash
npx prisma init
```

## Estrategia 1: Servicio que extiende PrismaClient (Usada en este proyecto)

### Ventajas
- Menos código
- Acceso directo a todos los métodos de Prisma
- Ideal para proyectos pequeños/medianos

### ProductsService

```typescript
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  // Se ejecuta cuando el módulo se inicializa
  onModuleInit() {
    this.$connect();
    this.logger.log('Prisma Client connected to the database');
  }

  // Ahora puedes usar directamente this.product, this.user, etc.
  async findAll() {
    return this.product.findMany();
  }

  async findOne(id: number) {
    return this.product.findUnique({
      where: { id }
    });
  }

  async create(data) {
    return this.product.create({ data });
  }

  async update(id: number, data) {
    return this.product.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    return this.product.delete({
      where: { id }
    });
  }
}
```

### Implementación con OnModuleDestroy

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class ProductsService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## Estrategia 2: PrismaService como servicio separado

### Ventajas
- Mejor separación de responsabilidades
- Reutilizable en múltiples servicios
- Ideal para proyectos grandes

### 1. Crear PrismaService

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 2. Crear PrismaModule

```typescript
// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // Hace que PrismaService esté disponible globalmente
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
```

### 3. Importar en AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    PrismaModule,  // ← Importar aquí
    ProductsModule
  ]
})
export class AppModule {}
```

### 4. Usar en ProductsService

```typescript
// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id }
    });
  }

  async create(data) {
    return this.prisma.product.create({ data });
  }

  async update(id: number, data) {
    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({
      where: { id }
    });
  }
}
```

## DTOs con Prisma

### Usar class-validator con DTOs

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### UpdateProductDto con PartialType

```typescript
// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

## Paginación

### PaginationDto

```typescript
// src/common/dto/pagination.dto.ts
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
```

### Uso en el servicio

```typescript
async findAll(paginationDto: PaginationDto) {
  const { page = 1, limit = 10 } = paginationDto;

  const [data, total] = await Promise.all([
    this.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { available: true }
    }),
    this.product.count({
      where: { available: true }
    })
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      lastPage: Math.ceil(total / limit)
    }
  };
}
```

## Manejo de errores

### Interceptor para errores de Prisma

```typescript
// src/common/interceptors/prisma-error.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {
            case 'P2002':
              return throwError(() => new ConflictException('Unique constraint violation'));
            case 'P2025':
              return throwError(() => new NotFoundException('Record not found'));
            case 'P2003':
              return throwError(() => new BadRequestException('Foreign key constraint failed'));
            default:
              return throwError(() => new BadRequestException('Database error'));
          }
        }
        return throwError(() => error);
      })
    );
  }
}
```

### Aplicar globalmente

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaErrorInterceptor } from './common/interceptors/prisma-error.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new PrismaErrorInterceptor());

  await app.listen(3000);
}
bootstrap();
```

## Testing con Prisma

### Mock de PrismaService

```typescript
// src/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all products', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 100 }
    ];

    mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

    const result = await service.findAll();
    expect(result).toEqual(mockProducts);
  });
});
```

## Variables de entorno con ConfigModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    PrismaModule
  ]
})
export class AppModule {}
```

## Logging de consultas

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],  // Habilitar logs
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Log personalizado para queries
    this.$on('query' as any, (e: any) => {
      console.log('Query: ' + e.query);
      console.log('Duration: ' + e.duration + 'ms');
    });
  }
}
```

## Mejores prácticas

1. **Usar transacciones para operaciones múltiples**
2. **Implementar soft deletes con campo `available` o `deleted`**
3. **Validar datos con class-validator antes de enviar a Prisma**
4. **Usar select para optimizar consultas (traer solo campos necesarios)**
5. **Implementar paginación en endpoints que devuelven listas**
6. **Manejar errores de Prisma con interceptors o exception filters**
7. **Usar índices en campos que se consultan frecuentemente**
