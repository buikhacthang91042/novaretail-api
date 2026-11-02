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
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { ProductService } from './product.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permissions } from '../auth/decorators/permission.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.read')
  async getProducts(@Query() query: GetProductsQueryDto) {
    return this.productService.getProducts(query);
  }

  @Post()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.create')
  async createProduct(@Body() body: CreateProductDto) {
    return this.productService.createProduct(body);
  }

  @Get(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.read')
  async getProductDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.getDetailProduct(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.update')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.delete')
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.deleteProduct(id);
  }
}
