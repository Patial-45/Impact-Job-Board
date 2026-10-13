import { createHash } from 'node:crypto';
import type { PrismaClient } from '@executive-match/database';
import {
  buildCandidateEmbeddingDocument,
  type EmbeddingProvider,
} from '@executive-match/ai';
import type { JobEnvelope } from '@executive-match/shared';
import type { CandidateEmbedPayload } from '../index';

export function createCandidateEmbedProcessor(
  db: PrismaClient,
  embeddingProvider: EmbeddingProvider,
) {
  return async (jobData: JobEnvelope<CandidateEmbedPayload>) => {
    const { candidateProfileId, force } = jobData.payload;

    const candidate = await db.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        skills: true,
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
      },
    });

    if (!candidate) {
      throw new Error(`Candidate profile not found: ${candidateProfileId}`);
    }

    const documentText = buildCandidateEmbeddingDocument({
      headline: candidate.headline,
      bio: candidate.bio,
      location: candidate.location,
      yearsOfExperience: candidate.yearsOfExperience,
      skills: candidate.skills.map((s) => ({ name: s.name, years: s.yearsOfExperience })),
      experiences: candidate.experiences.map((e) => ({
        title: e.title,
        companyName: e.companyName,
        description: e.description,
      })),
    });

    const sourceHash = createHash('sha256').update(documentText).digest('hex');

    // Skip if existing embedding has identical source hash unless force is true
    if (!force) {
      const existing = await db.candidateProfileEmbedding.findUnique({
        where: { candidateProfileId },
      });
      if (existing && existing.sourceHash === sourceHash) {
        return { status: 'skipped', reason: 'source_unchanged', candidateProfileId };
      }
    }

    const embedResult = await embeddingProvider.embed({
      texts: [documentText],
      context: {
        requestId: jobData.requestId || 'job-candidate-embed',
        purpose: 'candidate_profile_vectorization',
        timeoutMs: 15_000,
        workspaceId: jobData.workspaceId,
      },
    });

    const vector = embedResult.vectors[0] || [];

    await db.candidateProfileEmbedding.upsert({
      where: { candidateProfileId },
      create: {
        candidateProfileId,
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
      candidateProfileId,
      dimensions: vector.length,
      sourceHash,
    };
  };
}
