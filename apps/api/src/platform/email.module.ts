import { Global, Module, type Provider } from '@nestjs/common';
import { ConsoleEmailSender, type EmailSender } from '@executive-match/email';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

const emailProvider: Provider = {
  provide: EMAIL_SENDER,
  useFactory: (): EmailSender => {
    return new ConsoleEmailSender();
  },
};

@Global()
@Module({
  providers: [emailProvider],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
