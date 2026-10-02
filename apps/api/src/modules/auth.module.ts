import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Injectable,
  Inject,
  Module,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { DatabaseService } from '../platform/database.module';
import { LoginSchema, RegisterSchema } from '@executive-match/validation';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';

const sessionCookie = 'em_session';
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const publicUser = (user: { id: string; email: string; globalRole: string }) => ({
  id: user.id,
  email: user.email,
  globalRole: user.globalRole,
});

@Injectable()
export class AuthService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  async register(input: unknown) {
    const parsed = RegisterSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    const { email, password, displayName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    if (await this.db.user.findUnique({ where: { email: normalizedEmail } }))
      throw new HttpException({ code: 'EMAIL_IN_USE', message: 'Email already in use' }, 409);
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    try {
      const user = await this.db.user.create({
        data: { email: normalizedEmail, passwordHash, profile: { create: { displayName } } },
      });
      return publicUser(user);
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
        throw new HttpException({ code: 'EMAIL_IN_USE', message: 'Email already in use' }, 409);
      throw error;
    }
  }
  async login(input: unknown) {
    const parsed = LoginSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    const user = await this.db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
    });
    if (
      !user ||
      user.deletedAt ||
      !user.passwordHash ||
      !(await argon2.verify(user.passwordHash, parsed.data.password))
    )
      throw new HttpException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }, 401);
    const token = randomBytes(32).toString('base64url');
    await this.db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { token, user: publicUser(user) };
  }
  async me(token: string | undefined) {
    if (!token) return null;
    const session = await this.db.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.deletedAt)
      return null;
    return publicUser(session.user);
  }
  async logout(token: string | undefined) {
    if (token)
      await this.db.session.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }
}

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Post('register') @Throttle({ default: { limit: 5, ttl: 60_000 } }) async register(
    @Body() body: unknown,
  ) {
    return { user: await this.auth.register(body) };
  }
  @Post('login') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } }) async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.login(body);
    res.cookie(sessionCookie, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }
  @Post('logout') @HttpCode(204) async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.[sessionCookie]);
    res.clearCookie(sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
  @Get('me') @UseGuards(AuthGuard) me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
@Module({ providers: [AuthService], controllers: [AuthController], exports: [AuthService] })
export class AuthModule {}
