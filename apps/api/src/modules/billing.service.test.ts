/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { BillingService } from './billing.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';

function createMockDb() {
  return {
    workspaceSubscription: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    job: {
      count: vi.fn(),
    },
    workspaceMember: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  } as unknown as DatabaseService;
}

function createMockAccessService() {
  return {
    requireAction: vi.fn(),
  } as unknown as WorkspaceAccessService;
}

const mockOwner = {
  id: 'u-owner-1',
  email: 'owner@acme.com',
  globalRole: 'USER',
};

describe('BillingService - Workspace Plans & Usage Limits', () => {
  it('getSubscription: returns existing subscription with current usage', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new BillingService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
      name: 'Acme Corp',
    } as any);

    vi.mocked(db.workspaceSubscription.findUnique).mockResolvedValue({
      id: 'sub-1',
      workspaceId: 'ws-123',
      tier: 'GROWTH',
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      activeJobLimit: 15,
      candidateSearchLimit: 500,
    } as any);

    vi.mocked(db.job.count).mockResolvedValue(5);
    vi.mocked(db.workspaceMember.count).mockResolvedValue(3);

    const result = await service.getSubscription('acme', mockOwner as any);

    expect(result.subscription.tier).toBe('GROWTH');
    expect(result.currentUsage.activeJobsCount).toBe(5);
    expect(result.currentUsage.activeJobLimit).toBe(15);
    expect(result.currentUsage.membersCount).toBe(3);
    expect(result.availablePlans).toHaveLength(3);
  });

  it('updateSubscription: upgrades plan tier and logs audit entry', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new BillingService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
      name: 'Acme Corp',
    } as any);

    vi.mocked(db.workspaceSubscription.findUnique).mockResolvedValue({
      id: 'sub-1',
      workspaceId: 'ws-123',
      tier: 'STARTER',
    } as any);

    vi.mocked(db.workspaceSubscription.upsert).mockResolvedValue({
      id: 'sub-1',
      workspaceId: 'ws-123',
      tier: 'ENTERPRISE',
      billingCycle: 'ANNUAL',
      activeJobLimit: 100,
      candidateSearchLimit: 5000,
    } as any);

    const updated = await service.updateSubscription('acme', mockOwner as any, {
      tier: 'ENTERPRISE',
      billingCycle: 'ANNUAL',
    });

    expect(updated.tier).toBe('ENTERPRISE');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'SUBSCRIPTION_TIER_UPDATED',
        workspaceId: 'ws-123',
        actorUserId: mockOwner.id,
      }),
    });
  });

  it('cancelSubscription: sets cancelAtPeriodEnd flag and records audit log', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new BillingService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
      name: 'Acme Corp',
    } as any);

    vi.mocked(db.workspaceSubscription.findUnique).mockResolvedValue({
      id: 'sub-1',
      workspaceId: 'ws-123',
      currentPeriodEnd: new Date(),
    } as any);

    vi.mocked(db.workspaceSubscription.update).mockResolvedValue({
      id: 'sub-1',
      cancelAtPeriodEnd: true,
    } as any);

    const canceled = await service.cancelSubscription('acme', mockOwner as any, {
      reason: 'Migrating internal infrastructure',
    });

    expect(canceled.cancelAtPeriodEnd).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'SUBSCRIPTION_CANCELED',
        workspaceId: 'ws-123',
      }),
    });
  });
});
