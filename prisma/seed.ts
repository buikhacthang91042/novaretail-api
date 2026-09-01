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

async function main() {
  const adminRole = await prisma.role.upsert({
    where: {
      code: 'ADMIN',
    },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Adminstator',
      description: 'System Adminstrator',
      isSystem: true,
    },
  });
  console.log('Created Role: ', adminRole.code);
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
