import 'dotenv/config'; //đọc env
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
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

  const organization = await prisma.organization.upsert({
    where: {
      code: 'NOVA',
    },
    update: {},
    create: {
      code: 'NOVA',
      name: 'Nova Retail',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
    },
  });
  console.log('Seed Organization', organization.id);

  const branch = await prisma.branch.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'HN01',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: 'HN01',
      name: 'Nova Retail Hà Nội',
      address: '2A Hàng Bài, Thành phố Hà Nội',
    },
  });
  console.log('Seed Branch', branch.id);

  const department = await prisma.department.upsert({
    where: {
      branchId_code: {
        branchId: branch.id,
        code: 'SALE',
      },
    },
    update: {},
    create: {
      branchId: branch.id,
      code: 'SALE',
      name: 'Kinh doanh',
    },
  });
  console.log('Seed Department', department.id);

  const position = await prisma.position.upsert({
    where: {
      departmentId_code: {
        departmentId: department.id,
        code: 'SALE_STAFF',
      },
    },
    update: {},
    create: {
      departmentId: department.id,
      code: 'SALE_STAFF',
      name: 'Nhân viên kinh doanh',
      level: 1,
    },
  });
  console.log('Seed Position', position.id);

  const employee = await prisma.employee.upsert({
    where: {
      branchId_employeeCode: {
        branchId: branch.id,
        employeeCode: 'NRHN1',
      },
    },
    update: {},
    create: {
      branchId: branch.id,
      departmentId: department.id,
      positionId: position.id,
      employeeCode: 'NRHN1',
      firstName: 'Thành',
      lastName: 'Lê Văn',
      fullName: 'Lê Văn Thành',
      hireDate: new Date('2025-01-15'),
      employmentType: 'FULL_TIME',
    },
  });
  console.log('Seed Employee', employee.id);
  const passwordHash = await bcrypt.hash('1234', 10);
  const user = await prisma.user.upsert({
    where: {
      employeeId: employee.id,
    },
    update: {},
    create: {
      employeeId: employee.id,
      username: 'thanh.le',
      passwordHash,
      email: 'thanh.le@novaretail.local',
      status: 'ACTIVE',
    },
  });
  console.log('Seed User', user.id);
  const existingUserRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });

  const userRole =
    existingUserRole ??
    (await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    }));
  console.log('Seed User Role', userRole.id);
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
