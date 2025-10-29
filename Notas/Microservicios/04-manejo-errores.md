# Manejo de Errores en Microservicios

## Problema: Errores en Microservicios

En REST usamos `HttpException`, pero en microservicios debemos usar **`RpcException`**.

### ❌ Incorrecto (HttpException en microservicio)

```typescript
// products.controller.ts (Microservicio)
@MessagePattern({ cmd: 'get_product' })
getProduct(id: number) {
  const product = this.productsService.findOne(id);

  if (!product) {
    throw new NotFoundException('Product not found'); // ❌ Error
  }

  return product;
}
```

**Problema**: El error no se serializa correctamente entre microservicios.

---

## ✅ Solución: RpcException

```typescript
import { RpcException } from '@nestjs/microservices';

// products.controller.ts (Microservicio)
@MessagePattern({ cmd: 'get_product' })
getProduct(id: number) {
  const product = this.productsService.findOne(id);

  if (!product) {
    throw new RpcException({
      message: 'Product not found',
      statusCode: 404
    });
  }

  return product;
}
```

---

## Capturar Errores en Cliente

```typescript
// orders.service.ts (Cliente)
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

async createOrder(dto: any) {
  try {
    const product = await this.productsClient
      .send({ cmd: 'get_product' }, dto.productId)
      .pipe(
        catchError((error) => {
          console.error('Error from microservice:', error);

          // Transformar RpcException a HttpException
          if (error.statusCode === 404) {
            throw new NotFoundException(error.message);
          }

          throw new BadRequestException('Error communicating with products service');
        })
      )
      .toPromise();

    return product;
  } catch (error) {
    throw error;
  }
}
```

---

## Exception Filter Global (Microservicio)

Capturar todos los errores en un solo lugar.

```typescript
// rpc-exception.filter.ts
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    const error = exception.getError();

    console.error('RpcException caught:', error);

    // Retornar error estructurado
    return throwError(() => ({
      statusCode: error['statusCode'] || 500,
      message: error['message'] || 'Internal server error',
      timestamp: new Date().toISOString(),
    }));
  }
}
```

### Aplicar globalmente

```typescript
// main.ts (Microservicio)
import { NestFactory } from '@nestjs/core';
import { ExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: { port: 3001 },
  });

  // Aplicar filtro global
  app.useGlobalFilters(new ExceptionFilter());

  await app.listen();
}
bootstrap();
```

---

## Manejo de Timeouts

```typescript
// orders.service.ts
import { timeout, retry, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

async createOrder(dto: any) {
  const product = await this.productsClient
    .send({ cmd: 'get_product' }, dto.productId)
    .pipe(
      timeout(5000), // 5 segundos máximo
      retry(2), // Reintentar 2 veces
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          console.error('Timeout: Products service not responding');
          throw new RequestTimeoutException('Products service timeout');
        }
        throw error;
      })
    )
    .toPromise();

  return product;
}
```

---

## Patrón Fallback

Proporcionar valor por defecto cuando falla.

```typescript
async createOrder(dto: any) {
  const product = await this.productsClient
    .send({ cmd: 'get_product' }, dto.productId)
    .pipe(
      timeout(5000),
      catchError((error) => {
        console.warn('Using fallback product data');

        // Retornar valor por defecto
        return of({
          id: dto.productId,
          name: 'Product (cached)',
          price: 0,
          available: false
        });
      })
    )
    .toPromise();

  if (!product.available) {
    throw new BadRequestException('Product not available');
  }

  // Continuar con lógica
}
```

---

## Logging de Errores

```typescript
// logger.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToRpc();
    const data = ctx.getData();

    this.logger.log(`Incoming message: ${JSON.stringify(data)}`);

    return next.handle().pipe(
      tap((response) => {
        this.logger.log(`Response: ${JSON.stringify(response)}`);
      }),
      catchError((error) => {
        this.logger.error(`Error: ${error.message}`, error.stack);
        return throwError(() => error);
      })
    );
  }
}

// Aplicar globalmente en main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## Dead Letter Queue (DLQ)

Con RabbitMQ, enviar mensajes fallidos a cola especial.

```typescript
// main.ts
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'products_queue',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'dlx',
      deadLetterRoutingKey: 'products_dlq',
    },
  },
});
```

---

## Resumen

### Errores en Microservicios

| Tipo | Uso |
|------|-----|
| `RpcException` | Errores dentro del microservicio |
| `HttpException` | Errores en API Gateway (hacia cliente HTTP) |

### Estrategias de Manejo

| Estrategia | Uso |
|-----------|-----|
| **Retry** | Reintentar operación fallida |
| **Timeout** | Evitar esperas infinitas |
| **Fallback** | Valor por defecto cuando falla |
| **Circuit Breaker** | Evitar fallos en cascada |
| **DLQ** | Cola de mensajes fallidos |

**Regla de oro**: Nunca dejes que un error en un microservicio tumbe todo el sistema.
