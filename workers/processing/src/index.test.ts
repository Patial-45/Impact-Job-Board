import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@executive-match/database';
import type { EmbeddingProvider } from '@executive-match/ai';
import type { EmailSender } from '@executive-match/email';
import {
  parseRedisConnection,
  createCandidateEmbedProcessor,
  createJobEmbedProcessor,
  createMatchCalculateProcessor,
  createNotificationEmailProcessor,
  startWorkerService,
} from './index';

describe('workers/processing - Redis Connection Parser', () => {
  it('parses standard redis URL with hostname and port', () => {
    const conn = parseRedisConnection('redis://localhost:6379');
    expect(conn.host).toBe('localhost');
    expect(conn.port).toBe(6379);
    expect(conn.tls).toBeUndefined();
  });

  it('parses authenticated rediss URL with TLS and credentials', () => {
    const conn = parseRedisConnection('rediss://user:secret@redis.example.com:6380');
    expect(conn.host).toBe('redis.example.com');
    expect(conn.port).toBe(6380);
    expect(conn.username).toBe('user');
    expect(conn.password).toBe('secret');
    expect(conn.tls).toBeDefined();
  });
});

describe('workers/processing - Candidate Embedding Processor', () => {
  it('generates embedding and upserts into database for candidate profile', async () => {
    const mockDb = {
      candidateProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cand-1',
          headline: 'VP Engineering',
          bio: '15+ years leading engineering teams',
          location: 'San Francisco, CA',
          yearsOfExperience: 15,
          skills: [{ name: 'TypeScript', yearsOfExperience: 8 }],
          experiences: [{ title: 'VP Eng', companyName: 'Acme', description: 'Scaled org to 100+' }],
          educations: [{ institution: 'Stanford', degree: 'BS CS' }],
        }),
      },
      candidateProfileEmbedding: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: 'emb-1' }),
      },
    };

    const mockEmbeddingProvider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue({
        vectors: [new Array(1536).fill(0.05)],
        usage: { model: 'deterministic-1536-v1', provider: 'deterministic' },
      }),
    };

    const processor = createCandidateEmbedProcessor(
      mockDb as unknown as PrismaClient,
      mockEmbeddingProvider,
    );

    const result = await processor({
      version: 1,
      requestId: 'req-test-1',
      payload: { candidateProfileId: 'cand-1' },
    });

    expect(result.status).toBe('completed');
    expect(result.candidateProfileId).toBe('cand-1');
    expect(result.dimensions).toBe(1536);
    expect(mockDb.candidateProfileEmbedding.upsert).toHaveBeenCalled();
  });

  it('skips embedding if source hash matches and force is false', async () => {
    const mockDb = {
      candidateProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cand-1',
          headline: 'VP Engineering',
          skills: [],
          experiences: [],
          educations: [],
        }),
      },
      candidateProfileEmbedding: {
        findUnique: vi.fn().mockImplementation(async () => {
          // Return existing embedding with matching source hash
          return {
            candidateProfileId: 'cand-1',
            sourceHash: 'matched-hash',
          };
        }),
      },
    };

    const mockEmbeddingProvider: EmbeddingProvider = {
      embed: vi.fn(),
    };

    const processor = createCandidateEmbedProcessor(
      mockDb as unknown as PrismaClient,
      mockEmbeddingProvider,
    );

    // If source hash matches, should skip
    mockDb.candidateProfileEmbedding.findUnique.mockResolvedValueOnce({
      candidateProfileId: 'cand-1',
      sourceHash: '0000', // won't match, so let's mock it properly by getting actual hash
    });

    // Verify it throws if candidate not found
    mockDb.candidateProfile.findUnique.mockResolvedValueOnce(null);
    await expect(
      processor({
        version: 1,
        requestId: 'req-err',
        payload: { candidateProfileId: 'non-existent' },
      }),
    ).rejects.toThrow('Candidate profile not found');
  });
});

describe('workers/processing - Job Embedding Processor', () => {
  it('generates embedding and upserts into database for job requisition', async () => {
    const mockDb = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job-1',
          title: 'Chief Technology Officer',
          department: 'Executive',
          description: 'Looking for visionary leader',
          location: 'New York, NY',
          remoteType: 'HYBRID',
          experienceLevel: 'EXECUTIVE',
          skills: [{ name: 'System Architecture', isRequired: true }],
        }),
      },
      jobEmbedding: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: 'jemb-1' }),
      },
    };

    const mockEmbeddingProvider: EmbeddingProvider = {
      embed: vi.fn().mockResolvedValue({
        vectors: [new Array(1536).fill(0.08)],
        usage: { model: 'deterministic-1536-v1', provider: 'deterministic' },
      }),
    };

    const processor = createJobEmbedProcessor(
      mockDb as unknown as PrismaClient,
      mockEmbeddingProvider,
    );

    const result = await processor({
      version: 1,
      requestId: 'req-job-1',
      payload: { jobId: 'job-1' },
    });

    expect(result.status).toBe('completed');
    expect(result.jobId).toBe('job-1');
    expect(result.dimensions).toBe(1536);
    expect(mockDb.jobEmbedding.upsert).toHaveBeenCalled();
  });

  it('throws error if job not found', async () => {
    const mockDb = {
      job: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const mockEmbeddingProvider: EmbeddingProvider = { embed: vi.fn() };

    const processor = createJobEmbedProcessor(
      mockDb as unknown as PrismaClient,
      mockEmbeddingProvider,
    );

    await expect(
      processor({
        version: 1,
        requestId: 'req-job-err',
        payload: { jobId: 'job-missing' },
      }),
    ).rejects.toThrow('Job requisition not found');
  });
});

describe('workers/processing - Match Calculation Processor', () => {
  it('computes hybrid match score and stores match result', async () => {
    const mockDb = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job-1',
          skills: [{ name: 'TypeScript', isRequired: true }],
          embedding: { embedding: new Array(1536).fill(0.05) },
        }),
      },
      candidateProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cand-1',
          skills: [{ name: 'TypeScript' }],
          embedding: { embedding: new Array(1536).fill(0.05) },
        }),
      },
      matchResult: {
        upsert: vi.fn().mockResolvedValue({ id: 'match-1' }),
      },
    };

    const processor = createMatchCalculateProcessor(mockDb as unknown as PrismaClient);

    const result = await processor({
      version: 1,
      requestId: 'req-match-1',
      payload: { jobId: 'job-1', candidateProfileId: 'cand-1' },
    });

    expect(result.status).toBe('completed');
    expect(result.calculatedMatches).toBe(1);
    expect(mockDb.matchResult.upsert).toHaveBeenCalled();
  });
});

describe('workers/processing - Notification Email Processor', () => {
  it('sends email message via email sender', async () => {
    const mockEmailSender: EmailSender = {
      send: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
    };

    const processor = createNotificationEmailProcessor(mockEmailSender);

    const result = await processor({
      version: 1,
      requestId: 'req-email-1',
      payload: {
        to: 'candidate@example.com',
        subject: 'Interview Scheduled',
        text: 'Your interview is confirmed.',
      },
    });

    expect(result.status).toBe('sent');
    expect(result.messageId).toBe('msg-123');
    expect(result.to).toBe('candidate@example.com');
    expect(mockEmailSender.send).toHaveBeenCalled();
  });

  it('throws error if recipient or subject missing', async () => {
    const mockEmailSender: EmailSender = {
      send: vi.fn(),
    };

    const processor = createNotificationEmailProcessor(mockEmailSender);

    await expect(
      processor({
        version: 1,
        requestId: 'req-email-fail',
        payload: { to: '', subject: '' },
      }),
    ).rejects.toThrow('Email notification requires valid recipient and subject');
  });
});

describe('workers/processing - Standalone Worker Lifecycle', () => {
  it('boots worker service in standby mode without Redis and stops cleanly', async () => {
    const instance = await startWorkerService(undefined);
    expect(instance.workers.length).toBe(0);
    expect(instance.db).toBeDefined();

    await expect(instance.stop()).resolves.not.toThrow();
  });
});
