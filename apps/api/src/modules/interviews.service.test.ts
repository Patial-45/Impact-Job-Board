/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { InterviewsService, AssessmentsService } from './interviews.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';
import { NotFoundException } from '@nestjs/common';

function createMockDb() {
  return {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    interview: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    interviewScorecard: {
      upsert: vi.fn(),
    },
    candidateProfile: {
      findUnique: vi.fn(),
    },
    assessment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    assessmentInvite: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
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

describe('InterviewsService - Scheduling, Management & Scorecards', () => {
  it('createInterview: schedules interview and auto-advances stage to INTERVIEW', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new InterviewsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });

    (db.application.findFirst as any).mockResolvedValue({
      id: 'app-1',
      currentStage: 'APPLIED',
      status: 'SUBMITTED',
      job: { title: 'Staff Engineer', slug: 'staff-engineer' },
      candidateProfile: {
        id: 'cand-1',
        user: { email: 'candidate@dev.com', profile: { displayName: 'Alice' } },
      },
    });

    const mockCreatedInterview = {
      id: 'int-1',
      workspaceId: 'ws-1',
      applicationId: 'app-1',
      title: 'Technical Deep Dive',
      type: 'TECHNICAL',
      status: 'SCHEDULED',
      scheduledAt: new Date('2026-10-15T14:00:00Z'),
      durationMinutes: 60,
      location: 'https://meet.google.com/abc-xyz',
      timezone: 'UTC',
      participants: [{ userId: mockRecruiter.id, role: 'LEAD_INTERVIEWER' }],
    };

    (db.interview.create as any).mockResolvedValue(mockCreatedInterview);
    (db.application.update as any).mockResolvedValue({});

    const result = await service.createInterview(mockRecruiter, 'tech-corp', {
      applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Technical Deep Dive',
      type: 'TECHNICAL',
      scheduledAt: '2026-10-15T14:00:00.000Z',
      durationMinutes: 60,
      location: 'https://meet.google.com/abc-xyz',
    });

    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiter,
      'tech-corp',
      'interviews.write',
    );
    expect(db.interview.create).toHaveBeenCalled();
    expect(db.application.update).toHaveBeenCalledWith({
      where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      data: expect.objectContaining({
        currentStage: 'INTERVIEW',
        status: 'INTERVIEWING',
      }),
    });
    expect(result.interview.id).toBe('int-1');
  });

  it('createInterview: throws 404 when application is not in workspace', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new InterviewsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.application.findFirst as any).mockResolvedValue(null);

    await expect(
      service.createInterview(mockRecruiter, 'tech-corp', {
        applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Screening',
        type: 'SCREENING',
        scheduledAt: '2026-10-15T14:00:00.000Z',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('getWorkspaceInterviews: lists scheduled interviews with candidate details', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new InterviewsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.interview.findMany as any).mockResolvedValue([
      {
        id: 'int-1',
        title: 'System Design Interview',
        status: 'SCHEDULED',
        scheduledAt: new Date('2026-10-15T14:00:00Z'),
        application: {
          job: { title: 'Lead Architect', slug: 'lead-architect' },
          candidateProfile: {
            headline: 'Systems Architect',
            user: { profile: { displayName: 'Bob' } },
          },
        },
        participants: [],
        scorecards: [],
      },
    ]);

    const result = await service.getWorkspaceInterviews(mockRecruiter, 'tech-corp', {
      status: 'SCHEDULED',
    });

    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiter,
      'tech-corp',
      'interviews.read',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.title).toBe('System Design Interview');
  });

  it('cancelInterview: updates status to CANCELLED with reason', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new InterviewsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.interview.findFirst as any).mockResolvedValue({ id: 'int-1', workspaceId: 'ws-1' });
    (db.interview.update as any).mockResolvedValue({
      id: 'int-1',
      status: 'CANCELLED',
      cancellationReason: 'Rescheduling requested',
    });

    const res = await service.cancelInterview(mockRecruiter, 'tech-corp', 'int-1', {
      cancellationReason: 'Rescheduling requested',
    });

    expect(db.interview.update).toHaveBeenCalledWith({
      where: { id: 'int-1' },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Rescheduling requested',
      },
    });
    expect(res.interview.status).toBe('CANCELLED');
  });

  it('submitScorecard: upserts evaluator feedback and marks interview COMPLETED', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new InterviewsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.interview.findFirst as any).mockResolvedValue({
      id: 'int-1',
      workspaceId: 'ws-1',
      status: 'SCHEDULED',
    });

    const mockScorecard = {
      id: 'sc-1',
      interviewId: 'int-1',
      evaluatorId: mockRecruiter.id,
      recommendation: 'STRONG_HIRE',
      overallRating: 5,
      technicalRating: 5,
      cultureRating: 5,
    };

    (db.interviewScorecard.upsert as any).mockResolvedValue(mockScorecard);
    (db.interview.update as any).mockResolvedValue({});

    const result = await service.submitScorecard(mockRecruiter, 'tech-corp', 'int-1', {
      recommendation: 'STRONG_HIRE',
      overallRating: 5,
      technicalRating: 5,
      cultureRating: 5,
      strengths: 'Superb architecture knowledge',
    });

    expect(db.interviewScorecard.upsert).toHaveBeenCalled();
    expect(db.interview.update).toHaveBeenCalledWith({
      where: { id: 'int-1' },
      data: { status: 'COMPLETED' },
    });
    expect(result.scorecard.recommendation).toBe('STRONG_HIRE');
  });

  it('getCandidateInterviews: retrieves candidate scheduled sessions', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new InterviewsService(db, access);

    (db.candidateProfile.findUnique as any).mockResolvedValue({ id: 'cand-profile-1' });
    (db.interview.findMany as any).mockResolvedValue([
      {
        id: 'int-cand-1',
        title: 'Intro Call',
        scheduledAt: new Date('2026-10-18T10:00:00Z'),
        application: {
          job: {
            title: 'Frontend Engineer',
            company: { name: 'Acme Corp', slug: 'acme' },
          },
        },
      },
    ]);

    const result = await service.getCandidateInterviews(mockCandidateUser);

    expect(db.candidateProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: mockCandidateUser.id },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.title).toBe('Intro Call');
  });
});

describe('AssessmentsService - Creation, Invites & Scoring', () => {
  it('createAssessment: creates assessment template for workspace', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AssessmentsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.assessment.create as any).mockResolvedValue({
      id: 'ass-1',
      title: 'Full Stack TypeScript Assessment',
      passingScore: 80,
    });

    const res = await service.createAssessment(mockRecruiter, 'tech-corp', {
      title: 'Full Stack TypeScript Assessment',
      passingScore: 80,
      timeLimitMinutes: 60,
    });

    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiter,
      'tech-corp',
      'assessments.write',
    );
    expect(res.assessment.id).toBe('ass-1');
  });

  it('inviteCandidateAssessment: generates secure invite token', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AssessmentsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.assessment.findFirst as any).mockResolvedValue({ id: 'ass-1', workspaceId: 'ws-1' });
    (db.application.findFirst as any).mockResolvedValue({ id: 'app-1' });

    (db.assessmentInvite.upsert as any).mockResolvedValue({
      id: 'inv-1',
      token: 'secure-token-123',
      status: 'PENDING',
    });

    const res = await service.inviteCandidateAssessment(mockRecruiter, 'tech-corp', {
      assessmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      applicationId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      expiresInDays: 7,
    });

    expect(res.invite.status).toBe('PENDING');
    expect(db.assessmentInvite.upsert).toHaveBeenCalled();
  });

  it('submitAssessmentResult: scores candidate assessment invite', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AssessmentsService(db, access);

    (access.requireAction as any).mockResolvedValue({ id: 'ws-1', slug: 'tech-corp' });
    (db.assessmentInvite.findFirst as any).mockResolvedValue({ id: 'inv-1' });
    (db.assessmentInvite.update as any).mockResolvedValue({
      id: 'inv-1',
      status: 'COMPLETED',
      score: 92,
      feedback: 'Excellent clean code solution.',
    });

    const res = await service.submitAssessmentResult(mockRecruiter, 'tech-corp', 'inv-1', {
      score: 92,
      feedback: 'Excellent clean code solution.',
    });

    expect(res.invite.status).toBe('COMPLETED');
    expect(res.invite.score).toBe(92);
  });
});
