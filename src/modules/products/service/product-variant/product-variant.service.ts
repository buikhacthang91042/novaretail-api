import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateProductVariantDto } from '../../dto/product-variant/create-product-variant.dto';
import {
  Prisma,
  PurchaseOrderStatus,
  SalesOrderStatus,
  StockAdjustmentStatus,
  StockTransferStatus,
} from '@prisma/client';
import { GetProductVariantQueryDto } from '../../dto/product-variant/get-product-variant-query.dto';
import {
  ExistingVariantAttribute,
  UpdateProductVariantDto,
} from '../../dto/product-variant/update-product-variant.dto';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductVariantList(query: GetProductVariantQueryDto) {
    const { productId, search, status } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ProductVariantWhereInput = {
      deletedAt: null,
      ...(productId && { productId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            barcode: { contains: search, mode: 'insensitive' },
          },
          { sku: { contains: search, mode: 'insensitive' } },
          {
            productVariantAttributes: {
              some: {
                deletedAt: null,
                attribute: {
                  deletedAt: null,
                  code: { contains: search, mode: 'insensitive' },
                },
                value: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };
    const [productVariantList, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        select: {
          id: true,
          name: true,
          barcode: true,
          sku: true,
          status: true,
          costPrice: true,
          sellingPrice: true,
          createdAt: true,
          productVariantAttributes: {
            select: {
              attribute: {
                select: {
                  name: true,
                },
              },
              value: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.productVariant.count({ where }),
    ]);
    return {
      data: productVariantList,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  }

  async getProductVariantDetail(id: string) {
    const productVariantDetail = await this.prisma.productVariant.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        productId: true,
        sku: true,
        barcode: true,
        costPrice: true,
        sellingPrice: true,
        status: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        productVariantAttributes: {
          where: {
            deletedAt: null,
            attribute: {
              deletedAt: null,
            },
          },
          select: {
            attribute: {
              select: {
                name: true,
                code: true,
              },
            },
            value: true,
          },
        },
        stocks: {
          select: {
            quantity: true,
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!productVariantDetail) {
      throw new NotFoundException('Product Variant Not Found !');
    }
    return {
      data: productVariantDetail,
    };
  }

  async createProductVariant(body: CreateProductVariantDto) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: {
          id: body.productId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      });
      if (!existingProduct) {
        throw new NotFoundException('Product Not Found');
      }

      const existingSku = await this.prisma.productVariant.findUnique({
        where: {
          sku: body.sku,
        },
      });
      if (existingSku) {
        throw new ConflictException('SKU already exists !');
      }
      if (body.barcode) {
        const existingBarcode = await this.prisma.productVariant.findUnique({
          where: {
            barcode: body.barcode,
          },
        });
        if (existingBarcode) {
          throw new ConflictException('Barcode Is Existed !');
        }
      }
      if (body.attributes) {
        const listAttributeId: string[] = [];
        for (const attribute of body.attributes) {
          if (listAttributeId.includes(attribute.attributeId)) {
            throw new BadRequestException('Duplicate Attribute In Request');
          }
          listAttributeId.push(attribute.attributeId);
          const existingAttribute =
            await this.prisma.productAttribute.findUnique({
              where: {
                id: attribute.attributeId,
                deletedAt: null,
              },
            });
          if (!existingAttribute)
            throw new BadRequestException('Attribute Not Found');
        }
      }
      const createdProductVariant = await this.prisma.productVariant.create({
        data: {
          name: body.name,
          sku: body.sku,
          barcode: body.barcode,
          costPrice: body.costPrice,
          sellingPrice: body.sellingPrice,
          productId: body.productId,
          productVariantAttributes: {
            create: (body.attributes ?? []).map((attribute) => ({
              attributeId: attribute.attributeId,
              value: attribute.value,
            })),
          },
        },
        include: {
          productVariantAttributes: true,
        },
      });
      return {
        data: createdProductVariant,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product Variant already existed');
      }
      throw error;
    }
  }

  async updateProductVariant(id: string, body: UpdateProductVariantDto) {
    try {
      const existedProductVariant = await this.prisma.productVariant.findUnique(
        {
          where: {
            id,
            deletedAt: null,
          },
        },
      );
      if (!existedProductVariant) {
        throw new NotFoundException('Product Variant Not Found !');
      }

      const [existingSku, existingBarcode, existingAttribute] =
        await Promise.all([
          body.sku !== undefined
            ? this.prisma.productVariant.findFirst({
                where: {
                  sku: body.sku,
                  id: { not: id },
                  deletedAt: null,
                },
                select: {
                  id: true,
                },
              })
            : null,
          body.barcode !== undefined && body.barcode !== null
            ? this.prisma.productVariant.findFirst({
                where: {
                  id: { not: id },
                  deletedAt: null,
                  AND: [{ barcode: { not: null } }, { barcode: body.barcode }],
                },
              })
            : null,
          body.attributes !== undefined
            ? this.prisma.productVariantAttribute.findMany({
                where: {
                  variantId: id,
                },
                select: {
                  id: true,
                  attributeId: true,
                  value: true,
                  deletedAt: true,
                },
              })
            : null,
        ]);
      if (existingSku) {
        throw new ConflictException('Sku Already Existed !');
      }
      if (existingBarcode) {
        throw new ConflictException('Barcode Already Existed !');
      }
      if (body.attributes) {
        const listAttributeId: string[] = [];
        for (const attribute of body.attributes) {
          if (listAttributeId.includes(attribute.attributeId)) {
            throw new BadRequestException('Duplicate Attribute In Request');
          }
          listAttributeId.push(attribute.attributeId);
        }
        const validProductAttributes =
          await this.prisma.productAttribute.findMany({
            where: {
              id: {
                in: listAttributeId,
              },
              deletedAt: null,
            },
          });
        if (validProductAttributes.length < listAttributeId.length) {
          throw new BadRequestException('At Least One Attribute Not Found');
        }
      }
      const attributesToUpdate: ExistingVariantAttribute[] = [];
      const attributesToCreate: {
        attributeId: string;
        value: string;
      }[] = [];
      const attributesToDelete: ExistingVariantAttribute[] = [];
      const attributesToRestore: ExistingVariantAttribute[] = [];
      if (body.attributes !== undefined && existingAttribute !== null) {
        for (const newAtt of body.attributes) {
          const found = existingAttribute.find(
            (item) => item.attributeId === newAtt.attributeId,
          );
          if (found) {
            if (found.deletedAt === null) {
              attributesToUpdate.push({ ...found, ...newAtt });
            } else {
              attributesToRestore.push({ ...found, ...newAtt });
            }
          } else {
            attributesToCreate.push(newAtt);
          }
        }

        for (const oldAtt of existingAttribute) {
          if (
            oldAtt.deletedAt === null &&
            !body.attributes.find(
              (item) => item.attributeId === oldAtt.attributeId,
            )
          ) {
            attributesToDelete.push(oldAtt);
          }
        }
      }
      const fieldsChange = {
        ...(body.barcode !== undefined && {
          barcode: body.barcode,
        }),
        ...(body.sku !== undefined && {
          sku: body.sku,
        }),
        ...(body.name !== undefined && {
          name: body.name,
        }),
        ...(body.costPrice !== undefined && {
          costPrice: body.costPrice,
        }),
        ...(body.sellingPrice !== undefined && {
          sellingPrice: body.sellingPrice,
        }),
        ...(body.status !== undefined && {
          status: body.status,
        }),
      };

      const updatedProductVariant = await this.prisma.$transaction(
        async (tx) => {
          await Promise.all(
            attributesToUpdate.map((item) =>
              tx.productVariantAttribute.update({
                where: {
                  id: item.id,
                },
                data: {
                  attributeId: item.attributeId,
                  value: item.value,
                },
              }),
            ),
          );

          await Promise.all(
            attributesToCreate.map((item) =>
              tx.productVariantAttribute.create({
                data: {
                  attributeId: item.attributeId,
                  value: item.value,
                  variantId: existedProductVariant.id,
                },
              }),
            ),
          );
          await Promise.all(
            attributesToDelete.map((item) =>
              tx.productVariantAttribute.update({
                where: {
                  id: item.id,
                },
                data: {
                  deletedAt: new Date(),
                },
              }),
            ),
          );

          await Promise.all(
            attributesToRestore.map((item) =>
              tx.productVariantAttribute.update({
                where: { id: item.id },
                data: {
                  deletedAt: null,
                  value: item.value,
                },
              }),
            ),
          );

          return await tx.productVariant.update({
            where: {
              id,
            },
            data: fieldsChange,
          });
        },
      );
      return { data: updatedProductVariant };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product Variant Already Existed !');
      } else {
        throw error;
      }
    }
  }

  async deleteProductVariant(id: string) {
    const validStockTransferStatus: StockTransferStatus[] = [
      'PENDING',
      'APPROVED',
      'IN_TRANSIT',
    ];

    const validPurchaseOrderStatus: PurchaseOrderStatus[] = [
      'ORDERED',
      'PARTIALLY_RECEIVED',
    ];

    const validSalesOrderStatus: SalesOrderStatus[] = [
      'CONFIRMED',
      'PROCESSING',
    ];

    const validStockAdjustmentStatuses: StockAdjustmentStatus[] = [
      'PENDING',
      'APPROVED',
    ];

    const today = new Date();

    const existingProductVariant = await this.prisma.productVariant.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!existingProductVariant) {
      throw new NotFoundException('Product Variant Not Found');
    }
    const existingStock = await this.prisma.stock.findFirst({
      where: {
        variantId: id,
        deletedAt: null,
        OR: [{ quantity: { gt: 0 } }, { reservedQuantity: { gt: 0 } }],
      },
    });
    if (existingStock) {
      throw new ConflictException(
        'Product Variant Has Available or Reserved Stock',
      );
    }

    const existingTransferItem = await this.prisma.stockTransferItem.findFirst({
      where: {
        variantId: id,
        deletedAt: null,
        stockTransfer: {
          deletedAt: null,
          status: {
            in: validStockTransferStatus,
          },
        },
      },
    });
    if (existingTransferItem) {
      throw new ConflictException(
        'Product Variant Is Being Used In An Active Stock Transfer',
      );
    }

    const existingPurchaseOrderItem =
      await this.prisma.purchaseOrderItem.findFirst({
        where: {
          variantId: id,
          purchaseOrder: {
            deletedAt: null,
            status: {
              in: validPurchaseOrderStatus,
            },
          },
        },
      });
    if (existingPurchaseOrderItem) {
      throw new ConflictException(
        'Product Variant Is Being Used In An Active Purchase Order',
      );
    }

    const existingSalesOrderItem = await this.prisma.salesOrderItem.findFirst({
      where: {
        variantId: id,
        deletedAt: null,
        salesOrder: {
          deletedAt: null,
          status: {
            in: validSalesOrderStatus,
          },
        },
      },
    });
    if (existingSalesOrderItem) {
      throw new ConflictException(
        'Product Variant Is Being Used In An Active Sales Order',
      );
    }
    const existingStockAdjustmentItem =
      await this.prisma.stockAdjustmentItem.findFirst({
        where: {
          variantId: id,
          deletedAt: null,
          stockAdjustment: {
            deletedAt: null,
            status: {
              in: validStockAdjustmentStatuses,
            },
          },
        },
      });
    if (existingStockAdjustmentItem) {
      throw new ConflictException(
        'Product Variant Is Being Used In An Active Stock Adjustment',
      );
    }

    const existingPromotionVariant =
      await this.prisma.promotionVariant.findFirst({
        where: {
          variantId: id,
          deletedAt: null,
          promotion: {
            status: 'ACTIVE',
            deletedAt: null,
            startAt: {
              lte: today,
            },
            OR: [{ endAt: null }, { endAt: { gte: today } }],
          },
        },
      });
    if (existingPromotionVariant) {
      throw new ConflictException(
        'Product Variant Is Being Used In An Active Promotion Variant',
      );
    }
    await this.prisma.productVariant.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        status: 'INACTIVE',
        deletedAt: today,
      },
    });
    return {
      message: 'Delete Product Variant Successfully !',
    };
  }
}
