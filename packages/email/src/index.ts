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
  async send(): Promise<never> {
    throw new Error('Email provider is not configured');
  }
}
