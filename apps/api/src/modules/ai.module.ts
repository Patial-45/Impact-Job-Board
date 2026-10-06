import {
  Body,
  Controller,
  Get,
  HttpException,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import {
  AiMatchQuerySchema,
  RecomputeAiMatchSchema,
} from '@executive-match/validation';
import {
  DefaultAiProviderRegistry,
  buildCandidateEmbeddingDocument,
  buildJobEmbeddingDocument,
  cosineSimilarity,
  cosineToPercentage,
  calculateHybridScore,
  type AiContext,
} from '@executive-match/ai';
import { calculateJobMatch } from './matching.module';

@Injectable()
export class AiService {
  private readonly aiRegistry: DefaultAiProviderRegistry;

  constructor(
    private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {
    this.aiRegistry = new DefaultAiProviderRegistry();
  }

  private sha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generates or retrieves cached vector embedding for a candidate profile.
   */
  async embedCandidateProfile(candidateProfileId: string, force = false): Promise<number[]> {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        skills: { select: { name: true, yearsOfExperience: true, isPrimary: true } },
        experiences: {
          select: { title: true, companyName: true, description: true },
          orderBy: { startDate: 'desc' },
          take: 3,
        },
        embedding: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const docText = buildCandidateEmbeddingDocument({
      headline: candidate.headline,
      bio: candidate.bio,
      location: candidate.location,
      yearsOfExperience: candidate.yearsOfExperience,
      openToRemote: candidate.openToRemote,
      skills: candidate.skills,
      experiences: candidate.experiences,
    });

    const sourceHash = this.sha256(docText);

    if (!force && candidate.embedding && candidate.embedding.sourceHash === sourceHash) {
      return candidate.embedding.embedding;
    }

    const embeddingProvider = this.aiRegistry.embedding();
    const context: AiContext = {
      requestId: `embed-candidate-${candidateProfileId}`,
      purpose: 'candidate.profile.embedding',
      timeoutMs: 10000,
    };

    const res = await embeddingProvider.embed({
      texts: [docText],
      context,
    });

    const vector = res.vectors[0] || [];

    await this.db.candidateProfileEmbedding.upsert({
      where: { candidateProfileId },
      create: {
        candidateProfileId,
        embeddingVersion: res.usage.model,
        embedding: vector,
        sourceHash,
      },
      update: {
        embeddingVersion: res.usage.model,
        embedding: vector,
        sourceHash,
      },
    });

    return vector;
  }

  /**
   * Generates or retrieves cached vector embedding for a job requisition.
   */
  async embedJob(jobId: string, force = false): Promise<number[]> {
    const job = await this.db.job.findUnique({
      where: { id: jobId },
      include: {
        skills: { select: { name: true, isRequired: true } },
        embedding: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    const docText = buildJobEmbeddingDocument({
      title: job.title,
      department: job.department,
      description: job.description,
      location: job.location,
      remoteType: job.remoteType,
      experienceLevel: job.experienceLevel,
      skills: job.skills,
    });

    const sourceHash = this.sha256(docText);

    if (!force && job.embedding && job.embedding.sourceHash === sourceHash) {
      return job.embedding.embedding;
    }

    const embeddingProvider = this.aiRegistry.embedding();
    const context: AiContext = {
      requestId: `embed-job-${jobId}`,
      purpose: 'job.requisition.embedding',
      timeoutMs: 10000,
    };

    const res = await embeddingProvider.embed({
      texts: [docText],
      context,
    });

    const vector = res.vectors[0] || [];

    await this.db.jobEmbedding.upsert({
      where: { jobId },
      create: {
        jobId,
        embeddingVersion: res.usage.model,
        embedding: vector,
        sourceHash,
      },
      update: {
        embeddingVersion: res.usage.model,
        embedding: vector,
        sourceHash,
      },
    });

    return vector;
  }

  /**
   * Computes hybrid match combining deterministic feature scoring and semantic vector similarity.
   */
  async computeHybridMatch(
    jobId: string,
    candidateProfileId: string,
    semanticWeight = 0.3,
    force = false,
  ) {
    const [job, candidate] = await Promise.all([
      this.db.job.findUnique({
        where: { id: jobId },
        include: { skills: true },
      }),
      this.db.candidateProfile.findUnique({
        where: { id: candidateProfileId },
        include: {
          skills: true,
          user: { select: { email: true, profile: true } },
        },
      }),
    ]);

    if (!job || !candidate) {
      throw new NotFoundException('Job or candidate profile not found');
    }

    // 1. Get or generate embeddings
    const [jobVector, candidateVector] = await Promise.all([
      this.embedJob(job.id, force),
      this.embedCandidateProfile(candidate.id, force),
    ]);

    // 2. Compute semantic vector cosine similarity
    const cosineSim = cosineSimilarity(jobVector, candidateVector);
    const semanticPercentage = cosineToPercentage(cosineSim);

    // 3. Compute deterministic scoring
    const deterministicMatch = calculateJobMatch(job, {
      skills: candidate.skills,
      yearsOfExperience: candidate.yearsOfExperience,
      openToRemote: candidate.openToRemote,
      location: candidate.location,
    });

    // 4. Combine into calibrated hybrid score
    const hybrid = calculateHybridScore(
      deterministicMatch.score,
      semanticPercentage,
      { deterministic: 1 - semanticWeight, semantic: semanticWeight },
    );

    // 5. Store / update in match_results table
    const matchRecord = await this.db.matchResult.upsert({
      where: {
        jobId_candidateProfileId: {
          jobId: job.id,
          candidateProfileId: candidate.id,
        },
      },
      create: {
        jobId: job.id,
        candidateProfileId: candidate.id,
        overallScore: hybrid.overallScore,
        skillsScore: deterministicMatch.score,
        semanticScore: semanticPercentage,
        experienceScore: deterministicMatch.experienceScore,
        locationScore: deterministicMatch.locationCompatible ? 100 : 0,
        matchedSkills: deterministicMatch.matchedSkills,
        missingSkills: deterministicMatch.missingSkills,
        explanation: `${hybrid.explanation} ${deterministicMatch.summary}`,
        modelVersion: 'hybrid-v1',
      },
      update: {
        overallScore: hybrid.overallScore,
        skillsScore: deterministicMatch.score,
        semanticScore: semanticPercentage,
        experienceScore: deterministicMatch.experienceScore,
        locationScore: deterministicMatch.locationCompatible ? 100 : 0,
        matchedSkills: deterministicMatch.matchedSkills,
        missingSkills: deterministicMatch.missingSkills,
        explanation: `${hybrid.explanation} ${deterministicMatch.summary}`,
        modelVersion: 'hybrid-v1',
        calculatedAt: new Date(),
      },
    });

    return {
      matchRecord,
      deterministicMatch,
      semanticScore: semanticPercentage,
      cosineSimilarity: Number(cosineSim.toFixed(4)),
    };
  }

  /**
   * Retrieves candidates ranked with hybrid semantic + deterministic AI match scoring.
   */
  async getJobAiMatches(
    user: AuthUser,
    workspaceSlug: string,
    jobSlug: string,
    rawQuery: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const parsedQuery = AiMatchQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsedQuery.error.flatten() },
        400,
      );
    }

    const { minScore, semanticWeight, limit } = parsedQuery.data;

    const job = await this.db.job.findFirst({
      where: { slug: jobSlug, workspaceId: workspace.id, deletedAt: null },
      include: { skills: true },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    // Load talent pool candidates who are searchVisible
    const candidates = await this.db.candidateProfile.findMany({
      where: { searchVisible: true },
      include: {
        user: { select: { email: true, profile: true } },
        skills: { take: 8, orderBy: { isPrimary: 'desc' } },
        experiences: { take: 2, orderBy: { startDate: 'desc' } },
        savedByWorkspaces: { where: { workspaceId: workspace.id } },
      },
      take: 60,
    });

    // Compute hybrid match for each candidate
    const matches = await Promise.all(
      candidates.map(async (cand) => {
        const hybrid = await this.computeHybridMatch(job.id, cand.id, semanticWeight);
        return {
          candidate: {
            id: cand.id,
            headline: cand.headline,
            location: cand.location,
            yearsOfExperience: cand.yearsOfExperience,
            openToRemote: cand.openToRemote,
            user: cand.user,
            skills: cand.skills,
            experiences: cand.experiences,
            isSaved: cand.savedByWorkspaces.length > 0,
          },
          overallScore: hybrid.matchRecord.overallScore,
          skillsScore: hybrid.matchRecord.skillsScore,
          semanticScore: hybrid.matchRecord.semanticScore,
          experienceScore: hybrid.matchRecord.experienceScore,
          locationScore: hybrid.matchRecord.locationScore,
          matchedSkills: hybrid.matchRecord.matchedSkills,
          missingSkills: hybrid.matchRecord.missingSkills,
          explanation: hybrid.matchRecord.explanation,
          cosineSimilarity: hybrid.cosineSimilarity,
          calculatedAt: hybrid.matchRecord.calculatedAt,
        };
      }),
    );

    // Filter by minScore if provided, then sort descending by overallScore
    const filtered = minScore
      ? matches.filter((m) => m.overallScore >= minScore)
      : matches;

    filtered.sort((a, b) => b.overallScore - a.overallScore);

    return {
      job: { id: job.id, title: job.title, slug: job.slug },
      items: filtered.slice(0, limit),
      total: filtered.length,
      weights: {
        deterministic: Number((1 - semanticWeight).toFixed(2)),
        semantic: semanticWeight,
      },
    };
  }

  /**
   * Recalculates embeddings and hybrid AI matches for a job requisition.
   */
  async recomputeJobAiMatches(
    user: AuthUser,
    workspaceSlug: string,
    jobSlug: string,
    rawBody: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'jobs.write',
    );

    const parsed = RecomputeAiMatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new HttpException(
        { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
        400,
      );
    }

    const { candidateProfileId, force } = parsed.data;

    const job = await this.db.job.findFirst({
      where: { slug: jobSlug, workspaceId: workspace.id, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    if (candidateProfileId) {
      // Recompute single candidate match
      const result = await this.computeHybridMatch(job.id, candidateProfileId, 0.3, force);
      return {
        recomputedCount: 1,
        match: result.matchRecord,
      };
    }

    // Force re-embed the job
    await this.embedJob(job.id, true);

    // Recompute for talent pool candidates
    const candidates = await this.db.candidateProfile.findMany({
      where: { searchVisible: true },
      select: { id: true },
      take: 40,
    });

    await Promise.all(
      candidates.map((cand) => this.computeHybridMatch(job.id, cand.id, 0.3, force)),
    );

    return {
      recomputedCount: candidates.length,
      jobSlug: job.slug,
      status: 'COMPLETED',
    };
  }

  /**
   * Retrieves single candidate's AI match evaluation against a specific job requisition.
   */
  async getCandidateJobAiMatch(
    user: AuthUser,
    workspaceSlug: string,
    candidateProfileId: string,
    jobSlug: string,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const job = await this.db.job.findFirst({
      where: { slug: jobSlug, workspaceId: workspace.id, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    const result = await this.computeHybridMatch(job.id, candidateProfileId);
    return {
      job: { id: job.id, title: job.title, slug: job.slug },
      match: result.matchRecord,
      cosineSimilarity: result.cosineSimilarity,
    };
  }
}

// -------------------------------------------------------------
// Controllers
// -------------------------------------------------------------

@Controller('workspaces/:slug/jobs/:jobSlug/ai-matches')
@UseGuards(AuthGuard)
export class WorkspaceJobAiMatchesController {
  constructor(private readonly aiService: AiService) {}

  @Get()
  getJobAiMatches(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('jobSlug') jobSlug: string,
    @Query() query: unknown,
  ) {
    return this.aiService.getJobAiMatches(user, workspaceSlug, jobSlug, query);
  }

  @Post('recompute')
  recomputeJobAiMatches(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('jobSlug') jobSlug: string,
    @Body() body: unknown,
  ) {
    return this.aiService.recomputeJobAiMatches(user, workspaceSlug, jobSlug, body);
  }
}

@Controller('workspaces/:slug/candidates/:candidateProfileId/ai-match')
@UseGuards(AuthGuard)
export class WorkspaceCandidateAiMatchController {
  constructor(private readonly aiService: AiService) {}

  @Get(':jobSlug')
  getCandidateJobAiMatch(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('candidateProfileId') candidateProfileId: string,
    @Param('jobSlug') jobSlug: string,
  ) {
    return this.aiService.getCandidateJobAiMatch(
      user,
      workspaceSlug,
      candidateProfileId,
      jobSlug,
    );
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [
    WorkspaceJobAiMatchesController,
    WorkspaceCandidateAiMatchController,
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
