import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authSerivce: AuthService) {}

  @Post('login')
  login(@Body() loignDto: LoginDto) {
    return this.authSerivce.login(loignDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Req() request: Request) {
    return request.user;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() request: Request) {
    const userId = request.user.sub;
    return this.authSerivce.getMe(userId);
  }
}
