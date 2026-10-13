import { createHash } from 'node:crypto';
import type { PrismaClient } from '@executive-match/database';
import {
  buildJobEmbeddingDocument,
  type EmbeddingProvider,
} from '@executive-match/ai';
import type { JobEnvelope } from '@executive-match/shared';
import type { JobEmbedPayload } from '../index';

export function createJobEmbedProcessor(
  db: PrismaClient,
  embeddingProvider: EmbeddingProvider,
) {
  return async (jobData: JobEnvelope<JobEmbedPayload>) => {
    const { jobId, force } = jobData.payload;

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        skills: true,
      },
    });

    if (!job) {
      throw new Error(`Job requisition not found: ${jobId}`);
    }

    const documentText = buildJobEmbeddingDocument({
      title: job.title,
      department: job.department,
      description: job.description,
      location: job.location,
      remoteType: job.remoteType,
      experienceLevel: job.experienceLevel,
      skills: job.skills.map((s) => ({ name: s.name, isRequired: s.isRequired })),
    });

    const sourceHash = createHash('sha256').update(documentText).digest('hex');

    // Skip if existing embedding has identical source hash unless force is true
    if (!force) {
      const existing = await db.jobEmbedding.findUnique({
        where: { jobId },
      });
      if (existing && existing.sourceHash === sourceHash) {
        return { status: 'skipped', reason: 'source_unchanged', jobId };
      }
    }

    const embedResult = await embeddingProvider.embed({
      texts: [documentText],
      context: {
        requestId: jobData.requestId || 'job-requisition-embed',
        purpose: 'job_requisition_vectorization',
        timeoutMs: 15_000,
        workspaceId: jobData.workspaceId,
      },
    });

    const vector = embedResult.vectors[0] || [];

    await db.jobEmbedding.upsert({
      where: { jobId },
      create: {
        jobId,
        embeddingVersion: 'deterministic-1536-v1',
        embedding: vector,
        sourceHash,
      },
      update: {
        embeddingVersion: 'deterministic-1536-v1',
        embedding: vector,
        sourceHash,
        updatedAt: new Date(),
      },
    });

    return {
      status: 'completed',
      jobId,
      dimensions: vector.length,
      sourceHash,
    };
  };
}
