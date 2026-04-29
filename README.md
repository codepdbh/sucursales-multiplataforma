# Sistema Inventario y Ventas (Backend + Frontend)

Guia completa para levantar el proyecto en local y desplegarlo en una VPS.

## 1. Requisitos

- Node.js 20+ (recomendado 20 o 22)
- npm 10+
- Docker Desktop con Docker Compose para desarrollo local
- PostgreSQL 15+ para produccion en VPS

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

## 3. Configurar Backend en local

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

## 4. Configurar Frontend en local

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
- `regsp` / `RegSp12345!` (REGISTRADOR - Sucursal San Pedro)
- `regcv` / `RegCv12345!` (REGISTRADOR - Sucursal Cruce de Villas)

El seed es idempotente: puedes ejecutarlo de nuevo y actualizara/creara estos usuarios sin duplicarlos.

## 7. Despliegue en VPS (Ubuntu + PostgreSQL + PM2 + Nginx)

Esta guia asume Ubuntu 22.04/24.04, un dominio apuntando a la VPS y el proyecto clonado en `/var/www/sucursales-multiplataforma`.

### 7.1 Instalar paquetes base

```bash
sudo apt update
sudo apt install -y git curl nginx postgresql postgresql-contrib
```

Instala Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 7.2 Crear base de datos PostgreSQL

```bash
sudo -u postgres psql
```

Dentro de `psql`:

```sql
CREATE USER inventory_user WITH PASSWORD 'cambia_esta_clave_segura';
CREATE DATABASE inventory_db OWNER inventory_user;
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
\q
```

### 7.3 Clonar proyecto

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone TU_REPOSITORIO_GIT sucursales-multiplataforma
cd sucursales-multiplataforma
```

### 7.4 Configurar backend

```bash
cd /var/www/sucursales-multiplataforma/backend
cp .env.example .env
nano .env
```

Ejemplo de `.env` para produccion:

```env
PORT=3012
NODE_ENV=production
DATABASE_URL=postgresql://inventory_user:cambia_esta_clave_segura@localhost:5432/inventory_db?schema=public
JWT_SECRET=cambia_este_jwt_por_un_valor_largo_y_seguro
JWT_EXPIRES_IN=1d
UPLOAD_DIR=uploads
APP_URL=https://tudominio.com
FRONTEND_URL=https://tudominio.com
```

Instala, migra, siembra y compila:

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Levanta backend con PM2:

```bash
pm2 start npm --name sucursales-backend -- run start:prod
pm2 save
pm2 startup
```

Comprueba:

```bash
curl http://localhost:3012/api/health
```

### 7.5 Configurar frontend

```bash
cd /var/www/sucursales-multiplataforma/frontend
cp .env.example .env
nano .env
```

Para servir todo por el mismo dominio con Nginx:

```env
VITE_API_URL=https://tudominio.com/api
```

Compila:

```bash
npm ci
npm run build
```

### 7.6 Configurar Nginx

Crea el sitio:

```bash
sudo nano /etc/nginx/sites-available/sucursales
```

Contenido sugerido:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/sucursales-multiplataforma/frontend/dist;
    index index.html;

    client_max_body_size 20m;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3012/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:3012/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3012/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activa el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/sucursales /etc/nginx/sites-enabled/sucursales
sudo nginx -t
sudo systemctl reload nginx
```

### 7.7 HTTPS con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### 7.8 Actualizar una VPS ya desplegada

```bash
cd /var/www/sucursales-multiplataforma
git pull

cd backend
npm ci
npx prisma migrate deploy
npm run build
pm2 restart sucursales-backend

cd ../frontend
npm ci
npm run build
sudo systemctl reload nginx
```

## 8. Gitignore y archivos que no deben subirse

El repo incluye `.gitignore` para ignorar:

- `node_modules/`
- `dist/`
- `.env` y secretos
- `coverage/`
- uploads reales
- ruido de sistema/editor

Si `node_modules` o `dist` ya aparecen trackeados por Git, el `.gitignore` no los elimina automaticamente del indice. Antes de hacer commit puedes limpiar el indice sin borrar archivos locales:

```bash
git rm -r --cached backend/node_modules frontend/node_modules backend/dist frontend/dist
git rm --cached backend/.env frontend/.env 2>/dev/null || true
git add .gitignore
```

## 9. Comandos utiles

### Backend

```bash
npm run start:dev
npm run build
npm run start:prod
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

## 10. Problemas comunes

### El backend no conecta a base de datos

- Verifica que PostgreSQL o Docker esten encendidos
- Revisa que `backend/.env` exista
- Confirma que `DATABASE_URL` tenga usuario, password, host, puerto y base correctos

### El frontend no conecta al backend

- En local verifica que backend corra en `http://localhost:3012`
- En VPS verifica `frontend/.env` con `VITE_API_URL=https://tudominio.com/api`
- Recompila el frontend despues de cambiar `.env`: `npm run build`

### Cambie schema de Prisma y falla algo

En desarrollo:

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

En VPS:

```bash
cd backend
npx prisma migrate deploy
npm run prisma:generate
pm2 restart sucursales-backend
```

## 11. Apagar servicios locales

- Backend/frontend: detener terminales con `Ctrl + C`
- Base de datos Docker:

```bash
cd backend
npm run db:down
```
