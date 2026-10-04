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
import { EMAIL_SENDER } from '../platform/email.module';
import type { EmailSender } from '@executive-match/email';
import { createVerificationEmail, createPasswordResetEmail } from '@executive-match/email';
import {
  LoginSchema,
  RegisterSchema,
  VerifyEmailConfirmSchema,
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
} from '@executive-match/validation';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';

const sessionCookie = 'em_session';
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const getWebUrl = () => process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const publicUser = (user: {
  id: string;
  email: string;
  globalRole: string;
  emailVerified?: Date | null;
}) => ({
  id: user.id,
  email: user.email,
  globalRole: user.globalRole,
  emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
});

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

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
      // Automatically send email verification link upon registration
      try {
        await this.sendVerificationToken(user.id, normalizedEmail);
      } catch (err) {
        console.error('Failed to dispatch registration verification email:', err);
      }
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

  private async sendVerificationToken(userId: string, email: string) {
    await this.db.emailVerificationToken.deleteMany({ where: { userId } });
    const rawToken = randomBytes(32).toString('base64url');
    await this.db.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    const emailMessage = createVerificationEmail({
      to: email,
      token: rawToken,
      webUrl: getWebUrl(),
    });
    await this.emailSender.send(emailMessage);
  }

  async requestEmailVerification(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw new HttpException({ code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
    if (user.emailVerified) {
      return { alreadyVerified: true };
    }
    await this.sendVerificationToken(user.id, user.email);
    return { ok: true };
  }

  async confirmEmailVerification(input: unknown) {
    const parsed = VerifyEmailConfirmSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);

    const tokenHash = hashToken(parsed.data.token);
    const tokenRecord = await this.db.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.user.deletedAt) {
      throw new HttpException(
        { code: 'INVALID_TOKEN', message: 'Verification link is invalid or has expired' },
        400,
      );
    }

    const verifiedDate = new Date();
    await this.db.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: verifiedDate },
    });
    await this.db.emailVerificationToken.deleteMany({
      where: { userId: tokenRecord.userId },
    });

    return {
      ok: true,
      user: publicUser({ ...tokenRecord.user, emailVerified: verifiedDate }),
    };
  }

  async requestPasswordReset(input: unknown) {
    const parsed = PasswordResetRequestSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const user = await this.db.user.findUnique({ where: { email: normalizedEmail } });

    // Protect against account enumeration: return success even if user doesn't exist
    if (!user || user.deletedAt) {
      return { ok: true };
    }

    await this.db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const rawToken = randomBytes(32).toString('base64url');
    await this.db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      },
    });

    try {
      const emailMessage = createPasswordResetEmail({
        to: user.email,
        token: rawToken,
        webUrl: getWebUrl(),
      });
      await this.emailSender.send(emailMessage);
    } catch (err) {
      console.error('Failed to dispatch password reset email:', err);
    }

    return { ok: true };
  }

  async confirmPasswordReset(input: unknown) {
    const parsed = PasswordResetConfirmSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);

    const tokenHash = hashToken(parsed.data.token);
    const tokenRecord = await this.db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt < new Date() ||
      tokenRecord.user.deletedAt
    ) {
      throw new HttpException(
        { code: 'INVALID_TOKEN', message: 'Password reset link is invalid or has expired' },
        400,
      );
    }

    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });

    // Update password
    await this.db.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    // Mark reset token as used
    await this.db.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all active sessions for security
    await this.db.session.updateMany({
      where: { userId: tokenRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }
}

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: unknown) {
    return { user: await this.auth.register(body) };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
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

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[sessionCookie]);
    res.clearCookie(sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Post('verify-email/request')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async requestEmailVerification(@CurrentUser() user: AuthUser) {
    return this.auth.requestEmailVerification(user.id);
  }

  @Post('verify-email/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async confirmEmailVerification(@Body() body: unknown) {
    return this.auth.confirmEmailVerification(body);
  }

  @Post('password-reset/request')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestPasswordReset(@Body() body: unknown) {
    return this.auth.requestPasswordReset(body);
  }

  @Post('password-reset/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async confirmPasswordReset(@Body() body: unknown) {
    return this.auth.confirmPasswordReset(body);
  }
}

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

