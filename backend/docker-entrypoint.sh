#!/bin/sh
set -eu

echo "[sucmul-backend] Aplicando migraciones..."
npx prisma migrate deploy

echo "[sucmul-backend] Ejecutando seed idempotente..."
npm run prisma:seed

echo "[sucmul-backend] Iniciando API..."
exec node dist/src/main
