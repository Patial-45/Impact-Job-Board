import { describe, expect, it } from 'vitest';
import {
  ConsoleEmailSender,
  MemoryEmailSender,
  UnconfiguredEmailSender,
  createVerificationEmail,
  createPasswordResetEmail,
  createInvitationEmail,
} from './index';

describe('packages/email - Providers', () => {
  it('throws when unconfigured email sender is used', async () => {
    const sender = new UnconfiguredEmailSender();
    await expect(
      sender.send({
        to: 'test@example.com',
        subject: 'test',
        text: 'test',
        html: '<p>test</p>',
        idempotencyKey: 'key-1',
      }),
    ).rejects.toThrow('Email provider is not configured');
  });

  it('records sent messages with MemoryEmailSender', async () => {
    const memory = new MemoryEmailSender();
    const result = await memory.send({
      to: 'candidate@example.com',
      subject: 'Interview Confirmation',
      text: 'You are confirmed.',
      html: '<p>You are confirmed.</p>',
      idempotencyKey: 'interview-1',
    });
    expect(result.messageId).toContain('mem-');
    expect(memory.sentMessages).toHaveLength(1);
    expect(memory.sentMessages[0]?.to).toBe('candidate@example.com');
    memory.clear();
    expect(memory.sentMessages).toHaveLength(0);
  });

  it('logs with ConsoleEmailSender', async () => {
    const sender = new ConsoleEmailSender();
    const result = await sender.send({
      to: 'candidate@example.com',
      subject: 'Notice',
      text: 'Text',
      html: '<p>HTML</p>',
      idempotencyKey: 'k-1',
    });
    expect(result.messageId).toContain('console-');
  });
});

describe('packages/email - Templates', () => {
  it('creates verification email with correct link', () => {
    const email = createVerificationEmail({
      to: 'user@example.com',
      token: 'secure_verification_token',
      webUrl: 'http://localhost:3000',
    });
    expect(email.to).toBe('user@example.com');
    expect(email.subject).toContain('Verify your Executive Match account');
    expect(email.text).toContain('http://localhost:3000/verify-email?token=secure_verification_token');
    expect(email.html).toContain('http://localhost:3000/verify-email?token=secure_verification_token');
  });

  it('creates password reset email with correct link', () => {
    const email = createPasswordResetEmail({
      to: 'user@example.com',
      token: 'reset_123',
      webUrl: 'http://localhost:3000',
    });
    expect(email.to).toBe('user@example.com');
    expect(email.subject).toContain('Reset your Executive Match password');
    expect(email.text).toContain('http://localhost:3000/reset-password?token=reset_123');
  });

  it('creates workspace invitation email', () => {
    const email = createInvitationEmail({
      to: 'colleague@example.com',
      inviterName: 'Jane Doe',
      workspaceName: 'Acme Corp',
      token: 'invite_xyz',
      webUrl: 'http://localhost:3000',
      role: 'RECRUITER',
    });
    expect(email.to).toBe('colleague@example.com');
    expect(email.subject).toContain('Acme Corp');
    expect(email.text).toContain('Jane Doe');
    expect(email.text).toContain('RECRUITER');
    expect(email.text).toContain('http://localhost:3000/invite/invite_xyz');
  });
});
