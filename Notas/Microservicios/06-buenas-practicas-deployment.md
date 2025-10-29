# Buenas Prácticas y Deployment

## Buenas Prácticas de Desarrollo

### 1. Un Repositorio por Microservicio

```
✅ Correcto:
user-service/
product-service/
order-service/

❌ Incorrecto:
all-services/
  ├── users/
  ├── products/
  └── orders/
```

**Ventaja**: Despliegues y versioning independientes

---

### 2. Database per Service

Cada microservicio debe tener su propia base de datos.

```
✅ Correcto:
user-service → users_db
product-service → products_db
order-service → orders_db

❌ Incorrecto:
user-service ↘
product-service → shared_db
order-service ↗
```

**Ventaja**: Independencia total, sin acoplamiento de datos

---

### 3. API Gateway Pattern

Punto de entrada único para clientes externos.

```
Cliente (Web/Mobile)
        ↓
    API Gateway (:3000)
        ↓
   ┌────┼────┬────┐
   ↓    ↓    ↓    ↓
 Users Products Orders Payments
 :3001  :3002  :3003  :3004
```

**Ventajas**:
- ✅ Autenticación centralizada
- ✅ Rate limiting
- ✅ Logging unificado
- ✅ Caché centralizado

---

### 4. Circuit Breaker

Evitar fallos en cascada.

```typescript
import { timeout, retry, catchError } from 'rxjs/operators';

async getProduct(id: number) {
  return this.productsClient
    .send({ cmd: 'get_product' }, id)
    .pipe(
      timeout(3000),       // Max 3 segundos
      retry(2),            // Reintentar 2 veces
      catchError(err => {
        // Fallback
        return of({ id, name: 'N/A', available: false });
      })
    )
    .toPromise();
}
```

---

### 5. Versionado de APIs

Mantener compatibilidad hacia atrás.

```typescript
// v1
@MessagePattern({ cmd: 'get_product', version: 'v1' })
getProductV1(id: number) {
  return { id, name, price };
}

// v2 (nuevo campo)
@MessagePattern({ cmd: 'get_product', version: 'v2' })
getProductV2(id: number) {
  return { id, name, price, stock, category };
}
```

---

### 6. Health Checks

Monitorear salud de servicios.

```bash
npm install @nestjs/terminus
```

```typescript
// health.controller.ts
@Get('health')
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.microservice.pingCheck('products_ms', {
      transport: Transport.TCP,
      options: { host: 'localhost', port: 3001 }
    }),
  ]);
}
```

---

### 7. Logging Estructurado

```bash
npm install winston
```

```typescript
// logger.service.ts
import * as winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'products-ms' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Uso
logger.info('Product created', { productId: 123, userId: 456 });
logger.error('Failed to create product', { error: err.message });
```

---

### 8. Tracing Distribuido

Rastrear requests a través de múltiples servicios.

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node
```

```typescript
// tracer.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new JaegerExporter({
      serviceName: 'products-ms',
      endpoint: 'http://localhost:14268/api/traces',
    }),
  ),
);
provider.register();

export const tracer = provider.getTracer('products-ms');
```

---

## Deployment

### Docker Compose (Desarrollo)

```yaml
# docker-compose.yml
version: '3.8'

services:
  nats:
    image: nats:latest
    ports:
      - "4222:4222"
      - "8222:8222"

  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - NATS_SERVERS=nats://nats:4222
    depends_on:
      - nats
      - products-ms
      - orders-ms

  products-ms:
    build: ./products-ms
    environment:
      - NATS_SERVERS=nats://nats:4222
      - DATABASE_URL=file:./dev.db
    depends_on:
      - nats

  orders-ms:
    build: ./orders-ms
    environment:
      - NATS_SERVERS=nats://nats:4222
      - DATABASE_URL=file:./dev.db
    depends_on:
      - nats
      - products-ms
```

```bash
# Iniciar todos los servicios
docker-compose up --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

### Kubernetes (Producción)

#### Deployment

```yaml
# products-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: products-ms
spec:
  replicas: 3
  selector:
    matchLabels:
      app: products-ms
  template:
    metadata:
      labels:
        app: products-ms
    spec:
      containers:
      - name: products-ms
        image: myregistry/products-ms:1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NATS_SERVERS
          value: "nats://nats-service:4222"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service

```yaml
# products-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: products-service
spec:
  selector:
    app: products-ms
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

#### Aplicar

```bash
# Aplicar configuraciones
kubectl apply -f products-deployment.yaml
kubectl apply -f products-service.yaml

# Ver pods
kubectl get pods

# Ver logs
kubectl logs -f products-ms-xxxxx

# Escalar
kubectl scale deployment products-ms --replicas=5

# Ver estado
kubectl get deployment products-ms
```

---

### CI/CD con GitHub Actions

```yaml
# .github/workflows/products-ms.yml
name: Deploy Products MS

on:
  push:
    branches: [ main ]
    paths:
      - 'products-ms/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd products-ms
        npm ci

    - name: Run tests
      run: |
        cd products-ms
        npm test

    - name: Build
      run: |
        cd products-ms
        npm run build

    - name: Build Docker image
      run: |
        cd products-ms
        docker build -t myregistry/products-ms:${{ github.sha }} .
        docker tag myregistry/products-ms:${{ github.sha }} myregistry/products-ms:latest

    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push myregistry/products-ms:${{ github.sha }}
        docker push myregistry/products-ms:latest

    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/products-ms products-ms=myregistry/products-ms:${{ github.sha }}
        kubectl rollout status deployment/products-ms
```

---

## Monitoreo y Observabilidad

### Prometheus + Grafana

```typescript
// metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { collectDefaultMetrics, register } from 'prom-client';

collectDefaultMetrics();

@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    return register.metrics();
  }
}
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'products-ms'
    static_configs:
      - targets: ['products-ms:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

---

## Seguridad

### 1. JWT en API Gateway

```typescript
// auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
export class AppModule {}
```

---

## Checklist de Producción

- [ ] Health checks configurados
- [ ] Logging estructurado implementado
- [ ] Métricas expuestas (Prometheus)
- [ ] Tracing distribuido configurado
- [ ] Circuit breakers implementados
- [ ] Rate limiting activado
- [ ] Autenticación y autorización
- [ ] Variables de entorno (no hardcoded)
- [ ] Secrets en vault/secrets manager
- [ ] Base de datos con backups automáticos
- [ ] CI/CD pipeline configurado
- [ ] Monitoring y alertas (Grafana)
- [ ] Documentación actualizada
- [ ] Disaster recovery plan

---

## Recursos

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Kubernetes](https://kubernetes.io/docs/home/)
- [Docker](https://docs.docker.com/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [NATS](https://docs.nats.io/)
