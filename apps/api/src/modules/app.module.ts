import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../platform/database.module';
import { EmailModule } from '../platform/email.module';
import { StorageModule } from '../platform/storage.module';
import { AuthModule } from './auth.module';
import { CandidatesModule } from './candidates.module';
import { HealthModule } from './health.module';
import { JobsModule } from './jobs.module';
import { ApplicationsModule } from './applications.module';
import { AiModule } from './ai.module';
import { MatchingModule } from './matching.module';
import { WorkspacesModule } from './workspaces.module';
import { InterviewsModule } from './interviews.module';
import { OffersModule } from './offers.module';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    StorageModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    AuthModule,
    CandidatesModule,
    HealthModule,
    JobsModule,
    ApplicationsModule,
    MatchingModule,
    WorkspacesModule,
    AiModule,
    InterviewsModule,
    OffersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
