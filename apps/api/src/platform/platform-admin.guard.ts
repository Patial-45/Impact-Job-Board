import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { canPlatform, type GlobalRole } from '@executive-match/auth';
import type { AuthRequest } from './auth.guard';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    const role = req.authUser.globalRole as GlobalRole;
    if (!canPlatform(role, 'admin.read')) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Platform administrator privileges required',
      });
    }
    return true;
  }
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    const role = req.authUser.globalRole as GlobalRole;
    if (!canPlatform(role, 'admin.manage')) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Super administrator privileges required',
      });
    }
    return true;
  }
}
