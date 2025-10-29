# Guía Completa de Microservicios con NestJS

Documentación completa desde conceptos básicos hasta deployment en producción.

---

## 📚 Índice de Contenidos

### [00 - Monolítico vs Microservicios](./00-monolitico-vs-microservicios.md)
**Conceptos fundamentales y comparación de arquitecturas**

Aprenderás:
- ✅ ¿Qué es una arquitectura monolítica?
- ✅ ¿Qué son los microservicios?
- ✅ Ventajas y desventajas de cada enfoque
- ✅ Tipos de transporte (HTTP, gRPC, NATS, RabbitMQ, Kafka)
- ✅ Buenas prácticas de diseño
- ✅ Cuándo usar cada arquitectura

**Tiempo estimado**: 30 minutos

---

### [01 - Introducción a Microservicios con NestJS](./01-introduccion-microservicios-nestjs.md)
**NestJS y el paquete @nestjs/microservices**

Aprenderás:
- ✅ ¿Por qué NestJS para microservicios?
- ✅ Paquete @nestjs/microservices
- ✅ Arquitectura básica (Híbrida, Microservicio puro)
- ✅ Patrones de comunicación (Request-Response, Event-Based)
- ✅ Diferencias entre `send()` y `emit()`
- ✅ Configuración de clientes con Dependency Injection

**Tiempo estimado**: 45 minutos

---

### [02 - Instalación y Configuración](./02-instalacion-configuracion.md)
**Setup completo desde cero**

Aprenderás:
- ✅ Crear estructura de proyecto
- ✅ Configurar API Gateway
- ✅ Crear microservicios
- ✅ Configurar comunicación entre servicios
- ✅ Scripts de desarrollo
- ✅ Dockerizar microservicios
- ✅ Docker Compose para desarrollo local

**Tiempo estimado**: 1 hora

---

### [03 - Comunicación entre Microservicios](./03-comunicacion-microservicios.md)
**Transportes y patrones de comunicación**

Aprenderás:
- ✅ Request-Response vs Event-Based
- ✅ Transport TCP (por defecto)
- ✅ Transport NATS (recomendado producción)
- ✅ Transport RabbitMQ (colas robustas)
- ✅ Ejemplo práctico: E-commerce completo
- ✅ Circuit Breaker pattern
- ✅ Health checks

**Tiempo estimado**: 1 hora

---

### [04 - Manejo de Errores](./04-manejo-errores.md)
**Errores y excepciones en microservicios**

Aprenderás:
- ✅ RpcException vs HttpException
- ✅ Exception filters globales
- ✅ Manejo de timeouts
- ✅ Patrón Fallback
- ✅ Retry strategies
- ✅ Logging de errores
- ✅ Dead Letter Queue (DLQ)

**Tiempo estimado**: 45 minutos

---

### [05 - Patrones de Mensajería](./05-patrones-mensajeria.md)
**Patrones avanzados de comunicación**

Aprenderás:
- ✅ Request-Reply
- ✅ Fire and Forget
- ✅ Pub/Sub
- ✅ Queue Groups (NATS)
- ✅ Saga Pattern (transacciones distribuidas)
- ✅ CQRS (Command Query Responsibility Segregation)
- ✅ Event Sourcing
- ✅ Outbox Pattern

**Tiempo estimado**: 1.5 horas

---

### [06 - Buenas Prácticas y Deployment](./06-buenas-practicas-deployment.md)
**Producción y operaciones**

Aprenderás:
- ✅ Buenas prácticas de desarrollo
- ✅ Database per service
- ✅ API Gateway pattern
- ✅ Circuit Breaker
- ✅ Versionado de APIs
- ✅ Logging estructurado
- ✅ Tracing distribuido
- ✅ Deployment con Docker Compose
- ✅ Deployment con Kubernetes
- ✅ CI/CD con GitHub Actions
- ✅ Monitoreo (Prometheus + Grafana)
- ✅ Seguridad (JWT, Rate Limiting)

**Tiempo estimado**: 2 horas

---

## 🎯 Ruta de Aprendizaje Recomendada

### Nivel Principiante (Día 1-2)
1. Lee [00-monolitico-vs-microservicios.md](./00-monolitico-vs-microservicios.md)
2. Lee [01-introduccion-microservicios-nestjs.md](./01-introduccion-microservicios-nestjs.md)
3. Sigue [02-instalacion-configuracion.md](./02-instalacion-configuracion.md) y crea tu primer microservicio

**Objetivo**: Entender conceptos básicos y tener un microservicio funcionando

---

### Nivel Intermedio (Día 3-4)
4. Implementa comunicación siguiendo [03-comunicacion-microservicios.md](./03-comunicacion-microservicios.md)
5. Agrega manejo de errores con [04-manejo-errores.md](./04-manejo-errores.md)
6. Crea un proyecto real: Sistema de órdenes con 3 microservicios

**Objetivo**: Comunicación robusta entre múltiples microservicios

---

### Nivel Avanzado (Día 5-7)
7. Estudia patrones avanzados en [05-patrones-mensajeria.md](./05-patrones-mensajeria.md)
8. Implementa Saga Pattern o CQRS
9. Prepara para producción con [06-buenas-practicas-deployment.md](./06-buenas-practicas-deployment.md)
10. Despliega en Kubernetes

**Objetivo**: Arquitectura lista para producción con patrones avanzados

---

## 🛠️ Requisitos Previos

Antes de empezar, debes saber:

- ✅ JavaScript/TypeScript básico
- ✅ Node.js y npm
- ✅ NestJS básico (módulos, controladores, servicios)
- ✅ Conceptos de API REST
- ✅ Git básico

**Recomendado pero no requerido**:
- Docker y Docker Compose
- Bases de datos (PostgreSQL, MongoDB)
- Prisma ORM

---

## 📦 Stack Tecnológico

Este tutorial cubre:

| Tecnología | Uso | Alternativas |
|-----------|-----|--------------|
| **NestJS** | Framework principal | Express, Fastify |
| **TypeScript** | Lenguaje | JavaScript |
| **NATS** | Transport recomendado | RabbitMQ, Kafka |
| **Prisma** | ORM para base de datos | TypeORM, Mongoose |
| **Docker** | Contenedorización | - |
| **Kubernetes** | Orquestación | Docker Swarm |
| **Prometheus** | Métricas | Datadog, New Relic |
| **Grafana** | Visualización | Kibana |

---

## 🏗️ Proyecto de Ejemplo

A lo largo de la guía construiremos un **sistema de e-commerce** con:

```
┌─────────────────────────────────────────────────────┐
│                  API Gateway                        │
│                  (Puerto 3000)                      │
└────────────┬──────────────┬────────────┬───────────┘
             │              │            │
    ┌────────▼────────┐ ┌───▼──────┐ ┌──▼─────────┐
    │ Users Service   │ │ Products │ │  Orders    │
    │  (Puerto 3001)  │ │ Service  │ │  Service   │
    │                 │ │ (3002)   │ │  (3003)    │
    └─────────────────┘ └──────────┘ └────────────┘
```

**Funcionalidades**:
- 👤 Gestión de usuarios (registro, login)
- 📦 Catálogo de productos
- 🛒 Creación de órdenes
- 💳 Procesamiento de pagos (simulado)
- 📧 Notificaciones por email (eventos)

---

## 🔄 Flujo de una Orden (Ejemplo Completo)

```typescript
// 1. Cliente HTTP hace POST /api/orders
POST http://localhost:3000/api/orders
{
  "userId": 1,
  "productId": 5,
  "quantity": 2
}

// 2. API Gateway valida y obtiene datos
Gateway → Users Service: "¿Existe user 1?"
Gateway → Products Service: "¿Existe product 5?"

// 3. Gateway crea orden
Gateway → Orders Service: "Crear orden con estos datos"

// 4. Orders Service emite eventos
Orders Service → Products Service: EVENT "order_created" (reducir stock)
Orders Service → Users Service: EVENT "order_created" (enviar email)

// 5. Respuesta al cliente
{
  "orderId": 123,
  "total": 199.98,
  "status": "created"
}
```

---

## 📊 Arquitectura Final

```
                    Internet
                       │
                       ↓
                 Load Balancer
                       │
                       ↓
              ┌────────────────┐
              │  API Gateway   │
              │  (3 réplicas)  │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ↓             ↓             ↓
   ┌────────┐   ┌─────────┐   ┌─────────┐
   │ Users  │   │Products │   │ Orders  │
   │ (3x)   │   │  (5x)   │   │  (2x)   │
   └───┬────┘   └────┬────┘   └────┬────┘
       │             │             │
       ↓             ↓             ↓
   ┌────────┐   ┌─────────┐   ┌─────────┐
   │UserDB  │   │ProductDB│   │OrdersDB │
   └────────┘   └─────────┘   └─────────┘

           ┌──────────────────┐
           │  NATS / RabbitMQ │
           │  Message Broker  │
           └──────────────────┘
```

---

## 🎓 Certificación (Auto-evaluación)

Al terminar la guía deberías poder:

- [ ] Explicar diferencia entre monolítico y microservicios
- [ ] Crear un microservicio con NestJS desde cero
- [ ] Implementar comunicación Request-Response
- [ ] Implementar comunicación Event-Based
- [ ] Manejar errores con RpcException
- [ ] Configurar NATS como transport
- [ ] Implementar Circuit Breaker
- [ ] Implementar Saga Pattern
- [ ] Dockerizar microservicios
- [ ] Desplegar en Kubernetes
- [ ] Configurar CI/CD
- [ ] Implementar logging y monitoring

---

## 🤝 Contribuciones

Esta guía está en constante evolución. Si encuentras errores o tienes sugerencias:

1. Abre un issue describiendo el problema
2. Propón mejoras mediante pull request
3. Comparte tu experiencia en los comentarios

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NATS Documentation](https://docs.nats.io/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

### Libros Recomendados
- **Building Microservices** - Sam Newman
- **Microservices Patterns** - Chris Richardson
- **Domain-Driven Design** - Eric Evans

### Cursos y Videos
- [NestJS Official Courses](https://courses.nestjs.com/)
- [Fernando Herrera - NestJS Microservices](https://fernando-herrera.com/)

### Herramientas
- [Postman](https://www.postman.com/) - Testing de APIs
- [k6](https://k6.io/) - Load testing
- [Jaeger](https://www.jaegertracing.io/) - Distributed tracing
- [Lens](https://k8slens.dev/) - Kubernetes IDE

---

## 💡 Tips para el Éxito

1. **Empieza simple**: No intentes implementar todos los patrones de una vez
2. **Itera**: Comienza con TCP, luego migra a NATS
3. **Testea**: Escribe tests desde el inicio
4. **Documenta**: Mantén documentación actualizada
5. **Monitorea**: Implementa logging y métricas desde el día 1
6. **Practica**: La mejor forma de aprender es construyendo

---

## 🚀 Siguiente Paso

¿Listo para empezar?

👉 **[Comienza con 00 - Monolítico vs Microservicios →](./00-monolitico-vs-microservicios.md)**

---

**¡Éxito en tu journey de microservicios! 🎉**

---

*Última actualización: Noviembre 2024*
*Versión: 1.0*
*Autor: Guía para el curso de NestJS + Microservicios*
