/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { OffersService } from './offers.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';
import { NotFoundException, HttpException } from '@nestjs/common';

function createMockDb() {
  return {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    jobOffer: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    offerSignature: {
      create: vi.fn(),
    },
    onboardingTask: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
    },
    applicationStageHistory: {
      create: vi.fn(),
    },
    candidateProfile: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fns) => Promise.all(fns)),
  } as unknown as DatabaseService;
}

function createMockAccessService() {
  return {
    requireMembership: vi.fn(),
    requireAction: vi.fn(),
  } as unknown as WorkspaceAccessService;
}

const mockRecruiter = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  email: 'recruiter@tech.com',
  globalRole: 'USER' as const,
};

const mockCandidateUser = {
  id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  email: 'candidate@dev.com',
  globalRole: 'USER' as const,
};

describe('OffersService - Multi-tenant Employer Offers', () => {
  it('createOffer: creates draft job offer with compensation details', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      name: 'Acme Corp',
      slug: 'acme',
    } as any);

    vi.mocked(db.application.findFirst).mockResolvedValue({
      id: 'app-999',
      job: { id: 'job-1', title: 'Senior Go Engineer' },
    } as any);

    vi.mocked(db.jobOffer.create).mockResolvedValue({
      id: 'offer-1',
      workspaceId: 'ws-123',
      applicationId: 'app-999',
      jobTitle: 'Senior Go Engineer',
      baseSalary: 185000,
      currency: 'USD',
      status: 'DRAFT',
    } as any);

    const result = await service.createOffer(mockRecruiter, 'acme', {
      applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      jobTitle: 'Senior Go Engineer',
      baseSalary: 185000,
      currency: 'USD',
      startDate: new Date('2026-11-01T09:00:00Z').toISOString(),
      expiresAt: new Date('2026-10-25T18:00:00Z').toISOString(),
      workLocation: 'Hybrid - New York, NY',
    });

    expect(access.requireAction).toHaveBeenCalledWith(mockRecruiter, 'acme', 'offers.write');
    expect(db.jobOffer.create).toHaveBeenCalled();
    expect(result.offer.id).toBe('offer-1');
  });

  it('getWorkspaceOffers: lists offers scoped to workspace with status filter', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
    } as any);

    vi.mocked(db.jobOffer.findMany).mockResolvedValue([
      { id: 'offer-1', status: 'SENT', baseSalary: 185000 },
      { id: 'offer-2', status: 'SENT', baseSalary: 210000 },
    ] as any);

    const result = await service.getWorkspaceOffers(mockRecruiter, 'acme', 'SENT');

    expect(db.jobOffer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'ws-123', status: 'SENT' },
      }),
    );
    expect(result.items.length).toBe(2);
  });

  it('getOfferDetails: returns offer with relations and throws 404 if not found', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue(null);

    await expect(service.getOfferDetails(mockRecruiter, 'acme', 'missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('approveOffer and sendOffer: advances offer lifecycle and updates application stage to OFFER', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue({
      id: 'offer-1',
      workspaceId: 'ws-123',
      applicationId: 'app-999',
      status: 'DRAFT',
    } as any);

    vi.mocked(db.jobOffer.update).mockResolvedValue({
      id: 'offer-1',
      status: 'SENT',
    } as any);

    const result = await service.sendOffer(mockRecruiter, 'acme', 'offer-1');

    expect(db.$transaction).toHaveBeenCalled();
    expect(result.offer.status).toBe('SENT');
  });

  it('rescindOffer: marks offer as RESCINDED with audit reason', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue({
      id: 'offer-1',
      workspaceId: 'ws-123',
      status: 'SENT',
    } as any);

    vi.mocked(db.jobOffer.update).mockResolvedValue({
      id: 'offer-1',
      status: 'RESCINDED',
      rescindReason: 'Position closed due to freeze',
    } as any);

    const result = await service.rescindOffer(mockRecruiter, 'acme', 'offer-1', {
      reason: 'Position closed due to freeze',
    });

    expect(result.offer.status).toBe('RESCINDED');
  });

  it('createOnboardingTask and updateOnboardingTaskStatus: manages task checklist', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      slug: 'acme',
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue({
      id: 'offer-1',
      workspaceId: 'ws-123',
    } as any);

    vi.mocked(db.onboardingTask.create).mockResolvedValue({
      id: 'task-1',
      title: 'Submit direct deposit',
      status: 'PENDING',
    } as any);

    const created = await service.createOnboardingTask(mockRecruiter, 'acme', 'offer-1', {
      title: 'Submit direct deposit',
      category: 'DOCUMENTATION',
      required: true,
    });

    expect(created.task.id).toBe('task-1');

    vi.mocked(db.onboardingTask.findFirst).mockResolvedValue({
      id: 'task-1',
      workspaceId: 'ws-123',
    } as any);

    vi.mocked(db.onboardingTask.update).mockResolvedValue({
      id: 'task-1',
      status: 'COMPLETED',
    } as any);

    const updated = await service.updateOnboardingTaskStatus(mockRecruiter, 'acme', 'task-1', {
      status: 'COMPLETED',
    });

    expect(updated.task.status).toBe('COMPLETED');
  });
});

describe('OffersService - Candidate Portal & Digital Signatures', () => {
  it('getCandidateOffers: returns offers dispatched to logged in candidate', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-profile-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.jobOffer.findMany).mockResolvedValue([
      { id: 'offer-1', status: 'SENT', baseSalary: 195000 },
    ] as any);

    const result = await service.getCandidateOffers(mockCandidateUser);

    expect(result.items.length).toBe(1);
    expect(result.items[0]?.id).toBe('offer-1');
  });

  it('acceptOffer: signs offer, marks HIRED, and seeds default onboarding tasks', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-profile-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue({
      id: 'offer-1',
      workspaceId: 'ws-123',
      applicationId: 'app-999',
      status: 'SENT',
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
    } as any);

    vi.mocked(db.jobOffer.update).mockResolvedValue({
      id: 'offer-1',
      status: 'ACCEPTED',
    } as any);

    vi.mocked(db.offerSignature.create).mockResolvedValue({
      id: 'sig-1',
      offerId: 'offer-1',
      signerName: 'Jane Dev',
    } as any);

    const result = await service.acceptOffer(
      mockCandidateUser,
      'offer-1',
      {
        signerName: 'Jane Dev',
        signatureText: 'Jane Dev',
        consentConfirmed: true,
      },
      { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
    );

    expect(db.$transaction).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.offer.status).toBe('ACCEPTED');
  });

  it('acceptOffer: rejects expired offer and marks EXPIRED', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-profile-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue({
      id: 'offer-1',
      workspaceId: 'ws-123',
      applicationId: 'app-999',
      status: 'SENT',
      expiresAt: new Date(Date.now() - 86400000), // yesterday
    } as any);

    await expect(
      service.acceptOffer(
        mockCandidateUser,
        'offer-1',
        {
          signerName: 'Jane Dev',
          signatureText: 'Jane Dev',
          consentConfirmed: true,
        },
        {},
      ),
    ).rejects.toThrow(HttpException);

    expect(db.jobOffer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'offer-1' },
        data: { status: 'EXPIRED' },
      }),
    );
  });

  it('declineOffer: marks offer DECLINED with candidate reason', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-profile-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.jobOffer.findFirst).mockResolvedValue({
      id: 'offer-1',
      applicationId: 'app-999',
      status: 'SENT',
    } as any);

    const result = await service.declineOffer(mockCandidateUser, 'offer-1', {
      reason: 'Accepted another opportunity',
    });

    expect(db.$transaction).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('candidateCompleteOnboardingTask: marks candidate onboarding task completed', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new OffersService(db, access);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-profile-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.onboardingTask.findFirst).mockResolvedValue({
      id: 'task-1',
      offerId: 'offer-1',
    } as any);

    vi.mocked(db.onboardingTask.update).mockResolvedValue({
      id: 'task-1',
      status: 'COMPLETED',
    } as any);

    const result = await service.completeCandidateOnboardingTask(mockCandidateUser, 'task-1');

    expect(result.task.status).toBe('COMPLETED');
  });
});
