import { Module } from '@nestjs/common';
import { HeathController } from './heath.controller';
import { HeathService } from './heath.service';

@Module({
  controllers: [HeathController],
  providers: [HeathService]
})
export class HeathModule {}
