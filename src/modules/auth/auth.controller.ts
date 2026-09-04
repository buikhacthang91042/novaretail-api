import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authSerivce: AuthService) {}

  @Post('login')
  login(@Body() loignDto: LoginDto) {
    return this.authSerivce.login(loignDto);
  }
}
