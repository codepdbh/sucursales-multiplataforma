import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertUser(params: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  branchId?: string | null;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);

  await prisma.user.upsert({
    where: { username: params.username },
    update: {
      email: params.email,
      passwordHash,
      role: params.role,
      isActive: true,
      branchId: params.branchId ?? null,
    },
    create: {
      username: params.username,
      email: params.email,
      passwordHash,
      role: params.role,
      isActive: true,
      branchId: params.branchId ?? null,
    },
  });
}

async function main() {
  const sanPedro = await prisma.branch.upsert({
    where: { name: 'Sucursal San Pedro' },
    update: { isActive: true },
    create: { name: 'Sucursal San Pedro', isActive: true },
  });

  const cruceDeVillas = await prisma.branch.upsert({
    where: { name: 'Sucursal Cruce de Villas' },
    update: { isActive: true },
    create: { name: 'Sucursal Cruce de Villas', isActive: true },
  });

  await upsertUser({
    username: 'owner',
    email: 'owner@sistema.local',
    password: 'Owner12345!',
    role: UserRole.OWNER,
  });

  await upsertUser({
    username: 'admin1',
    email: 'admin1@sistema.local',
    password: 'Admin112345!',
    role: UserRole.ADMIN,
  });

  await upsertUser({
    username: 'admin2',
    email: 'admin2@sistema.local',
    password: 'Admin212345!',
    role: UserRole.ADMIN,
  });

  await upsertUser({
    username: 'regsp',
    email: 'regsp@sistema.local',
    password: 'RegSp12345!',
    role: UserRole.REGISTRADOR,
    branchId: sanPedro.id,
  });

  await upsertUser({
    username: 'regcv',
    email: 'regcv@sistema.local',
    password: 'RegCv12345!',
    role: UserRole.REGISTRADOR,
    branchId: cruceDeVillas.id,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
