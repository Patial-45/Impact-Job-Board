import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../platform/database.module';
import { EmailModule } from '../platform/email.module';
import { AuthModule } from './auth.module';
import { HealthModule } from './health.module';
import { WorkspacesModule } from './workspaces.module';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    AuthModule,
    HealthModule,
    WorkspacesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
