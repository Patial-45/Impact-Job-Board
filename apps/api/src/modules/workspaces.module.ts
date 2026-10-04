import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  Injectable,
  Inject,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../platform/database.module';
import { EMAIL_SENDER } from '../platform/email.module';
import type { EmailSender } from '@executive-match/email';
import { createInvitationEmail } from '@executive-match/email';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { canWorkspace, type WorkspaceAction, type WorkspaceRole } from '@executive-match/auth';
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
} from '@executive-match/validation';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const getWebUrl = () => process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

@Injectable()
export class WorkspaceAccessService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async requireMembership(user: AuthUser, slug: string) {
    const workspace = await this.db.workspace.findUnique({
      where: { slug },
      include: {
        memberships: {
          where: { userId: user.id },
        },
      },
    });

    if (!workspace || workspace.deletedAt || !workspace.memberships.length) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You are not a member of this workspace',
      });
    }

    return {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      role: workspace.memberships[0]!.role as WorkspaceRole,
    };
  }

  async requireAction(user: AuthUser, slug: string, action: WorkspaceAction) {
    const workspace = await this.requireMembership(user, slug);
    if (!canWorkspace(workspace.role, action)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Action '${action}' is not permitted for role '${workspace.role}'`,
      });
    }
    return workspace;
  }
}

@ApiTags('workspaces')
@Controller('workspaces')
@UseGuards(AuthGuard)
class WorkspacesController {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(WorkspaceAccessService) private readonly access: WorkspaceAccessService,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

  @Post()
  async createWorkspace(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const { name, slug } = parsed.data;

    // Check slug uniqueness
    const existing = await this.db.workspace.findUnique({ where: { slug } });
    if (existing) {
      throw new HttpException({ code: 'SLUG_IN_USE', message: 'Workspace slug is already in use' }, 409);
    }

    // Atomically create workspace, company stub, and OWNER membership
    const workspace = await this.db.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          company: {
            create: {
              name,
              slug,
            },
          },
          memberships: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });
      return ws;
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: 'OWNER',
    };
  }

  @Get()
  async mine(@CurrentUser() user: AuthUser) {
    const memberships = await this.db.workspaceMember.findMany({
      where: { userId: user.id, workspace: { deletedAt: null } },
      include: { workspace: true },
    });

    return {
      items: memberships.map((member) => ({
        id: member.workspaceId,
        slug: member.workspace.slug,
        name: member.workspace.name,
        role: member.role,
        joinedAt: member.createdAt.toISOString(),
      })),
    };
  }

  @Get(':slug')
  async getOne(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.access.requireMembership(user, slug);
  }

  @Patch(':slug')
  async updateWorkspace(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: unknown,
  ) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.manage');
    const parsed = UpdateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const updated = await this.db.workspace.update({
      where: { id: workspace.id },
      data: { name: parsed.data.name },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      role: workspace.role,
    };
  }

  @Get(':slug/members')
  async listMembers(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.members.read');

    const members = await this.db.workspaceMember.findMany({
      where: { workspaceId: workspace.id, user: { deletedAt: null } },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        displayName: m.user.profile?.displayName ?? null,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
      })),
    };
  }

  @Patch(':slug/members/:memberId')
  async updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @Body() body: unknown,
  ) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.members.manage');
    const parsed = UpdateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const member = await this.db.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspace.id) {
      throw new HttpException({ code: 'MEMBER_NOT_FOUND', message: 'Member not found' }, 404);
    }

    // Protect against modifying OWNER unless caller is OWNER
    if (member.role === 'OWNER' && workspace.role !== 'OWNER') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only workspace owners can modify owner roles',
      });
    }

    const updated = await this.db.workspaceMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role as WorkspaceRole },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
    };
  }

  @Delete(':slug/members/:memberId')
  @HttpCode(204)
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
  ) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.members.manage');

    const member = await this.db.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspace.id) {
      throw new HttpException({ code: 'MEMBER_NOT_FOUND', message: 'Member not found' }, 404);
    }

    // If target member is an OWNER, check whether they are the last owner
    if (member.role === 'OWNER') {
      const ownerCount = await this.db.workspaceMember.count({
        where: { workspaceId: workspace.id, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new HttpException(
          { code: 'CANNOT_REMOVE_LAST_OWNER', message: 'Cannot remove the last owner of the workspace' },
          400,
        );
      }
    }

    await this.db.workspaceMember.delete({ where: { id: memberId } });
  }

  @Post(':slug/invitations')
  async inviteMember(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: unknown,
  ) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.members.invite');
    const parsed = InviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    // Check if user is already an active member of this workspace
    const existingMember = await this.db.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        user: { email: normalizedEmail, deletedAt: null },
      },
    });

    if (existingMember) {
      throw new HttpException(
        { code: 'ALREADY_MEMBER', message: 'User is already a member of this workspace' },
        409,
      );
    }

    // Revoke any previous unaccepted invitations for this email in this workspace
    await this.db.workspaceInvitation.updateMany({
      where: {
        workspaceId: workspace.id,
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.db.workspaceInvitation.create({
      data: {
        workspaceId: workspace.id,
        email: normalizedEmail,
        role: parsed.data.role as WorkspaceRole,
        tokenHash: hashToken(rawToken),
        invitedByUserId: user.id,
        expiresAt,
      },
    });

    try {
      const emailMessage = createInvitationEmail({
        to: normalizedEmail,
        inviterName: user.email,
        workspaceName: workspace.name,
        token: rawToken,
        webUrl: getWebUrl(),
        role: parsed.data.role,
      });
      await this.emailSender.send(emailMessage);
    } catch (err) {
      console.error('Failed to dispatch workspace invitation email:', err);
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  @Get(':slug/invitations')
  async listInvitations(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.members.invite');

    const invitations = await this.db.workspaceInvitation.findMany({
      where: {
        workspaceId: workspace.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        invitedByEmail: inv.invitedBy.email,
      })),
    };
  }

  @Delete(':slug/invitations/:inviteId')
  @HttpCode(204)
  async revokeInvitation(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('inviteId') inviteId: string,
  ) {
    const workspace = await this.access.requireAction(user, slug, 'workspace.members.manage');

    const invitation = await this.db.workspaceInvitation.findUnique({
      where: { id: inviteId },
    });

    if (!invitation || invitation.workspaceId !== workspace.id) {
      throw new HttpException({ code: 'INVITATION_NOT_FOUND', message: 'Invitation not found' }, 404);
    }

    await this.db.workspaceInvitation.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });
  }
}

@ApiTags('invitations')
@Controller('invitations')
class InvitationsController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get(':token')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async getInvitation(@Param('token') token: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.db.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: true,
        invitedBy: {
          include: { profile: true },
        },
      },
    });

    if (
      !invitation ||
      invitation.revokedAt ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date() ||
      invitation.workspace.deletedAt
    ) {
      throw new HttpException(
        { code: 'INVALID_INVITATION', message: 'Invitation is invalid or has expired' },
        400,
      );
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace.name,
      workspaceSlug: invitation.workspace.slug,
      inviterName: invitation.invitedBy.profile?.displayName || invitation.invitedBy.email,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  @Post(':token/accept')
  @UseGuards(AuthGuard)
  async acceptInvitation(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.db.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });

    if (
      !invitation ||
      invitation.revokedAt ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date() ||
      invitation.workspace.deletedAt
    ) {
      throw new HttpException(
        { code: 'INVALID_INVITATION', message: 'Invitation is invalid or has expired' },
        400,
      );
    }

    // Check if caller is already a member
    const existing = await this.db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!existing) {
      await this.db.$transaction([
        this.db.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: invitation.role,
          },
        }),
        this.db.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);
    } else {
      await this.db.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    }

    return {
      ok: true,
      workspaceSlug: invitation.workspace.slug,
      workspaceName: invitation.workspace.name,
      role: invitation.role,
    };
  }
}

@Module({
  providers: [WorkspaceAccessService],
  controllers: [WorkspacesController, InvitationsController],
  exports: [WorkspaceAccessService],
})
export class WorkspacesModule {}

