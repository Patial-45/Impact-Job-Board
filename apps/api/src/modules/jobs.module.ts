import {
  Body,
  Controller,
  Delete,
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
import type { Prisma } from '@executive-match/database';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import {
  UpdateCompanySchema,
  CreateJobSchema,
  UpdateJobSchema,
  UpdateJobStatusSchema,
  JobQuerySchema,
} from '@executive-match/validation';

@Injectable()
export class JobsService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  // --- Company Profile (Workspace scoped) ---

  async getWorkspaceCompany(user: AuthUser, workspaceSlug: string) {
    const workspace = await this.workspaceAccess.requireMembership(user, workspaceSlug);
    const company = await this.db.company.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (!company || company.deletedAt) {
      throw new NotFoundException('Company profile not found');
    }

    return company;
  }

  async updateWorkspaceCompany(user: AuthUser, workspaceSlug: string, input: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'workspace.manage',
    );
    const parsed = UpdateCompanySchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const { name, description, website, industry, size, location, logoKey, bannerKey } =
      parsed.data;

    return this.db.company.update({
      where: { workspaceId: workspace.id },
      data: {
        name,
        description,
        website: website !== undefined ? website || null : undefined,
        industry,
        size,
        location,
        logoKey,
        bannerKey,
      },
    });
  }

  // --- Workspace Jobs (Employer ATS) ---

  async createWorkspaceJob(user: AuthUser, workspaceSlug: string, input: unknown) {
    const workspace = await this.workspaceAccess.requireAction(user, workspaceSlug, 'jobs.write');
    const parsed = CreateJobSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const {
      title,
      slug: customSlug,
      description,
      department,
      location,
      remoteType,
      employmentType,
      experienceLevel,
      minSalary,
      maxSalary,
      currency,
      skills,
    } = parsed.data;

    // Generate or use slug
    let baseSlug =
      customSlug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'job-opening';

    // Verify uniqueness within workspace
    let finalSlug = baseSlug;
    const existing = await this.db.job.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: finalSlug,
        },
      },
    });

    if (existing) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return this.db.job.create({
      data: {
        workspaceId: workspace.id,
        slug: finalSlug,
        title,
        description,
        department,
        location,
        remoteType,
        employmentType,
        experienceLevel,
        minSalary,
        maxSalary,
        currency,
        status: 'DRAFT',
        skills: skills && skills.length > 0
          ? {
              create: skills.map((s) => ({
                name: s.name,
                isRequired: s.isRequired,
              })),
            }
          : undefined,
      },
      include: {
        skills: true,
      },
    });
  }

  async listWorkspaceJobs(user: AuthUser, workspaceSlug: string) {
    const workspace = await this.workspaceAccess.requireAction(user, workspaceSlug, 'jobs.read');
    return this.db.job.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
      },
      include: {
        skills: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkspaceJob(user: AuthUser, workspaceSlug: string, jobSlug: string) {
    const workspace = await this.workspaceAccess.requireAction(user, workspaceSlug, 'jobs.read');
    const job = await this.db.job.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: jobSlug,
        deletedAt: null,
      },
      include: {
        skills: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async updateWorkspaceJob(
    user: AuthUser,
    workspaceSlug: string,
    jobSlug: string,
    input: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(user, workspaceSlug, 'jobs.write');
    const parsed = UpdateJobSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const job = await this.db.job.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: jobSlug,
        deletedAt: null,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const {
      title,
      description,
      department,
      location,
      remoteType,
      employmentType,
      experienceLevel,
      minSalary,
      maxSalary,
      currency,
      skills,
    } = parsed.data;

    // If skills are provided, replace existing
    if (skills) {
      await this.db.jobSkill.deleteMany({
        where: { jobId: job.id },
      });
      if (skills.length > 0) {
        await this.db.jobSkill.createMany({
          data: skills.map((s) => ({
            jobId: job.id,
            name: s.name,
            isRequired: s.isRequired,
          })),
        });
      }
    }

    return this.db.job.update({
      where: { id: job.id },
      data: {
        title,
        description,
        department,
        location,
        remoteType,
        employmentType,
        experienceLevel,
        minSalary,
        maxSalary,
        currency,
      },
      include: {
        skills: true,
      },
    });
  }

  async updateWorkspaceJobStatus(
    user: AuthUser,
    workspaceSlug: string,
    jobSlug: string,
    input: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(user, workspaceSlug, 'jobs.write');
    const parsed = UpdateJobStatusSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const job = await this.db.job.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: jobSlug,
        deletedAt: null,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const nextStatus = parsed.data.status;
    let publishedAt = job.publishedAt;
    let closedAt = job.closedAt;

    if (nextStatus === 'PUBLISHED') {
      publishedAt = publishedAt || new Date();
      closedAt = null;
    } else if (nextStatus === 'CLOSED') {
      closedAt = new Date();
    } else if (nextStatus === 'DRAFT') {
      closedAt = null;
    }

    return this.db.job.update({
      where: { id: job.id },
      data: {
        status: nextStatus,
        publishedAt,
        closedAt,
      },
      include: {
        skills: true,
      },
    });
  }

  async deleteWorkspaceJob(user: AuthUser, workspaceSlug: string, jobSlug: string) {
    const workspace = await this.workspaceAccess.requireAction(user, workspaceSlug, 'jobs.write');
    const job = await this.db.job.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: jobSlug,
        deletedAt: null,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.db.job.update({
      where: { id: job.id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // --- Public Discovery ---

  async listPublicJobs(queryInput: unknown) {
    const parsed = JobQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const { query, department, remoteType, employmentType, experienceLevel, location, page, pageSize } =
      parsed.data;

    const where: Prisma.JobWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
      workspace: {
        deletedAt: null,
      },
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    if (remoteType) {
      where.remoteType = remoteType;
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.db.job.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
        include: {
          skills: true,
          workspace: {
            select: {
              company: {
                select: {
                  name: true,
                  slug: true,
                  logoKey: true,
                  industry: true,
                  location: true,
                },
              },
            },
          },
        },
      }),
      this.db.job.count({ where }),
    ]);

    const formattedItems = items.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      remoteType: job.remoteType,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      currency: job.currency,
      publishedAt: job.publishedAt,
      skills: job.skills,
      company: job.workspace.company,
    }));

    return {
      items: formattedItems,
      page,
      pageSize,
      total,
    };
  }

  async getPublicJob(slug: string) {
    const job = await this.db.job.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      include: {
        skills: true,
        workspace: {
          select: {
            company: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or no longer active');
    }

    return {
      id: job.id,
      slug: job.slug,
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      remoteType: job.remoteType,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      currency: job.currency,
      publishedAt: job.publishedAt,
      skills: job.skills,
      company: job.workspace.company,
    };
  }

  async getPublicCompany(slug: string) {
    const company = await this.db.company.findFirst({
      where: {
        slug,
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      include: {
        workspace: {
          select: {
            jobs: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },
              include: {
                skills: true,
              },
              orderBy: { publishedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      website: company.website,
      industry: company.industry,
      size: company.size,
      location: company.location,
      logoKey: company.logoKey,
      bannerKey: company.bannerKey,
      jobs: company.workspace.jobs,
    };
  }
}

// --- Controllers ---

@Controller('workspaces/:slug')
@UseGuards(AuthGuard)
export class WorkspaceJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('company')
  async getCompany(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.jobsService.getWorkspaceCompany(user, slug);
  }

  @Patch('company')
  async updateCompany(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: unknown,
  ) {
    return this.jobsService.updateWorkspaceCompany(user, slug, body);
  }

  @Post('jobs')
  async createJob(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: unknown,
  ) {
    return this.jobsService.createWorkspaceJob(user, slug, body);
  }

  @Get('jobs')
  async listJobs(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.jobsService.listWorkspaceJobs(user, slug);
  }

  @Get('jobs/:jobSlug')
  async getJob(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('jobSlug') jobSlug: string,
  ) {
    return this.jobsService.getWorkspaceJob(user, slug, jobSlug);
  }

  @Patch('jobs/:jobSlug')
  async updateJob(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('jobSlug') jobSlug: string,
    @Body() body: unknown,
  ) {
    return this.jobsService.updateWorkspaceJob(user, slug, jobSlug, body);
  }

  @Patch('jobs/:jobSlug/status')
  async updateJobStatus(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('jobSlug') jobSlug: string,
    @Body() body: unknown,
  ) {
    return this.jobsService.updateWorkspaceJobStatus(user, slug, jobSlug, body);
  }

  @Delete('jobs/:jobSlug')
  async deleteJob(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('jobSlug') jobSlug: string,
  ) {
    return this.jobsService.deleteWorkspaceJob(user, slug, jobSlug);
  }
}

@Controller('jobs')
export class PublicJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async listJobs(@Query() query: unknown) {
    return this.jobsService.listPublicJobs(query);
  }

  @Get(':slug')
  async getJob(@Param('slug') slug: string) {
    return this.jobsService.getPublicJob(slug);
  }
}

@Controller('companies')
export class PublicCompaniesController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':slug')
  async getCompany(@Param('slug') slug: string) {
    return this.jobsService.getPublicCompany(slug);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [WorkspaceJobsController, PublicJobsController, PublicCompaniesController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
