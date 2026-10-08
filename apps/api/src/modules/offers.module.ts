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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import type { OfferStatus } from '@executive-match/database';
import {
  CreateOfferSchema,
  UpdateOfferSchema,
  RescindOfferSchema,
  AcceptOfferSchema,
  DeclineOfferSchema,
  CreateOnboardingTaskSchema,
  UpdateOnboardingTaskStatusSchema,
} from '@executive-match/validation';

@Injectable()
export class OffersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  /**
   * Generates a new job offer in DRAFT status for a candidate application.
   */
  async createOffer(user: AuthUser, workspaceSlug: string, rawBody: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.write',
    );

    const parsed = CreateOfferSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const {
      applicationId,
      jobTitle,
      baseSalary,
      currency,
      bonus,
      equity,
      signOnBonus,
      startDate,
      expiresAt,
      workLocation,
      offerLetter,
      notes,
    } = parsed.data;

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id },
      },
      include: {
        job: { select: { id: true, title: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found within this workspace');
    }

    const offer = await this.db.jobOffer.create({
      data: {
        workspaceId: workspace.id,
        applicationId,
        jobTitle: jobTitle || application.job.title,
        baseSalary,
        currency,
        bonus: bonus ?? null,
        equity: equity ?? null,
        signOnBonus: signOnBonus ?? null,
        startDate: new Date(startDate),
        expiresAt: new Date(expiresAt),
        workLocation,
        offerLetter: offerLetter ?? null,
        notes: notes ?? null,
        status: 'DRAFT',
        createdById: user.id,
      },
      include: {
        application: {
          select: {
            id: true,
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
        createdBy: { select: { id: true, email: true, profile: true } },
      },
    });

    return { offer };
  }

  /**
   * Retrieves all offers managed within the workspace, with optional status filtering.
   */
  async getWorkspaceOffers(user: AuthUser, workspaceSlug: string, status?: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.read',
    );

    const whereClause: { workspaceId: string; status?: OfferStatus } = {
      workspaceId: workspace.id,
    };
    if (status && status !== 'ALL') {
      whereClause.status = status as OfferStatus;
    }

    const offers = await this.db.jobOffer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: {
            id: true,
            status: true,
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
        createdBy: { select: { id: true, email: true, profile: true } },
        approvedBy: { select: { id: true, email: true, profile: true } },
        signature: true,
        _count: { select: { onboardingTasks: true } },
      },
    });

    return { items: offers, total: offers.length };
  }

  /**
   * Retrieves detailed offer data including signature and onboarding checklist.
   */
  async getOfferDetails(user: AuthUser, workspaceSlug: string, offerId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.read',
    );

    const offer = await this.db.jobOffer.findFirst({
      where: { id: offerId, workspaceId: workspace.id },
      include: {
        application: {
          include: {
            candidateProfile: {
              include: {
                user: { select: { email: true, profile: true } },
                skills: { take: 10 },
              },
            },
            job: { select: { id: true, title: true, slug: true } },
          },
        },
        createdBy: { select: { id: true, email: true, profile: true } },
        approvedBy: { select: { id: true, email: true, profile: true } },
        signature: true,
        onboardingTasks: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    return { offer };
  }

  /**
   * Updates an offer prior to sending.
   */
  async updateOffer(
    user: AuthUser,
    workspaceSlug: string,
    offerId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.write',
    );

    const parsed = UpdateOfferSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const offer = await this.db.jobOffer.findFirst({
      where: { id: offerId, workspaceId: workspace.id },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== 'DRAFT' && offer.status !== 'PENDING_APPROVAL') {
      throw new HttpException(
        { code: 'INVALID_STATUS', message: 'Only draft or pending offers can be edited' },
        400,
      );
    }

    const data = parsed.data;
    const updated = await this.db.jobOffer.update({
      where: { id: offerId },
      data: {
        jobTitle: data.jobTitle,
        baseSalary: data.baseSalary,
        currency: data.currency,
        bonus: data.bonus,
        equity: data.equity,
        signOnBonus: data.signOnBonus,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        workLocation: data.workLocation,
        offerLetter: data.offerLetter,
        notes: data.notes,
        updatedAt: new Date(),
      },
    });

    return { offer: updated };
  }

  /**
   * Approves an offer internally.
   */
  async approveOffer(user: AuthUser, workspaceSlug: string, offerId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.write',
    );

    const offer = await this.db.jobOffer.findFirst({
      where: { id: offerId, workspaceId: workspace.id },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    const updated = await this.db.jobOffer.update({
      where: { id: offerId },
      data: {
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    return { offer: updated };
  }

  /**
   * Sends the official offer letter to the candidate, updating pipeline stage to OFFER.
   */
  async sendOffer(user: AuthUser, workspaceSlug: string, offerId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.write',
    );

    const offer = await this.db.jobOffer.findFirst({
      where: { id: offerId, workspaceId: workspace.id },
      include: { application: true },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== 'DRAFT' && offer.status !== 'PENDING_APPROVAL') {
      throw new HttpException(
        { code: 'INVALID_STATE', message: 'Offer has already been sent or finalized' },
        400,
      );
    }

    const [updatedOffer] = await this.db.$transaction([
      this.db.jobOffer.update({
        where: { id: offerId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      }),
      this.db.application.update({
        where: { id: offer.applicationId },
        data: {
          status: 'OFFERED',
          currentStage: 'OFFER',
        },
      }),
      this.db.applicationStageHistory.create({
        data: {
          applicationId: offer.applicationId,
          stage: 'OFFER',
          changedByUserId: user.id,
          notes: 'Official job offer dispatched to candidate.',
        },
      }),
    ]);

    return { offer: updatedOffer };
  }

  /**
   * Rescinds an active or draft job offer with an explicit reason.
   */
  async rescindOffer(
    user: AuthUser,
    workspaceSlug: string,
    offerId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'offers.write',
    );

    const parsed = RescindOfferSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const offer = await this.db.jobOffer.findFirst({
      where: { id: offerId, workspaceId: workspace.id },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    const updated = await this.db.jobOffer.update({
      where: { id: offerId },
      data: {
        status: 'RESCINDED',
        rescindReason: parsed.data.reason,
        updatedAt: new Date(),
      },
    });

    return { offer: updated };
  }

  /**
   * Creates an onboarding checklist item for an offer.
   */
  async createOnboardingTask(
    user: AuthUser,
    workspaceSlug: string,
    offerId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'onboarding.write',
    );

    const parsed = CreateOnboardingTaskSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const offer = await this.db.jobOffer.findFirst({
      where: { id: offerId, workspaceId: workspace.id },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    const task = await this.db.onboardingTask.create({
      data: {
        workspaceId: workspace.id,
        offerId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        category: parsed.data.category ?? 'GENERAL',
        required: parsed.data.required ?? true,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    });

    return { task };
  }

  /**
   * Updates an onboarding task status by recruiter or admin.
   */
  async updateOnboardingTaskStatus(
    user: AuthUser,
    workspaceSlug: string,
    taskId: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'onboarding.write',
    );

    const parsed = UpdateOnboardingTaskStatusSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const task = await this.db.onboardingTask.findFirst({
      where: { id: taskId, workspaceId: workspace.id },
    });

    if (!task) {
      throw new NotFoundException('Onboarding task not found');
    }

    const updated = await this.db.onboardingTask.update({
      where: { id: taskId },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === 'COMPLETED' ? new Date() : null,
        completedByUserId: parsed.data.status === 'COMPLETED' ? user.id : null,
      },
    });

    return { task: updated };
  }

  // ==========================================
  // CANDIDATE PORTAL METHODS
  // ==========================================

  /**
   * Retrieves all dispatched offers for the logged-in candidate.
   */
  async getCandidateOffers(user: AuthUser) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      return { items: [] };
    }

    const offers = await this.db.jobOffer.findMany({
      where: {
        application: { candidateProfileId: candidate.id },
        status: { in: ['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'RESCINDED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
                workspace: {
                  select: {
                    name: true,
                    company: { select: { name: true, slug: true, location: true } },
                  },
                },
              },
            },
          },
        },
        signature: true,
        onboardingTasks: { orderBy: { createdAt: 'asc' } },
      },
    });

    return { items: offers };
  }

  /**
   * Candidate views single offer details.
   */
  async getCandidateOfferDetails(user: AuthUser, offerId: string) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const offer = await this.db.jobOffer.findFirst({
      where: {
        id: offerId,
        application: { candidateProfileId: candidate.id },
        status: { in: ['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'RESCINDED'] },
      },
      include: {
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
                workspace: {
                  select: {
                    name: true,
                    company: { select: { name: true, slug: true, location: true } },
                  },
                },
              },
            },
          },
        },
        signature: true,
        onboardingTasks: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    return { offer };
  }

  /**
   * Digitally accepts an offer with e-signature and seeds the onboarding checklist.
   */
  async acceptOffer(
    user: AuthUser,
    offerId: string,
    rawBody: unknown,
    reqInfo: { ip?: string; userAgent?: string },
  ) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const parsed = AcceptOfferSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const offer = await this.db.jobOffer.findFirst({
      where: {
        id: offerId,
        application: { candidateProfileId: candidate.id },
      },
      include: { application: true },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== 'SENT') {
      throw new HttpException(
        { code: 'INVALID_STATUS', message: 'Offer is not awaiting acceptance' },
        400,
      );
    }

    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
      await this.db.jobOffer.update({
        where: { id: offerId },
        data: { status: 'EXPIRED' },
      });
      throw new HttpException(
        { code: 'OFFER_EXPIRED', message: 'This job offer has expired' },
        400,
      );
    }

    const { signerName, signatureText } = parsed.data;

    // Transactionally sign offer, hire candidate, and seed onboarding tasks
    const [updatedOffer, signature] = await this.db.$transaction([
      this.db.jobOffer.update({
        where: { id: offerId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      }),
      this.db.offerSignature.create({
        data: {
          offerId,
          signerName,
          signerEmail: user.email,
          signatureText,
          ipAddress: reqInfo.ip ?? null,
          userAgent: reqInfo.userAgent ?? null,
          signedAt: new Date(),
        },
      }),
      this.db.application.update({
        where: { id: offer.applicationId },
        data: {
          status: 'HIRED',
          currentStage: 'HIRED',
        },
      }),
      this.db.applicationStageHistory.create({
        data: {
          applicationId: offer.applicationId,
          stage: 'HIRED',
          notes: `Offer accepted and digitally signed by ${signerName}.`,
        },
      }),
      // Seed default onboarding checklist
      this.db.onboardingTask.createMany({
        data: [
          {
            workspaceId: offer.workspaceId,
            offerId,
            title: 'Sign Employee Confidentiality & IP Agreement',
            description: 'Review and confirm intellectual property assignment terms.',
            category: 'COMPLIANCE',
            required: true,
          },
          {
            workspaceId: offer.workspaceId,
            offerId,
            title: 'Submit Direct Deposit & Tax Documents',
            description: 'Provide banking details and W-4 / W-8BEN tax withholding forms.',
            category: 'DOCUMENTATION',
            required: true,
          },
          {
            workspaceId: offer.workspaceId,
            offerId,
            title: 'Verify Identity & Right to Work Documentation',
            description: 'Upload legal government-issued identification.',
            category: 'COMPLIANCE',
            required: true,
          },
          {
            workspaceId: offer.workspaceId,
            offerId,
            title: 'Complete Emergency Contact & Benefits Enrollment',
            description: 'Submit emergency contact info and select health/dental elections.',
            category: 'GENERAL',
            required: false,
          },
          {
            workspaceId: offer.workspaceId,
            offerId,
            title: 'Setup Developer Workstation & SSO Accounts',
            description: 'Configure corporate security keys and access development repos.',
            category: 'IT_SETUP',
            required: true,
          },
        ],
      }),
    ]);

    return { success: true, offer: updatedOffer, signature };
  }

  /**
   * Candidate declines offer with optional reason.
   */
  async declineOffer(user: AuthUser, offerId: string, rawBody: unknown) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const parsed = DeclineOfferSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const offer = await this.db.jobOffer.findFirst({
      where: {
        id: offerId,
        application: { candidateProfileId: candidate.id },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== 'SENT') {
      throw new HttpException(
        { code: 'INVALID_STATUS', message: 'Offer is not awaiting candidate response' },
        400,
      );
    }

    const reason = parsed.data.reason;
    await this.db.$transaction([
      this.db.jobOffer.update({
        where: { id: offerId },
        data: {
          status: 'DECLINED',
          declineReason: reason ?? null,
          respondedAt: new Date(),
        },
      }),
      this.db.application.update({
        where: { id: offer.applicationId },
        data: {
          withdrawnReason: reason || 'Candidate declined job offer.',
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * Candidate gets active onboarding checklist tasks.
   */
  async getCandidateOnboarding(user: AuthUser) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      return { tasks: [], completedCount: 0, totalCount: 0 };
    }

    const tasks = await this.db.onboardingTask.findMany({
      where: {
        offer: {
          application: { candidateProfileId: candidate.id },
          status: 'ACCEPTED',
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        offer: {
          select: {
            id: true,
            jobTitle: true,
            startDate: true,
            workspace: {
              select: {
                name: true,
                company: { select: { name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

    return {
      tasks,
      completedCount,
      totalCount: tasks.length,
    };
  }

  /**
   * Candidate marks an onboarding task as completed.
   */
  async completeCandidateOnboardingTask(user: AuthUser, taskId: string) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const task = await this.db.onboardingTask.findFirst({
      where: {
        id: taskId,
        offer: {
          application: { candidateProfileId: candidate.id },
          status: 'ACCEPTED',
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Onboarding task not found');
    }

    const updated = await this.db.onboardingTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedByUserId: user.id,
      },
    });

    return { task: updated };
  }
}

@Controller('workspaces/:workspaceSlug/offers')
@UseGuards(AuthGuard)
export class WorkspaceOffersController {
  constructor(private readonly service: OffersService) {}

  @Get()
  async listOffers(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('status') status?: string,
  ) {
    return this.service.getWorkspaceOffers(user, workspaceSlug, status);
  }

  @Post()
  async createOffer(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() body: unknown,
  ) {
    return this.service.createOffer(user, workspaceSlug, body);
  }

  @Get(':offerId')
  async getOffer(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('offerId') offerId: string,
  ) {
    return this.service.getOfferDetails(user, workspaceSlug, offerId);
  }

  @Patch(':offerId')
  async updateOffer(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('offerId') offerId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateOffer(user, workspaceSlug, offerId, body);
  }

  @Post(':offerId/approve')
  async approveOffer(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('offerId') offerId: string,
  ) {
    return this.service.approveOffer(user, workspaceSlug, offerId);
  }

  @Post(':offerId/send')
  async sendOffer(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('offerId') offerId: string,
  ) {
    return this.service.sendOffer(user, workspaceSlug, offerId);
  }

  @Post(':offerId/rescind')
  async rescindOffer(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('offerId') offerId: string,
    @Body() body: unknown,
  ) {
    return this.service.rescindOffer(user, workspaceSlug, offerId, body);
  }

  @Post(':offerId/tasks')
  async createTask(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('offerId') offerId: string,
    @Body() body: unknown,
  ) {
    return this.service.createOnboardingTask(user, workspaceSlug, offerId, body);
  }

  @Patch('tasks/:taskId')
  async updateTaskStatus(
    @CurrentUser() user: AuthUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateOnboardingTaskStatus(user, workspaceSlug, taskId, body);
  }
}

@Controller('candidates/me/offers')
@UseGuards(AuthGuard)
export class CandidateOffersController {
  constructor(private readonly service: OffersService) {}

  @Get()
  async listOffers(@CurrentUser() user: AuthUser) {
    return this.service.getCandidateOffers(user);
  }

  @Get(':offerId')
  async getOffer(
    @CurrentUser() user: AuthUser,
    @Param('offerId') offerId: string,
  ) {
    return this.service.getCandidateOfferDetails(user, offerId);
  }

  @Post(':offerId/accept')
  async acceptOffer(
    @CurrentUser() user: AuthUser,
    @Param('offerId') offerId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.service.acceptOffer(user, offerId, body, { ip, userAgent });
  }

  @Post(':offerId/decline')
  async declineOffer(
    @CurrentUser() user: AuthUser,
    @Param('offerId') offerId: string,
    @Body() body: unknown,
  ) {
    return this.service.declineOffer(user, offerId, body);
  }
}

@Controller('candidates/me/onboarding')
@UseGuards(AuthGuard)
export class CandidateOnboardingController {
  constructor(private readonly service: OffersService) {}

  @Get()
  async getOnboarding(@CurrentUser() user: AuthUser) {
    return this.service.getCandidateOnboarding(user);
  }

  @Patch('tasks/:taskId/complete')
  async completeTask(
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
  ) {
    return this.service.completeCandidateOnboardingTask(user, taskId);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [
    WorkspaceOffersController,
    CandidateOffersController,
    CandidateOnboardingController,
  ],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
