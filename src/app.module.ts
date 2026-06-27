import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HeathModule } from './modules/heath/heath.module';

@Module({
  imports: [HeathModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
