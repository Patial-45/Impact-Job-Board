/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { MatchingService, calculateJobMatch } from './matching.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';

function createMockDb() {
  return {
    candidateProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    job: {
      findFirst: vi.fn(),
    },
    savedCandidate: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    savedJob: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
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
  id: 'usr-rec-1',
  email: 'recruiter@tech.com',
  globalRole: 'USER' as const,
};

const mockCandidate = {
  id: 'usr-cand-1',
  email: 'candidate@dev.com',
  globalRole: 'USER' as const,
};

describe('Matching Engine - Deterministic Matching Algorithm', () => {
  it('calculates 100% match score for perfect candidate alignment', () => {
    const job = {
      skills: [
        { name: 'TypeScript', isRequired: true },
        { name: 'Node.js', isRequired: true },
        { name: 'GraphQL', isRequired: false },
      ],
      experienceLevel: 'SENIOR',
      remoteType: 'REMOTE',
      location: null,
    };

    const candidate = {
      skills: [{ name: 'TypeScript' }, { name: 'Node.js' }, { name: 'GraphQL' }, { name: 'Docker' }],
      yearsOfExperience: 6,
      openToRemote: true,
      location: 'New York, NY',
    };

    const result = calculateJobMatch(job, candidate);
    expect(result.score).toBe(100);
    expect(result.matchedSkills).toEqual(['TypeScript', 'Node.js', 'GraphQL']);
    expect(result.missingSkills).toHaveLength(0);
    expect(result.experienceScore).toBe(20);
    expect(result.locationCompatible).toBe(true);
  });

  it('calculates partial score when required skills are missing and experience is lower', () => {
    const job = {
      skills: [
        { name: 'Rust', isRequired: true },
        { name: 'Distributed Systems', isRequired: true },
      ],
      experienceLevel: 'LEAD',
      remoteType: 'REMOTE',
      location: null,
    };

    const candidate = {
      skills: [{ name: 'Rust' }],
      yearsOfExperience: 4, // LEAD expects 8, so diff is 4
      openToRemote: true,
      location: 'Berlin, Germany',
    };

    const result = calculateJobMatch(job, candidate);
    // Req: 1 of 2 = 25/50. Pref: 20 (no pref required). Exp: max(5, 20 - 4*5) = 5/20. Loc: 10/10. Total: 60.
    expect(result.score).toBe(60);
    expect(result.matchedSkills).toEqual(['Rust']);
    expect(result.missingSkills).toEqual(['Distributed Systems']);
    expect(result.experienceScore).toBe(5);
  });
});

describe('MatchingService - Recruiter Talent Search & Matching', () => {
  it('searches talent pool respecting searchVisible flag and permissions', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new MatchingService(db, access);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-inc',
      name: 'Acme Inc',
      role: 'RECRUITER',
    });

    vi.mocked(db.candidateProfile.findMany).mockResolvedValueOnce([
      {
        id: 'cp-1',
        headline: 'Staff Infrastructure Architect',
        bio: '10 years building cloud platforms.',
        location: 'Seattle, WA',
        yearsOfExperience: 10,
        openToRemote: true,
        user: { email: 'staff@example.com', profile: { displayName: 'Alex Staff' } },
        skills: [{ name: 'Kubernetes', isPrimary: true }],
        experiences: [],
        educations: [],
        savedByWorkspaces: [],
      },
    ] as any);

    vi.mocked(db.candidateProfile.count).mockResolvedValueOnce(1);

    const result = await service.searchCandidates(mockRecruiter, 'acme-inc', {
      query: 'Infrastructure',
      minExperience: 8,
      page: 1,
      pageSize: 10,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.headline).toBe('Staff Infrastructure Architect');
    expect(access.requireAction).toHaveBeenCalledWith(mockRecruiter, 'acme-inc', 'candidates.read');
  });

  it('ranks and scores candidates against a job requisition when jobId is provided', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new MatchingService(db, access);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-inc',
      name: 'Acme Inc',
      role: 'RECRUITER',
    });

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      title: 'Senior Backend Engineer',
      slug: 'senior-backend-engineer',
      skills: [{ name: 'Go', isRequired: true }],
      experienceLevel: 'SENIOR',
      remoteType: 'REMOTE',
      location: null,
    } as any);

    vi.mocked(db.candidateProfile.findMany).mockResolvedValueOnce([
      {
        id: 'cp-1',
        headline: 'Go Specialist',
        yearsOfExperience: 6,
        openToRemote: true,
        location: null,
        user: { email: 'go@example.com', profile: { displayName: 'Go Dev' } },
        skills: [{ name: 'Go', isPrimary: true }],
        experiences: [],
        educations: [],
        savedByWorkspaces: [],
      },
    ] as any);

    vi.mocked(db.candidateProfile.count).mockResolvedValueOnce(1);

    const result = await service.searchCandidates(mockRecruiter, 'acme-inc', {
      jobId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.items[0]?.matchResult?.score).toBe(100);
    expect(result.items[0]?.matchResult?.matchedSkills).toContain('Go');
  });

  it('saves and unsaves candidate for recruiter workspace', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new MatchingService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue({
      id: 'ws-1',
      slug: 'acme-inc',
      name: 'Acme Inc',
      role: 'RECRUITER',
    });

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValueOnce({
      id: 'cp-1',
    } as any);

    vi.mocked(db.savedCandidate.upsert).mockResolvedValueOnce({
      id: 'sc-1',
      workspaceId: 'ws-1',
      candidateProfileId: 'cp-1',
      notes: 'Strong candidate for upcoming expansion.',
    } as any);

    const saved = await service.saveCandidate(mockRecruiter, 'acme-inc', 'cp-1', {
      notes: 'Strong candidate for upcoming expansion.',
    });

    expect(saved.id).toBe('sc-1');

    vi.mocked(db.savedCandidate.deleteMany).mockResolvedValueOnce({ count: 1 });
    const unsaved = await service.unsaveCandidate(mockRecruiter, 'acme-inc', 'cp-1');
    expect(unsaved.success).toBe(true);
  });
});

describe('MatchingService - Candidate Saved Jobs', () => {
  it('allows candidate to bookmark and retrieve saved jobs', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new MatchingService(db, access);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cp-1',
      userId: mockCandidate.id,
    } as any);

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      slug: 'head-of-product',
      status: 'PUBLISHED',
    } as any);

    vi.mocked(db.savedJob.upsert).mockResolvedValueOnce({
      id: 'sj-1',
      candidateProfileId: 'cp-1',
      jobId: 'job-1',
    } as any);

    const bookmark = await service.saveJobForCandidate(mockCandidate, 'head-of-product');
    expect(bookmark.id).toBe('sj-1');

    vi.mocked(db.savedJob.findMany).mockResolvedValueOnce([
      {
        id: 'sj-1',
        createdAt: new Date(),
        job: { id: 'job-1', title: 'Head of Product', slug: 'head-of-product' },
      },
    ] as any);

    const savedJobs = await service.getCandidateSavedJobs(mockCandidate);
    expect(savedJobs.total).toBe(1);
    expect(savedJobs.items[0]?.job.title).toBe('Head of Product');
  });
});
