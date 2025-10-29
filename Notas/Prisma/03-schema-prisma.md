# Schema de Prisma (schema.prisma)

## Estructura del archivo schema.prisma

El archivo `schema.prisma` es el corazón de Prisma. Contiene:
1. Configuración del generador
2. Configuración de la fuente de datos
3. Definición de modelos (tablas)

## Componentes principales

### 1. Generator (Generador)

Define cómo se genera el Prisma Client:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma/client"
}
```

- **provider**: El generador a usar (siempre `prisma-client-js` para Node.js)
- **output**: Ubicación donde se genera el cliente (opcional)

### 2. Datasource (Fuente de datos)

Define la conexión a la base de datos:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

- **provider**: Tipo de base de datos (`sqlite`, `postgresql`, `mysql`, etc.)
- **url**: URL de conexión (se obtiene de variables de entorno)

### 3. Models (Modelos)

Los modelos representan las tablas de tu base de datos:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Tipos de datos comunes

| Tipo Prisma | Descripción | Equivalente en TypeScript |
|-------------|-------------|---------------------------|
| `Int` | Número entero | `number` |
| `Float` | Número decimal | `number` |
| `String` | Texto | `string` |
| `Boolean` | Verdadero/Falso | `boolean` |
| `DateTime` | Fecha y hora | `Date` |
| `Json` | Datos JSON | `any` o tipo personalizado |

## Atributos de campo (@)

### @id
Define el campo como clave primaria:
```prisma
id Int @id @default(autoincrement())
```

### @default()
Establece un valor por defecto:
```prisma
available Boolean @default(true)
createdAt DateTime @default(now())
```

### @updatedAt
Actualiza automáticamente el campo con la fecha actual:
```prisma
updatedAt DateTime @updatedAt
```

### @unique
Garantiza que el valor sea único en la tabla:
```prisma
email String @unique
```

## Relaciones entre modelos

### One-to-Many (Uno a muchos)

```prisma
model User {
  id       Int       @id @default(autoincrement())
  name     String
  posts    Post[]    // Un usuario tiene muchos posts
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  userId   Int
  user     User   @relation(fields: [userId], references: [id])
}
```

### Many-to-Many (Muchos a muchos)

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
```

## Índices

Para mejorar el rendimiento de las consultas:

```prisma
model Product {
  id    Int    @id @default(autoincrement())
  name  String
  price Float

  @@index([name])           // Índice simple
  @@index([name, price])    // Índice compuesto
}
```

## Ejemplo completo del proyecto

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma/client"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Comentarios en schema.prisma

Puedes agregar comentarios para documentar tu schema:

```prisma
/// Modelo que representa un producto en el sistema
model Product {
  /// ID único del producto
  id          Int      @id @default(autoincrement())

  /// Nombre del producto
  name        String

  // Precio en la moneda base del sistema
  price       Float
}
```

- `///` - Comentarios de documentación (aparecen en el autocompletado)
- `//` - Comentarios regulares
