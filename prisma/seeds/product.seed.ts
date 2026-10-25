import { Prisma, PrismaClient, ProductVariantStatus } from '@prisma/client';

const brandData = [
  {
    code: 'apple',
    name: 'Apple',
    description: 'Top 1 IPhone',
  },
  {
    code: 'samsung',
    name: 'Samsung',
    description: 'Top 1 Android',
  },
];
const categoryData = [
  {
    code: 'PHONE',
    name: 'Điện thoại',
    description: 'Top 1 IPhone',
  },
  {
    code: 'TABLET',
    name: 'Máy tính bảng',
    description: 'Top 1 Android',
  },
];

const productsData = [
  {
    code: 'IP17PRO',
    name: 'iPhone 17 Pro',
    categoryCode: 'PHONE',
    brandCode: 'apple',
  },
  {
    code: 'IPADPRO',
    name: 'iPad Pro',
    description: 'Top 1 Ipad',
    categoryCode: 'TABLET',
    brandCode: 'apple',
  },
  {
    code: 'S26ULTRA',
    name: 'Galaxy S26 Ultra',
    description: 'Top 1 Android',
    categoryCode: 'PHONE',
    brandCode: 'samsung',
  },
];

const productVariantsData = [
  {
    productCode: 'IP17PRO',
    sku: '0123456789',
    name: 'iPhone 17 Pro - 256GB',
    barcode: '123921830912',
    costPrice: 15000000,
    sellingPrice: 20000000,
    status: 'ACTIVE' as ProductVariantStatus,
  },
  {
    productCode: 'IP17PRO',
    sku: '0123456754',
    name: 'iPhone 17 Pro - 512GB',
    barcode: '12392183091321',
    costPrice: 20000000,
    sellingPrice: 30000000,
    status: 'ACTIVE' as ProductVariantStatus,
  },
  {
    productCode: 'IPADPRO',
    sku: '0323456789',
    name: 'iPad Pro - 256GB',
    barcode: '231432543543',
    costPrice: 7000000,
    sellingPrice: 10000000,
    status: 'ACTIVE' as ProductVariantStatus,
  },
  {
    productCode: 'S26ULTRA',
    sku: '013223456789',
    name: 'Galaxy S26 Ultra - 256GB',
    barcode: '44212312312',
    costPrice: 17000000,
    sellingPrice: 20000000,
    status: 'ACTIVE' as ProductVariantStatus,
  },
  {
    productCode: 'S26ULTRA',
    sku: '3132131231223',
    name: 'Galaxy S26 Ultra - 512GB',
    barcode: '534534443',
    costPrice: 30000000,
    sellingPrice: 35000000,
    status: 'ACTIVE' as ProductVariantStatus,
  },
];

const productImage = [
  {
    productCode: 'IP17PRO',
    filePath:
      'https://drive.google.com/file/d/1K-PT_XseFB8CBQTwKIC_tAhLhFf_i4Vl/view?usp=drive_link',
    fileName: 'iphone17pro.png',
  },
  {
    productCode: 'S26ULTRA',
    filePath:
      'https://drive.google.com/file/d/1a6sP9uaFyd1tC0ybblM-BQ8g9x-CNqUj/view?usp=drive_link',
    fileName: 'S26Ultra.png',
  },
  {
    productCode: 'IPADPRO',
    filePath:
      'https://drive.google.com/file/d/193dxD59DhLxU72seKUfZrEkmZR7wNxbo/view?usp=drive_link',
    fileName: 'ipadPro.png',
  },
];

export async function seedProducts(prisma: PrismaClient) {
  const brands: Prisma.BrandGetPayload<object>[] = [];
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: {
        code: b.code,
      },
      update: {},
      create: {
        code: b.code,
        name: b.name,
        description: b.description,
      },
    });
    brands.push(brand);
  }

  const categories: Prisma.CategoryGetPayload<object>[] = [];
  for (const c of categoryData) {
    const category = await prisma.category.upsert({
      where: {
        code: c.code,
      },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        description: c.description,
      },
    });
    categories.push(category);
  }
  const products: Prisma.ProductGetPayload<object>[] = [];
  for (const p of productsData) {
    const category = categories.find(
      (category) => category.code === p.categoryCode,
    );
    const brand = brands.find((brand) => brand.code === p.brandCode);
    if (!category) {
      throw new Error(`Category not found: ${p.categoryCode}`);
    }

    if (!brand) {
      throw new Error(`Brand not found: ${p.brandCode}`);
    }
    const product = await prisma.product.upsert({
      where: {
        code: p.code,
      },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    products.push(product);

    console.log('Seed Product', product.id);
  }

  for (const pv of productVariantsData) {
    const product = products.find((p) => p.code === pv.productCode);
    if (!product) {
      throw new Error(`Product not found: ${pv.productCode}`);
    }
    const productVariant = await prisma.productVariant.upsert({
      where: {
        sku: pv.sku,
      },
      update: {},
      create: {
        barcode: pv.barcode,
        productId: product.id,
        name: pv.name,
        costPrice: pv.costPrice,
        sellingPrice: pv.sellingPrice,
        sku: pv.sku,
        status: pv.status,
      },
    });
    console.log('Seed Product', productVariant.id);
  }

  for (const image of productImage) {
    const product = products.find((p) => p.code === image.productCode);

    if (!product) {
      throw new Error(`Product not found: ${image.productCode}`);
    }

    const existingImage = await prisma.productImage.findFirst({
      where: {
        productId: product.id,
        fileName: image.fileName,
        deletedAt: null,
      },
    });

    if (!existingImage) {
      const createdImage = await prisma.productImage.create({
        data: {
          fileName: image.fileName,
          filePath: image.filePath,
          productId: product.id,
          isPrimary: true,
        },
      });

      console.log('Seed Product Image', createdImage.id);
    } else {
      console.log('Product Image already exists', existingImage.id);
    }
  }
}
