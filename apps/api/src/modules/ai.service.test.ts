/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { AiService } from './ai.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';
import { HttpException, NotFoundException } from '@nestjs/common';

function createMockDb() {
  return {
    candidateProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    candidateProfileEmbedding: {
      upsert: vi.fn(),
    },
    jobEmbedding: {
      upsert: vi.fn(),
    },
    matchResult: {
      upsert: vi.fn(),
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

const mockCandidateProfile = {
  id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  headline: 'Senior Staff TypeScript Engineer',
  bio: 'Specialist in distributed systems and Node.js microservices.',
  location: 'San Francisco, CA',
  yearsOfExperience: 8,
  openToRemote: true,
  searchVisible: true,
  skills: [
    { name: 'TypeScript', yearsOfExperience: 8, isPrimary: true },
    { name: 'Node.js', yearsOfExperience: 6, isPrimary: true },
    { name: 'PostgreSQL', yearsOfExperience: 5, isPrimary: false },
  ],
  experiences: [
    {
      title: 'Senior Engineer',
      companyName: 'Acme Corp',
      description: 'Built distributed ingestion pipelines.',
    },
  ],
  embedding: null,
  user: {
    email: 'candidate@dev.com',
    profile: {
      firstName: 'Alice',
      lastName: 'Smith',
      avatarUrl: null,
    },
  },
  savedByWorkspaces: [],
};

const mockJob = {
  id: 'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  slug: 'lead-backend-engineer',
  title: 'Lead Backend Engineer',
  department: 'Core Infrastructure',
  description: 'Looking for a Lead Engineer skilled in TypeScript, Node.js, and PostgreSQL.',
  location: 'San Francisco, CA',
  remoteType: 'REMOTE',
  experienceLevel: 'SENIOR',
  skills: [
    { name: 'TypeScript', isRequired: true },
    { name: 'Node.js', isRequired: true },
    { name: 'PostgreSQL', isRequired: false },
  ],
  embedding: null,
};

describe('AiService - Semantic Vector Embeddings & Hybrid Matching', () => {
  it('embedCandidateProfile: generates and caches candidate embedding vector', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (db.candidateProfile.findUnique as any).mockResolvedValue(mockCandidateProfile);
    (db.candidateProfileEmbedding.upsert as any).mockResolvedValue({
      id: 'emb-cand-1',
      candidateProfileId: mockCandidateProfile.id,
      embedding: new Array(384).fill(0.05),
    });

    const vector = await service.embedCandidateProfile(mockCandidateProfile.id);

    expect(vector).toBeDefined();
    expect(vector.length).toBe(384);
    expect(db.candidateProfile.findUnique).toHaveBeenCalledWith({
      where: { id: mockCandidateProfile.id },
      include: expect.any(Object),
    });
    expect(db.candidateProfileEmbedding.upsert).toHaveBeenCalled();
  });

  it('embedCandidateProfile: reuses cached vector when sourceHash matches and force is false', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    // Compute expected hash first or inspect behavior
    const cachedVector = new Array(384).fill(0.1);
    // Emulate candidate with existing embedding matching sourceHash
    (db.candidateProfile.findUnique as any).mockImplementation(async () => {
      // First call generates it
      return {
        ...mockCandidateProfile,
        embedding: null,
      };
    });

    const firstVector = await service.embedCandidateProfile(mockCandidateProfile.id);
    expect(firstVector.length).toBe(384);

    // Now mock with existing embedding matching the sourceHash saved in upsert
    const upsertCall = (db.candidateProfileEmbedding.upsert as any).mock.calls[0][0];
    const computedHash = upsertCall.create.sourceHash;

    (db.candidateProfile.findUnique as any).mockResolvedValue({
      ...mockCandidateProfile,
      embedding: {
        sourceHash: computedHash,
        embedding: cachedVector,
      },
    });

    (db.candidateProfileEmbedding.upsert as any).mockClear();
    const cachedResult = await service.embedCandidateProfile(mockCandidateProfile.id, false);

    expect(cachedResult).toEqual(cachedVector);
    expect(db.candidateProfileEmbedding.upsert).not.toHaveBeenCalled();
  });

  it('embedCandidateProfile: throws NotFoundException when candidate does not exist', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (db.candidateProfile.findUnique as any).mockResolvedValue(null);

    await expect(service.embedCandidateProfile('unknown-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('embedJob: generates and caches job requisition embedding vector', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (db.job.findUnique as any).mockResolvedValue(mockJob);
    (db.jobEmbedding.upsert as any).mockResolvedValue({
      id: 'emb-job-1',
      jobId: mockJob.id,
      embedding: new Array(384).fill(0.05),
    });

    const vector = await service.embedJob(mockJob.id);

    expect(vector).toBeDefined();
    expect(vector.length).toBe(384);
    expect(db.jobEmbedding.upsert).toHaveBeenCalled();
  });

  it('computeHybridMatch: computes hybrid score and saves matchResult record', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (db.job.findUnique as any).mockResolvedValue(mockJob);
    (db.candidateProfile.findUnique as any).mockResolvedValue(mockCandidateProfile);

    (db.jobEmbedding.upsert as any).mockResolvedValue({});
    (db.candidateProfileEmbedding.upsert as any).mockResolvedValue({});

    (db.matchResult.upsert as any).mockImplementation(({ create }: any) => ({
      id: 'match-1',
      ...create,
      calculatedAt: new Date(),
    }));

    const result = await service.computeHybridMatch(mockJob.id, mockCandidateProfile.id, 0.3);

    expect(result).toBeDefined();
    expect(result.matchRecord.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.matchRecord.overallScore).toBeLessThanOrEqual(100);
    expect(result.semanticScore).toBeGreaterThanOrEqual(0);
    expect(result.cosineSimilarity).toBeDefined();
    expect(result.deterministicMatch.score).toBe(100); // Perfect match on skills & senior exp
    expect(db.matchResult.upsert).toHaveBeenCalledWith({
      where: {
        jobId_candidateProfileId: {
          jobId: mockJob.id,
          candidateProfileId: mockCandidateProfile.id,
        },
      },
      create: expect.objectContaining({
        jobId: mockJob.id,
        candidateProfileId: mockCandidateProfile.id,
        overallScore: expect.any(Number),
        skillsScore: 100,
      }),
      update: expect.any(Object),
    });
  });

  it('getJobAiMatches: ranks candidates with workspace RBAC check', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (access.requireAction as any).mockResolvedValue({
      id: 'ws-1',
      slug: 'tech-corp',
    });

    (db.job.findFirst as any).mockResolvedValue(mockJob);
    (db.job.findUnique as any).mockResolvedValue(mockJob);
    (db.jobEmbedding.upsert as any).mockResolvedValue({});

    (db.candidateProfile.findMany as any).mockResolvedValue([mockCandidateProfile]);
    (db.candidateProfile.findUnique as any).mockResolvedValue(mockCandidateProfile);
    (db.candidateProfileEmbedding.upsert as any).mockResolvedValue({});

    (db.matchResult.upsert as any).mockImplementation(({ create }: any) => ({
      id: 'match-res-1',
      ...create,
      calculatedAt: new Date(),
    }));

    const response = await service.getJobAiMatches(
      mockRecruiter,
      'tech-corp',
      'lead-backend-engineer',
      { minScore: 50, limit: 10 },
    );

    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiter,
      'tech-corp',
      'candidates.read',
    );
    expect(response.job.slug).toBe('lead-backend-engineer');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]!.candidate.id).toBe(mockCandidateProfile.id);
    expect(response.items[0]!.overallScore).toBeGreaterThanOrEqual(50);
  });

  it('getJobAiMatches: rejects invalid query with 400 validation error', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (access.requireAction as any).mockResolvedValue({
      id: 'ws-1',
      slug: 'tech-corp',
    });

    await expect(
      service.getJobAiMatches(mockRecruiter, 'tech-corp', 'lead-backend-engineer', {
        minScore: 150, // max is 100
      }),
    ).rejects.toThrow(HttpException);
  });

  it('recomputeJobAiMatches: recalculates talent pool matches when permitted', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new AiService(db, access);

    (access.requireAction as any).mockResolvedValue({
      id: 'ws-1',
      slug: 'tech-corp',
    });

    (db.job.findFirst as any).mockResolvedValue(mockJob);
    (db.job.findUnique as any).mockResolvedValue(mockJob);
    (db.jobEmbedding.upsert as any).mockResolvedValue({});

    (db.candidateProfile.findMany as any).mockResolvedValue([
      { id: mockCandidateProfile.id },
    ]);
    (db.candidateProfile.findUnique as any).mockResolvedValue(mockCandidateProfile);
    (db.candidateProfileEmbedding.upsert as any).mockResolvedValue({});

    (db.matchResult.upsert as any).mockImplementation(({ create }: any) => ({
      id: 'match-res-recompute',
      ...create,
      calculatedAt: new Date(),
    }));

    const result = await service.recomputeJobAiMatches(
      mockRecruiter,
      'tech-corp',
      'lead-backend-engineer',
      { force: true },
    );

    expect(access.requireAction).toHaveBeenCalledWith(
      mockRecruiter,
      'tech-corp',
      'jobs.write',
    );
    expect(result.status).toBe('COMPLETED');
    expect(result.recomputedCount).toBe(1);
  });
});
