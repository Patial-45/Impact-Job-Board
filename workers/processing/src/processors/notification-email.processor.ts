import type { EmailSender, EmailMessage } from '@executive-match/email';
import type { JobEnvelope } from '@executive-match/shared';

export type NotificationEmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  idempotencyKey?: string;
};

export function createNotificationEmailProcessor(emailSender: EmailSender) {
  return async (jobData: JobEnvelope<NotificationEmailPayload>) => {
    const { to, subject, html, text, idempotencyKey } = jobData.payload;

    if (!to || !subject) {
      throw new Error('Email notification requires valid recipient and subject');
    }

    const message: EmailMessage = {
      to,
      subject,
      html: html || `<p>${text || subject}</p>`,
      text: text || subject,
      idempotencyKey: idempotencyKey || jobData.requestId || `email-${Date.now()}`,
    };

    const result = await emailSender.send(message);

    return {
      status: 'sent',
      messageId: result.messageId,
      to,
      idempotencyKey: message.idempotencyKey,
    };
  };
}
