# Introducción a Microservicios con NestJS

## ¿Qué es NestJS?

**NestJS** es un framework de Node.js para construir aplicaciones server-side eficientes y escalables. Está construido con TypeScript y combina elementos de:

- 🏗️ **OOP** (Programación Orientada a Objetos)
- 🔧 **FP** (Programación Funcional)
- 📦 **FRP** (Programación Reactiva Funcional)

### ¿Por qué NestJS para Microservicios?

✅ **Arquitectura modular**: Perfecta para microservicios
✅ **TypeScript nativo**: Tipado fuerte y mejor DX
✅ **Soporte nativo de microservicios**: @nestjs/microservices incluido
✅ **Múltiples transportes**: TCP, Redis, NATS, RabbitMQ, Kafka, gRPC, MQTT
✅ **Inyección de dependencias**: Facilita testing y mantenimiento
✅ **Decoradores**: Sintaxis limpia y declarativa
✅ **CLI poderoso**: Genera código scaffold rápidamente

---

## Paquete @nestjs/microservices

El paquete `@nestjs/microservices` proporciona soporte nativo para construir microservicios.

### Instalación

```bash
npm install @nestjs/microservices
```

### Transportes Soportados

| Transporte | Paquete Adicional | Caso de uso |
|-----------|-------------------|-------------|
| **TCP** | Ninguno | Comunicación interna simple |
| **Redis** | `redis` | Pub/Sub con Redis |
| **NATS** | `nats` | Mensajería ligera y rápida |
| **RabbitMQ** | `amqplib` | Colas de mensajes robustas |
| **Kafka** | `kafkajs` | Streaming de eventos de alto rendimiento |
| **gRPC** | `@grpc/grpc-js` | RPC de alto rendimiento |
| **MQTT** | `mqtt` | IoT y dispositivos |

---

## Arquitectura Básica

### Aplicación Tradicional (Híbrida)

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

### Aplicación como Microservicio

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });

  await app.listen();
  console.log('Microservice is listening on port 3001');
}
bootstrap();
```

### Aplicación Híbrida (HTTP + Microservicio)

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crear aplicación HTTP
  const app = await NestFactory.create(AppModule);

  // Conectar microservicio
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });

  // Iniciar ambos
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('HTTP server running on port 3000');
  console.log('Microservice running on port 3001');
}
bootstrap();
```

---

## Patrones de Comunicación

NestJS soporta dos patrones principales de comunicación:

### 1. Request-Response (Síncrono)

**Descripción**: Cliente envía mensaje y espera respuesta.

```typescript
// products.controller.ts (Microservicio)
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class ProductsController {
  @MessagePattern({ cmd: 'get_product' })
  getProduct(id: number) {
    return {
      id,
      name: 'Laptop',
      price: 999.99
    };
  }

  @MessagePattern({ cmd: 'list_products' })
  listProducts() {
    return [
      { id: 1, name: 'Laptop', price: 999.99 },
      { id: 2, name: 'Mouse', price: 25.50 }
    ];
  }
}
```

**Cliente**:

```typescript
// orders.service.ts (Cliente)
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    });
  }

  async getProduct(id: number) {
    // Envía mensaje y espera respuesta
    const product = await this.client.send({ cmd: 'get_product' }, id).toPromise();
    return product;
  }

  async listProducts() {
    const products = await this.client.send({ cmd: 'list_products' }, {}).toPromise();
    return products;
  }
}
```

**Flujo**:
```
Cliente → send() → Microservicio → Procesa → Responde → Cliente recibe
                   (espera bloqueante)
```

---

### 2. Event-Based (Asíncrono)

**Descripción**: Cliente emite evento y NO espera respuesta (fire and forget).

```typescript
// products.controller.ts (Microservicio)
import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class ProductsController {
  @EventPattern('product_created')
  handleProductCreated(data: any) {
    console.log('Product created:', data);
    // No retorna nada
  }

  @EventPattern('product_updated')
  handleProductUpdated(data: any) {
    console.log('Product updated:', data);
    // Actualizar cache, enviar notificaciones, etc.
  }
}
```

**Cliente**:

```typescript
// orders.service.ts (Cliente)
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    });
  }

  async createOrder(orderData: any) {
    // Emite evento y NO espera respuesta
    this.client.emit('product_created', {
      productId: orderData.productId,
      quantity: orderData.quantity,
      timestamp: new Date()
    });

    return { message: 'Order created successfully' };
  }
}
```

**Flujo**:
```
Cliente → emit() → Microservicio → Procesa (asíncrono)
         (no espera respuesta)
```

---

## Diferencias Clave: send() vs emit()

| Característica | send() | emit() |
|---------------|--------|--------|
| **Patrón** | Request-Response | Event-Based |
| **Decorador** | @MessagePattern() | @EventPattern() |
| **Espera respuesta** | ✅ Sí (bloqueante) | ❌ No (fire and forget) |
| **Retorna valor** | ✅ Sí | ❌ No |
| **Maneja errores** | ✅ Sí (con catch) | ❌ No directamente |
| **Uso típico** | Consultas, comandos | Notificaciones, eventos |

### Ejemplo Combinado

```typescript
// products.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';

@Controller()
export class ProductsController {
  // Request-Response: Cliente espera respuesta
  @MessagePattern({ cmd: 'create_product' })
  async createProduct(data: any) {
    // Guardar en base de datos
    const product = await this.productsService.create(data);

    // Retornar el producto creado
    return product;
  }

  // Event-Based: Cliente NO espera respuesta
  @EventPattern('product_created')
  async handleProductCreated(product: any) {
    // Tareas asíncronas después de crear producto
    await this.cacheService.invalidate('products');
    await this.notificationService.notifyAdmin(product);
    await this.analyticsService.track('product_created', product);
    // No retorna nada
  }

  // Request-Response: Obtener producto
  @MessagePattern({ cmd: 'get_product' })
  getProduct(id: number) {
    return this.productsService.findOne(id);
  }

  // Event-Based: Producto eliminado
  @EventPattern('product_deleted')
  handleProductDeleted(id: number) {
    console.log(`Product ${id} was deleted`);
    // Limpiar cache, notificar, etc.
  }
}
```

**Cliente consumiendo ambos patrones**:

```typescript
// orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    @Inject('PRODUCTS_SERVICE') private client: ClientProxy
  ) {}

  async createOrder(orderData: any) {
    try {
      // 1. Obtener producto (Request-Response)
      const product = await this.client
        .send({ cmd: 'get_product' }, orderData.productId)
        .toPromise();

      if (!product) {
        throw new Error('Product not found');
      }

      // 2. Crear orden
      const order = await this.ordersRepository.create({
        ...orderData,
        productPrice: product.price
      });

      // 3. Emitir evento (Event-Based)
      this.client.emit('product_created', {
        productId: product.id,
        orderId: order.id,
        quantity: orderData.quantity
      });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
}
```

---

## Configuración de Cliente (Dependency Injection)

En lugar de crear cliente manualmente, usa módulos:

### Paso 1: Configurar módulo

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3002,
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class AppModule {}
```

### Paso 2: Inyectar cliente

```typescript
// orders.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('PRODUCTS_SERVICE') private productsClient: ClientProxy,
    @Inject('USERS_SERVICE') private usersClient: ClientProxy,
  ) {}

  async createOrder(orderData: any) {
    // Obtener producto
    const product = await this.productsClient
      .send({ cmd: 'get_product' }, orderData.productId)
      .toPromise();

    // Obtener usuario
    const user = await this.usersClient
      .send({ cmd: 'get_user' }, orderData.userId)
      .toPromise();

    // Crear orden
    const order = {
      id: Date.now(),
      user: user.name,
      product: product.name,
      total: product.price * orderData.quantity
    };

    // Emitir evento
    this.productsClient.emit('order_created', order);

    return order;
  }
}
```

---

## Lifecycle Hooks

Los microservicios necesitan conectarse antes de usarse:

```typescript
// orders.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @Inject('PRODUCTS_SERVICE') private productsClient: ClientProxy,
  ) {}

  async onModuleInit() {
    // Conectar al microservicio cuando el módulo inicie
    await this.productsClient.connect();
    console.log('Connected to Products Microservice');
  }

  async getProduct(id: number) {
    return this.productsClient.send({ cmd: 'get_product' }, id).toPromise();
  }
}
```

---

## Estructura de Proyecto Recomendada

```
microservices/
├── api-gateway/                 # Gateway HTTP público
│   ├── src/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   └── main.ts
│   └── package.json
│
├── products-service/            # Microservicio de productos
│   ├── src/
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.module.ts
│   │   └── main.ts
│   └── package.json
│
├── orders-service/              # Microservicio de órdenes
│   ├── src/
│   │   ├── orders/
│   │   └── main.ts
│   └── package.json
│
└── users-service/               # Microservicio de usuarios
    ├── src/
    │   ├── users/
    │   └── main.ts
    └── package.json
```

---

## Ventajas de NestJS para Microservicios

### 1. Abstracciones de Alto Nivel

No necesitas lidiar directamente con sockets, buffers, o protocolos:

```typescript
// Sin NestJS (Node.js puro)
const net = require('net');
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const message = JSON.parse(data.toString());
    const response = handleMessage(message);
    socket.write(JSON.stringify(response));
  });
});
server.listen(3001);

// Con NestJS
@MessagePattern({ cmd: 'get_product' })
getProduct(id: number) {
  return this.productsService.findOne(id);
}
```

### 2. Cambio de Transporte sin Modificar Código

Cambia de TCP a NATS sin tocar la lógica:

```typescript
// Antes: TCP
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.TCP,
  options: { port: 3001 }
});

// Después: NATS
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: { servers: ['nats://localhost:4222'] }
});

// El código del controller NO cambia
@MessagePattern({ cmd: 'get_product' })
getProduct(id: number) {
  return this.productsService.findOne(id);
}
```

### 3. Testing Fácil

```typescript
// products.controller.spec.ts
describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Laptop' })
          }
        }
      ]
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should return product', async () => {
    const result = await controller.getProduct(1);
    expect(result).toEqual({ id: 1, name: 'Laptop' });
    expect(service.findOne).toHaveBeenCalledWith(1);
  });
});
```

---

## Comparación: REST vs Microservicios

### Aplicación REST (Tradicional)

```typescript
// products.controller.ts
@Controller('products')
export class ProductsController {
  @Get(':id')
  async getProduct(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  async createProduct(@Body() data: CreateProductDto) {
    return this.productsService.create(data);
  }
}
```

**Cliente**: Navegador, fetch, axios
```typescript
const response = await fetch('http://localhost:3000/products/1');
const product = await response.json();
```

### Aplicación Microservicio

```typescript
// products.controller.ts
@Controller()
export class ProductsController {
  @MessagePattern({ cmd: 'get_product' })
  async getProduct(id: number) {
    return this.productsService.findOne(id);
  }

  @MessagePattern({ cmd: 'create_product' })
  async createProduct(data: any) {
    return this.productsService.create(data);
  }
}
```

**Cliente**: Otro microservicio NestJS
```typescript
const product = await this.client
  .send({ cmd: 'get_product' }, id)
  .toPromise();
```

---

## Próximos Pasos

En las siguientes notas veremos:

1. ✅ **Instalación y Configuración**: Setup completo de proyecto
2. ✅ **Estructura de Proyecto**: Organización de archivos
3. ✅ **Comunicación entre Microservicios**: TCP, NATS, gRPC
4. ✅ **Patrones de Mensajería**: Request-Response, Event-Based
5. ✅ **Manejo de Errores**: RpcException, filtros globales
6. ✅ **Testing**: Unit tests, integration tests
7. ✅ **Deployment**: Docker, Kubernetes

---

## Recursos

- [NestJS Microservices Documentation](https://docs.nestjs.com/microservices/basics)
- [NestJS Microservices Patterns](https://docs.nestjs.com/microservices/basics#patterns)
- [Transport Layers](https://docs.nestjs.com/microservices/basics#transporters)
- [GitHub - NestJS Microservices Examples](https://github.com/nestjs/nest/tree/master/sample/04-microservices)
