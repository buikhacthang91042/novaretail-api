import 'dotenv/config'; //đọc env
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
}); // tạo connection pool tới Postgres SQL
const adapter = new PrismaPg(pool); //tạo adpater giúp Primsa Client giao tiếp với PostgreSQL
const prisma = new PrismaClient({
  adapter,
}); // tạo Prisma Client sử dụng connection đó

const permissions = [
  {
    code: 'product.read',
    permissionGroup: 'PRODUCT',
    module: 'product',
    action: 'read',
    name: 'View products',
    description: 'Allow viewing products',
    isSystem: true,
  },
  {
    code: 'product.create',
    permissionGroup: 'PRODUCT',
    module: 'product',
    action: 'create',
    name: 'Create products',
    description: 'Allow creating products',
    isSystem: true,
  },
  {
    code: 'product.update',
    permissionGroup: 'PRODUCT',
    module: 'product',
    action: 'update',
    name: 'Update products',
    description: 'Allow updating products',
    isSystem: true,
  },
];

async function main() {
  const adminRole = await prisma.role.upsert({
    where: {
      code: 'ADMIN',
    },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Administrator',
      description: 'System Administrator',
      isSystem: true,
    },
  });
  console.log('Created Role: ', adminRole.code);
  for (const permission of permissions) {
    const result = await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {},
      create: permission,
    });

    const resultPermission = await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: result.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: result.id,
      },
    });
    console.log('resultPermission: ', resultPermission.id);
    console.log('Created Permission: ', result.code);
  }
}

//disconnect sau khi seed
main()
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
