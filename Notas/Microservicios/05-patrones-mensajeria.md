# Patrones de Mensajería

## 1. Request-Reply (Pregunta-Respuesta)

Cliente envía solicitud y espera respuesta.

```typescript
// Microservicio
@MessagePattern({ cmd: 'calculate_total' })
calculateTotal(items: any[]) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { total, tax: total * 0.16, grandTotal: total * 1.16 };
}

// Cliente
const result = await this.client
  .send({ cmd: 'calculate_total' }, orderItems)
  .toPromise();

console.log(result.grandTotal); // Usa la respuesta
```

**Cuándo usar**: Queries, comandos con confirmación, operaciones síncronas

---

## 2. Fire and Forget (Disparar y Olvidar)

Cliente envía mensaje y NO espera respuesta.

```typescript
// Microservicio
@EventPattern('email_send')
handleSendEmail(data: any) {
  this.emailService.send(data.to, data.subject, data.body);
  // No retorna nada
}

// Cliente
this.client.emit('email_send', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Thank you for signing up'
});
// Continúa sin esperar
```

**Cuándo usar**: Notificaciones, logs, eventos de auditoría

---

## 3. Pub/Sub (Publicar/Suscribir)

Un evento puede ser consumido por **múltiples suscriptores**.

```typescript
// Publisher (API Gateway)
this.client.emit('order_created', {
  orderId: 123,
  userId: 456,
  total: 500,
  items: [...]
});

// Subscriber 1: Inventory Service
@EventPattern('order_created')
handleOrderCreated(data: any) {
  this.inventoryService.reduceStock(data.items);
}

// Subscriber 2: Email Service
@EventPattern('order_created')
handleOrderCreated(data: any) {
  this.emailService.sendOrderConfirmation(data.userId);
}

// Subscriber 3: Analytics Service
@EventPattern('order_created')
handleOrderCreated(data: any) {
  this.analyticsService.trackSale(data);
}
```

**Cuándo usar**: Eventos de negocio que interesan a múltiples servicios

---

## 4. Queue Groups (NATS)

Balanceo de carga: solo un suscriptor del grupo recibe el mensaje.

```typescript
// main.ts (Microservicio 1)
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'orders_workers', // Mismo queue group
  },
});

// main.ts (Microservicio 2)
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'orders_workers', // Mismo queue group
  },
});

// Ambos escuchan, pero solo uno procesa cada mensaje
@MessagePattern({ cmd: 'process_order' })
processOrder(data: any) {
  // Solo una instancia procesará este mensaje
  console.log('Processing order:', data.orderId);
  return { status: 'processed' };
}
```

**Cuándo usar**: Alta disponibilidad, distribución de carga

---

## 5. Saga Pattern (Transacciones Distribuidas)

Coordinar transacciones entre múltiples servicios.

### Saga Orquestada

```typescript
// order-saga.service.ts
export class OrderSagaService {
  async createOrder(dto: CreateOrderDto) {
    const sagaId = uuid();

    try {
      // Paso 1: Reservar inventario
      const inventory = await this.inventoryClient
        .send({ cmd: 'reserve_inventory' }, {
          sagaId,
          items: dto.items
        })
        .toPromise();

      // Paso 2: Procesar pago
      const payment = await this.paymentClient
        .send({ cmd: 'process_payment' }, {
          sagaId,
          amount: dto.total,
          userId: dto.userId
        })
        .toPromise();

      // Paso 3: Crear orden
      const order = await this.ordersClient
        .send({ cmd: 'create_order' }, {
          sagaId,
          ...dto,
          inventoryId: inventory.id,
          paymentId: payment.id
        })
        .toPromise();

      // Éxito: Confirmar todas las operaciones
      this.inventoryClient.emit('saga_complete', { sagaId });
      this.paymentClient.emit('saga_complete', { sagaId });

      return order;

    } catch (error) {
      // Error: Compensar (rollback)
      console.error('Saga failed, compensating...', error);

      this.inventoryClient.emit('saga_compensate', { sagaId });
      this.paymentClient.emit('saga_compensate', { sagaId });

      throw new Error('Order creation failed');
    }
  }
}
```

### Compensación en Microservicios

```typescript
// inventory.controller.ts
@EventPattern('saga_compensate')
handleSagaCompensate(data: any) {
  // Liberar inventario reservado
  this.inventoryService.releaseReservation(data.sagaId);
  console.log(`Inventory released for saga ${data.sagaId}`);
}

// payment.controller.ts
@EventPattern('saga_compensate')
handleSagaCompensate(data: any) {
  // Reversar pago
  this.paymentService.refund(data.sagaId);
  console.log(`Payment refunded for saga ${data.sagaId}`);
}
```

**Cuándo usar**: Operaciones que requieren múltiples servicios y deben ser atómicas

---

## 6. CQRS (Command Query Responsibility Segregation)

Separar lecturas (queries) de escrituras (commands).

```typescript
// Commands (escritura)
@MessagePattern({ cmd: 'create_product' })
async createProduct(data: any) {
  const product = await this.productsRepo.create(data);

  // Emitir evento
  this.eventBus.emit('product_created', product);

  return product;
}

@MessagePattern({ cmd: 'update_product' })
async updateProduct(data: any) {
  const product = await this.productsRepo.update(data.id, data);

  // Emitir evento
  this.eventBus.emit('product_updated', product);

  return product;
}

// Queries (lectura) - puede tener su propia DB optimizada para lectura
@MessagePattern({ cmd: 'get_products' })
async getProducts() {
  // Leer de caché o DB de solo lectura
  return this.productsReadRepo.findAll();
}

@MessagePattern({ cmd: 'search_products' })
async searchProducts(query: string) {
  // Elasticsearch para búsquedas rápidas
  return this.searchService.search(query);
}
```

**Cuándo usar**: Alta carga de lectura, necesidad de optimizar queries independientemente

---

## 7. Event Sourcing

Guardar eventos en lugar de estado actual.

```typescript
// Event Store
const events = [
  { type: 'ProductCreated', data: { id: 1, name: 'Laptop', price: 999 } },
  { type: 'PriceChanged', data: { id: 1, oldPrice: 999, newPrice: 899 } },
  { type: 'StockReduced', data: { id: 1, quantity: 5 } }
];

// Reconstruir estado actual
function getProductState(productId: number) {
  const productEvents = events.filter(e => e.data.id === productId);

  let state = {};

  for (const event of productEvents) {
    switch (event.type) {
      case 'ProductCreated':
        state = { ...event.data };
        break;
      case 'PriceChanged':
        state.price = event.data.newPrice;
        break;
      case 'StockReduced':
        state.stock = (state.stock || 0) - event.data.quantity;
        break;
    }
  }

  return state;
}
```

**Cuándo usar**: Auditoría completa, necesidad de reconstruir estado histórico

---

## 8. Outbox Pattern

Garantizar que eventos se publiquen al guardar en DB.

```typescript
// products.service.ts
async createProduct(data: any) {
  // Transacción
  return this.prisma.$transaction(async (tx) => {
    // 1. Guardar producto
    const product = await tx.product.create({ data });

    // 2. Guardar evento en outbox table
    await tx.outbox.create({
      data: {
        eventType: 'product_created',
        payload: JSON.stringify(product),
        createdAt: new Date()
      }
    });

    return product;
  });
}

// Worker separado procesa outbox
setInterval(async () => {
  const events = await prisma.outbox.findMany({
    where: { processed: false },
    take: 100
  });

  for (const event of events) {
    try {
      // Publicar evento
      this.eventBus.emit(event.eventType, JSON.parse(event.payload));

      // Marcar como procesado
      await prisma.outbox.update({
        where: { id: event.id },
        data: { processed: true }
      });
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }
}, 5000); // Cada 5 segundos
```

**Cuándo usar**: Garantía de entrega de eventos, consistencia eventual

---

## Comparación de Patrones

| Patrón | Complejidad | Consistencia | Uso típico |
|--------|-------------|--------------|------------|
| **Request-Reply** | 🟢 Baja | ✅ Fuerte | Queries, comandos simples |
| **Fire and Forget** | 🟢 Baja | ⚠️ Eventual | Notificaciones |
| **Pub/Sub** | 🟡 Media | ⚠️ Eventual | Eventos de negocio |
| **Queue Groups** | 🟡 Media | ✅ Fuerte | Balanceo de carga |
| **Saga** | 🔴 Alta | ⚠️ Eventual | Transacciones distribuidas |
| **CQRS** | 🔴 Alta | ⚠️ Eventual | Lectura/escritura separadas |
| **Event Sourcing** | 🔴 Alta | ✅ Fuerte | Auditoría completa |
| **Outbox** | 🟡 Media | ✅ Fuerte | Garantía de entrega |

---

## Recomendaciones

1. **Empieza simple**: Request-Reply para la mayoría de casos
2. **Usa eventos**: Para notificaciones y acciones no críticas
3. **Saga para transacciones**: Cuando involucres múltiples servicios
4. **CQRS solo si lo necesitas**: Alta carga de lectura
5. **Event Sourcing con cuidado**: Solo si auditoría es crítica

**Regla de oro**: No uses patrones complejos solo porque están de moda. Usa la solución más simple que resuelva tu problema.
