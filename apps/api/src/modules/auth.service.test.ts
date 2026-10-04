/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.module';
import type { DatabaseService } from '../platform/database.module';
import { MemoryEmailSender } from '@executive-match/email';

function createMockDb() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    emailVerificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as DatabaseService;
}

describe('AuthService - Registration & Login', () => {
  it('throws 400 validation error if registration payload is invalid', async () => {
    const db = createMockDb();
    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    await expect(
      service.register({ email: 'bad-email', password: 'short', displayName: '' }),
    ).rejects.toThrow();
  });

  it('throws 409 if email is already in use', async () => {
    const db = createMockDb();
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'existing-id',
      email: 'taken@example.com',
      passwordHash: 'hash',
      globalRole: 'USER',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);

    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    await expect(
      service.register({
        email: 'taken@example.com',
        password: 'secure-password-123',
        displayName: 'John',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('successfully registers new user and dispatches verification email', async () => {
    const db = createMockDb();
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce({
      id: 'user-123',
      email: 'new@example.com',
      globalRole: 'USER',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);

    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    const result = await service.register({
      email: 'new@example.com',
      password: 'secure-password-123',
      displayName: 'New User',
    });

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('new@example.com');
    expect(emailSender.sentMessages).toHaveLength(1);
    expect(emailSender.sentMessages[0]?.to).toBe('new@example.com');
  });

  it('rejects login with non-existent user', async () => {
    const db = createMockDb();
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    await expect(
      service.login({ email: 'unknown@example.com', password: 'any-password' }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

describe('AuthService - Password Reset Flow', () => {
  it('does not leak user presence on password reset request', async () => {
    const db = createMockDb();
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null); // User does not exist
    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    const result = await service.requestPasswordReset({ email: 'nonexistent@example.com' });
    expect(result).toEqual({ ok: true });
    expect(emailSender.sentMessages).toHaveLength(0); // No email sent to non-existent user
  });

  it('dispatches reset email when user exists', async () => {
    const db = createMockDb();
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-reset-id',
      email: 'valid@example.com',
      deletedAt: null,
    } as any);

    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    const result = await service.requestPasswordReset({ email: 'valid@example.com' });
    expect(result).toEqual({ ok: true });
    expect(emailSender.sentMessages).toHaveLength(1);
    expect(emailSender.sentMessages[0]?.to).toBe('valid@example.com');
    expect(emailSender.sentMessages[0]?.subject).toContain('Reset your Executive Match password');
  });

  it('rejects expired or used reset token on confirmation', async () => {
    const db = createMockDb();
    vi.mocked(db.passwordResetToken.findUnique).mockResolvedValueOnce({
      id: 'token-id',
      userId: 'user-id',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 10_000), // Expired
      createdAt: new Date(),
      usedAt: null,
      user: { id: 'user-id', deletedAt: null },
    } as any);

    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    await expect(
      service.confirmPasswordReset({
        token: 'expired-token',
        password: 'new-valid-password-123',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('successfully resets password, revokes sessions, and marks token used', async () => {
    const db = createMockDb();
    vi.mocked(db.passwordResetToken.findUnique).mockResolvedValueOnce({
      id: 'token-valid',
      userId: 'user-valid-id',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      usedAt: null,
      user: { id: 'user-valid-id', deletedAt: null },
    } as any);

    const emailSender = new MemoryEmailSender();
    const service = new AuthService(db, emailSender);

    const result = await service.confirmPasswordReset({
      token: 'valid-reset-token',
      password: 'brand-new-secure-password-123',
    });

    expect(result).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-valid-id' } }),
    );
    expect(db.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-valid-id', revokedAt: null } }),
    );
    expect(db.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'token-valid' } }),
    );
  });
});
