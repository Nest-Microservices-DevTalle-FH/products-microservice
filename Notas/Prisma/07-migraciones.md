# Migraciones con Prisma

## ¿Qué son las migraciones?

Las migraciones son una forma de versionar los cambios en tu base de datos. Cada migración contiene:
- Los cambios SQL necesarios para actualizar el schema
- Un historial de todos los cambios realizados
- La capacidad de revertir cambios si es necesario

## Workflow de migraciones

```
1. Modificar schema.prisma
2. Crear migración: npx prisma migrate dev --name descripcion
3. Prisma genera SQL automáticamente
4. Se aplica la migración a la BD
5. Se genera el Prisma Client actualizado
```

## Crear la primera migración

```bash
# Primera migración (crea las tablas iniciales)
npx prisma migrate dev --name init
```

Esto crea:
```
prisma/
├── migrations/
│   └── 20251028172710_init/
│       └── migration.sql
└── schema.prisma
```

## Estructura de una migración

### Archivo migration.sql

```sql
-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
```

## Tipos de cambios en migraciones

### 1. Agregar un campo

**schema.prisma:**
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  description String?  // ← Campo nuevo (opcional)
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Comando:**
```bash
npx prisma migrate dev --name add_description_field
```

**SQL generado:**
```sql
-- AlterTable
ALTER TABLE "Product" ADD COLUMN "description" TEXT;
```

### 2. Modificar un campo

**schema.prisma:**
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String   @unique  // ← Ahora es único
  price       Decimal  @db.Decimal(10, 2)  // ← Cambio de Float a Decimal
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Comando:**
```bash
npx prisma migrate dev --name update_product_fields
```

### 3. Eliminar un campo

**schema.prisma:**
```prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Float
  available Boolean  @default(true)
  // ❌ Se eliminaron createdAt y updatedAt
}
```

**Comando:**
```bash
npx prisma migrate dev --name remove_timestamps
```

⚠️ **Cuidado**: Esto eliminará datos permanentemente.

### 4. Agregar un modelo (tabla)

**schema.prisma:**
```prisma
model Product {
  id        Int       @id @default(autoincrement())
  name      String
  price     Float
  categoryId Int
  category  Category  @relation(fields: [categoryId], references: [id])
}

model Category {  // ← Nuevo modelo
  id       Int       @id @default(autoincrement())
  name     String
  products Product[]
}
```

**Comando:**
```bash
npx prisma migrate dev --name add_category_model
```

## Comandos de migración

### Desarrollo

```bash
# Crear y aplicar migración
npx prisma migrate dev --name descripcion

# Crear migración sin aplicarla
npx prisma migrate dev --create-only --name descripcion

# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (⚠️ elimina todos los datos)
npx prisma migrate reset
```

### Producción

```bash
# Aplicar migraciones pendientes
npx prisma migrate deploy

# Ver estado
npx prisma migrate status

# Resolver problemas
npx prisma migrate resolve --applied "20251028172710_init"
npx prisma migrate resolve --rolled-back "20251028172710_init"
```

## Problemas comunes y soluciones

### 1. Migraciones en conflicto

**Problema**: Dos desarrolladores crean migraciones diferentes.

**Solución**:
```bash
# 1. Hacer pull de los cambios del repositorio
git pull

# 2. Resetear tu base de datos local
npx prisma migrate reset

# 3. Aplicar todas las migraciones
npx prisma migrate dev
```

### 2. Cambio que puede perder datos

**Problema**: Prisma detecta que un cambio eliminará datos.

**Ejemplo**: Cambiar un campo de `String?` (opcional) a `String` (requerido)

**Solución opción 1**: Migración en dos pasos
```bash
# Paso 1: Agregar valor por defecto
npx prisma migrate dev --name add_default_value

# Paso 2: Hacer el campo requerido
npx prisma migrate dev --name make_field_required
```

**Solución opción 2**: Migración personalizada
```bash
# Crear migración sin aplicar
npx prisma migrate dev --create-only --name custom_migration

# Editar el archivo SQL generado manualmente
# Aplicar la migración
npx prisma migrate dev
```

### 3. Base de datos desincronizada

**Problema**: Tu schema no coincide con la base de datos.

**Solución para desarrollo**:
```bash
npx prisma db push  # Sincroniza sin crear migración
```

**Solución para producción**:
```bash
npx prisma migrate deploy
```

## Editar migraciones manualmente

### 1. Crear migración sin aplicar

```bash
npx prisma migrate dev --create-only --name custom_migration
```

### 2. Editar el archivo SQL

```sql
-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL
);

-- Custom: Insert initial data
INSERT INTO "Product" ("name", "price") VALUES
  ('Laptop', 999.99),
  ('Mouse', 25.50),
  ('Keyboard', 75.00);
```

### 3. Aplicar la migración

```bash
npx prisma migrate dev
```

## Baseline de una base de datos existente

Si ya tienes una base de datos en producción:

```bash
# 1. Introspeccionar la base de datos existente
npx prisma db pull

# 2. Crear migración inicial sin aplicar
npx prisma migrate dev --create-only --name baseline

# 3. Marcar la migración como aplicada
npx prisma migrate resolve --applied "XXXXXX_baseline"
```

## Prototyping vs Migrations

### Prototyping (db push)
Para desarrollo rápido sin historial:
```bash
npx prisma db push
```
- ✅ Rápido
- ✅ No crea migraciones
- ❌ No hay historial
- ❌ No para producción

### Migrations (migrate dev)
Para cambios formales con historial:
```bash
npx prisma migrate dev --name descripcion
```
- ✅ Historial completo
- ✅ Versionable
- ✅ Para producción
- ⏱️ Más lento

## Best Practices

1. **Nombres descriptivos**: Usa nombres claros para las migraciones
   ```bash
   # ✅ Bien
   npx prisma migrate dev --name add_user_email_field

   # ❌ Mal
   npx prisma migrate dev --name update
   ```

2. **Commits atómicos**: Una migración por commit
   ```bash
   git add prisma/
   git commit -m "feat: add email field to user model"
   ```

3. **Nunca editar migraciones aplicadas**: Una vez aplicada en producción, no modificar

4. **Testing**: Probar migraciones en ambiente de staging antes de producción

5. **Backups**: Hacer backup antes de aplicar migraciones en producción
   ```bash
   # Ejemplo para PostgreSQL
   pg_dump database_name > backup.sql

   # Aplicar migración
   npx prisma migrate deploy
   ```

6. **Rollback plan**: Tener un plan de reversión
   ```sql
   -- En caso de error, tener scripts de rollback
   -- rollback_migration.sql
   ALTER TABLE "Product" DROP COLUMN "new_field";
   ```

## Ejemplo completo de workflow

```bash
# 1. Modificar schema.prisma
# (agregar campo 'stock: Int @default(0)')

# 2. Crear migración
npx prisma migrate dev --name add_stock_field

# 3. Ver el SQL generado
cat prisma/migrations/XXXXXX_add_stock_field/migration.sql

# 4. Verificar en Prisma Studio
npx prisma studio

# 5. Commit
git add prisma/
git commit -m "feat: add stock field to product"

# 6. Push
git push origin main

# 7. En producción
npx prisma migrate deploy
```
