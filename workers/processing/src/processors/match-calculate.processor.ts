import type { PrismaClient } from '@executive-match/database';
import {
  calculateHybridScore,
  cosineSimilarity,
} from '@executive-match/ai';
import type { JobEnvelope } from '@executive-match/shared';
import type { MatchCalculatePayload } from '../index';

export function createMatchCalculateProcessor(db: PrismaClient) {
  return async (jobData: JobEnvelope<MatchCalculatePayload>) => {
    const { jobId, candidateProfileId } = jobData.payload;

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        skills: true,
        embedding: true,
      },
    });

    if (!job) {
      throw new Error(`Job requisition not found: ${jobId}`);
    }

    const candidateIds = candidateProfileId
      ? [candidateProfileId]
      : (
          await db.candidateProfile.findMany({
            where: { searchVisible: true },
            select: { id: true },
          })
        ).map((c) => c.id);

    const results: Array<{ candidateProfileId: string; overallScore: number }> = [];

    for (const cId of candidateIds) {
      const candidate = await db.candidateProfile.findUnique({
        where: { id: cId },
        include: {
          skills: true,
          embedding: true,
        },
      });

      if (!candidate) continue;

      const candidateSkillNames = new Set(candidate.skills.map((s) => s.name.toLowerCase()));

      const matchedSkills = job.skills
        .filter((s) => candidateSkillNames.has(s.name.toLowerCase()))
        .map((s) => s.name);
      const missingSkills = job.skills
        .filter((s) => !candidateSkillNames.has(s.name.toLowerCase()))
        .map((s) => s.name);

      const requiredSkills = job.skills.filter((s) => s.isRequired);
      const matchedRequired = requiredSkills.filter((s) =>
        candidateSkillNames.has(s.name.toLowerCase()),
      );

      const skillsScore =
        job.skills.length > 0
          ? Math.round(
              (matchedSkills.length / job.skills.length) * 80 +
                (requiredSkills.length > 0
                  ? (matchedRequired.length / requiredSkills.length) * 20
                  : 20),
            )
          : 70;

      const experienceScore = 75;
      const locationScore = 80;

      const deterministicScore = Math.round(
        skillsScore * 0.5 + experienceScore * 0.3 + locationScore * 0.2,
      );

      let semanticScore = 50;
      if (job.embedding?.embedding && candidate.embedding?.embedding) {
        const sim = cosineSimilarity(job.embedding.embedding, candidate.embedding.embedding);
        semanticScore = Math.max(0, Math.min(100, Math.round(sim * 100)));
      }

      const hybrid = calculateHybridScore(deterministicScore, semanticScore);

      await db.matchResult.upsert({
        where: {
          jobId_candidateProfileId: {
            jobId,
            candidateProfileId: cId,
          },
        },
        create: {
          jobId,
          candidateProfileId: cId,
          overallScore: hybrid.overallScore,
          skillsScore,
          semanticScore,
          experienceScore,
          locationScore,
          matchedSkills,
          missingSkills,
          explanation: hybrid.explanation,
          modelVersion: 'hybrid-v1',
          calculatedAt: new Date(),
        },
        update: {
          overallScore: hybrid.overallScore,
          skillsScore,
          semanticScore,
          experienceScore,
          locationScore,
          matchedSkills,
          missingSkills,
          explanation: hybrid.explanation,
          modelVersion: 'hybrid-v1',
          calculatedAt: new Date(),
        },
      });

      results.push({ candidateProfileId: cId, overallScore: hybrid.overallScore });
    }

    return {
      status: 'completed',
      jobId,
      calculatedMatches: results.length,
      results,
    };
  };
}
