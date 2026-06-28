import { Controller, Get } from '@nestjs/common';
import { HeathService } from '../services/heath.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Heath')
@Controller('heath')
export class HeathController {
  constructor(private readonly healthService: HeathService) {}
  @Get()
  @ApiOperation({
    summary: 'Health Check Endpoint',
  })
  check() {
    return this.healthService.check();
  }
}
