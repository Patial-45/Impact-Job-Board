/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { JobsService } from './jobs.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';

function createMockDb() {
  return {
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    jobSkill: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  } as unknown as DatabaseService;
}

function createMockAccessService() {
  return {
    requireMembership: vi.fn(),
    requireAction: vi.fn(),
  } as unknown as WorkspaceAccessService;
}

describe('JobsService - Company Profile Management', () => {
  it('returns workspace company profile for authenticated member', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(access.requireMembership).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'ADMIN',
    });

    vi.mocked(db.company.findUnique).mockResolvedValueOnce({
      id: 'comp-1',
      workspaceId: 'ws-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      industry: 'Software',
      deletedAt: null,
    } as any);

    const company = await service.getWorkspaceCompany(
      { id: 'user-1', email: 'admin@acme.com', globalRole: 'USER' },
      'acme-corp',
    );

    expect(company.name).toBe('Acme Corp');
    expect(company.industry).toBe('Software');
  });

  it('updates company profile with valid payload and workspace.manage check', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'ADMIN',
    });

    vi.mocked(db.company.update).mockResolvedValueOnce({
      id: 'comp-1',
      workspaceId: 'ws-1',
      name: 'Acme Innovations',
      website: 'https://acme.io',
      industry: 'Enterprise AI',
    } as any);

    const updated = await service.updateWorkspaceCompany(
      { id: 'user-1', email: 'admin@acme.com', globalRole: 'USER' },
      'acme-corp',
      {
        name: 'Acme Innovations',
        website: 'https://acme.io',
        industry: 'Enterprise AI',
      },
    );

    expect(updated.name).toBe('Acme Innovations');
    expect(access.requireAction).toHaveBeenCalledWith(expect.anything(), 'acme-corp', 'workspace.manage');
  });
});

describe('JobsService - Employer ATS Job Management', () => {
  it('creates job with auto-generated slug and skills relation', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'RECRUITER',
    });

    vi.mocked(db.job.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.job.create).mockResolvedValueOnce({
      id: 'job-1',
      workspaceId: 'ws-1',
      slug: 'senior-full-stack-engineer',
      title: 'Senior Full Stack Engineer',
      status: 'DRAFT',
      skills: [
        { id: 'js-1', name: 'TypeScript', isRequired: true },
        { id: 'js-2', name: 'Node.js', isRequired: true },
      ],
    } as any);

    const job = await service.createWorkspaceJob(
      { id: 'recruiter-1', email: 'recruiter@acme.com', globalRole: 'USER' },
      'acme-corp',
      {
        title: 'Senior Full Stack Engineer',
        description: 'Building mission critical multi-tenant web applications and cloud architectures.',
        department: 'Engineering',
        remoteType: 'REMOTE',
        skills: [
          { name: 'TypeScript', isRequired: true },
          { name: 'Node.js', isRequired: true },
        ],
      },
    );

    expect(job.title).toBe('Senior Full Stack Engineer');
    expect(job.status).toBe('DRAFT');
    expect(job.skills).toHaveLength(2);
    expect(access.requireAction).toHaveBeenCalledWith(expect.anything(), 'acme-corp', 'jobs.write');
  });

  it('transitions job status to PUBLISHED with publishedAt timestamp', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'RECRUITER',
    });

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      workspaceId: 'ws-1',
      slug: 'senior-engineer',
      status: 'DRAFT',
      publishedAt: null,
      closedAt: null,
    } as any);

    vi.mocked(db.job.update).mockResolvedValueOnce({
      id: 'job-1',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      closedAt: null,
      skills: [],
    } as any);

    const updated = await service.updateWorkspaceJobStatus(
      { id: 'recruiter-1', email: 'recruiter@acme.com', globalRole: 'USER' },
      'acme-corp',
      'senior-engineer',
      { status: 'PUBLISHED' },
    );

    expect(updated.status).toBe('PUBLISHED');
    expect(updated.publishedAt).toBeInstanceOf(Date);
  });

  it('soft-deletes a job with timestamp', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValueOnce({
      id: 'ws-1',
      slug: 'acme-corp',
      name: 'Acme Corp',
      role: 'ADMIN',
    });

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      workspaceId: 'ws-1',
      slug: 'old-role',
    } as any);

    vi.mocked(db.job.update).mockResolvedValueOnce({
      id: 'job-1',
      deletedAt: new Date(),
    } as any);

    const result = await service.deleteWorkspaceJob(
      { id: 'admin-1', email: 'admin@acme.com', globalRole: 'USER' },
      'acme-corp',
      'old-role',
    );

    expect(result.success).toBe(true);
    expect(db.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});

describe('JobsService - Public Discovery Board', () => {
  it('lists published jobs with search filtering and pagination', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(db.job.findMany).mockResolvedValueOnce([
      {
        id: 'job-pub-1',
        slug: 'principal-devops-engineer',
        title: 'Principal DevOps Engineer',
        description: 'Kubernetes, Terraform, AWS',
        department: 'Infrastructure',
        location: 'Remote, US',
        remoteType: 'REMOTE',
        employmentType: 'FULL_TIME',
        experienceLevel: 'LEAD',
        minSalary: 180000,
        maxSalary: 230000,
        currency: 'USD',
        publishedAt: new Date(),
        skills: [{ id: 's-1', name: 'Kubernetes', isRequired: true }],
        workspace: {
          company: {
            name: 'CloudCorp',
            slug: 'cloudcorp',
            logoKey: null,
            industry: 'Cloud',
            location: 'Austin, TX',
          },
        },
      },
    ] as any);

    vi.mocked(db.job.count).mockResolvedValueOnce(1);

    const result = await service.listPublicJobs({
      query: 'devops',
      remoteType: 'REMOTE',
      page: 1,
      pageSize: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.title).toBe('Principal DevOps Engineer');
    expect(result.items[0]?.company?.name).toBe('CloudCorp');
    expect(result.total).toBe(1);
  });

  it('returns details of single published job', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new JobsService(db, access);

    vi.mocked(db.job.findFirst).mockResolvedValueOnce({
      id: 'job-1',
      slug: 'lead-ai-researcher',
      title: 'Lead AI Researcher',
      description: 'NLP, Large Language Models',
      department: 'Research',
      location: 'San Francisco, CA',
      remoteType: 'HYBRID',
      employmentType: 'FULL_TIME',
      experienceLevel: 'LEAD',
      minSalary: 220000,
      maxSalary: 300000,
      currency: 'USD',
      publishedAt: new Date(),
      skills: [{ id: 'sk-1', name: 'PyTorch', isRequired: true }],
      workspace: {
        company: {
          name: 'OpenAI Lab',
          slug: 'openai-lab',
          description: 'Pioneering frontier AI',
        },
      },
    } as any);

    const job = await service.getPublicJob('lead-ai-researcher');
    expect(job.title).toBe('Lead AI Researcher');
    expect(job.company?.name).toBe('OpenAI Lab');
  });
});
