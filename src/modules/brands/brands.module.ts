import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandController } from './brands.controller';
import { BrandService } from './brands.service';
import { JwtModule } from '@nestjs/jwt';

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
  controllers: [BrandController],
  providers: [BrandService],
})
export class BrandModule {}
