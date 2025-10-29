# Instalación de Prisma

## ¿Qué es Prisma?

Prisma es un ORM (Object-Relational Mapping) de última generación para Node.js y TypeScript que facilita el trabajo con bases de datos mediante:
- Type-safety (seguridad de tipos)
- Auto-completado en el IDE
- Migraciones automáticas
- Cliente de base de datos generado automáticamente

## Instalación

### 1. Instalar Prisma como dependencia de desarrollo

```bash
npm install prisma --save-dev
```

### 2. Instalar Prisma Client

```bash
npm install @prisma/client
```

## Verificar instalación

Puedes verificar que Prisma se instaló correctamente con:

```bash
npx prisma --version
```

## Bases de datos soportadas

Prisma soporta múltiples bases de datos:
- PostgreSQL
- MySQL
- SQLite
- SQL Server
- MongoDB
- CockroachDB

En este proyecto estamos usando **SQLite** para desarrollo local.
