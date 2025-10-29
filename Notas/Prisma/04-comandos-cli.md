# Comandos CLI de Prisma

## Comandos principales

### 1. Inicializar Prisma

```bash
npx prisma init
```
Crea la estructura inicial de Prisma (carpeta `prisma/` y archivo `.env`)

### 2. Generar Prisma Client

```bash
npx prisma generate
```
Genera el cliente de Prisma basándose en tu `schema.prisma`. Debes ejecutar este comando después de cualquier cambio en el schema.

### 3. Migraciones

#### Crear y aplicar una migración

```bash
npx prisma migrate dev --name nombre_de_la_migracion
```
- Crea una nueva migración basada en cambios en el schema
- Aplica la migración a la base de datos
- Genera el Prisma Client automáticamente

Ejemplo:
```bash
npx prisma migrate dev --name init
npx prisma migrate dev --name add_available_field
npx prisma migrate dev --name add_user_table
```

#### Aplicar migraciones pendientes (producción)

```bash
npx prisma migrate deploy
```
Aplica todas las migraciones pendientes sin generar nuevas.

#### Ver el estado de las migraciones

```bash
npx prisma migrate status
```

#### Resetear la base de datos

```bash
npx prisma migrate reset
```
⚠️ **CUIDADO**: Elimina toda la base de datos y aplica todas las migraciones desde cero.

### 4. Prisma Studio (Interfaz visual)

```bash
npx prisma studio
```
Abre una interfaz web en `http://localhost:5555` para:
- Ver tus datos
- Editar registros
- Crear nuevos registros
- Explorar relaciones

### 5. Formatear el schema

```bash
npx prisma format
```
Formatea el archivo `schema.prisma` con el estilo estándar.

### 6. Validar el schema

```bash
npx prisma validate
```
Verifica que tu `schema.prisma` esté correctamente escrito.

### 7. Ver la base de datos

```bash
npx prisma db pull
```
Introspecciona una base de datos existente y genera el `schema.prisma` basado en ella.

```bash
npx prisma db push
```
Sincroniza el schema con la base de datos sin crear migraciones (útil para prototipado rápido).

## Comandos útiles del proyecto

### Desarrollo

```bash
# 1. Crear la primera migración
npx prisma migrate dev --name init

# 2. Ver los datos en Prisma Studio
npx prisma studio

# 3. Después de cambiar el schema
npx prisma migrate dev --name descripcion_del_cambio

# 4. Si solo cambias el código y no el schema, regenera el cliente
npx prisma generate
```

### Producción

```bash
# Aplicar migraciones en producción
npx prisma migrate deploy

# Generar el cliente
npx prisma generate
```

## Opciones útiles

### --skip-generate
No genera el cliente después de la migración:
```bash
npx prisma migrate dev --name init --skip-generate
```

### --create-only
Crea la migración pero no la aplica:
```bash
npx prisma migrate dev --create-only --name add_user
```

### --help
Muestra ayuda para cualquier comando:
```bash
npx prisma --help
npx prisma migrate --help
npx prisma migrate dev --help
```

## Workflow típico de desarrollo

```bash
# 1. Modificar prisma/schema.prisma
# 2. Crear y aplicar migración
npx prisma migrate dev --name descripcion_cambio

# 3. Si hay errores, revisar y corregir
# 4. Ver los datos
npx prisma studio

# 5. Si necesitas empezar de cero
npx prisma migrate reset
```

## Variables de entorno

Puedes especificar un archivo .env diferente:

```bash
npx prisma migrate dev --name init --env-file .env.development
```

## Troubleshooting común

### Error: "Prisma Client not found"
```bash
npx prisma generate
```

### Error: "Environment variable not found: DATABASE_URL"
Verifica que tu archivo `.env` tenga `DATABASE_URL` definido.

### La base de datos está desincronizada
```bash
npx prisma migrate reset  # ⚠️ Elimina todos los datos
# O
npx prisma db push        # Para desarrollo rápido
```
