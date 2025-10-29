# Instalación y Configuración de Microservicios con NestJS

Esta guía te llevará paso a paso desde cero hasta tener un proyecto de microservicios funcional con NestJS.

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

```bash
# Node.js (v18 o superior recomendado)
node --version  # v18.x.x o superior

# npm o yarn
npm --version   # 9.x.x o superior

# NestJS CLI (global)
npm install -g @nestjs/cli
nest --version  # 10.x.x o superior
```

---

## Paso 1: Crear Estructura de Carpetas

Crearemos un monorepo con múltiples microservicios:

```bash
mkdir microservices-app
cd microservices-app

# Estructura inicial
mkdir -p {api-gateway,products-ms,orders-ms,users-ms}
```

Estructura resultante:
```
microservices-app/
├── api-gateway/          # Gateway HTTP
├── products-ms/          # Microservicio de productos
├── orders-ms/            # Microservicio de órdenes
└── users-ms/             # Microservicio de usuarios
```

---

## Paso 2: Crear API Gateway

El **API Gateway** es el punto de entrada público que se comunica con los microservicios.

```bash
cd api-gateway
nest new . --package-manager npm

# Instalar dependencias de microservicios
npm install @nestjs/microservices
```

### Configurar main.ts (API Gateway)

```typescript
// api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  app.enableCors();

  // Prefijo global
  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log('🚀 API Gateway running on http://localhost:3000');
}
bootstrap();
```

### Configurar .env (API Gateway)

```env
# api-gateway/.env
PORT=3000

# Microservices
PRODUCTS_MS_HOST=localhost
PRODUCTS_MS_PORT=3001

ORDERS_MS_HOST=localhost
ORDERS_MS_PORT=3002

USERS_MS_HOST=localhost
USERS_MS_PORT=3003
```

### Instalar dependencias adicionales

```bash
npm install @nestjs/config class-validator class-transformer
```

---

## Paso 3: Crear Microservicio de Productos

```bash
cd ../products-ms
nest new . --package-manager npm

# Instalar dependencias
npm install @nestjs/microservices @nestjs/config
```

### Configurar main.ts (Microservicio)

```typescript
// products-ms/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT) || 3001,
      },
    },
  );

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.listen();
  console.log('🎯 Products Microservice is listening on port 3001');
}
bootstrap();
```

### Configurar .env (Microservicio)

```env
# products-ms/.env
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL="file:./dev.db"
```

---

## Paso 4: Configurar Comunicación

### En API Gateway: Registrar clientes

```typescript
// api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // Variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Registrar clientes de microservicios
    ClientsModule.registerAsync([
      {
        name: 'PRODUCTS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('PRODUCTS_MS_HOST'),
            port: configService.get('PRODUCTS_MS_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'ORDERS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('ORDERS_MS_HOST'),
            port: configService.get('ORDERS_MS_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'USERS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('USERS_MS_HOST'),
            port: configService.get('USERS_MS_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
```

### En API Gateway: Usar cliente

```typescript
// api-gateway/src/products/products.controller.ts
import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject('PRODUCTS_SERVICE') private productsClient: ClientProxy,
  ) {}

  @Get()
  async findAll() {
    return firstValueFrom(
      this.productsClient.send({ cmd: 'get_products' }, {})
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.productsClient.send({ cmd: 'get_product' }, +id)
    );
  }

  @Post()
  async create(@Body() createProductDto: any) {
    return firstValueFrom(
      this.productsClient.send({ cmd: 'create_product' }, createProductDto)
    );
  }
}
```

### En Microservicio: Manejar mensajes

```typescript
// products-ms/src/products/products.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({ cmd: 'get_products' })
  async findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern({ cmd: 'get_product' })
  async findOne(id: number) {
    return this.productsService.findOne(id);
  }

  @MessagePattern({ cmd: 'create_product' })
  async create(data: any) {
    return this.productsService.create(data);
  }
}
```

---

## Paso 5: Scripts de Desarrollo

### API Gateway: package.json

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main"
  }
}
```

### Microservicio: package.json

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main"
  }
}
```

### Script global (raíz del proyecto)

Crear `package.json` en la raíz:

```json
{
  "name": "microservices-app",
  "version": "1.0.0",
  "scripts": {
    "dev:gateway": "cd api-gateway && npm run start:dev",
    "dev:products": "cd products-ms && npm run start:dev",
    "dev:orders": "cd orders-ms && npm run start:dev",
    "dev:users": "cd users-ms && npm run start:dev",
    "dev:all": "concurrently \"npm run dev:gateway\" \"npm run dev:products\" \"npm run dev:orders\" \"npm run dev:users\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Instalar concurrently:

```bash
npm install -D concurrently
```

### Ejecutar todos los servicios

```bash
# Desde la raíz
npm run dev:all
```

---

## Paso 6: Dockerizar los Microservicios

### Dockerfile para cada microservicio

```dockerfile
# products-ms/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "dist/main"]
```

### Docker Compose

Crear `docker-compose.yml` en la raíz:

```yaml
version: '3.8'

services:
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - PRODUCTS_MS_HOST=products-ms
      - PRODUCTS_MS_PORT=3001
      - ORDERS_MS_HOST=orders-ms
      - ORDERS_MS_PORT=3002
      - USERS_MS_HOST=users-ms
      - USERS_MS_PORT=3003
    depends_on:
      - products-ms
      - orders-ms
      - users-ms
    networks:
      - microservices-network

  products-ms:
    build:
      context: ./products-ms
      dockerfile: Dockerfile
    expose:
      - "3001"
    environment:
      - PORT=3001
      - HOST=0.0.0.0
    volumes:
      - ./products-ms/prisma:/app/prisma
      - products-data:/app/data
    networks:
      - microservices-network

  orders-ms:
    build:
      context: ./orders-ms
      dockerfile: Dockerfile
    expose:
      - "3002"
    environment:
      - PORT=3002
      - HOST=0.0.0.0
    networks:
      - microservices-network

  users-ms:
    build:
      context: ./users-ms
      dockerfile: Dockerfile
    expose:
      - "3003"
    environment:
      - PORT=3003
      - HOST=0.0.0.0
    networks:
      - microservices-network

networks:
  microservices-network:
    driver: bridge

volumes:
  products-data:
```

### Ejecutar con Docker

```bash
# Build e iniciar todos los servicios
docker-compose up --build

# Solo iniciar
docker-compose up

# Detener
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f products-ms
```

---

## Paso 7: Estructura Final

```
microservices-app/
├── api-gateway/
│   ├── src/
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   └── products.module.ts
│   │   ├── orders/
│   │   │   ├── orders.controller.ts
│   │   │   └── orders.module.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── products-ms/
│   ├── src/
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── orders-ms/
│   ├── src/
│   │   ├── orders/
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   └── orders.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── users-ms/
│   ├── src/
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Paso 8: Testing de Configuración

### Test manual con cURL

```bash
# API Gateway (HTTP)
curl http://localhost:3000/api/products

# Crear producto
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "description": "Gaming laptop"
  }'

# Obtener producto por ID
curl http://localhost:3000/api/products/1
```

### Test con REST Client (VSCode)

Crear `test.http`:

```http
### Get all products
GET http://localhost:3000/api/products

### Get single product
GET http://localhost:3000/api/products/1

### Create product
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "name": "Laptop",
  "price": 999.99,
  "description": "Gaming laptop"
}

### Update product
PATCH http://localhost:3000/api/products/1
Content-Type: application/json

{
  "price": 899.99
}

### Delete product
DELETE http://localhost:3000/api/products/1
```

---

## Checklist de Instalación Completa

- [ ] Node.js instalado (v18+)
- [ ] NestJS CLI instalado globalmente
- [ ] Estructura de carpetas creada
- [ ] API Gateway creado y configurado
- [ ] Al menos un microservicio creado
- [ ] Variables de entorno configuradas
- [ ] Comunicación entre gateway y microservicio funciona
- [ ] Scripts de desarrollo configurados
- [ ] Docker y Docker Compose configurados (opcional)
- [ ] Tests manuales exitosos

---

## Comandos Útiles

```bash
# Crear nuevo microservicio
nest new nombre-servicio

# Generar recurso completo
nest g resource products

# Generar controller
nest g controller products

# Generar service
nest g service products

# Generar module
nest g module products

# Build
npm run build

# Limpiar dist
rm -rf dist

# Ver estructura de proyecto
tree -L 3 -I node_modules
```

---

## Problemas Comunes

### Error: Cannot connect to microservice

**Solución**: Verifica que:
1. El microservicio esté corriendo
2. Host y puerto sean correctos
3. Firewall no bloquee el puerto

### Error: Module not found

**Solución**:
```bash
npm install
```

### Error: Port already in use

**Solución**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

---

## Próximos Pasos

Con la instalación completa, ahora puedes:

1. ✅ Crear módulos y controladores
2. ✅ Implementar lógica de negocio
3. ✅ Agregar base de datos (Prisma)
4. ✅ Implementar patrones de mensajería
5. ✅ Agregar manejo de errores
6. ✅ Implementar testing

---

## Recursos

- [NestJS CLI Documentation](https://docs.nestjs.com/cli/overview)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
