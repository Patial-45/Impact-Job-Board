/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { ApplicationsService } from './applications.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';
import type { ObjectStorage } from '@executive-match/storage';

function createMockDb() {
  return {
    candidateProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    candidateResume: {
      findFirst: vi.fn(),
    },
    job: {
      findFirst: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    applicationStageHistory: {
      create: vi.fn(),
    },
    applicationNote: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
      return cb({
        application: {
          create: vi.fn().mockImplementation(({ data }) => ({
            id: 'app-created-1',
            ...data,
          })),
          update: vi.fn().mockImplementation(({ data }) => ({
            id: 'app-updated-1',
            ...data,
          })),
        },
        applicationStageHistory: {
          create: vi.fn().mockResolvedValue({ id: 'hist-1' }),
        },
      });
    }),
  } as unknown as DatabaseService;
}

function createMockAccessService() {
  return {
    requireMembership: vi.fn(),
    requireAction: vi.fn(),
  } as unknown as WorkspaceAccessService;
}

function createMockStorage() {
  return {
    createDownloadUrl: vi.fn().mockResolvedValue('https://storage.local/signed-download-url'),
    createUploadUrl: vi.fn(),
    delete: vi.fn(),
  } as unknown as ObjectStorage;
}

const mockCandidateUser = {
  id: 'usr-cand-1',
  email: 'candidate@example.com',
  globalRole: 'USER' as const,
};

const mockRecruiterUser = {
  id: 'usr-rec-1',
  email: 'recruiter@example.com',
  globalRole: 'USER' as const,
};

describe('ApplicationsService - Candidate Applications', () => {
  it('successfully submits job application with resume and initial stage history', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValueOnce({
      id: 'cp-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      slug: 'senior-engineer',
      title: 'Senior Engineer',
      status: 'PUBLISHED',
      workspace: {
        id: 'ws-1',
        slug: 'tech-corp',
        company: { name: 'Tech Corp', slug: 'tech-corp', logoKey: null },
      },
    } as any);

    vi.mocked(db.application.findUnique).mockResolvedValueOnce(null);

    vi.mocked(db.candidateResume.findFirst).mockResolvedValueOnce({
      id: 'res-1',
      candidateProfileId: 'cp-1',
      isPrimary: true,
    } as any);

    const result = await service.applyToJob(mockCandidateUser, 'senior-engineer', {
      coverLetter: 'I am excited about this role.',
    });

    expect(result.jobId).toBe('job-1');
    expect(result.status).toBe('SUBMITTED');
    expect(result.currentStage).toBe('APPLIED');
    expect(result.job.title).toBe('Senior Engineer');
    expect(db.$transaction).toHaveBeenCalled();
  });

  it('rejects duplicate applications with 409 Conflict', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValueOnce({
      id: 'cp-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      slug: 'senior-engineer',
      status: 'PUBLISHED',
      workspace: { id: 'ws-1', slug: 'tech-corp' },
    } as any);

    vi.mocked(db.application.findUnique).mockResolvedValueOnce({
      id: 'existing-app-1',
    } as any);

    await expect(
      service.applyToJob(mockCandidateUser, 'senior-engineer', {}),
    ).rejects.toThrow('You have already submitted an application');
  });

  it('rejects applying to non-existent or unpublished job with 404 NotFound', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValueOnce({
      id: 'cp-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.job.findFirst).mockResolvedValueOnce(null);

    await expect(
      service.applyToJob(mockCandidateUser, 'closed-job', {}),
    ).rejects.toThrow('Job not found or is no longer accepting applications');
  });

  it('retrieves candidate applications list', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValueOnce({
      id: 'cp-1',
      userId: mockCandidateUser.id,
    } as any);

    vi.mocked(db.application.findMany).mockResolvedValueOnce([
      {
        id: 'app-1',
        status: 'IN_REVIEW',
        currentStage: 'SCREENING',
        createdAt: new Date(),
        job: {
          id: 'job-1',
          title: 'Staff Architect',
          slug: 'staff-architect',
          workspace: { company: { name: 'Fintech Co', slug: 'fintech-co' } },
        },
        resume: { id: 'res-1', fileName: 'cv.pdf' },
        stageHistory: [],
      },
    ] as any);

    const result = await service.getCandidateApplications(mockCandidateUser);
    expect(result.total).toBe(1);
    expect(result.items[0]?.job?.title).toBe('Staff Architect');
  });

  it('allows candidate to withdraw application', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(db.application.findFirst).mockResolvedValueOnce({
      id: 'app-1',
      status: 'IN_REVIEW',
      candidateProfile: { userId: mockCandidateUser.id },
    } as any);

    const result = await service.withdrawApplication(mockCandidateUser, 'app-1', {
      reason: 'Accepted offer elsewhere',
    });

    expect(result.status).toBe('WITHDRAWN');
    expect(result.withdrawnReason).toBe('Accepted offer elsewhere');
  });
});

describe('ApplicationsService - Recruiter ATS Pipeline', () => {
  it('lists job applications with pagination and workspace tenant access verification', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'RECRUITER',
    });

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      workspaceId: 'ws-1',
      slug: 'devops-lead',
    } as any);

    vi.mocked(db.application.findMany).mockResolvedValueOnce([
      {
        id: 'app-10',
        currentStage: 'SCREENING',
        status: 'IN_REVIEW',
        candidateProfile: {
          headline: 'Senior Cloud Engineer',
          user: { email: 'cloud@example.com', profile: { displayName: 'John Cloud' } },
          skills: [{ name: 'Terraform', yearsOfExperience: 6, isPrimary: true }],
        },
        resume: { id: 'res-1', fileName: 'john_resume.pdf' },
        _count: { notes: 2 },
        stageHistory: [{ stage: 'SCREENING', createdAt: new Date() }],
      },
    ] as any);

    vi.mocked(db.application.count).mockResolvedValueOnce(1);

    const result = await service.getJobApplications(mockRecruiterUser, 'acme-corp', 'devops-lead', {
      stage: 'SCREENING',
      page: 1,
      pageSize: 10,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.candidateProfile.user.profile?.displayName).toBe('John Cloud');
    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiterUser,
      'acme-corp',
      'applications.read',
    );
  });

  it('updates application stage and appends history log', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'RECRUITER',
    });

    vi.mocked(db.application.findFirst).mockResolvedValueOnce({
      id: 'app-10',
      status: 'IN_REVIEW',
      currentStage: 'SCREENING',
      job: { workspaceId: 'ws-1' },
    } as any);

    const result = await service.updateApplicationStage(mockRecruiterUser, 'acme-corp', 'app-10', {
      stage: 'INTERVIEW',
      notes: 'Passed initial technical screening with score 92/100',
    });

    expect(result.currentStage).toBe('INTERVIEW');
    expect(result.status).toBe('INTERVIEWING');
    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiterUser,
      'acme-corp',
      'applications.write',
    );
  });

  it('creates recruiter private note on candidate application', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const storage = createMockStorage();
    const service = new ApplicationsService(db, access, storage);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'RECRUITER',
    });

    vi.mocked(db.application.findFirst).mockResolvedValueOnce({
      id: 'app-10',
      job: { workspaceId: 'ws-1' },
    } as any);

    vi.mocked(db.applicationNote.create).mockResolvedValueOnce({
      id: 'note-1',
      applicationId: 'app-10',
      workspaceId: 'ws-1',
      authorUserId: mockRecruiterUser.id,
      content: 'Candidate has strong distributed systems background.',
      createdAt: new Date(),
      author: {
        email: 'recruiter@example.com',
        profile: { displayName: 'Jane Recruiter' },
      },
    } as any);

    const note = await service.createApplicationNote(mockRecruiterUser, 'acme-corp', 'app-10', {
      content: 'Candidate has strong distributed systems background.',
    });

    expect(note.content).toBe('Candidate has strong distributed systems background.');
    expect(note.author.profile?.displayName).toBe('Jane Recruiter');
  });
});
