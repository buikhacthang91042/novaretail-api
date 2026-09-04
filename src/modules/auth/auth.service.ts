import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });
    let userStatus = user?.status;
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    let lockedUntil = user.lockedUntil;
    if (userStatus === 'LOCKED') {
      if (lockedUntil && lockedUntil > new Date()) {
        throw new UnauthorizedException('Invalid username or password');
      } else {
        await this.prisma.user.update({
          where: {
            username,
          },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            status: 'ACTIVE',
          },
        });
        userStatus = 'ACTIVE';
      }
    }

    if (userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const failedLoginCount = user.failedLoginCount + 1;
      const isLocked = failedLoginCount >= 5;
      await this.prisma.user.update({
        where: {
          username,
        },
        data: {
          failedLoginCount,
          ...(isLocked && {
            status: 'LOCKED',
            lockedUntil: new Date(Date.now() + 1 * 60 * 1000),
          }),
        },
      });
      throw new UnauthorizedException('Invalid username or password');
    }
    await this.prisma.user.update({
      where: {
        username,
      },
      data: {
        failedLoginCount: 0,
        lastLoginAt: new Date(Date.now()),
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
