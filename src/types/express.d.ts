//Dùng để nói cho typescript biết request có field user
// để sử dụng req.user thay vì req['user']
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}
export {};
