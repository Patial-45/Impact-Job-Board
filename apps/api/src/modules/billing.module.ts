import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  UpdateSubscriptionSchema,
  CancelSubscriptionSchema,
  type UpdateSubscriptionInput,
  type CancelSubscriptionInput,
} from '@executive-match/validation';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';

export const SUBSCRIPTION_TIER_PLANS = {
  STARTER: {
    tier: 'STARTER',
    name: 'Starter Tier',
    priceMonthly: 0,
    priceAnnual: 0,
    activeJobLimit: 3,
    candidateSearchLimit: 50,
    features: [
      'Up to 3 active job requisitions',
      '50 monthly candidate profile searches',
      'Standard applicant tracking pipeline',
      'Basic keyword & skill matching',
      'Email customer support',
    ],
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth Tier',
    priceMonthly: 199,
    priceAnnual: 1990,
    activeJobLimit: 15,
    candidateSearchLimit: 500,
    features: [
      'Up to 15 active job requisitions',
      '500 monthly candidate profile searches',
      'AI semantic embedding candidate matching',
      'Structured interview scorecards & debriefs',
      'Digital offer letters & e-signature tracking',
      'Hiring pipeline velocity analytics',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise Tier',
    priceMonthly: 599,
    priceAnnual: 5990,
    activeJobLimit: 100,
    candidateSearchLimit: 5000,
    features: [
      'Up to 100 active job requisitions',
      '5,000 monthly candidate profile searches',
      'Dedicated recruiter workspace seats',
      'Custom onboarding checklist templates',
      'Comprehensive conversion analytics & reports',
      'Audited platform elevation & priority SLA',
    ],
  },
} as const;

@Injectable()
export class BillingService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(WorkspaceAccessService) private readonly access: WorkspaceAccessService,
  ) {}

  async getSubscription(workspaceSlug: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'billing.read');

    let sub = await this.db.workspaceSubscription.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (!sub) {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      sub = await this.db.workspaceSubscription.create({
        data: {
          workspaceId: workspace.id,
          tier: 'STARTER',
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          activeJobLimit: SUBSCRIPTION_TIER_PLANS.STARTER.activeJobLimit,
          candidateSearchLimit: SUBSCRIPTION_TIER_PLANS.STARTER.candidateSearchLimit,
        },
      });
    }

    const [activeJobsCount, membersCount] = await Promise.all([
      this.db.job.count({
        where: {
          workspaceId: workspace.id,
          status: 'PUBLISHED',
          deletedAt: null,
        },
      }),
      this.db.workspaceMember.count({
        where: { workspaceId: workspace.id },
      }),
    ]);

    return {
      workspace: {
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
      },
      subscription: sub,
      currentUsage: {
        activeJobsCount,
        activeJobLimit: sub.activeJobLimit,
        membersCount,
        candidateSearchLimit: sub.candidateSearchLimit,
      },
      availablePlans: Object.values(SUBSCRIPTION_TIER_PLANS),
    };
  }

  async updateSubscription(workspaceSlug: string, user: AuthUser, dto: UpdateSubscriptionInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'billing.manage');
    const planConfig = SUBSCRIPTION_TIER_PLANS[dto.tier];

    const currentSub = await this.db.workspaceSubscription.findUnique({
      where: { workspaceId: workspace.id },
    });

    const previousTier = currentSub?.tier || 'STARTER';
    const now = new Date();
    const cycleDurationDays = dto.billingCycle === 'ANNUAL' ? 365 : 30;
    const periodEnd = new Date(now.getTime() + cycleDurationDays * 24 * 60 * 60 * 1000);

    const updated = await this.db.workspaceSubscription.upsert({
      where: { workspaceId: workspace.id },
      create: {
        workspaceId: workspace.id,
        tier: dto.tier,
        status: 'ACTIVE',
        billingCycle: dto.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        activeJobLimit: planConfig.activeJobLimit,
        candidateSearchLimit: planConfig.candidateSearchLimit,
      },
      update: {
        tier: dto.tier,
        status: 'ACTIVE',
        billingCycle: dto.billingCycle,
        cancelAtPeriodEnd: false,
        activeJobLimit: planConfig.activeJobLimit,
        candidateSearchLimit: planConfig.candidateSearchLimit,
      },
    });

    await this.db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'SUBSCRIPTION_TIER_UPDATED',
        targetType: 'SUBSCRIPTION',
        targetId: updated.id,
        details: {
          previousTier,
          newTier: dto.tier,
          billingCycle: dto.billingCycle,
        },
      },
    });

    return updated;
  }

  async cancelSubscription(workspaceSlug: string, user: AuthUser, dto: CancelSubscriptionInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'billing.manage');

    const sub = await this.db.workspaceSubscription.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (!sub) {
      throw new HttpException({ code: 'NOT_FOUND', message: 'No active subscription found' }, 404);
    }

    const updated = await this.db.workspaceSubscription.update({
      where: { workspaceId: workspace.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    await this.db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'SUBSCRIPTION_CANCELED',
        targetType: 'SUBSCRIPTION',
        targetId: updated.id,
        details: {
          reason: dto.reason,
          effectiveDate: sub.currentPeriodEnd.toISOString(),
        },
      },
    });

    return updated;
  }
}

@ApiTags('billing')
@Controller('workspaces/:slug/billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Get()
  async getSubscription(@Param('slug') slug: string, @CurrentUser() user: AuthUser) {
    return this.billing.getSubscription(slug, user);
  }

  @Post('upgrade')
  async updateSubscription(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUser,
    @Body() rawBody: unknown,
  ) {
    const parsed = UpdateSubscriptionSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.billing.updateSubscription(slug, user, parsed.data);
  }

  @Post('cancel')
  async cancelSubscription(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUser,
    @Body() rawBody: unknown,
  ) {
    const parsed = CancelSubscriptionSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.billing.cancelSubscription(slug, user, parsed.data);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
