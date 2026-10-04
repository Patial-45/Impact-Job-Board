/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceAccessService } from './workspaces.module';
import type { DatabaseService } from '../platform/database.module';

function createMockDb() {
  return {
    workspace: {
      findUnique: vi.fn(),
    },
  } as unknown as DatabaseService;
}

describe('WorkspaceAccessService - Tenant Isolation & RBAC', () => {
  it('throws ForbiddenException if user has no membership in workspace', async () => {
    const db = createMockDb();
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme',
      name: 'Acme Corp',
      deletedAt: null,
      memberships: [], // User is NOT a member
    } as any);

    const service = new WorkspaceAccessService(db);
    const user = { id: 'user-intruder', email: 'intruder@other.com', globalRole: 'USER' };

    await expect(service.requireMembership(user, 'acme')).rejects.toThrow();
  });

  it('throws ForbiddenException if workspace is soft-deleted', async () => {
    const db = createMockDb();
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'deleted-corp',
      name: 'Deleted Corp',
      deletedAt: new Date(),
      memberships: [{ role: 'OWNER' }],
    } as any);

    const service = new WorkspaceAccessService(db);
    const user = { id: 'user-owner', email: 'owner@deleted.com', globalRole: 'USER' };

    await expect(service.requireMembership(user, 'deleted-corp')).rejects.toThrow();
  });

  it('allows member access when active membership exists', async () => {
    const db = createMockDb();
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme',
      name: 'Acme Corp',
      deletedAt: null,
      memberships: [{ role: 'RECRUITER' }],
    } as any);

    const service = new WorkspaceAccessService(db);
    const user = { id: 'user-recruiter', email: 'recruiter@acme.com', globalRole: 'USER' };

    const result = await service.requireMembership(user, 'acme');
    expect(result.id).toBe('ws-1');
    expect(result.slug).toBe('acme');
    expect(result.role).toBe('RECRUITER');
  });

  it('grants recruiter permission to write jobs', async () => {
    const db = createMockDb();
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme',
      name: 'Acme Corp',
      deletedAt: null,
      memberships: [{ role: 'RECRUITER' }],
    } as any);

    const service = new WorkspaceAccessService(db);
    const user = { id: 'user-recruiter', email: 'recruiter@acme.com', globalRole: 'USER' };

    const result = await service.requireAction(user, 'acme', 'jobs.write');
    expect(result.role).toBe('RECRUITER');
  });

  it('forbids recruiter from managing workspace administration', async () => {
    const db = createMockDb();
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme',
      name: 'Acme Corp',
      deletedAt: null,
      memberships: [{ role: 'RECRUITER' }],
    } as any);

    const service = new WorkspaceAccessService(db);
    const user = { id: 'user-recruiter', email: 'recruiter@acme.com', globalRole: 'USER' };

    await expect(service.requireAction(user, 'acme', 'workspace.manage')).rejects.toThrow();
  });

  it('allows OWNER to manage workspace administration', async () => {
    const db = createMockDb();
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme',
      name: 'Acme Corp',
      deletedAt: null,
      memberships: [{ role: 'OWNER' }],
    } as any);

    const service = new WorkspaceAccessService(db);
    const user = { id: 'user-owner', email: 'owner@acme.com', globalRole: 'USER' };

    const result = await service.requireAction(user, 'acme', 'workspace.manage');
    expect(result.role).toBe('OWNER');
  });
});
