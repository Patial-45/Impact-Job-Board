/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';

function createMockDb() {
  return {
    application: {
      findMany: vi.fn(),
    },
    job: {
      findMany: vi.fn(),
    },
  } as unknown as DatabaseService;
}

function createMockAccessService() {
  return {
    requireAction: vi.fn(),
  } as unknown as WorkspaceAccessService;
}

const mockUser = {
  id: 'user-recruiter-1',
  email: 'recruiter@acme.com',
  globalRole: 'USER',
};

describe('AnalyticsService - Recruitment & Pipeline Analytics', () => {
  it('calculates full hiring funnel, conversion rates, and time-to-hire', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AnalyticsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-123',
      name: 'Acme Corp',
      slug: 'acme',
    } as any);

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const mockApplications = [
      {
        id: 'app-1',
        jobId: 'job-1',
        status: 'HIRED',
        currentStage: 'HIRED',
        createdAt: tenDaysAgo,
        updatedAt: now,
        stageHistory: [
          { stage: 'APPLIED', createdAt: tenDaysAgo },
          { stage: 'SCREENING', createdAt: new Date(tenDaysAgo.getTime() + 2 * 86400000) },
          { stage: 'INTERVIEW', createdAt: new Date(tenDaysAgo.getTime() + 4 * 86400000) },
          { stage: 'OFFER', createdAt: new Date(tenDaysAgo.getTime() + 8 * 86400000) },
          { stage: 'HIRED', createdAt: now },
        ],
        offers: [{ id: 'off-1', status: 'ACCEPTED', baseSalary: 180000, currency: 'USD' }],
        interviews: [
          {
            id: 'inv-1',
            status: 'COMPLETED',
            scorecards: [{ overallRating: 5, recommendation: 'STRONG_HIRE' }],
          },
        ],
      },
      {
        id: 'app-2',
        jobId: 'job-1',
        status: 'REJECTED',
        currentStage: 'SCREENING',
        createdAt: fiveDaysAgo,
        updatedAt: now,
        stageHistory: [
          { stage: 'APPLIED', createdAt: fiveDaysAgo },
          { stage: 'SCREENING', createdAt: new Date(fiveDaysAgo.getTime() + 1 * 86400000) },
        ],
        offers: [],
        interviews: [],
      },
      {
        id: 'app-3',
        jobId: 'job-2',
        status: 'OFFERED',
        currentStage: 'OFFER',
        createdAt: fiveDaysAgo,
        updatedAt: now,
        stageHistory: [
          { stage: 'APPLIED', createdAt: fiveDaysAgo },
          { stage: 'SCREENING', createdAt: fiveDaysAgo },
          { stage: 'INTERVIEW', createdAt: fiveDaysAgo },
          { stage: 'OFFER', createdAt: now },
        ],
        offers: [{ id: 'off-2', status: 'SENT', baseSalary: 140000, currency: 'USD' }],
        interviews: [
          {
            id: 'inv-2',
            status: 'COMPLETED',
            scorecards: [{ overallRating: 4, recommendation: 'HIRE' }],
          },
        ],
      },
    ];

    const mockJobs = [
      { id: 'job-1', title: 'Principal Architect', slug: 'principal-architect', status: 'PUBLISHED', department: 'Engineering' },
      { id: 'job-2', title: 'VP of Product', slug: 'vp-of-product', status: 'PUBLISHED', department: 'Product' },
    ];

    vi.mocked(db.application.findMany).mockResolvedValue(mockApplications as any);
    vi.mocked(db.job.findMany).mockResolvedValue(mockJobs as any);

    const result = await service.getWorkspaceAnalytics('acme', mockUser as any, {});

    expect(result.summary.totalApplicants).toBe(3);
    expect(result.summary.hiredCount).toBe(1);
    expect(result.summary.rejectedCount).toBe(1);
    expect(result.summary.averageTimeToHireDays).toBe(10);

    // Funnel stages
    expect(result.funnel.applied).toBe(3);
    expect(result.funnel.screening).toBe(3);
    expect(result.funnel.interview).toBe(2);
    expect(result.funnel.offer).toBe(2);
    expect(result.funnel.hired).toBe(1);

    // Conversion rates
    expect(result.funnel.conversionRates.appliedToScreening).toBe(100);
    expect(result.funnel.conversionRates.screeningToInterview).toBe(67); // 2 of 3
    expect(result.funnel.conversionRates.interviewToOffer).toBe(100); // 2 of 2
    expect(result.funnel.conversionRates.offerToHire).toBe(50); // 1 of 2

    // Offers
    expect(result.offers.totalOffers).toBe(2);
    expect(result.offers.accepted).toBe(1);
    expect(result.offers.pending).toBe(1);
    expect(result.offers.acceptanceRate).toBe(100); // 1 accepted / (1 accepted + 0 declined)

    // Scorecards & Interviews
    expect(result.interviews.totalInterviews).toBe(2);
    expect(result.interviews.completedInterviews).toBe(2);
    expect(result.interviews.averageRating).toBe(4.5);
    expect(result.interviews.recommendations.STRONG_HIRE).toBe(1);
    expect(result.interviews.recommendations.HIRE).toBe(1);

    // Job breakdown
    expect(result.jobBreakdown).toHaveLength(2);
    expect(result.jobBreakdown[0]?.title).toBe('Principal Architect');
    expect(result.jobBreakdown[0]?.totalApplicants).toBe(2);
    expect(result.jobBreakdown[0]?.hiresCount).toBe(1);
  });
});
