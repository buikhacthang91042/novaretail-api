import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductController } from './controller/product/product.controller';
import { ProductService } from './service/product/product.service';
import { JwtModule } from '@nestjs/jwt';
import { ProductVariantController } from './controller/product-variant/product-variant-controller';
import { ProductVariantService } from './service/product-variant/product-variant.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [ProductController, ProductVariantController],
  providers: [ProductService, ProductVariantService],
})
export class ProductModule {}
