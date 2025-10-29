# Comunicación entre Microservicios

## Tipos de Comunicación

### 1. Request-Response (Síncrono)

Cliente envía mensaje y **espera respuesta**.

```typescript
// Microservicio
@MessagePattern({ cmd: 'get_product' })
getProduct(id: number) {
  return { id, name: 'Laptop', price: 999 };
}

// Cliente
const product = await this.client
  .send({ cmd: 'get_product' }, productId)
  .toPromise();
```

**Cuándo usar**: GET, consultas, comandos que requieren confirmación

---

### 2. Event-Based (Asíncrono)

Cliente emite evento y **NO espera respuesta**.

```typescript
// Microservicio
@EventPattern('product_created')
handleProductCreated(data: any) {
  console.log('Product created:', data);
  // No retorna nada
}

// Cliente
this.client.emit('product_created', { id: 1, name: 'Laptop' });
```

**Cuándo usar**: Notificaciones, eventos de negocio, procesamiento en background

---

## Transport TCP (Por Defecto)

### Configuración

```typescript
// main.ts (Microservicio)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  },
);

// Cliente
ClientsModule.register([
  {
    name: 'PRODUCTS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
  },
]);
```

**Pros**: Simple, sin dependencias externas
**Contras**: Sin balanceo de carga nativo, sin persistencia de mensajes

---

## Transport NATS

NATS es un sistema de mensajería ligero y de alto rendimiento.

### Instalación

```bash
# Instalar NATS server (Docker)
docker run -p 4222:4222 -p 8222:8222 nats

# Instalar cliente
npm install nats
```

### Configuración

```typescript
// main.ts (Microservicio)
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.NATS,
    options: {
      servers: ['nats://localhost:4222'],
      queue: 'products_queue', // Load balancing
    },
  },
);

// Cliente
ClientsModule.register([
  {
    name: 'PRODUCTS_SERVICE',
    transport: Transport.NATS,
    options: {
      servers: ['nats://localhost:4222'],
    },
  },
]);
```

**Pros**:
- ✅ Muy rápido
- ✅ Balanceo de carga automático (queue groups)
- ✅ Pub/Sub nativo
- ✅ Request-Reply integrado

**Contras**:
- ❌ No persiste mensajes (solo JetStream)
- ❌ Infraestructura adicional

---

## Transport RabbitMQ

### Instalación

```bash
# Docker
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Cliente
npm install amqplib amqp-connection-manager
```

### Configuración

```typescript
// main.ts (Microservicio)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'products_queue',
      queueOptions: {
        durable: true,
      },
    },
  },
);

// Cliente
ClientsModule.register([
  {
    name: 'PRODUCTS_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'products_queue',
      queueOptions: {
        durable: true,
      },
    },
  },
]);
```

**Pros**:
- ✅ Persistencia de mensajes
- ✅ Acknowledgments (ACK/NACK)
- ✅ Routing complejo (exchanges)
- ✅ Dead Letter Queues

---

## Ejemplo Práctico: E-commerce

### Escenario: Crear una orden

```typescript
// API Gateway
@Post('orders')
async createOrder(@Body() dto: CreateOrderDto) {
  // 1. Verificar producto
  const product = await firstValueFrom(
    this.productsClient.send({ cmd: 'get_product' }, dto.productId)
  );

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  // 2. Verificar usuario
  const user = await firstValueFrom(
    this.usersClient.send({ cmd: 'get_user' }, dto.userId)
  );

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // 3. Crear orden
  const order = await firstValueFrom(
    this.ordersClient.send({ cmd: 'create_order' }, {
      ...dto,
      productPrice: product.price,
      userName: user.name,
    })
  );

  // 4. Emitir eventos (asíncrono)
  this.productsClient.emit('order_created', {
    orderId: order.id,
    productId: product.id,
    quantity: dto.quantity,
  });

  this.usersClient.emit('order_created', {
    orderId: order.id,
    userId: user.id,
    total: order.total,
  });

  return order;
}
```

### Microservicio de Productos

```typescript
// products-ms
@Controller()
export class ProductsController {
  // Request-Response: Obtener producto
  @MessagePattern({ cmd: 'get_product' })
  async getProduct(id: number) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new RpcException('Product not found');
    }
    return product;
  }

  // Event: Orden creada (reducir stock)
  @EventPattern('order_created')
  async handleOrderCreated(data: any) {
    await this.productsService.reduceStock(
      data.productId,
      data.quantity
    );
    console.log(`Stock reduced for product ${data.productId}`);
  }
}
```

### Microservicio de Usuarios

```typescript
// users-ms
@Controller()
export class UsersController {
  // Request-Response: Obtener usuario
  @MessagePattern({ cmd: 'get_user' })
  async getUser(id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new RpcException('User not found');
    }
    return user;
  }

  // Event: Orden creada (notificar usuario)
  @EventPattern('order_created')
  async handleOrderCreated(data: any) {
    await this.notificationService.sendEmail(data.userId, {
      subject: 'Order Confirmation',
      body: `Your order ${data.orderId} has been created. Total: $${data.total}`
    });
    console.log(`Notification sent to user ${data.userId}`);
  }
}
```

---

## Patrón Circuit Breaker

Evita fallos en cascada cuando un microservicio no responde.

```typescript
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, catchError, retry } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('PRODUCTS_SERVICE') private productsClient: ClientProxy
  ) {}

  async createOrder(dto: any) {
    try {
      const product = await this.productsClient
        .send({ cmd: 'get_product' }, dto.productId)
        .pipe(
          timeout(5000), // Timeout de 5 segundos
          retry(3), // Reintentar 3 veces
          catchError(err => {
            console.error('Product service unavailable:', err);
            // Fallback: Usar caché o valor por defecto
            return of({ id: dto.productId, price: 0, available: false });
          })
        )
        .toPromise();

      if (!product.available) {
        throw new Error('Product not available');
      }

      // Continuar con la lógica
      return { orderId: 123, product };
    } catch (error) {
      throw error;
    }
  }
}
```

---

## Health Checks

Monitorear salud de microservicios.

```bash
npm install @nestjs/terminus
```

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.microservice.pingCheck('products_ms', {
          transport: Transport.TCP,
          options: { host: 'localhost', port: 3001 },
        }),
      () =>
        this.microservice.pingCheck('orders_ms', {
          transport: Transport.TCP,
          options: { host: 'localhost', port: 3002 },
        }),
    ]);
  }
}
```

---

## Resumen

| Patrón | Método | Espera respuesta | Uso |
|--------|--------|------------------|-----|
| **Request-Response** | `send()` | ✅ Sí | Consultas, comandos |
| **Event-Based** | `emit()` | ❌ No | Notificaciones, eventos |

| Transport | Complejidad | Persistencia | Uso recomendado |
|-----------|-------------|--------------|------------------|
| **TCP** | 🟢 Baja | ❌ No | Desarrollo, comunicación interna simple |
| **NATS** | 🟡 Media | ⚠️ Con JetStream | Producción, alto rendimiento |
| **RabbitMQ** | 🔴 Alta | ✅ Sí | Procesamiento crítico, colas robustas |
| **Kafka** | 🔴 Alta | ✅ Sí | Event sourcing, alto throughput |

**Recomendación**: Empieza con TCP para desarrollo, migra a NATS o RabbitMQ en producción.
