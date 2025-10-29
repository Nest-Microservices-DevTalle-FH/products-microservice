# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Products microservice built with NestJS and Prisma ORM, part of a larger microservices architecture course (Nest-Microservicios-Fernando-Herrera). The service manages product operations with a REST API and SQLite database.

## Common Commands

### Development
```bash
npm run start:dev          # Start in watch mode for development
npm run start              # Start application
npm run start:prod         # Start in production mode
npm run build              # Build the application
```

### Database (Prisma)
```bash
npx prisma migrate dev --name <description>   # Create and apply migration
npx prisma migrate deploy                     # Apply migrations in production
npx prisma generate                           # Generate Prisma Client
npx prisma studio                             # Open Prisma Studio (database GUI)
npx prisma db push                            # Sync schema without migration (prototyping)
```

### Testing
```bash
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
```

### Code Quality
```bash
npm run lint               # Run ESLint and auto-fix issues
npm run format             # Format code with Prettier
```

### Generate Resources
```bash
nest g res <name> --no-spec    # Generate a new CRUD resource without test files
```

## Architecture

### Application Structure
- **src/main.ts**: Application entry point, bootstraps NestJS on port 3001 (configurable via .env)
- **src/app.module.ts**: Root module importing ProductsModule
- **src/products/**: Products feature module (controller, service, DTOs)
- **src/common/**: Shared utilities and DTOs (pagination)
- **src/config/envs.ts**: Environment variable validation with joi

### Database Integration (Prisma)

**Prisma Setup**:
- Database: SQLite (`dev.db`)
- Schema location: `prisma/schema.prisma`
- Client output: `generated/prisma/client` (custom location)
- Migrations: `prisma/migrations/`

**Service Pattern**: ProductsService extends PrismaClient directly (src/products/products.service.ts:13)
- Implements `OnModuleInit` to connect to database on startup
- Direct access to `this.product` for database operations
- This pattern is simple but couples service to Prisma (suitable for small projects)

**Database Schema**:
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([available])
}
```

**Important Database Behaviors**:
1. **Soft Delete**: The `remove()` method sets `available = false` instead of deleting records
2. **Filtering**: `findAll()` and `findOne()` only return products where `available = true`
3. **Pagination**: Uses skip/take pattern with metadata (page, total, lastPage)

### Key Architectural Patterns

**Global Validation Pipe** (src/main.ts:9-14):
- `whitelist: true` - Strips properties not defined in DTOs
- `forbidNonWhitelisted: true` - Throws errors for unexpected properties
- Applies to all incoming requests automatically

**Environment Configuration** (src/config/envs.ts):
- Uses dotenv + joi for validation at startup
- Required variables: `PORT`, `DATABASE_URL`
- Validates types and throws error if configuration is invalid
- Exports type-safe `envs` object

**DTO Validation**:
- **CreateProductDto**: Validates name (string) and price (number, min 0, max 4 decimals)
- **UpdateProductDto**: Uses PartialType (all fields optional)
- **PaginationDto**: Validates page and limit (positive numbers, optional, auto-transformed)
- Uses class-validator decorators + class-transformer @Type for automatic type conversion

**Common Module Pattern**:
- Shared utilities exported via barrel file (src/common/index.ts)
- PaginationDto is reusable across multiple resources
- Import from `src/common` instead of deep imports

### Products Module Flow

1. **Request** → ProductsController (handles HTTP)
2. **Controller** → ProductsService (business logic + database)
3. **Service** → Prisma Client (database operations)
4. **Response** ← Formatted data with proper HTTP status

**Pagination Response Format**:
```typescript
{
  data: Product[],
  meta: {
    page: number,
    total: number,
    lastPage: number
  }
}
```

## Environment Variables

Required in `.env`:
- `PORT`: Server port (default: 3001)
- `DATABASE_URL`: Database connection string (e.g., `file:./dev.db` for SQLite)

## Documentation

The project includes extensive Prisma documentation in `Notas/Prisma/`:
- Installation and setup
- Schema definition
- CLI commands
- CRUD operations
- Advanced queries
- Migrations
- NestJS integration
- **JOINs** (with SQL examples): `Notas/Prisma/Joins/` contains detailed guides on INNER, LEFT, RIGHT, and FULL JOINs with multiple table examples

Refer to these guides when working with database operations or learning Prisma patterns.

## Important Notes

- This is a learning project from a microservices course
- Uses SQLite for simplicity (consider PostgreSQL/MySQL for production)
- Prisma Client is generated in custom location: `generated/prisma/client`
- The service pattern (extending PrismaClient) is simple but not ideal for large projects
- Soft delete pattern prevents data loss but requires filtering in all queries
- Port 3001 (not default 3000) to avoid conflicts with other microservices
