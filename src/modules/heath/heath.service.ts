import { Injectable } from '@nestjs/common';

@Injectable()
export class HeathService {
  check() {
    return {
      status: 'ok',
    };
  }
}
