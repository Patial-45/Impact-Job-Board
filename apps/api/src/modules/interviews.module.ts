import {
  Body,
  Controller,
  Get,
  HttpException,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import {
  CreateInterviewSchema,
  UpdateInterviewSchema,
  CancelInterviewSchema,
  SubmitScorecardSchema,
  CreateAssessmentSchema,
  InviteAssessmentSchema,
  CompleteAssessmentSchema,
} from '@executive-match/validation';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  /**
   * Schedule a new interview round for an application within the workspace.
   */
  async createInterview(user: AuthUser, workspaceSlug: string, rawBody: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'interviews.write',
    );

    const parsed = CreateInterviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const {
      applicationId,
      title,
      type,
      scheduledAt,
      durationMinutes,
      location,
      timezone,
      notes,
      participantUserIds,
    } = parsed.data;

    // Verify application exists and belongs to a job in this workspace
    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id, deletedAt: null },
      },
      include: {
        candidateProfile: {
          include: {
            user: { select: { email: true, profile: true } },
          },
        },
        job: { select: { title: true, slug: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found in this workspace');
    }

    // Create interview with participants
    const interview = await this.db.interview.create({
      data: {
        workspaceId: workspace.id,
        applicationId,
        title,
        type,
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        location: location || null,
        timezone,
        notes: notes || null,
        participants: participantUserIds && participantUserIds.length > 0
          ? {
              create: participantUserIds.map((userId) => ({
                userId,
                role: 'INTERVIEWER',
              })),
            }
          : {
              create: [
                {
                  userId: user.id,
                  role: 'LEAD_INTERVIEWER',
                },
              ],
            },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        application: {
          select: {
            id: true,
            currentStage: true,
            candidateProfile: {
              select: {
                id: true,
                headline: true,
                user: { select: { email: true, profile: true } },
              },
            },
            job: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    // Automatically transition application stage to INTERVIEWING if in early stage
    if (application.currentStage === 'APPLIED' || application.currentStage === 'SCREENING') {
      await this.db.application.update({
        where: { id: applicationId },
        data: {
          currentStage: 'INTERVIEW',
          status: 'INTERVIEWING',
          stageHistory: {
            create: {
              stage: 'INTERVIEW',
              changedByUserId: user.id,
              notes: `Interview scheduled: ${title}`,
            },
          },
        },
      });
    }

    return { interview };
  }

  /**
   * Retrieves all scheduled and completed interviews for a workspace.
   */
  async getWorkspaceInterviews(
    user: AuthUser,
    workspaceSlug: string,
    query?: { status?: string; type?: string },
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'interviews.read',
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { workspaceId: workspace.id };
    if (query?.status) whereClause.status = query.status;
    if (query?.type) whereClause.type = query.type;

    const interviews = await this.db.interview.findMany({
      where: whereClause,
      orderBy: { scheduledAt: 'asc' },
      include: {
        application: {
          select: {
            id: true,
            currentStage: true,
            status: true,
            candidateProfile: {
              select: {
                id: true,
                headline: true,
                location: true,
                user: { select: { email: true, profile: true } },
              },
            },
            job: { select: { id: true, title: true, slug: true } },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        scorecards: {
          select: {
            id: true,
            evaluatorId: true,
            recommendation: true,
            overallRating: true,
            submittedAt: true,
          },
        },
      },
    });

    return { items: interviews, total: interviews.length };
  }

  /**
   * Retrieves detailed interview data including all scorecard assessments.
   */
  async getInterviewDetails(user: AuthUser, workspaceSlug: string, interviewId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'interviews.read',
    );

    const interview = await this.db.interview.findFirst({
      where: { id: interviewId, workspaceId: workspace.id },
      include: {
        application: {
          include: {
            candidateProfile: {
              include: {
                user: { select: { email: true, profile: true } },
                skills: { take: 10 },
                experiences: { take: 3, orderBy: { startDate: 'desc' } },
              },
            },
            job: { select: { id: true, title: true, slug: true, department: true } },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        scorecards: {
          include: {
            evaluator: { select: { id: true, email: true, profile: true } },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return { interview };
  }

  /**
   * Updates an existing interview (time, location, notes).
   */
  async updateInterview(
    user: AuthUser,
    workspaceSlug: string,
    interviewId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'interviews.write',
    );

    const parsed = UpdateInterviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const existing = await this.db.interview.findFirst({
      where: { id: interviewId, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    const data = parsed.data;
    const updated = await this.db.interview.update({
      where: { id: interviewId },
      data: {
        title: data.title ?? undefined,
        type: data.type ?? undefined,
        status: data.status ?? undefined,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        durationMinutes: data.durationMinutes ?? undefined,
        location: data.location !== undefined ? data.location : undefined,
        timezone: data.timezone ?? undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
    });

    return { interview: updated };
  }

  /**
   * Cancels an interview with reason.
   */
  async cancelInterview(
    user: AuthUser,
    workspaceSlug: string,
    interviewId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'interviews.write',
    );

    const parsed = CancelInterviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const existing = await this.db.interview.findFirst({
      where: { id: interviewId, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    const updated = await this.db.interview.update({
      where: { id: interviewId },
      data: {
        status: 'CANCELLED',
        cancellationReason: parsed.data.cancellationReason || 'Cancelled by recruiter',
      },
    });

    return { interview: updated };
  }

  /**
   * Evaluator submits or updates a scorecard for an interview session.
   */
  async submitScorecard(
    user: AuthUser,
    workspaceSlug: string,
    interviewId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'interviews.write',
    );

    const parsed = SubmitScorecardSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const interview = await this.db.interview.findFirst({
      where: { id: interviewId, workspaceId: workspace.id },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const data = parsed.data;
    const scorecard = await this.db.interviewScorecard.upsert({
      where: {
        interviewId_evaluatorId: {
          interviewId,
          evaluatorId: user.id,
        },
      },
      create: {
        interviewId,
        evaluatorId: user.id,
        recommendation: data.recommendation,
        overallRating: data.overallRating,
        technicalRating: data.technicalRating ?? null,
        communicationRating: data.communicationRating ?? null,
        leadershipRating: data.leadershipRating ?? null,
        cultureRating: data.cultureRating ?? null,
        strengths: data.strengths ?? null,
        weaknesses: data.weaknesses ?? null,
        notes: data.notes ?? null,
      },
      update: {
        recommendation: data.recommendation,
        overallRating: data.overallRating,
        technicalRating: data.technicalRating ?? null,
        communicationRating: data.communicationRating ?? null,
        leadershipRating: data.leadershipRating ?? null,
        cultureRating: data.cultureRating ?? null,
        strengths: data.strengths ?? null,
        weaknesses: data.weaknesses ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });

    // If interview was in SCHEDULED state, mark COMPLETED
    if (interview.status === 'SCHEDULED') {
      await this.db.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' },
      });
    }

    return { scorecard };
  }

  /**
   * Candidate views scheduled interviews across all their applications.
   */
  async getCandidateInterviews(user: AuthUser) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      return { items: [] };
    }

    const interviews = await this.db.interview.findMany({
      where: {
        application: { candidateProfileId: candidate.id },
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        durationMinutes: true,
        location: true,
        timezone: true,
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
                workspace: {
                  select: { company: { select: { name: true, slug: true } } },
                },
              },
            },
          },
        },
      },
    });

    return { items: interviews };
  }
}

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  /**
   * Creates a reusable assessment questionnaire/rubric for the workspace.
   */
  async createAssessment(user: AuthUser, workspaceSlug: string, rawBody: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'assessments.write',
    );

    const parsed = CreateAssessmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const { title, description, timeLimitMinutes, passingScore, questions } = parsed.data;
    const assessment = await this.db.assessment.create({
      data: {
        workspaceId: workspace.id,
        title,
        description: description || null,
        timeLimitMinutes: timeLimitMinutes || null,
        passingScore: passingScore || null,
        questions: questions || null,
      },
    });

    return { assessment };
  }

  /**
   * Retrieves all assessments defined in the workspace.
   */
  async getWorkspaceAssessments(user: AuthUser, workspaceSlug: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'assessments.read',
    );

    const assessments = await this.db.assessment.findMany({
      where: { workspaceId: workspace.id },
      include: {
        _count: { select: { invites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { items: assessments };
  }

  /**
   * Invites an applicant to complete an assessment.
   */
  async inviteCandidateAssessment(user: AuthUser, workspaceSlug: string, rawBody: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'assessments.write',
    );

    const parsed = InviteAssessmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const { assessmentId, applicationId, expiresInDays } = parsed.data;

    // Verify assessment belongs to this workspace
    const assessment = await this.db.assessment.findFirst({
      where: { id: assessmentId, workspaceId: workspace.id },
    });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // Verify application belongs to workspace
    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id, deletedAt: null },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await this.db.assessmentInvite.upsert({
      where: {
        assessmentId_applicationId: {
          assessmentId,
          applicationId,
        },
      },
      create: {
        assessmentId,
        applicationId,
        token,
        status: 'PENDING',
        expiresAt,
      },
      update: {
        token,
        status: 'PENDING',
        expiresAt,
        score: null,
        feedback: null,
        completedAt: null,
      },
    });

    return { invite };
  }

  /**
   * Submits or scores an assessment invite.
   */
  async submitAssessmentResult(
    user: AuthUser,
    workspaceSlug: string,
    inviteId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'assessments.write',
    );

    const parsed = CompleteAssessmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const invite = await this.db.assessmentInvite.findFirst({
      where: {
        id: inviteId,
        assessment: { workspaceId: workspace.id },
      },
    });

    if (!invite) {
      throw new NotFoundException('Assessment invite not found');
    }

    const updated = await this.db.assessmentInvite.update({
      where: { id: inviteId },
      data: {
        status: 'COMPLETED',
        score: parsed.data.score,
        feedback: parsed.data.feedback || null,
        completedAt: new Date(),
      },
    });

    return { invite: updated };
  }

  /**
   * Candidate views pending and completed assessments across their applications.
   */
  async getCandidateAssessments(user: AuthUser) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      return { items: [] };
    }

    const invites = await this.db.assessmentInvite.findMany({
      where: {
        application: { candidateProfileId: candidate.id },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimitMinutes: true,
            passingScore: true,
          },
        },
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                workspace: {
                  select: { company: { select: { name: true, slug: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { items: invites };
  }
}

// -------------------------------------------------------------
// Controllers
// -------------------------------------------------------------

@Controller('workspaces/:slug/interviews')
@UseGuards(AuthGuard)
export class WorkspaceInterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  createInterview(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Body() body: unknown,
  ) {
    return this.interviewsService.createInterview(user, workspaceSlug, body);
  }

  @Get()
  getWorkspaceInterviews(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.interviewsService.getWorkspaceInterviews(user, workspaceSlug, {
      status,
      type,
    });
  }

  @Get(':id')
  getInterviewDetails(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('id') interviewId: string,
  ) {
    return this.interviewsService.getInterviewDetails(user, workspaceSlug, interviewId);
  }

  @Patch(':id')
  updateInterview(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('id') interviewId: string,
    @Body() body: unknown,
  ) {
    return this.interviewsService.updateInterview(user, workspaceSlug, interviewId, body);
  }

  @Post(':id/cancel')
  cancelInterview(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('id') interviewId: string,
    @Body() body: unknown,
  ) {
    return this.interviewsService.cancelInterview(user, workspaceSlug, interviewId, body);
  }

  @Post(':id/scorecards')
  submitScorecard(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('id') interviewId: string,
    @Body() body: unknown,
  ) {
    return this.interviewsService.submitScorecard(user, workspaceSlug, interviewId, body);
  }
}

@Controller('workspaces/:slug/assessments')
@UseGuards(AuthGuard)
export class WorkspaceAssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  createAssessment(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Body() body: unknown,
  ) {
    return this.assessmentsService.createAssessment(user, workspaceSlug, body);
  }

  @Get()
  getWorkspaceAssessments(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
  ) {
    return this.assessmentsService.getWorkspaceAssessments(user, workspaceSlug);
  }

  @Post('invites')
  inviteCandidateAssessment(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Body() body: unknown,
  ) {
    return this.assessmentsService.inviteCandidateAssessment(user, workspaceSlug, body);
  }

  @Patch('invites/:inviteId')
  submitAssessmentResult(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('inviteId') inviteId: string,
    @Body() body: unknown,
  ) {
    return this.assessmentsService.submitAssessmentResult(
      user,
      workspaceSlug,
      inviteId,
      body,
    );
  }
}

@Controller('candidates/me')
@UseGuards(AuthGuard)
export class CandidateInterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly assessmentsService: AssessmentsService,
  ) {}

  @Get('interviews')
  getCandidateInterviews(@CurrentUser() user: AuthUser) {
    return this.interviewsService.getCandidateInterviews(user);
  }

  @Get('assessments')
  getCandidateAssessments(@CurrentUser() user: AuthUser) {
    return this.assessmentsService.getCandidateAssessments(user);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [
    WorkspaceInterviewsController,
    WorkspaceAssessmentsController,
    CandidateInterviewsController,
  ],
  providers: [InterviewsService, AssessmentsService],
  exports: [InterviewsService, AssessmentsService],
})
export class InterviewsModule {}
