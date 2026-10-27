import { Controller, Get, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Permissions } from '../auth/decorators/permission.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('category.read')
  async getCategories() {
    return this.categoriesService.getCategories();
  }
}
