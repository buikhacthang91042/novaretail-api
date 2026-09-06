//Cái này dùng để làm @Permission và set Metadata vào handler
//Ví dụ:
/* @Get('users')
@Permissions('USER_READ')
        ↓
Route handler
        ↓
metadata:
{
  permissions: ['USER_READ']
}  */
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};
