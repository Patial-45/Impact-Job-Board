import {
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Inject,
  Module,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../platform/database.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { canWorkspace, type WorkspaceAction, type WorkspaceRole } from '@executive-match/auth';
@Injectable()
export class WorkspaceAccessService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  async requireMembership(user: AuthUser, slug: string) {
    const workspace = await this.db.workspace.findUnique({
      where: { slug },
      include: { memberships: { where: { userId: user.id } } },
    });
    if (!workspace || workspace.deletedAt || !workspace.memberships.length)
      throw new ForbiddenException();
    return {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      role: workspace.memberships[0]!.role,
    };
  }
  async requireAction(user: AuthUser, slug: string, action: WorkspaceAction) {
    const workspace = await this.requireMembership(user, slug);
    if (!canWorkspace(workspace.role as WorkspaceRole, action)) throw new ForbiddenException();
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
  ) {}
  @Get() async mine(@CurrentUser() user: AuthUser) {
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
      })),
    };
  }
  @Get(':slug') getOne(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.access.requireMembership(user, slug);
  }
}
@Module({
  providers: [WorkspaceAccessService],
  controllers: [WorkspacesController],
  exports: [WorkspaceAccessService],
})
export class WorkspacesModule {}
