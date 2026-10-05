import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { OBJECT_STORAGE } from '../platform/storage.module';
import type { ObjectStorage } from '@executive-match/storage';
import type { ApplicationStatus } from '@executive-match/database';
import {
  ApplyJobSchema,
  UpdateApplicationStageSchema,
  UpdateApplicationStatusSchema,
  WithdrawApplicationSchema,
  CreateApplicationNoteSchema,
  ApplicationQuerySchema,
} from '@executive-match/validation';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  // --- Candidate Application Flows ---

  async applyToJob(user: AuthUser, jobSlug: string, input: unknown) {
    const parsed = ApplyJobSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    // Ensure or find candidate profile
    let candidateProfile = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidateProfile) {
      candidateProfile = await this.db.candidateProfile.create({
        data: { userId: user.id },
      });
    }

    // Find published job
    const job = await this.db.job.findFirst({
      where: {
        slug: jobSlug,
        status: 'PUBLISHED',
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      include: {
        workspace: {
          select: {
            id: true,
            slug: true,
            company: {
              select: {
                name: true,
                slug: true,
                logoKey: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or is no longer accepting applications');
    }

    // Check duplicate application
    const existing = await this.db.application.findUnique({
      where: {
        jobId_candidateProfileId: {
          jobId: job.id,
          candidateProfileId: candidateProfile.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted an application for this job');
    }

    // Resolve resume
    let resumeId: string | null = null;
    if (parsed.data.resumeId) {
      const resume = await this.db.candidateResume.findFirst({
        where: {
          id: parsed.data.resumeId,
          candidateProfileId: candidateProfile.id,
        },
      });
      if (!resume) {
        throw new BadRequestException('Selected resume not found');
      }
      resumeId = resume.id;
    } else {
      // Pick primary resume if available
      const primaryResume = await this.db.candidateResume.findFirst({
        where: {
          candidateProfileId: candidateProfile.id,
          isPrimary: true,
        },
      });
      if (primaryResume) {
        resumeId = primaryResume.id;
      } else {
        const latestResume = await this.db.candidateResume.findFirst({
          where: { candidateProfileId: candidateProfile.id },
          orderBy: { createdAt: 'desc' },
        });
        if (latestResume) {
          resumeId = latestResume.id;
        }
      }
    }

    // Transactionally create application and stage history
    return this.db.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          jobId: job.id,
          candidateProfileId: candidateProfile.id,
          resumeId,
          status: 'SUBMITTED',
          currentStage: 'APPLIED',
          coverLetter: parsed.data.coverLetter || null,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          stage: 'APPLIED',
          changedByUserId: user.id,
          notes: 'Application submitted by candidate',
        },
      });

      return {
        ...application,
        job: {
          id: job.id,
          title: job.title,
          slug: job.slug,
          company: job.workspace.company,
        },
      };
    });
  }

  async getCandidateApplications(user: AuthUser) {
    const candidateProfile = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidateProfile) {
      return { items: [], total: 0 };
    }

    const applications = await this.db.application.findMany({
      where: { candidateProfileId: candidateProfile.id },
      include: {
        job: {
          select: {
            id: true,
            slug: true,
            title: true,
            department: true,
            location: true,
            remoteType: true,
            employmentType: true,
            status: true,
            workspace: {
              select: {
                slug: true,
                company: {
                  select: {
                    name: true,
                    slug: true,
                    logoKey: true,
                  },
                },
              },
            },
          },
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
          },
        },
        stageHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: applications,
      total: applications.length,
    };
  }

  async withdrawApplication(user: AuthUser, applicationId: string, input: unknown) {
    const parsed = WithdrawApplicationSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        candidateProfile: { userId: user.id },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status === 'WITHDRAWN') {
      return application;
    }

    if (application.status === 'HIRED') {
      throw new BadRequestException('Cannot withdraw an accepted/hired offer');
    }

    return this.db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: application.id },
        data: {
          status: 'WITHDRAWN',
          withdrawnReason: parsed.data.reason || null,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          stage: 'WITHDRAWN',
          changedByUserId: user.id,
          notes: parsed.data.reason ? `Candidate withdrew: ${parsed.data.reason}` : 'Candidate withdrew application',
        },
      });

      return updated;
    });
  }

  // --- Recruiter ATS Pipeline Flows (Tenant Scoped) ---

  async getJobApplications(user: AuthUser, workspaceSlug: string, jobSlug: string, query: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'applications.read',
    );

    const job = await this.db.job.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: jobSlug,
        deletedAt: null,
      },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    const parsedQuery = ApplicationQuerySchema.safeParse(query);
    const { stage, status, page, pageSize } = parsedQuery.success
      ? parsedQuery.data
      : { stage: undefined, status: undefined, page: 1, pageSize: 20 };

    const where: {
      jobId: string;
      currentStage?: string;
      status?: ApplicationStatus;
    } = { jobId: job.id };

    if (stage) where.currentStage = stage;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.db.application.findMany({
        where,
        include: {
          candidateProfile: {
            include: {
              user: {
                select: {
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarKey: true,
                    },
                  },
                },
              },
              skills: {
                take: 5,
                orderBy: { isPrimary: 'desc' },
                select: {
                  name: true,
                  yearsOfExperience: true,
                  isPrimary: true,
                },
              },
            },
          },
          resume: {
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              parsingStatus: true,
            },
          },
          _count: {
            select: {
              notes: true,
            },
          },
          stageHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.application.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async getApplicationDetail(user: AuthUser, workspaceSlug: string, applicationId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'applications.read',
    );

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id },
      },
      include: {
        job: {
          select: {
            id: true,
            slug: true,
            title: true,
            department: true,
            status: true,
          },
        },
        candidateProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            experiences: { orderBy: { startDate: 'desc' } },
            educations: { orderBy: { startDate: 'desc' } },
            skills: { orderBy: { isPrimary: 'desc' } },
          },
        },
        resume: true,
        stageHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedByUser: {
              select: {
                email: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                email: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    let resumeDownloadUrl: string | null = null;
    if (application.resume) {
      resumeDownloadUrl = await this.storage.createDownloadUrl(application.resume.fileKey, 900);
    }

    return {
      ...application,
      resumeDownloadUrl,
    };
  }

  async updateApplicationStage(
    user: AuthUser,
    workspaceSlug: string,
    applicationId: string,
    input: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'applications.write',
    );

    const parsed = UpdateApplicationStageSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const nextStage = parsed.data.stage.toUpperCase();
    let newStatus = application.status;

    // Automatically synchronize status with certain milestone stages
    if (nextStage === 'OFFER' || nextStage === 'OFFERED') {
      newStatus = 'OFFERED';
    } else if (nextStage === 'HIRED') {
      newStatus = 'HIRED';
    } else if (nextStage === 'INTERVIEW' || nextStage === 'TECHNICAL_INTERVIEW') {
      newStatus = 'INTERVIEWING';
    } else if (application.status === 'SUBMITTED') {
      newStatus = 'IN_REVIEW';
    }

    return this.db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: application.id },
        data: {
          currentStage: nextStage,
          status: newStatus,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          stage: nextStage,
          changedByUserId: user.id,
          notes: parsed.data.notes || null,
        },
      });

      return updated;
    });
  }

  async updateApplicationStatus(
    user: AuthUser,
    workspaceSlug: string,
    applicationId: string,
    input: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'applications.write',
    );

    const parsed = UpdateApplicationStatusSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const { status, reason } = parsed.data;

    return this.db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: application.id },
        data: {
          status,
          rejectedReason: status === 'REJECTED' ? reason || null : undefined,
          currentStage: status === 'HIRED' ? 'HIRED' : application.currentStage,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          stage: status,
          changedByUserId: user.id,
          notes: reason ? `Status changed to ${status}: ${reason}` : `Status changed to ${status}`,
        },
      });

      return updated;
    });
  }

  async createApplicationNote(
    user: AuthUser,
    workspaceSlug: string,
    applicationId: string,
    input: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'applications.write',
    );

    const parsed = CreateApplicationNoteSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.db.applicationNote.create({
      data: {
        applicationId: application.id,
        workspaceId: workspace.id,
        authorUserId: user.id,
        content: parsed.data.content,
      },
      include: {
        author: {
          select: {
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async getApplicationNotes(user: AuthUser, workspaceSlug: string, applicationId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'applications.read',
    );

    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        job: { workspaceId: workspace.id },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.db.applicationNote.findMany({
      where: {
        applicationId: application.id,
        workspaceId: workspace.id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });
  }
}

// --- Controllers ---

@Controller('jobs')
export class CandidateJobApplicationController {
  constructor(private readonly service: ApplicationsService) {}

  @Post(':jobSlug/apply')
  @UseGuards(AuthGuard)
  applyToJob(
    @CurrentUser() user: AuthUser,
    @Param('jobSlug') jobSlug: string,
    @Body() body: unknown,
  ) {
    return this.service.applyToJob(user, jobSlug, body);
  }
}

@Controller('candidates/me/applications')
@UseGuards(AuthGuard)
export class CandidateApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  getMyApplications(@CurrentUser() user: AuthUser) {
    return this.service.getCandidateApplications(user);
  }

  @Patch(':applicationId/withdraw')
  withdrawApplication(
    @CurrentUser() user: AuthUser,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.service.withdrawApplication(user, applicationId, body);
  }
}

@Controller('workspaces/:slug')
@UseGuards(AuthGuard)
export class WorkspaceApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get('jobs/:jobSlug/applications')
  getJobApplications(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('jobSlug') jobSlug: string,
    @Query() query: unknown,
  ) {
    return this.service.getJobApplications(user, workspaceSlug, jobSlug, query);
  }

  @Get('applications/:applicationId')
  getApplicationDetail(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.getApplicationDetail(user, workspaceSlug, applicationId);
  }

  @Patch('applications/:applicationId/stage')
  updateApplicationStage(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateApplicationStage(user, workspaceSlug, applicationId, body);
  }

  @Patch('applications/:applicationId/status')
  updateApplicationStatus(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateApplicationStatus(user, workspaceSlug, applicationId, body);
  }

  @Post('applications/:applicationId/notes')
  createApplicationNote(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.service.createApplicationNote(user, workspaceSlug, applicationId, body);
  }

  @Get('applications/:applicationId/notes')
  getApplicationNotes(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.getApplicationNotes(user, workspaceSlug, applicationId);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [
    CandidateJobApplicationController,
    CandidateApplicationsController,
    WorkspaceApplicationsController,
  ],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
