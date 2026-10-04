export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export interface EmailSender {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}

export class UnconfiguredEmailSender implements EmailSender {
  async send(_message?: EmailMessage): Promise<never> {
    void _message;
    throw new Error('Email provider is not configured');
  }
}

export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<{ messageId: string }> {
    const messageId = `console-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[Email] To: ${message.to} | Subject: ${message.subject} | Key: ${message.idempotencyKey}`);
    return { messageId };
  }
}

export class MemoryEmailSender implements EmailSender {
  public readonly sentMessages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    const messageId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.sentMessages.push(message);
    return { messageId };
  }

  clear(): void {
    this.sentMessages.length = 0;
  }
}

export function createVerificationEmail({
  to,
  token,
  webUrl,
}: {
  to: string;
  token: string;
  webUrl: string;
}): EmailMessage {
  const verifyUrl = `${webUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: 'Verify your Executive Match account',
    text: `Welcome to Executive Match. Please verify your email address by visiting: ${verifyUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #182320;">Verify your email</h2>
        <p style="color: #60706a; line-height: 1.6;">Thank you for registering. Click the button below to verify your email address.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #315f4d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block;">Verify Email</a>
        </p>
        <p style="color: #60706a; font-size: 13px;">Or copy and paste this link: ${verifyUrl}</p>
      </div>
    `,
    idempotencyKey: `verify-${to}-${token.substring(0, 12)}`,
  };
}

export function createPasswordResetEmail({
  to,
  token,
  webUrl,
}: {
  to: string;
  token: string;
  webUrl: string;
}): EmailMessage {
  const resetUrl = `${webUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: 'Reset your Executive Match password',
    text: `A password reset was requested for your account. Visit: ${resetUrl} to set a new password. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #182320;">Reset your password</h2>
        <p style="color: #60706a; line-height: 1.6;">A password reset was requested for your account. Click below to set a new password.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #315f4d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #60706a; font-size: 13px;">If you did not request this, please disregard this email.</p>
      </div>
    `,
    idempotencyKey: `reset-${to}-${token.substring(0, 12)}`,
  };
}

export function createInvitationEmail({
  to,
  inviterName,
  workspaceName,
  token,
  webUrl,
  role,
}: {
  to: string;
  inviterName: string;
  workspaceName: string;
  token: string;
  webUrl: string;
  role: string;
}): EmailMessage {
  const inviteUrl = `${webUrl.replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`;
  return {
    to,
    subject: `You've been invited to join ${workspaceName} on Executive Match`,
    text: `${inviterName} has invited you to join ${workspaceName} as ${role}. Accept your invitation here: ${inviteUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #182320;">Workspace Invitation</h2>
        <p style="color: #60706a; line-height: 1.6;"><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #315f4d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block;">Accept Invitation</a>
        </p>
        <p style="color: #60706a; font-size: 13px;">Or copy and paste this link: ${inviteUrl}</p>
      </div>
    `,
    idempotencyKey: `invite-${to}-${token.substring(0, 12)}`,
  };
}

