import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from './database.module';
import { createHash } from 'node:crypto';
export type AuthUser = { id: string; email: string; globalRole: string };
export interface AuthRequest extends Request {
  authUser?: AuthUser;
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.em_session;
    if (!token || typeof token !== 'string') throw new UnauthorizedException();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.db.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.deletedAt)
      throw new UnauthorizedException();
    req.authUser = {
      id: session.user.id,
      email: session.user.email,
      globalRole: session.user.globalRole,
    };
    return true;
  }
}
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthRequest>().authUser,
);
