import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PermissionGuard } from './guards/permission.guard';
import { Permissions } from './decorators/permission.decorator';

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

  @Post('refresh')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authSerivce.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  logOut(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authSerivce.logOut(refreshTokenDto);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  logoutAll(@Req() request: Request) {
    const userId = request.user.sub;
    return this.authSerivce.logoutAll(userId);
  }

  @Get('test-permission')
  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('product.read', 'product.create')
  testPermission() {
    return {
      message: 'You have product.create permission',
    };
  }
}
