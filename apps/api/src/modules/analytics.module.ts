import {
  Controller,
  Get,
  HttpException,
  Inject,
  Injectable,
  Module,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@executive-match/database';
import {
  AnalyticsQuerySchema,
  type AnalyticsQueryInput,
} from '@executive-match/validation';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(WorkspaceAccessService) private readonly access: WorkspaceAccessService,
  ) {}

  async getWorkspaceAnalytics(workspaceSlug: string, user: AuthUser, query: AnalyticsQueryInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'analytics.read');

    const whereApp: Prisma.ApplicationWhereInput = {
      job: {
        workspaceId: workspace.id,
        deletedAt: null,
      },
    };

    if (query.jobId) {
      whereApp.jobId = query.jobId;
    }

    if (query.from || query.to) {
      whereApp.createdAt = {};
      if (query.from) whereApp.createdAt.gte = new Date(query.from);
      if (query.to) whereApp.createdAt.lte = new Date(query.to);
    }

    const [applications, jobs] = await Promise.all([
      this.db.application.findMany({
        where: whereApp,
        include: {
          job: { select: { id: true, title: true, slug: true, status: true, department: true } },
          stageHistory: { orderBy: { createdAt: 'asc' } },
          offers: { select: { id: true, status: true, baseSalary: true, currency: true } },
          interviews: {
            include: {
              scorecards: { select: { overallRating: true, recommendation: true } },
            },
          },
        },
      }),
      this.db.job.findMany({
        where: { workspaceId: workspace.id, deletedAt: null },
        select: { id: true, title: true, slug: true, status: true, department: true },
      }),
    ]);

    const totalApplicants = applications.length;

    let appliedCount = 0;
    let screeningCount = 0;
    let interviewCount = 0;
    let offerCount = 0;
    let hiredCount = 0;
    let rejectedCount = 0;
    let withdrawnCount = 0;

    const timeToHireDaysList: number[] = [];
    const allScorecards: Array<{ overallRating: number; recommendation: string }> = [];
    let totalInterviews = 0;
    let completedInterviews = 0;

    let allOffersCount = 0;
    let acceptedOffersCount = 0;
    let declinedOffersCount = 0;
    let pendingOffersCount = 0;

    for (const app of applications) {
      appliedCount += 1;

      const stagesVisited = new Set<string>();
      stagesVisited.add(app.currentStage.toUpperCase());
      for (const history of app.stageHistory) {
        stagesVisited.add(history.stage.toUpperCase());
      }

      if (
        stagesVisited.has('SCREENING') ||
        stagesVisited.has('PHONE_SCREEN') ||
        stagesVisited.has('REVIEW') ||
        stagesVisited.has('IN_REVIEW')
      ) {
        screeningCount += 1;
      }

      if (
        stagesVisited.has('INTERVIEW') ||
        stagesVisited.has('INTERVIEWING') ||
        stagesVisited.has('TECHNICAL') ||
        stagesVisited.has('FINAL') ||
        app.interviews.length > 0
      ) {
        interviewCount += 1;
      }

      if (stagesVisited.has('OFFER') || stagesVisited.has('OFFERED') || app.offers.length > 0) {
        offerCount += 1;
      }

      if (app.status === 'HIRED' || stagesVisited.has('HIRED')) {
        hiredCount += 1;
        const hiredRecord = app.stageHistory.find((s) => s.stage.toUpperCase() === 'HIRED');
        const hiredTimestamp = hiredRecord ? hiredRecord.createdAt.getTime() : app.updatedAt.getTime();
        const durationDays = Math.max(1, Math.round((hiredTimestamp - app.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
        timeToHireDaysList.push(durationDays);
      } else if (app.status === 'REJECTED') {
        rejectedCount += 1;
      } else if (app.status === 'WITHDRAWN') {
        withdrawnCount += 1;
      }

      for (const inv of app.interviews) {
        totalInterviews += 1;
        if (inv.status === 'COMPLETED') completedInterviews += 1;
        for (const sc of inv.scorecards) {
          allScorecards.push(sc);
        }
      }

      for (const off of app.offers) {
        allOffersCount += 1;
        if (off.status === 'ACCEPTED') acceptedOffersCount += 1;
        else if (off.status === 'DECLINED') declinedOffersCount += 1;
        else if (off.status === 'SENT' || off.status === 'PENDING_APPROVAL') pendingOffersCount += 1;
      }
    }

    // Adjust funnel hierarchy if intermediate stages were bypassed directly
    screeningCount = Math.max(screeningCount, interviewCount);
    interviewCount = Math.max(interviewCount, offerCount);
    offerCount = Math.max(offerCount, hiredCount);

    const averageTimeToHireDays =
      timeToHireDaysList.length > 0
        ? Math.round(timeToHireDaysList.reduce((acc, d) => acc + d, 0) / timeToHireDaysList.length)
        : null;

    const offerAcceptanceRate =
      acceptedOffersCount + declinedOffersCount > 0
        ? Math.round((acceptedOffersCount / (acceptedOffersCount + declinedOffersCount)) * 100)
        : null;

    const avgScorecardRating =
      allScorecards.length > 0
        ? Number(
            (allScorecards.reduce((acc, sc) => acc + sc.overallRating, 0) / allScorecards.length).toFixed(1),
          )
        : null;

    const recommendationCounts = {
      STRONG_HIRE: allScorecards.filter((sc) => sc.recommendation === 'STRONG_HIRE').length,
      HIRE: allScorecards.filter((sc) => sc.recommendation === 'HIRE').length,
      NO_HIRE: allScorecards.filter((sc) => sc.recommendation === 'NO_HIRE').length,
      STRONG_NO_HIRE: allScorecards.filter((sc) => sc.recommendation === 'STRONG_NO_HIRE').length,
    };

    const jobBreakdown = jobs.map((job) => {
      const jobApps = applications.filter((app) => app.jobId === job.id);
      const hires = jobApps.filter((app) => app.status === 'HIRED').length;
      const active = jobApps.filter(
        (app) => app.status !== 'HIRED' && app.status !== 'REJECTED' && app.status !== 'WITHDRAWN',
      ).length;

      return {
        id: job.id,
        title: job.title,
        slug: job.slug,
        status: job.status,
        department: job.department,
        totalApplicants: jobApps.length,
        activeApplicants: active,
        hiresCount: hires,
      };
    });

    return {
      workspace: {
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
      },
      summary: {
        totalApplicants,
        activePipelineCount: totalApplicants - hiredCount - rejectedCount - withdrawnCount,
        hiredCount,
        rejectedCount,
        withdrawnCount,
        averageTimeToHireDays,
        offerAcceptanceRate,
      },
      funnel: {
        applied: appliedCount,
        screening: screeningCount,
        interview: interviewCount,
        offer: offerCount,
        hired: hiredCount,
        conversionRates: {
          appliedToScreening: appliedCount > 0 ? Math.round((screeningCount / appliedCount) * 100) : 0,
          screeningToInterview: screeningCount > 0 ? Math.round((interviewCount / screeningCount) * 100) : 0,
          interviewToOffer: interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0,
          offerToHire: offerCount > 0 ? Math.round((hiredCount / offerCount) * 100) : 0,
          overallConversion: appliedCount > 0 ? Math.round((hiredCount / appliedCount) * 100) : 0,
        },
      },
      offers: {
        totalOffers: allOffersCount,
        accepted: acceptedOffersCount,
        declined: declinedOffersCount,
        pending: pendingOffersCount,
        acceptanceRate: offerAcceptanceRate,
      },
      interviews: {
        totalInterviews,
        completedInterviews,
        averageRating: avgScorecardRating,
        recommendations: recommendationCounts,
      },
      jobBreakdown,
    };
  }
}

@ApiTags('analytics')
@Controller('workspaces/:slug/analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analytics: AnalyticsService) {}

  @Get()
  async getWorkspaceAnalytics(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUser,
    @Query() rawQuery: unknown,
  ) {
    const parsed = AnalyticsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.analytics.getWorkspaceAnalytics(slug, user, parsed.data);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
