# Monolítico vs Microservicios

## ¿Qué es una Arquitectura Monolítica?

Una **aplicación monolítica** es aquella donde todo el código y funcionalidades están contenidos en una sola unidad desplegable. Toda la lógica de negocio, acceso a datos, UI y servicios están **fuertemente acoplados** dentro de la misma aplicación.

### Características

- ✅ Todo el código está en un solo repositorio y proyecto
- ✅ Una sola base de datos compartida
- ✅ Un solo proceso de despliegue
- ✅ Comunicación interna directa (sin red)
- ✅ Fácil de desarrollar al inicio

### Ejemplo Visual

```
┌─────────────────────────────────────────────────────────┐
│           APLICACIÓN MONOLÍTICA                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Usuarios │  │ Productos│  │  Órdenes │             │
│  │  Module  │  │  Module  │  │  Module  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                     │
│       └─────────────┴─────────────┘                     │
│                     ▼                                   │
│         ┌─────────────────────┐                        │
│         │  Base de Datos      │                        │
│         │  Compartida         │                        │
│         └─────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

### Ventajas del Monolítico

✅ **Cero latencia**: Comunicación instantánea entre módulos (no hay red de por medio)
✅ **Desarrollo simple**: Fácil de entender y desarrollar al inicio
✅ **Despliegue simple**: Un solo archivo/contenedor para desplegar
✅ **Testing más fácil**: Todo en un solo lugar, testing end-to-end directo
✅ **Debugging más simple**: Stack trace completo en un solo proceso
✅ **Transacciones ACID**: Fácil mantener consistencia de datos

### Desventajas del Monolítico

❌ **Escalamiento limitado**: Si crece una parte, hay que escalar todo el monolito
❌ **Despliegue arriesgado**: Un cambio pequeño requiere redesplegar toda la aplicación
❌ **Acoplamiento fuerte**: Difícil hacer cambios sin afectar otras partes
❌ **Tecnología única**: Todo debe estar en el mismo lenguaje/framework
❌ **Equipos bloqueados**: Difícil trabajar en paralelo sin conflictos
❌ **Tiempo de inicio**: A mayor tamaño, más lento es iniciar la aplicación
❌ **Punto único de fallo**: Si cae, toda la aplicación cae

### Cuándo usar Monolítico

✅ Proyectos pequeños o medianos
✅ Equipos pequeños (< 10 desarrolladores)
✅ Aplicaciones con bajo tráfico o crecimiento predecible
✅ MVP o prototipos
✅ Proyectos con presupuesto limitado
✅ Cuando la simplicidad es más importante que la escalabilidad

---

## ¿Qué es una Arquitectura de Microservicios?

Los **microservicios** son una arquitectura donde la aplicación se divide en **servicios pequeños e independientes**, cada uno ejecutándose en su propio proceso y comunicándose mediante protocolos ligeros (HTTP, gRPC, mensajería).

### Características

- ✅ Cada servicio es independiente y desplegable por separado
- ✅ Cada servicio puede tener su propia base de datos
- ✅ Servicios se comunican por red (REST, gRPC, eventos)
- ✅ Pueden estar escritos en diferentes lenguajes
- ✅ Escalamiento independiente por servicio
- ✅ Equipos independientes por servicio

### Ejemplo Visual

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  User Service   │ │ Product Service │ │  Order Service  │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ - Get Users     │ │ - Get Products  │ │ - Create Order  │
│ - Create User   │ │ - Update Stock  │ │ - Get Orders    │
│ - Auth          │ │ - Categories    │ │ - Pay Order     │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│   Port: 3001    │ │   Port: 3002    │ │   Port: 3003    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │  DB 1   │         │  DB 2   │         │  DB 3   │
    │ Users   │         │Products │         │ Orders  │
    └─────────┘         └─────────┘         └─────────┘
```

### Ventajas de Microservicios

✅ **Escalamiento independiente**: Escala solo lo que necesites
✅ **Despliegues independientes**: Actualiza un servicio sin afectar otros
✅ **Tecnología flexible**: Cada servicio puede usar diferente stack
✅ **Resiliencia**: Si cae un servicio, los demás siguen funcionando
✅ **Equipos autónomos**: Cada equipo trabaja en su servicio
✅ **Mantenimiento más fácil**: Servicios pequeños son más fáciles de entender
✅ **Desarrollo paralelo**: Múltiples equipos trabajan simultáneamente
✅ **Reutilización**: Servicios pueden ser consumidos por múltiples aplicaciones

### Desventajas de Microservicios

❌ **Complejidad operacional**: Más servicios = más infraestructura que manejar
❌ **Latencia de red**: Comunicación por red es más lenta que llamadas directas
❌ **Consistencia de datos**: Transacciones distribuidas son complejas
❌ **Testing complejo**: Testing end-to-end más difícil
❌ **Debugging difícil**: Trazas distribuidas en múltiples servicios
❌ **Seguridad compleja**: Más puntos de entrada = más superficie de ataque
❌ **Costo inicial**: Requiere más infraestructura y herramientas
❌ **Duplicación**: Código/lógica puede duplicarse entre servicios

### Cuándo usar Microservicios

✅ Aplicaciones grandes y complejas
✅ Equipos grandes (10+ desarrolladores)
✅ Alto tráfico o crecimiento exponencial
✅ Necesidad de escalar partes específicas
✅ Múltiples equipos trabajando en paralelo
✅ Necesidad de usar diferentes tecnologías
✅ Ciclos de despliegue frecuentes
✅ Necesidad de alta disponibilidad

---

## Comparación Directa

| Aspecto | Monolítico | Microservicios |
|---------|-----------|----------------|
| **Complejidad inicial** | 🟢 Baja | 🔴 Alta |
| **Escalamiento** | 🔴 Vertical (todo junto) | 🟢 Horizontal (independiente) |
| **Despliegue** | 🟡 Todo o nada | 🟢 Independiente |
| **Latencia** | 🟢 Cero (memoria) | 🔴 Red de por medio |
| **Consistencia de datos** | 🟢 ACID nativo | 🔴 Eventual consistency |
| **Testing** | 🟢 Simple | 🔴 Complejo |
| **Debugging** | 🟢 Un solo proceso | 🔴 Trazas distribuidas |
| **Tecnología** | 🔴 Una sola | 🟢 Múltiples opciones |
| **Equipos** | 🔴 Acoplados | 🟢 Independientes |
| **Resiliencia** | 🔴 Punto único de fallo | 🟢 Fallas aisladas |
| **Costo inicial** | 🟢 Bajo | 🔴 Alto |
| **Mantenimiento a largo plazo** | 🔴 Difícil al crecer | 🟢 Más manejable |

---

## Tipos de Transporte en Microservicios

Los microservicios necesitan comunicarse entre sí. Existen varios mecanismos de transporte:

### 1. HTTP/HTTPS (REST)

**Descripción**: Comunicación síncrona usando el protocolo HTTP con APIs RESTful.

```typescript
// Cliente HTTP
const response = await fetch('http://products-service:3000/api/products/1');
const product = await response.json();
```

**Pros**:
- ✅ Simple y universal
- ✅ Fácil de debuggear
- ✅ Compatible con navegadores
- ✅ Múltiples herramientas disponibles

**Contras**:
- ❌ Overhead de HTTP
- ❌ Solo request-response
- ❌ No ideal para alta performance

**Casos de uso**: APIs públicas, comunicación simple, integraciones externas

---

### 2. gRPC (Google Remote Procedure Call)

**Descripción**: Protocolo de comunicación de alto rendimiento usando Protocol Buffers.

```protobuf
// products.proto
service ProductService {
  rpc GetProduct (ProductRequest) returns (Product);
  rpc ListProducts (Empty) returns (ProductList);
}
```

**Pros**:
- ✅ Muy rápido (Protocol Buffers binarios)
- ✅ Tipado estricto
- ✅ Soporte para streaming
- ✅ Generación de código automática

**Contras**:
- ❌ Más complejo que REST
- ❌ No compatible con navegadores sin proxy
- ❌ Debugging más difícil (binario)

**Casos de uso**: Comunicación interna entre servicios, alta performance, streaming

---

### 3. Message Queues (Colas de Mensajes)

**Descripción**: Comunicación asíncrona mediante colas de mensajes. Patrón "oficina postal".

#### RabbitMQ
```typescript
// Publicar mensaje
await channel.sendToQueue('products.created', Buffer.from(JSON.stringify(product)));

// Consumir mensaje
channel.consume('products.created', (msg) => {
  const product = JSON.parse(msg.content.toString());
  // Procesar producto
});
```

#### Apache Kafka
```typescript
// Productor
await producer.send({
  topic: 'products',
  messages: [{ value: JSON.stringify(product) }]
});

// Consumidor
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const product = JSON.parse(message.value.toString());
  }
});
```

**Pros**:
- ✅ Desacoplamiento total
- ✅ Asíncrono (no bloquea)
- ✅ Retry automático
- ✅ Orden garantizado (Kafka)
- ✅ Alta disponibilidad

**Contras**:
- ❌ Mayor complejidad
- ❌ Eventual consistency
- ❌ Debugging más difícil
- ❌ Infraestructura adicional

**Casos de uso**: Eventos de negocio, notificaciones, procesamiento en background

**Opciones populares**:
- **RabbitMQ**: Colas de mensajes tradicionales
- **Apache Kafka**: Stream de eventos de alto rendimiento
- **Apache Pulsar**: Similar a Kafka con mejoras
- **AWS Kinesis**: Servicio de streaming en AWS
- **NATS**: Ligero y rápido para microservicios

---

### 4. Event Streams (Flujo de Eventos)

**Descripción**: Múltiples servicios pueden consumir el mismo evento.

```typescript
// Publicar evento
await eventBus.publish('order.created', {
  orderId: 123,
  userId: 456,
  total: 299.99
});

// Múltiples consumidores
// Servicio de Inventario
eventBus.subscribe('order.created', async (event) => {
  await reduceStock(event.orderId);
});

// Servicio de Notificaciones
eventBus.subscribe('order.created', async (event) => {
  await sendOrderConfirmation(event.userId);
});

// Servicio de Analytics
eventBus.subscribe('order.created', async (event) => {
  await trackSale(event);
});
```

**Pros**:
- ✅ Un evento, múltiples consumidores
- ✅ Escalamiento horizontal
- ✅ Replay de eventos posible
- ✅ Event sourcing

**Contras**:
- ❌ Complejidad alta
- ❌ Eventual consistency
- ❌ Puede haber duplicados

**Casos de uso**: Event sourcing, notificaciones múltiples, analytics en tiempo real

**Opciones**:
- Apache Kafka
- Apache Pulsar
- AWS Kinesis
- NATS Streaming

---

### 5. TCP/UDP

**Descripción**: Comunicación de bajo nivel en la capa 4 del modelo OSI.

**TCP** (Transmission Control Protocol):
- ✅ Confiable y ordenado
- ✅ Garantiza entrega
- ❌ Mayor overhead

**UDP** (User Datagram Protocol):
- ✅ Muy rápido
- ✅ Bajo overhead
- ❌ No garantiza entrega

**Casos de uso**: Streaming de video, gaming online, IoT, comunicación de baja latencia

---

## Buenas Prácticas en Microservicios

### 1. Descomposición Adecuada

✅ **Haz**: Divide por dominio de negocio (Domain-Driven Design)
❌ **Evita**: Dividir por capas técnicas (controllers, services, repositories)

```
✅ Correcto:
- user-service
- product-service
- order-service
- payment-service

❌ Incorrecto:
- controller-service
- business-logic-service
- database-service
```

### 2. Responsabilidad Única

Cada microservicio debe tener **una sola responsabilidad**.

```
✅ Correcto:
- auth-service: Solo autenticación y autorización
- notification-service: Solo notificaciones

❌ Incorrecto:
- user-service: Usuarios, autenticación, notificaciones, pagos, etc.
```

### 3. Tamaño Adecuado

No hay un tamaño "correcto", pero considera:

- 🎯 **Regla de 2 pizzas**: Un equipo que puede ser alimentado con 2 pizzas (6-8 personas)
- 🎯 **Regla de 2 semanas**: Reescribir el servicio debería tomar ~2 semanas
- 🎯 **Líneas de código**: Entre 1,000 y 10,000 LOC es razonable

### 4. Escalamiento Independiente

Cada servicio debe poder escalar sin afectar otros:

```yaml
# docker-compose.yml
services:
  products-service:
    image: products:latest
    deploy:
      replicas: 1  # Tráfico normal

  orders-service:
    image: orders:latest
    deploy:
      replicas: 5  # Alto tráfico
```

### 5. Despliegues Independientes

CI/CD por servicio:

```yaml
# .github/workflows/products-service.yml
name: Deploy Products Service
on:
  push:
    paths:
      - 'products-service/**'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Products Service
        run: |
          cd products-service
          npm run build
          docker build -t products:latest .
          docker push products:latest
```

### 6. Seguridad Independiente

Cada servicio con su propia seguridad:

- 🔐 Autenticación: JWT, OAuth2, API Keys
- 🔐 Autorización: RBAC, permisos por servicio
- 🔐 Cifrado: HTTPS/TLS, cifrado de datos en reposo
- 🔐 Secrets: Variables de entorno, Vault, AWS Secrets Manager

### 7. Evitar Acoplamiento Excesivo

❌ **Mal**: Servicio A llama directamente a la base de datos de Servicio B

```typescript
// ❌ Nunca hacer esto
const products = await serviceBDatabase.query('SELECT * FROM products');
```

✅ **Bien**: Servicio A llama a la API de Servicio B

```typescript
// ✅ Correcto
const products = await fetch('http://service-b/api/products');
```

### 8. Evitar Dependencias entre Servicios

❌ **Mal**: Dependencias en cascada (A → B → C → D)

```
User Service → Product Service → Inventory Service → Warehouse Service
     ↓                                                        ↓
  Si cae, todo cae                                    Latencia acumulada
```

✅ **Bien**: Comunicación por eventos (desacoplado)

```
User Service → Event Bus ← Product Service
                ↕
           Inventory Service
```

### 9. Database per Service

Cada microservicio debe tener su propia base de datos:

```
✅ Correcto:
user-service → users_db (PostgreSQL)
product-service → products_db (MongoDB)
analytics-service → analytics_db (ClickHouse)

❌ Incorrecto:
user-service ↘
             → shared_database
product-service ↗
```

### 10. API Gateway

Usa un API Gateway como punto de entrada único:

```
Cliente Web/Mobile
       ↓
   API Gateway (puerto 80/443)
       ↓
    ┌──┴──┬──────┬──────┐
    ↓     ↓      ↓      ↓
  Users Products Orders Payments
  :3001  :3002   :3003   :3004
```

---

## Camino de Migración: Monolítico → Microservicios

### Fase 1: Monolito Modular
```
Aplicación Monolítica
├── Users Module (bien separado)
├── Products Module (bien separado)
└── Orders Module (bien separado)
```

### Fase 2: Strangler Pattern
```
                    API Gateway
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
        User Service          Monolito (Products + Orders)
```

### Fase 3: Extracción Gradual
```
                    API Gateway
                         ↓
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
    User Service  Product Service  Monolito (Orders)
```

### Fase 4: Microservicios Completos
```
                    API Gateway
                         ↓
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
    User Service  Product Service  Order Service
```

---

## Conclusión

### Usa Monolítico si:
- 🎯 Es un proyecto pequeño o MVP
- 🎯 Equipo pequeño (< 10 personas)
- 🎯 Simplicidad es prioritaria
- 🎯 Presupuesto limitado

### Usa Microservicios si:
- 🎯 Aplicación grande y compleja
- 🎯 Equipos grandes (10+ personas)
- 🎯 Necesitas escalar partes específicas
- 🎯 Alta disponibilidad es crítica
- 🎯 Despliegues frecuentes

### No existe "mejor" arquitectura
La arquitectura correcta depende de:
- Tamaño del equipo
- Complejidad del dominio
- Requisitos de escalabilidad
- Presupuesto y recursos
- Experiencia del equipo

**Recomendación**: Empieza con monolítico bien modularizado y migra a microservicios cuando realmente lo necesites. No hagas microservicios por "moda" o "hype".

---

**Recursos adicionales**:
- [Building Microservices - Sam Newman](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/)
- [Microservices Patterns - Chris Richardson](https://microservices.io/patterns/index.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
