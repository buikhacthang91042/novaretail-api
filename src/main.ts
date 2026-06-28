import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // dùng để loại bỏ các thuộc tính không được định nghĩa trong DTO, xác định field nào không hợp lệ
      forbidNonWhitelisted: true, // dùng để trả về lỗi luôn nếu có thuộc tính không được định nghĩa trong DTO , không tự loại bỏ các thuộc tính không được định nghĩa trong DTO, bắt buộc phải có whitelist: true để sử dụng
      transform: true, // dùng để tự động chuyển đổi các kiểu dữ liệu từ request sang kiểu dữ liệu được định nghĩa trong DTO
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('NovaRetail API')
    .setDescription('NovaRetail Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth() // dùng để thêm thông tin xác thực Bearer Token vào Swagger UI, cho phép nhập token để truy cập các endpoint cần token mới được gọi
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
