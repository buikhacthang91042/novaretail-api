import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(query: GetProductsQueryDto) {
    const { brandId, categoryId, search, status } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          {
            productVariants: {
              some: {
                deletedAt: null,
                OR: [
                  { sku: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                  { barcode: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      }),
    };
    const [productList, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          createdAt: true,
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          productImages: {
            where: {
              deletedAt: null,
              isPrimary: true,
            },
            select: {
              id: true,
              filePath: true,
              fileName: true,
              altText: true,
            },
            take: 1,
          },
          _count: {
            select: {
              productVariants: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const finalProductList = productList.map(
      ({ _count, productImages, ...product }) => {
        return {
          ...product,
          variantCount: _count.productVariants,
          primaryImage: productImages[0] ?? null,
        };
      },
    );
    return {
      data: finalProductList,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  }

  async createProduct(body: CreateProductDto) {
    try {
      const existingBrand = await this.prisma.brand.findFirst({
        where: {
          id: body.brandId,
          deletedAt: null,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });
      if (!existingBrand) {
        throw new NotFoundException('Brand is not existed !');
      }
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          id: body.categoryId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });
      if (!existingCategory) {
        throw new NotFoundException('Category is not existed !');
      }
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          code: body.code,
        },
        select: {
          id: true,
        },
      });
      if (existingProduct) {
        throw new ConflictException('Product code is existed !');
      }
      const newProduct = await this.prisma.product.create({
        data: {
          code: body.code,
          name: body.name,
          brandId: body.brandId,
          categoryId: body.categoryId,
          description: body.description,
        },
      });
      return { data: newProduct };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product code already exists');
      }
      throw error;
    }
  }
}
