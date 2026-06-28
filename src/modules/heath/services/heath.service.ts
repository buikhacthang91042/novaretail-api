import { Injectable } from '@nestjs/common';

@Injectable()
export class HeathService {
  check() {
    return {
      success: true,
      status: 'NovaRetail API is running',
      version: '1.0',
      timestamp: new Date().toISOString(),
    };
  }
}
