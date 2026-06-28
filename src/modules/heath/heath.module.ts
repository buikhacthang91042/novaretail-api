import { Module } from '@nestjs/common';
import { HeathController } from './controllers/heath.controller';
import { HeathService } from './services/heath.service';

@Module({
  controllers: [HeathController],
  providers: [HeathService],
})
export class HeathModule {}
