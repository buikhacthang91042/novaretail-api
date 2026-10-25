import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { ProductService } from './product.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permissions } from '../auth/decorators/permission.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.read')
  async getProducts(@Query() query: GetProductsQueryDto) {
    return this.productService.getProducts(query);
  }
}
