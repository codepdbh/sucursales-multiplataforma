# Sistema Inventario y Ventas (Backend + Frontend)

Guia completa para levantar todo el proyecto en local desde cero.

## 1. Requisitos

- Node.js 20+ (recomendado 20 o 22)
- npm 10+
- Docker Desktop (con Docker Compose)

Verifica:

```bash
node -v
npm -v
docker --version
docker compose version
```

## 2. Estructura del proyecto

```text
sucursales-multiplataforma/
  backend/   # NestJS + Prisma + PostgreSQL
  frontend/  # React + Vite + TypeScript
```

## 3. Configurar Backend

### 3.1 Ir a la carpeta backend

```bash
cd backend
```

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Crear archivo de entorno

Linux/macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3.4 Levantar PostgreSQL con Docker

```bash
npm run db:up
```

### 3.5 Ejecutar migraciones y seed

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 3.6 Iniciar backend en desarrollo

```bash
npm run start:dev
```

Backend disponible en:

- API: `http://localhost:3012/api`
- Swagger: `http://localhost:3012/docs`
- Health: `http://localhost:3012/api/health`

## 4. Configurar Frontend

Abre otra terminal.

### 4.1 Ir a la carpeta frontend

Desde la raiz del repo:

```bash
cd frontend
```

### 4.2 Instalar dependencias

```bash
npm install
```

### 4.3 Crear archivo de entorno

Linux/macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

El frontend apunta por defecto a:

```env
VITE_API_URL=http://localhost:3012/api
```

### 4.4 Iniciar frontend en desarrollo

```bash
npm run dev
```

Frontend disponible en:

- `http://localhost:5173` (o el puerto que muestre Vite)

## 5. Orden recomendado para ejecutar todo

1. Levantar DB (`backend`: `npm run db:up`)
2. Correr migraciones (`backend`: `npm run prisma:migrate`)
3. Seed inicial (`backend`: `npm run prisma:seed`)
4. Levantar backend (`backend`: `npm run start:dev`)
5. Levantar frontend (`frontend`: `npm run dev`)

## 6. Credenciales iniciales (seed)

- `owner` / `Owner12345!` (OWNER)
- `admin1` / `Admin112345!` (ADMIN)
- `admin2` / `Admin212345!` (ADMIN)
- `regsp` / `RegSp12345!` (REGISTRADOR)

## 7. Comandos utiles

### Backend

```bash
npm run start:dev
npm run build
npm run test
npm run db:up
npm run db:down
npm run prisma:migrate
npm run prisma:seed
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## 8. Problemas comunes

### El backend no conecta a base de datos

- Verifica que Docker este encendido
- Revisa que `npm run db:up` este activo
- Confirma que `backend/.env` existe y tiene `DATABASE_URL` correcto

### El frontend no conecta al backend

- Verifica que backend este corriendo en `http://localhost:3012`
- Verifica `frontend/.env` con `VITE_API_URL=http://localhost:3012/api`
- Reinicia `npm run dev` en frontend si cambiaste `.env`

### Cambie schema de Prisma y falla algo

Ejecuta de nuevo:

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

## 9. Apagar servicios

- Backend/frontend: detener terminales con `Ctrl + C`
- Base de datos Docker:

```bash
cd backend
npm run db:down
```

