import { describe, expect, it } from 'vitest';
import { canPlatform, canWorkspace, type WorkspaceAction } from './index';

describe('RBAC - Workspace permissions', () => {
  it('grants OWNER full permissions across all workspace actions', () => {
    const actions: WorkspaceAction[] = [
      'workspace.read',
      'workspace.manage',
      'workspace.members.read',
      'workspace.members.invite',
      'workspace.members.manage',
      'jobs.read',
      'jobs.write',
      'candidates.read',
      'applications.read',
      'applications.write',
      'interviews.read',
      'interviews.write',
      'assessments.read',
      'assessments.write',
    ];
    for (const action of actions) {
      expect(canWorkspace('OWNER', action)).toBe(true);
    }
  });

  it('grants ADMIN management permissions', () => {
    expect(canWorkspace('ADMIN', 'workspace.manage')).toBe(true);
    expect(canWorkspace('ADMIN', 'workspace.members.invite')).toBe(true);
    expect(canWorkspace('ADMIN', 'jobs.write')).toBe(true);
    expect(canWorkspace('ADMIN', 'interviews.write')).toBe(true);
    expect(canWorkspace('ADMIN', 'assessments.write')).toBe(true);
  });

  it('restricts RECRUITER to recruitment actions without workspace administration', () => {
    expect(canWorkspace('RECRUITER', 'workspace.read')).toBe(true);
    expect(canWorkspace('RECRUITER', 'jobs.write')).toBe(true);
    expect(canWorkspace('RECRUITER', 'candidates.read')).toBe(true);
    expect(canWorkspace('RECRUITER', 'applications.write')).toBe(true);
    expect(canWorkspace('RECRUITER', 'interviews.write')).toBe(true);
    expect(canWorkspace('RECRUITER', 'assessments.write')).toBe(true);
    expect(canWorkspace('RECRUITER', 'workspace.manage')).toBe(false);
    expect(canWorkspace('RECRUITER', 'workspace.members.invite')).toBe(false);
    expect(canWorkspace('RECRUITER', 'workspace.members.manage')).toBe(false);
  });

  it('restricts VIEWER to read-only access', () => {
    expect(canWorkspace('VIEWER', 'workspace.read')).toBe(true);
    expect(canWorkspace('VIEWER', 'workspace.members.read')).toBe(true);
    expect(canWorkspace('VIEWER', 'jobs.read')).toBe(true);
    expect(canWorkspace('VIEWER', 'candidates.read')).toBe(true);
    expect(canWorkspace('VIEWER', 'applications.read')).toBe(true);
    expect(canWorkspace('VIEWER', 'interviews.read')).toBe(true);
    expect(canWorkspace('VIEWER', 'assessments.read')).toBe(true);

    expect(canWorkspace('VIEWER', 'jobs.write')).toBe(false);
    expect(canWorkspace('VIEWER', 'applications.write')).toBe(false);
    expect(canWorkspace('VIEWER', 'interviews.write')).toBe(false);
    expect(canWorkspace('VIEWER', 'assessments.write')).toBe(false);
    expect(canWorkspace('VIEWER', 'workspace.manage')).toBe(false);
    expect(canWorkspace('VIEWER', 'workspace.members.invite')).toBe(false);
  });
});

describe('RBAC - Platform permissions', () => {
  it('keeps platform administration strictly separated', () => {
    expect(canPlatform('USER', 'admin.read')).toBe(false);
    expect(canPlatform('USER', 'admin.manage')).toBe(false);
    expect(canPlatform('PLATFORM_ADMIN', 'admin.read')).toBe(true);
    expect(canPlatform('PLATFORM_ADMIN', 'admin.manage')).toBe(false);
    expect(canPlatform('SUPER_ADMIN', 'admin.read')).toBe(true);
    expect(canPlatform('SUPER_ADMIN', 'admin.manage')).toBe(true);
  });
});

