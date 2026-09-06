import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { Request } from 'express';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {} // reflector dùng để đọc metadata

  //getAllAndOverride của reflector là dùng để lấy perrmission được ưu tiên hơn. Ví dụ:
  /*  
        @Permissions('USER_READ')
        @Controller('users')
        export class UserController {

            @Permissions('USER_CREATE')
            @Post()
            create() {}
    } */
  // =>>>>>> Nó sẽ lấy ['USER_CREATE']

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()], //Cái này để sắp xếp độ ưu tiên lấy @Permission (hàm > class)
    );
    if (!requiredPermissions?.length) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user.sub;
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { expiredAt: null },
          {
            expiredAt: {
              gt: new Date(),
            },
          },
        ],
        deletedAt: null,
      },
      select: {
        roleId: true,
      },
    });
    const roleIds = userRoles.map((role) => role.roleId);
    const userPermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        permissionId: true,
      },
    });
    const permissionIds = userPermissions.map(
      (permission) => permission.permissionId,
    );
    const listPermission = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        code: true,
      },
    });
    const permissionCodes = listPermission.map((p) => p.code);
    const hasPermission = requiredPermissions.every((rp) =>
      permissionCodes.includes(rp),
    );
    if (!hasPermission) throw new ForbiddenException('Forbidden');
    return true;
  }
}
