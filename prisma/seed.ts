import 'dotenv/config'; //đọc env
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { seedProducts } from './seeds/product.seed';
import { seedRBAC } from './seeds/rbac.seed';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
}); // tạo connection pool tới Postgres SQL
const adapter = new PrismaPg(pool); //tạo adpater giúp Primsa Client giao tiếp với PostgreSQL
const prisma = new PrismaClient({
  adapter,
}); // tạo Prisma Client sử dụng connection đó

async function main() {
  await seedRBAC(prisma);
  await seedProducts(prisma);
}

main()
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  //disconnect sau khi seed
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
