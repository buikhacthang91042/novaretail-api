import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { type Response, type Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { Permissions } from './decorators/permission.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authSerivce: AuthService) {}

  @Post('login')
  async login(
    @Body() loignDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authSerivce.login(loignDto);
    const { refreshToken, ...resultData } = result;
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return resultData;
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
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken: unknown = request.cookies['refreshToken'];
    if (typeof refreshToken !== 'string')
      throw new UnauthorizedException('Unauthorized');
    const result = await this.authSerivce.refreshToken(refreshToken);
    const { refreshToken: newRefreshToken, ...resultData } = result;
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return resultData;
  }

  @Post('logout')
  async logOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken: unknown = request.cookies['refreshToken'];
    if (typeof refreshToken !== 'string')
      throw new UnauthorizedException('Unauthorized');
    const result = await this.authSerivce.logOut(refreshToken);
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return result;
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
