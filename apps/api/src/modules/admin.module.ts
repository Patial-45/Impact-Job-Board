import {
  BadRequestException,
  Body,
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
import { ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@executive-match/database';
import type { GlobalRole } from '@executive-match/auth';
import {
  AdminUserQuerySchema,
  AdminUpdateUserRoleSchema,
  AdminWorkspaceQuerySchema,
  AdminAuditLogQuerySchema,
  AdminSupportElevationSchema,
  AdminModerateJobSchema,
  type AdminUserQueryInput,
  type AdminWorkspaceQueryInput,
  type AdminAuditLogQueryInput,
  type AdminSupportElevationInput,
  type AdminModerateJobInput,
} from '@executive-match/validation';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { DatabaseService } from '../platform/database.module';
import { PlatformAdminGuard, SuperAdminGuard } from '../platform/platform-admin.guard';

@Injectable()
export class AdminService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async getOverviewStats() {
    const [
      totalUsers,
      totalWorkspaces,
      totalJobs,
      publishedJobs,
      totalApplications,
      totalOffers,
      acceptedOffers,
      activeSubscriptions,
      recentAuditLogs,
    ] = await Promise.all([
      this.db.user.count({ where: { deletedAt: null } }),
      this.db.workspace.count({ where: { deletedAt: null } }),
      this.db.job.count({ where: { deletedAt: null } }),
      this.db.job.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.db.application.count(),
      this.db.jobOffer.count(),
      this.db.jobOffer.count({ where: { status: 'ACCEPTED' } }),
      this.db.workspaceSubscription.count({ where: { status: 'ACTIVE' } }),
      this.db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true } },
            },
          },
          workspace: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalWorkspaces,
      totalJobs,
      publishedJobs,
      totalApplications,
      totalOffers,
      acceptedOffers,
      activeSubscriptions,
      recentAuditLogs,
    };
  }

  async listUsers(query: AdminUserQueryInput) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (query.globalRole) {
      where.globalRole = query.globalRole;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { profile: { displayName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          globalRole: true,
          emailVerified: true,
          createdAt: true,
          profile: { select: { displayName: true, avatarKey: true } },
          candidate: { select: { id: true, headline: true } },
          memberships: {
            select: {
              role: true,
              workspace: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      this.db.user.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async updateUserRole(userId: string, targetRole: GlobalRole, actorUser: AuthUser) {
    const target = await this.db.user.findUnique({ where: { id: userId } });
    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found');
    }

    if (target.globalRole === 'SUPER_ADMIN' && targetRole !== 'SUPER_ADMIN') {
      const superAdminCount = await this.db.user.count({
        where: { globalRole: 'SUPER_ADMIN', deletedAt: null },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot demote the last remaining SUPER_ADMIN');
      }
    }

    const previousRole = target.globalRole;
    const updated = await this.db.user.update({
      where: { id: userId },
      data: { globalRole: targetRole },
      select: { id: true, email: true, globalRole: true, updatedAt: true },
    });

    await this.db.auditLog.create({
      data: {
        actorUserId: actorUser.id,
        actorEmail: actorUser.email,
        action: 'USER_ROLE_UPDATED',
        targetType: 'USER',
        targetId: userId,
        details: { previousRole, newRole: targetRole },
      },
    });

    return updated;
  }

  async listWorkspaces(query: AdminWorkspaceQueryInput) {
    const where: Prisma.WorkspaceWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.db.workspace.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { name: true, industry: true, location: true } },
          subscription: true,
          _count: {
            select: {
              memberships: true,
              jobs: true,
              offers: true,
            },
          },
        },
      }),
      this.db.workspace.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async requestSupportElevation(actorUser: AuthUser, input: AdminSupportElevationInput) {
    const workspace = await this.db.workspace.findUnique({
      where: { slug: input.workspaceSlug },
    });
    if (!workspace || workspace.deletedAt) {
      throw new NotFoundException('Workspace not found');
    }

    const expiresAt = new Date(Date.now() + input.durationHours * 60 * 60 * 1000);

    const elevation = await this.db.supportElevation.create({
      data: {
        workspaceId: workspace.id,
        adminUserId: actorUser.id,
        reason: input.reason,
        scope: input.scope,
        expiresAt,
      },
    });

    await this.db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorUserId: actorUser.id,
        actorEmail: actorUser.email,
        action: 'SUPPORT_ELEVATION_GRANTED',
        targetType: 'WORKSPACE',
        targetId: workspace.id,
        details: {
          elevationId: elevation.id,
          reason: input.reason,
          scope: input.scope,
          durationHours: input.durationHours,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return elevation;
  }

  async listAuditLogs(query: AdminAuditLogQueryInput) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) {
      where.action = query.action;
    }
    if (query.targetType) {
      where.targetType = query.targetType;
    }
    if (query.actorUserId) {
      where.actorUserId = query.actorUserId;
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true } },
            },
          },
          workspace: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.db.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getSystemHealth() {
    const start = Date.now();
    let dbHealthy = false;
    try {
      await this.db.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }
    const dbLatencyMs = Date.now() - start;
    const memory = process.memoryUsage();

    return {
      status: dbHealthy ? 'HEALTHY' : 'DEGRADED',
      database: {
        status: dbHealthy ? 'CONNECTED' : 'DISCONNECTED',
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }

  async moderateJob(jobId: string, input: AdminModerateJobInput, actorUser: AuthUser) {
    const job = await this.db.job.findUnique({
      where: { id: jobId },
      include: { workspace: true },
    });
    if (!job || job.deletedAt) {
      throw new NotFoundException('Job requisition not found');
    }

    const previousStatus = job.status;
    const updated = await this.db.job.update({
      where: { id: jobId },
      data: {
        status: input.status,
        ...(input.status === 'PUBLISHED' && !job.publishedAt ? { publishedAt: new Date() } : {}),
        ...(input.status === 'CLOSED' ? { closedAt: new Date() } : {}),
      },
    });

    await this.db.auditLog.create({
      data: {
        workspaceId: job.workspaceId,
        actorUserId: actorUser.id,
        actorEmail: actorUser.email,
        action: 'JOB_MODERATED',
        targetType: 'JOB',
        targetId: jobId,
        details: {
          previousStatus,
          newStatus: input.status,
          reason: input.moderationReason,
          jobTitle: job.title,
        },
      },
    });

    return updated;
  }
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard, PlatformAdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get('stats')
  async getOverviewStats() {
    return this.admin.getOverviewStats();
  }

  @Get('users')
  async listUsers(@Query() rawQuery: unknown) {
    const parsed = AdminUserQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.admin.listUsers(parsed.data);
  }

  @Patch('users/:userId/role')
  @UseGuards(SuperAdminGuard)
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() rawBody: unknown,
    @CurrentUser() actor: AuthUser,
  ) {
    const parsed = AdminUpdateUserRoleSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.admin.updateUserRole(userId, parsed.data.globalRole, actor);
  }

  @Get('workspaces')
  async listWorkspaces(@Query() rawQuery: unknown) {
    const parsed = AdminWorkspaceQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.admin.listWorkspaces(parsed.data);
  }

  @Post('support-elevation')
  async requestSupportElevation(@CurrentUser() actor: AuthUser, @Body() rawBody: unknown) {
    const parsed = AdminSupportElevationSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.admin.requestSupportElevation(actor, parsed.data);
  }

  @Get('audit-logs')
  async listAuditLogs(@Query() rawQuery: unknown) {
    const parsed = AdminAuditLogQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.admin.listAuditLogs(parsed.data);
  }

  @Get('health')
  async getSystemHealth() {
    return this.admin.getSystemHealth();
  }

  @Patch('jobs/:jobId/moderate')
  async moderateJob(
    @Param('jobId') jobId: string,
    @Body() rawBody: unknown,
    @CurrentUser() actor: AuthUser,
  ) {
    const parsed = AdminModerateJobSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }
    return this.admin.moderateJob(jobId, parsed.data, actor);
  }
}

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
