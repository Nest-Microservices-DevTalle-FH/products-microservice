# Configuración Inicial de Prisma

## Inicializar Prisma

Para inicializar Prisma en tu proyecto:

```bash
npx prisma init
```

Este comando crea:
- 📁 `prisma/` - Carpeta con el archivo `schema.prisma`
- 📄 `.env` - Archivo para variables de entorno (si no existe)

## Configuración de la Base de Datos

### Variables de Entorno (.env)

Agrega la URL de conexión a tu base de datos en el archivo `.env`:

```env
# Para SQLite (base de datos local en archivo)
DATABASE_URL="file:./dev.db"

# Para PostgreSQL
# DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_db"

# Para MySQL
# DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_db"
```

### Configuración del Schema

En el archivo `prisma/schema.prisma`, configura el proveedor de base de datos:

```prisma
datasource db {
  provider = "sqlite"  // Puede ser: postgresql, mysql, sqlserver, mongodb
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma/client"  // Opcional: ubicación personalizada del cliente
}
```

## Output personalizado del cliente

En este proyecto, el Prisma Client se genera en una ubicación personalizada:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma/client"
}
```

Esto permite importar el cliente desde:
```typescript
import { PrismaClient } from 'generated/prisma/client';
```

## Estructura del proyecto

```
proyecto/
├── prisma/
│   ├── schema.prisma       # Definición del esquema de la base de datos
│   └── migrations/         # Historial de migraciones (se crea después)
├── generated/
│   └── prisma/
│       └── client/         # Cliente de Prisma generado
├── .env                    # Variables de entorno
└── dev.db                  # Base de datos SQLite (se crea con la migración)
```
