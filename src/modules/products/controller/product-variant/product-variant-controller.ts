import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductVariantService } from '../../service/product-variant/product-variant.service';
import { CreateProductVariantDto } from '../../dto/product-variant/create-product-variant.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { GetProductVariantQueryDto } from '../../dto/product-variant/get-product-variant-query.dto';
import { UpdateProductVariantDto } from '../../dto/product-variant/update-product-variant.dto';

@Controller('product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('productVariant.read')
  async getProductVariantList(@Query() query: GetProductVariantQueryDto) {
    return this.productVariantService.getProductVariantList(query);
  }

  @Post()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('productVariant.create')
  async createProductVariant(@Body() body: CreateProductVariantDto) {
    return this.productVariantService.createProductVariant(body);
  }

  @Get(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('productVariant.read')
  async getProductVariantDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantService.getProductVariantDetail(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('productVariant.update')
  async updateProductVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductVariantDto,
  ) {
    return this.productVariantService.updateProductVariant(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('productVariant.delete')
  async deleteProductVariant(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantService.deleteProductVariant(id);
  }
}
