# Guía Completa de Prisma

Documentación completa sobre Prisma ORM para el proyecto Products Microservice.

## 📚 Índice de contenidos

### 1. [Instalación](./01-instalacion.md)
- ¿Qué es Prisma?
- Cómo instalar Prisma y Prisma Client
- Bases de datos soportadas
- Verificación de instalación

### 2. [Configuración Inicial](./02-configuracion-inicial.md)
- Inicializar Prisma en el proyecto
- Configurar variables de entorno (.env)
- Configuración del schema
- Output personalizado del cliente
- Estructura del proyecto

### 3. [Schema de Prisma](./03-schema-prisma.md)
- Estructura del archivo schema.prisma
- Componentes principales (generator, datasource, models)
- Tipos de datos comunes
- Atributos de campo (@id, @default, @unique, @updatedAt)
- Relaciones entre modelos (One-to-Many, Many-to-Many)
- Índices para optimización
- Comentarios y documentación

### 4. [Comandos CLI](./04-comandos-cli.md)
- Comandos principales de Prisma
- Generar cliente (`generate`)
- Migraciones (`migrate dev`, `migrate deploy`, `migrate status`)
- Prisma Studio (interfaz visual)
- Formatear y validar schema
- Workflow típico de desarrollo
- Troubleshooting común

### 5. [Operaciones CRUD](./05-operaciones-crud.md)
- Configuración con NestJS
- CREATE: crear registros (create, createMany, upsert)
- READ: leer registros (findMany, findUnique, findFirst, paginación)
- UPDATE: actualizar registros (update, updateMany)
- DELETE: eliminar registros (delete, soft delete)
- Contar registros
- Ejemplo completo de servicio

### 6. [Consultas Avanzadas](./06-consultas-avanzadas.md)
- Operadores de filtrado (gt, gte, lt, lte, in, notIn)
- Operadores de texto (contains, startsWith, endsWith)
- Operadores lógicos (AND, OR, NOT)
- Filtrar por relaciones
- Incluir relaciones (JOIN)
- Agregaciones (count, avg, sum, min, max)
- Group By
- Búsqueda full-text
- Transacciones
- Raw queries (SQL directo)
- Distinct

### 7. [Migraciones](./07-migraciones.md)
- ¿Qué son las migraciones?
- Workflow de migraciones
- Crear la primera migración
- Tipos de cambios (agregar, modificar, eliminar campos)
- Comandos de migración (dev vs producción)
- Problemas comunes y soluciones
- Editar migraciones manualmente
- Baseline de bases de datos existentes
- Prototyping vs Migrations
- Best practices

### 8. [Integración con NestJS](./08-integracion-nestjs.md)
- Estrategia 1: Servicio que extiende PrismaClient
- Estrategia 2: PrismaService separado
- DTOs con Prisma y class-validator
- Paginación
- Manejo de errores con interceptors
- Testing con mocks
- Variables de entorno con ConfigModule
- Logging de consultas
- Mejores prácticas

### 9. [JOINs en Profundidad](./Joins/README.md) 🔗
Guía especializada sobre JOINs con diagramas y ejemplos detallados:
- **[Concepto de JOINs](./Joins/00-concepto-joins.md)** - ¿Qué son y cómo funcionan?
- **[INNER JOIN](./Joins/01-inner-join.md)** - Solo coincidencias
- **[LEFT JOIN](./Joins/02-left-join.md)** - Todos los registros principales
- **[RIGHT JOIN](./Joins/03-right-join.md)** - Todos los registros secundarios
- **[FULL JOIN](./Joins/04-full-join.md)** - Todos los registros de ambas tablas

## 🚀 Inicio rápido

```bash
# 1. Instalar Prisma
npm install prisma --save-dev
npm install @prisma/client

# 2. Inicializar
npx prisma init

# 3. Configurar DATABASE_URL en .env
# 4. Definir modelos en schema.prisma

# 5. Crear migración inicial
npx prisma migrate dev --name init

# 6. Ver datos en Prisma Studio
npx prisma studio
```

## 📖 Orden de lectura recomendado

Para principiantes:
1. Instalación
2. Configuración Inicial
3. Schema de Prisma
4. Comandos CLI
5. Operaciones CRUD

Para desarrollo:
6. Consultas Avanzadas
7. Migraciones
8. Integración con NestJS

Para dominio avanzado:
9. JOINs en Profundidad (recomendado para entender relaciones)

## 🔗 Enlaces útiles

- [Documentación oficial de Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)

## 💡 Recursos adicionales

- **Ejemplo del proyecto**: Ver `src/products/products.service.ts`
- **Schema actual**: Ver `prisma/schema.prisma`
- **Migraciones**: Ver `prisma/migrations/`
- **Variables de entorno**: Ver `.env`
