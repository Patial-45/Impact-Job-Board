/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { AdminService } from './admin.module';
import type { DatabaseService } from '../platform/database.module';
import { BadRequestException, NotFoundException } from '@nestjs/common';

function createMockDb() {
  return {
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    workspace: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    job: {
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    application: {
      count: vi.fn(),
    },
    jobOffer: {
      count: vi.fn(),
    },
    workspaceSubscription: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    supportElevation: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  } as unknown as DatabaseService;
}

const mockAdminUser = {
  id: 'u-admin-1',
  email: 'admin@platform.com',
  globalRole: 'SUPER_ADMIN',
};

describe('AdminService - Platform Administration', () => {
  it('getOverviewStats: aggregates system-wide counts and recent audit events', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.user.count).mockResolvedValue(150);
    vi.mocked(db.workspace.count).mockResolvedValue(25);
    vi.mocked(db.job.count).mockResolvedValueOnce(80).mockResolvedValueOnce(60);
    vi.mocked(db.application.count).mockResolvedValue(320);
    vi.mocked(db.jobOffer.count).mockResolvedValueOnce(45).mockResolvedValueOnce(38);
    vi.mocked(db.workspaceSubscription.count).mockResolvedValue(20);
    vi.mocked(db.auditLog.findMany).mockResolvedValue([
      { id: 'audit-1', action: 'USER_ROLE_UPDATED', createdAt: new Date() },
    ] as any);

    const stats = await service.getOverviewStats();

    expect(stats.totalUsers).toBe(150);
    expect(stats.totalWorkspaces).toBe(25);
    expect(stats.totalJobs).toBe(80);
    expect(stats.publishedJobs).toBe(60);
    expect(stats.totalApplications).toBe(320);
    expect(stats.totalOffers).toBe(45);
    expect(stats.acceptedOffers).toBe(38);
    expect(stats.activeSubscriptions).toBe(20);
    expect(stats.recentAuditLogs).toHaveLength(1);
  });

  it('listUsers: returns paginated list of users', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: 'u-1', email: 'john@example.com', globalRole: 'USER' },
    ] as any);
    vi.mocked(db.user.count).mockResolvedValue(1);

    const res = await service.listUsers({ page: 1, pageSize: 20 });
    expect(res.items).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.totalPages).toBe(1);
  });

  it('updateUserRole: updates role and records an audit log entry', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'u-target',
      email: 'member@test.com',
      globalRole: 'USER',
      deletedAt: null,
    } as any);
    vi.mocked(db.user.update).mockResolvedValue({
      id: 'u-target',
      email: 'member@test.com',
      globalRole: 'PLATFORM_ADMIN',
    } as any);

    const res = await service.updateUserRole('u-target', 'PLATFORM_ADMIN', mockAdminUser as any);
    expect(res.globalRole).toBe('PLATFORM_ADMIN');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_ROLE_UPDATED',
        targetType: 'USER',
        targetId: 'u-target',
        actorUserId: mockAdminUser.id,
      }),
    });
  });

  it('updateUserRole: throws error when demoting the last SUPER_ADMIN', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'u-target',
      email: 'super@test.com',
      globalRole: 'SUPER_ADMIN',
      deletedAt: null,
    } as any);
    vi.mocked(db.user.count).mockResolvedValue(1);

    await expect(
      service.updateUserRole('u-target', 'USER', mockAdminUser as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateUserRole: throws NotFoundException when target user does not exist', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    await expect(
      service.updateUserRole('u-nonexistent', 'USER', mockAdminUser as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('requestSupportElevation: issues audited elevation record', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.workspace.findUnique).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
      name: 'Acme',
      deletedAt: null,
    } as any);

    vi.mocked(db.supportElevation.create).mockResolvedValue({
      id: 'elev-1',
      workspaceId: 'ws-123',
      adminUserId: mockAdminUser.id,
      reason: 'Diagnosing webhook synchronization timeout',
      scope: 'READ_ONLY',
      expiresAt: new Date(),
    } as any);

    const elevation = await service.requestSupportElevation(mockAdminUser as any, {
      workspaceSlug: 'acme',
      reason: 'Diagnosing webhook synchronization timeout',
      scope: 'READ_ONLY',
      durationHours: 2,
    });

    expect(elevation.id).toBe('elev-1');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'SUPPORT_ELEVATION_GRANTED',
        targetType: 'WORKSPACE',
        workspaceId: 'ws-123',
      }),
    });
  });

  it('moderateJob: changes status and records audit event', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.job.findUnique).mockResolvedValue({
      id: 'job-1',
      workspaceId: 'ws-123',
      title: 'Senior Engineer',
      status: 'PUBLISHED',
      deletedAt: null,
    } as any);

    vi.mocked(db.job.update).mockResolvedValue({
      id: 'job-1',
      status: 'CLOSED',
    } as any);

    const updated = await service.moderateJob(
      'job-1',
      { status: 'CLOSED', moderationReason: 'Content policy violation' },
      mockAdminUser as any,
    );

    expect(updated.status).toBe('CLOSED');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'JOB_MODERATED',
        targetType: 'JOB',
        targetId: 'job-1',
      }),
    });
  });

  it('getSystemHealth: reports db status and process stats', async () => {
    const db = createMockDb();
    const service = new AdminService(db);

    vi.mocked(db.$queryRaw).mockResolvedValue([{ 1: 1 }]);

    const health = await service.getSystemHealth();
    expect(health.status).toBe('HEALTHY');
    expect(health.database.status).toBe('CONNECTED');
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
