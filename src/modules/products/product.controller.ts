import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { ProductService } from './product.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permissions } from '../auth/decorators/permission.decorator';
import { CreateProductDto } from './dto/create-product.dto';

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
}
