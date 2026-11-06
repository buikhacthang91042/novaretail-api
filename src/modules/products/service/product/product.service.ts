import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetProductsQueryDto } from '../../dto/product/get-products-query.dto';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from '../../dto/product/create-product.dto';
import { UpdateProductDto } from '../../dto/product/update-product.dto';

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
          organizationId: '',
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

  async getDetailProduct(id: string) {
    const productDetail = await this.prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        status: true,
        brand: {
          select: {
            name: true,
            id: true,
          },
        },
        category: {
          select: {
            name: true,
            id: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!productDetail) {
      throw new NotFoundException('Product not found');
    }
    return {
      data: productDetail,
    };
  }

  async updateProduct(id: string, body: UpdateProductDto) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          code: true,
          name: true,
          brand: {
            select: {
              id: true,
            },
          },
          category: {
            select: {
              id: true,
            },
          },
          deletedAt: true,
        },
      });

      if (!existingProduct) {
        throw new NotFoundException('Product not found !');
      }

      if (existingProduct.deletedAt !== null) {
        throw new NotFoundException('Product has been deleted !');
      }
      const [existingProductCode, existingBrands, existingCategory] =
        await Promise.all([
          body.code !== undefined
            ? this.prisma.product.findFirst({
                where: {
                  AND: [{ code: body.code }, { id: { not: id } }],
                },
                select: {
                  id: true,
                  code: true,
                },
              })
            : null,
          body.brandId
            ? this.prisma.brand.findFirst({
                where: {
                  id: body.brandId,
                  status: 'ACTIVE',
                  deletedAt: null,
                },
                select: {
                  id: true,
                },
              })
            : null,
          body.categoryId
            ? this.prisma.category.findFirst({
                where: {
                  id: body.categoryId,
                  status: 'ACTIVE',
                  deletedAt: null,
                },
                select: {
                  id: true,
                },
              })
            : null,
        ]);

      if (existingProductCode) {
        throw new ConflictException('Product code is existed !');
      }

      if (body.brandId && !existingBrands) {
        throw new BadRequestException('Brand is not existed or inactived !');
      }

      if (body.categoryId && !existingCategory) {
        throw new BadRequestException('Category is not existed or inactived !');
      }

      const fieldChanges = {
        ...(body.brandId !== undefined &&
          body.brandId !== existingProduct.brand.id && {
            brandId: body.brandId,
          }),
        ...(body.categoryId !== undefined &&
          body.categoryId !== existingProduct.category.id && {
            categoryId: body.categoryId,
          }),
        ...(body.code !== undefined &&
          body.code !== existingProduct.code && {
            code: body.code,
          }),
        ...(body.name !== undefined &&
          body.name !== existingProduct.name && {
            name: body.name,
          }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
      };

      if (Object.keys(fieldChanges).length === 0) {
        return {
          data: await this.getDetailProduct(id).then((res) => res.data),
        };
      }

      const updateProduct = await this.prisma.product.update({
        where: {
          id,
        },
        data: fieldChanges,
      });
      return {
        data: updateProduct,
      };
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

  async deleteProduct(id: string) {
    const result = await this.prisma.product.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Product not found');
    } else {
      return {
        message: 'Delete product successfully !',
      };
    }
  }
}
