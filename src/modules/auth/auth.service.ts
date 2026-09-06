import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { response } from 'express';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    let userStatus = user.status;

    const lockedUntil = user.lockedUntil;
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
            lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
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
        lastLoginAt: new Date(),
      },
    });

    const payload = {
      sub: user.id,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(64).toString('hex');
    const hashRefreshToken = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async getMe(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken)
      throw new UnauthorizedException('Unauthorized');
    const hashRefreshToken = createHash('sha256')
      .update(refreshTokenDto.refreshToken)
      .digest('hex');

    const existingRefreshToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken,
      },
    });
    if (
      !existingRefreshToken ||
      existingRefreshToken.revokedAt !== null ||
      existingRefreshToken.expiresAt <= new Date()
    )
      throw new UnauthorizedException('Unauthorized');

    const user = await this.prisma.user.findUnique({
      where: {
        id: existingRefreshToken.userId,
      },
      select: {
        id: true,
        status: true,
        username: true,
      },
    });
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Unauthorized');
    }
    const payload = {
      sub: user.id,
      username: user.username,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: {
          tokenHash: hashRefreshToken,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'ROTATED',
        },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logOut(refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken)
      throw new UnauthorizedException('Unauthorized');
    const hashRefreshToken = createHash('sha256')
      .update(refreshTokenDto.refreshToken)
      .digest('hex');
    const existingRefreshToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken,
      },
      select: {
        id: true,
        revokedAt: true,
      },
    });
    if (!existingRefreshToken) throw new UnauthorizedException('Unauthorized');
    if (existingRefreshToken.revokedAt === null) {
      await this.prisma.refreshToken.update({
        where: {
          tokenHash: hashRefreshToken,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'LOGOUT',
        },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!existingUser) throw new UnauthorizedException('Unauthorized');
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'LOGOUT_ALL',
      },
    });
    return {
      message: 'Logged out from all devices successfully',
      revokedSessions: result.count,
    };
  }
}
