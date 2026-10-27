import { Controller, Get, UseGuards } from '@nestjs/common';
import { BrandService } from './brands.service';
import { Permissions } from '../auth/decorators/permission.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('brand.read')
  async getBrands() {
    return this.brandService.getBrands();
  }
}
