# Backend de Inventario y Ventas

Backend con NestJS, Prisma y PostgreSQL para gestionar inventario, ventas, sucursales, usuarios, auditoría y reportes. Está preparado para desarrollo local, integración posterior con un frontend React y ejecución en Windows.

Importante:
- Solo PostgreSQL corre en Docker.
- El backend NestJS corre localmente fuera de Docker.
- La API usa el prefijo global `/api`.
- Swagger está disponible en `/docs`.

## Tecnologías usadas

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL 16
- JWT + Passport
- class-validator + class-transformer
- bcrypt
- Swagger con `@nestjs/swagger`
- Multer para carga de archivos

## Funcionalidades incluidas

- Login por `username` o `email`
- JWT Bearer con endpoint `me`
- Roles: `OWNER`, `ADMIN`, `REGISTRADOR`
- Sucursales, usuarios, marcas y productos
- Foto de producto guardada en `uploads/products`
- Importación de productos por CSV
- Entradas y salidas de inventario
- Ventas con transacción Prisma
- Ventana de corrección de ventas
- Reportes de liquidación diaria, semanal y mensual
- Auditoría de acciones sensibles
- Health check
- Swagger UI

## Requisitos previos

Instalar en el equipo:

- Node.js 20 o superior
- npm 10 o superior
- Docker Desktop
- Git opcional, si se va a clonar el proyecto

Verificación rápida:

```powershell
node -v
npm -v
docker --version
docker compose version
```

## Cómo clonar o copiar el proyecto

Si usas Git:

```powershell
git clone <URL_DEL_REPOSITORIO>
cd sucursales-multiplataforma\backend
```

Si copias la carpeta manualmente:

```powershell
cd ruta\al\proyecto\backend
```

## Instalación paso a paso

### 1. Instalar dependencias

```powershell
npm install
```

### 2. Crear el archivo `.env`

PowerShell:

```powershell
Copy-Item .env.example .env
```

CMD:

```bat
copy .env.example .env
```

Contenido esperado:

```env
PORT=3011
NODE_ENV=development
DATABASE_URL=postgresql://inventory_user:inventory_pass_2026@localhost:55439/inventory_db?schema=public
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=1d
UPLOAD_DIR=uploads
APP_URL=http://localhost:3011
FRONTEND_URL=http://localhost:5177
```

### 3. Levantar PostgreSQL en Docker

```powershell
npm run db:up
```

Datos de la base:

- Contenedor: `postgres_inventory`
- Puerto host: `55439`
- Base de datos: `inventory_db`
- Usuario: `inventory_user`
- Password: `inventory_pass_2026`

Para detener la base:

```powershell
npm run db:down
```

### 4. Ejecutar migraciones Prisma

```powershell
npm run prisma:migrate
```

### 5. Ejecutar el seed inicial

```powershell
npm run prisma:seed
```

### 6. Iniciar el backend en desarrollo

```powershell
npm run start:dev
```

Accesos locales:

- API: `http://localhost:3011/api`
- Swagger UI: `http://localhost:3011/docs`
- OpenAPI JSON: `http://localhost:3011/docs-json`
- Health: `http://localhost:3011/api/health`

## Credenciales iniciales de prueba

Usuarios del seed:

- `owner` / `Owner12345!` / `OWNER`
- `admin1` / `Admin112345!` / `ADMIN`
- `admin2` / `Admin212345!` / `ADMIN`
- `regsp` / `RegSp12345!` / `REGISTRADOR`

Sucursales iniciales:

- `Sucursal San Pedro`
- `Sucursal Cruce de Villas`

El usuario `regsp` queda asociado a `Sucursal San Pedro`.

## Reglas de acceso importantes

- `OWNER` tiene acceso total y sensible.
- `ADMIN` puede operar productos, inventario, ventas y registradores.
- `REGISTRADOR` trabaja con su sucursal asignada desde el JWT.
- Si un `REGISTRADOR` envía `branchId` en ventas o inventario, el backend ignora ese valor y usa el `branchId` del token.
- Solo `OWNER` puede habilitar la corrección de ventas.
- Los reportes de liquidación son solo para `OWNER`.

## Uso de Swagger

Swagger ya está configurado con Bearer JWT.

Flujo sugerido:

1. Abrir `http://localhost:3011/docs`
2. Ejecutar `POST /api/auth/login`
3. Copiar el `accessToken`
4. Pulsar `Authorize`
5. Pegar el token Bearer

## Importación CSV

Endpoint:

```text
POST /api/products/import/csv
```

Formato mínimo recomendado:

```csv
Marca,producto,cantidad,precio,barcode,requiresWeight,siatEnabled
Coca-Cola,Coca-Cola 2L,10,15.50,1234567890123,false,true
Pil,Leche Entera 1L,20,8.00,,false,false
```

Notas:

- Para `OWNER` y `ADMIN`, se debe enviar `branchId`.
- Si la marca no existe, se crea automáticamente.
- Si el producto no existe, se crea automáticamente.
- Si `cantidad` es mayor a 0, también actualiza stock y registra movimiento `IN`.

## Estructura general del proyecto

```text
backend/
  src/
    common/
    config/
    prisma/
    modules/
      auth/
      users/
      branches/
      brands/
      products/
      inventory/
      sales/
      reports/
      audit-log/
      health/
    app.module.ts
    main.ts
  prisma/
    schema.prisma
    seed.ts
    migrations/
  uploads/
    products/
  test/
  .env.example
  docker-compose.yml
  README.md
```

## Scripts disponibles

```powershell
npm run start
npm run start:dev
npm run build
npm run format
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run db:up
npm run db:down
npm run test
npm run test:e2e
```

## Cómo llevarlo a otro PC

1. Copiar o clonar la carpeta `backend`
2. Instalar Node.js, npm y Docker Desktop
3. Ejecutar `npm install`
4. Crear `.env` desde `.env.example`
5. Levantar PostgreSQL con `npm run db:up`
6. Ejecutar `npm run prisma:migrate`
7. Ejecutar `npm run prisma:seed`
8. Iniciar el backend con `npm run start:dev`

Mientras los puertos `3011` y `55439` estén libres, no deberías cambiar nada.

## Integración futura con React

- La API ya expone JWT Bearer.
- El prefijo base es `/api`.
- Swagger deja visible el contrato inicial.
- Los archivos subidos quedan disponibles bajo `/uploads/...`.
- El backend está modularizado para crecer sin acoplarse al frontend.

## Problemas comunes

### Docker no inicia PostgreSQL

- Verifica que Docker Desktop esté abierto.
- Revisa si el puerto `55439` está ocupado.
- Ejecuta `docker compose ps`.

### Prisma no conecta

- Revisa que `.env` exista dentro de `backend`.
- Verifica que `DATABASE_URL` use `localhost:55439`.
- Confirma que el contenedor esté arriba antes de correr migraciones.

### El backend no arranca

- Ejecuta `npm install` nuevamente si faltan dependencias.
- Verifica que el puerto `3011` no esté ocupado.
- Revisa que el `.env` tenga todas las variables requeridas.

### Swagger abre, pero fallan endpoints protegidos

- Haz login en `POST /api/auth/login`.
- Autoriza el token en Swagger.
- Verifica que el usuario tenga el rol requerido.

## Observación final

La integración real con SIAT no está implementada. El sistema ya conserva `siatEnabled` en productos, `siatStatus` en ventas y un servicio stub para completar esa integración más adelante sin bloquear el desarrollo actual.
