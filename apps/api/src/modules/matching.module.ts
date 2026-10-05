import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '../platform/database.module';
import type { Prisma } from '@executive-match/database';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import {
  CandidateSearchQuerySchema,
  SaveCandidateSchema,
} from '@executive-match/validation';

export type MatchResult = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceScore: number;
  locationCompatible: boolean;
  summary: string;
};

export function calculateJobMatch(
  job: {
    skills: Array<{ name: string; isRequired: boolean }>;
    experienceLevel: string;
    remoteType: string;
    location: string | null;
  },
  candidate: {
    skills: Array<{ name: string }>;
    yearsOfExperience: number | null;
    openToRemote: boolean;
    location: string | null;
  },
): MatchResult {
  const candidateSkillsSet = new Set(candidate.skills.map((s) => s.name.trim().toLowerCase()));

  const requiredSkills = job.skills.filter((s) => s.isRequired);
  const preferredSkills = job.skills.filter((s) => !s.isRequired);

  const matchedRequired = requiredSkills.filter((s) =>
    candidateSkillsSet.has(s.name.trim().toLowerCase()),
  );
  const missingRequired = requiredSkills.filter(
    (s) => !candidateSkillsSet.has(s.name.trim().toLowerCase()),
  );
  const matchedPreferred = preferredSkills.filter((s) =>
    candidateSkillsSet.has(s.name.trim().toLowerCase()),
  );

  const reqScore =
    requiredSkills.length > 0 ? (matchedRequired.length / requiredSkills.length) * 50 : 50;
  const prefScore =
    preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 20 : 20;

  // Seniority mapping
  const expectedYears: Record<string, { min: number; max: number }> = {
    ENTRY: { min: 0, max: 2 },
    MID: { min: 3, max: 5 },
    SENIOR: { min: 5, max: 8 },
    LEAD: { min: 8, max: 12 },
    EXECUTIVE: { min: 12, max: 40 },
  };
  const expected = expectedYears[job.experienceLevel] || { min: 2, max: 5 };
  const candYears = candidate.yearsOfExperience ?? 3;
  let expScore = 20;
  if (candYears < expected.min) {
    const diff = expected.min - candYears;
    expScore = Math.max(5, 20 - diff * 5);
  }

  // Location / Remote Policy
  let locCompatible = true;
  let locScore = 10;
  if (job.remoteType === 'ONSITE') {
    if (job.location && candidate.location) {
      locCompatible =
        candidate.location.toLowerCase().includes(job.location.toLowerCase()) ||
        job.location.toLowerCase().includes(candidate.location.toLowerCase());
      locScore = locCompatible ? 10 : 3;
    }
  } else if (job.remoteType === 'HYBRID') {
    locScore = candidate.openToRemote ? 10 : 7;
  } else {
    // REMOTE
    locScore = candidate.openToRemote ? 10 : 8;
  }

  const totalScore = Math.min(100, Math.round(reqScore + prefScore + expScore + locScore));
  const matchedSkillsNames = [
    ...matchedRequired.map((s) => s.name),
    ...matchedPreferred.map((s) => s.name),
  ];
  const missingSkillsNames = missingRequired.map((s) => s.name);

  const summary = `${matchedSkillsNames.length} skill${matchedSkillsNames.length === 1 ? '' : 's'} matched, ${candYears}y experience for ${job.experienceLevel} role.`;

  return {
    score: totalScore,
    matchedSkills: matchedSkillsNames,
    missingSkills: missingSkillsNames,
    experienceScore: expScore,
    locationCompatible: locCompatible,
    summary,
  };
}

@Injectable()
export class MatchingService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  // --- Recruiter Candidate Talent Search ---

  async searchCandidates(user: AuthUser, workspaceSlug: string, query: unknown) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const parsed = CandidateSearchQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const {
      query: searchKeyword,
      skills,
      minExperience,
      maxExperience,
      location,
      openToRemote,
      jobId,
      page,
      pageSize,
    } = parsed.data;

    // Build Prisma where filter
    const where: Prisma.CandidateProfileWhereInput = {
      searchVisible: true,
    };

    if (openToRemote !== undefined) {
      where.openToRemote = openToRemote;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (minExperience !== undefined || maxExperience !== undefined) {
      where.yearsOfExperience = {};
      if (minExperience !== undefined) where.yearsOfExperience.gte = minExperience;
      if (maxExperience !== undefined) where.yearsOfExperience.lte = maxExperience;
    }

    if (searchKeyword) {
      where.OR = [
        { headline: { contains: searchKeyword, mode: 'insensitive' } },
        { bio: { contains: searchKeyword, mode: 'insensitive' } },
        {
          user: {
            profile: {
              displayName: { contains: searchKeyword, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (skills) {
      const skillNames = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillNames.length > 0) {
        where.skills = {
          some: {
            name: { in: skillNames, mode: 'insensitive' },
          },
        };
      }
    }

    // If matching against a specific job requisition
    let targetJob: {
      id: string;
      title: string;
      slug: string;
      skills: Array<{ name: string; isRequired: boolean }>;
      experienceLevel: string;
      remoteType: string;
      location: string | null;
    } | null = null;
    if (jobId) {
      targetJob = await this.db.job.findFirst({
        where: { id: jobId, workspaceId: workspace.id, deletedAt: null },
        include: { skills: true },
      });
    }

    const [candidates, total] = await Promise.all([
      this.db.candidateProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarKey: true,
                },
              },
            },
          },
          skills: {
            take: 8,
            orderBy: { isPrimary: 'desc' },
          },
          experiences: {
            take: 2,
            orderBy: { startDate: 'desc' },
          },
          educations: {
            take: 1,
            orderBy: { startDate: 'desc' },
          },
          savedByWorkspaces: {
            where: { workspaceId: workspace.id },
            select: { id: true, notes: true, createdAt: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.candidateProfile.count({ where }),
    ]);

    // Attach match score and saved indicators
    const items = candidates.map((cand) => {
      const isSaved = cand.savedByWorkspaces.length > 0;
      let matchResult: MatchResult | null = null;

      if (targetJob) {
        matchResult = calculateJobMatch(targetJob, {
          skills: cand.skills,
          yearsOfExperience: cand.yearsOfExperience,
          openToRemote: cand.openToRemote,
          location: cand.location,
        });
      }

      return {
        id: cand.id,
        headline: cand.headline,
        bio: cand.bio,
        location: cand.location,
        yearsOfExperience: cand.yearsOfExperience,
        openToRemote: cand.openToRemote,
        user: cand.user,
        skills: cand.skills,
        experiences: cand.experiences,
        educations: cand.educations,
        isSaved,
        matchResult,
      };
    });

    // If job was provided, sort by match score descending
    if (targetJob) {
      items.sort((a, b) => (b.matchResult?.score ?? 0) - (a.matchResult?.score ?? 0));
    }

    return {
      items,
      total,
      page,
      pageSize,
      targetJob: targetJob
        ? { id: targetJob.id, title: targetJob.title, slug: targetJob.slug }
        : null,
    };
  }

  async getCandidateTalentDossier(
    user: AuthUser,
    workspaceSlug: string,
    candidateProfileId: string,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const candidate = await this.db.candidateProfile.findFirst({
      where: { id: candidateProfileId, searchVisible: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        skills: { orderBy: { isPrimary: 'desc' } },
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        savedByWorkspaces: {
          where: { workspaceId: workspace.id },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found or is set to private');
    }

    return {
      ...candidate,
      isSaved: candidate.savedByWorkspaces.length > 0,
      savedNotes: candidate.savedByWorkspaces[0]?.notes || null,
    };
  }

  async matchJobCandidates(user: AuthUser, workspaceSlug: string, jobSlug: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const job = await this.db.job.findFirst({
      where: { slug: jobSlug, workspaceId: workspace.id, deletedAt: null },
      include: { skills: true },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    const candidates = await this.db.candidateProfile.findMany({
      where: { searchVisible: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        skills: true,
        experiences: { take: 2, orderBy: { startDate: 'desc' } },
        savedByWorkspaces: { where: { workspaceId: workspace.id } },
      },
      take: 100,
    });

    const matches = candidates.map((cand) => {
      const match = calculateJobMatch(job, {
        skills: cand.skills,
        yearsOfExperience: cand.yearsOfExperience,
        openToRemote: cand.openToRemote,
        location: cand.location,
      });

      return {
        candidate: {
          id: cand.id,
          headline: cand.headline,
          location: cand.location,
          yearsOfExperience: cand.yearsOfExperience,
          openToRemote: cand.openToRemote,
          user: cand.user,
          skills: cand.skills.slice(0, 5),
          isSaved: cand.savedByWorkspaces.length > 0,
        },
        ...match,
      };
    });

    matches.sort((a, b) => b.score - a.score);

    return {
      job: { id: job.id, title: job.title, slug: job.slug },
      matches: matches.slice(0, 20),
    };
  }

  // --- Saved Candidates (Workspace Bookmarks) ---

  async saveCandidate(
    user: AuthUser,
    workspaceSlug: string,
    candidateProfileId: string,
    input: unknown,
  ) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const parsed = SaveCandidateSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const candidate = await this.db.candidateProfile.findUnique({
      where: { id: candidateProfileId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    return this.db.savedCandidate.upsert({
      where: {
        workspaceId_candidateProfileId: {
          workspaceId: workspace.id,
          candidateProfileId: candidate.id,
        },
      },
      create: {
        workspaceId: workspace.id,
        candidateProfileId: candidate.id,
        notes: parsed.data.notes || null,
      },
      update: {
        notes: parsed.data.notes !== undefined ? parsed.data.notes || null : undefined,
      },
    });
  }

  async unsaveCandidate(user: AuthUser, workspaceSlug: string, candidateProfileId: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    await this.db.savedCandidate.deleteMany({
      where: {
        workspaceId: workspace.id,
        candidateProfileId,
      },
    });

    return { success: true };
  }

  async getSavedCandidates(user: AuthUser, workspaceSlug: string) {
    const workspace = await this.workspaceAccess.requireAction(
      user,
      workspaceSlug,
      'candidates.read',
    );

    const saved = await this.db.savedCandidate.findMany({
      where: { workspaceId: workspace.id },
      include: {
        candidateProfile: {
          include: {
            user: { select: { email: true, profile: true } },
            skills: { take: 5, orderBy: { isPrimary: 'desc' } },
            experiences: { take: 2, orderBy: { startDate: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => ({
      id: s.id,
      notes: s.notes,
      savedAt: s.createdAt,
      candidate: s.candidateProfile,
    }));
  }

  // --- Saved Jobs (Candidate Bookmarks) ---

  async saveJobForCandidate(user: AuthUser, jobSlug: string) {
    let candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      candidate = await this.db.candidateProfile.create({
        data: { userId: user.id },
      });
    }

    const job = await this.db.job.findFirst({
      where: { slug: jobSlug, status: 'PUBLISHED', deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    return this.db.savedJob.upsert({
      where: {
        candidateProfileId_jobId: {
          candidateProfileId: candidate.id,
          jobId: job.id,
        },
      },
      create: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
      update: {},
    });
  }

  async unsaveJobForCandidate(user: AuthUser, jobSlug: string) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) return { success: true };

    const job = await this.db.job.findFirst({
      where: { slug: jobSlug },
    });

    if (!job) return { success: true };

    await this.db.savedJob.deleteMany({
      where: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
    });

    return { success: true };
  }

  async getCandidateSavedJobs(user: AuthUser) {
    const candidate = await this.db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) return { items: [], total: 0 };

    const saved = await this.db.savedJob.findMany({
      where: { candidateProfileId: candidate.id },
      include: {
        job: {
          include: {
            workspace: {
              select: {
                slug: true,
                company: true,
              },
            },
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: saved.map((s) => ({
        id: s.id,
        savedAt: s.createdAt,
        job: s.job,
      })),
      total: saved.length,
    };
  }
}

// --- Controllers ---

@Controller('workspaces/:slug/candidates')
@UseGuards(AuthGuard)
export class WorkspaceCandidateSearchController {
  constructor(private readonly service: MatchingService) {}

  @Get('search')
  searchCandidates(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Query() query: unknown,
  ) {
    return this.service.searchCandidates(user, workspaceSlug, query);
  }

  @Get('saved')
  getSavedCandidates(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
  ) {
    return this.service.getSavedCandidates(user, workspaceSlug);
  }

  @Get(':candidateProfileId')
  getCandidateDossier(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('candidateProfileId') candidateProfileId: string,
  ) {
    return this.service.getCandidateTalentDossier(user, workspaceSlug, candidateProfileId);
  }

  @Post(':candidateProfileId/save')
  saveCandidate(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('candidateProfileId') candidateProfileId: string,
    @Body() body: unknown,
  ) {
    return this.service.saveCandidate(user, workspaceSlug, candidateProfileId, body);
  }

  @Delete(':candidateProfileId/save')
  unsaveCandidate(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('candidateProfileId') candidateProfileId: string,
  ) {
    return this.service.unsaveCandidate(user, workspaceSlug, candidateProfileId);
  }
}

@Controller('workspaces/:slug/jobs/:jobSlug/matches')
@UseGuards(AuthGuard)
export class WorkspaceJobMatchesController {
  constructor(private readonly service: MatchingService) {}

  @Get()
  getJobMatches(
    @CurrentUser() user: AuthUser,
    @Param('slug') workspaceSlug: string,
    @Param('jobSlug') jobSlug: string,
  ) {
    return this.service.matchJobCandidates(user, workspaceSlug, jobSlug);
  }
}

@Controller('candidates/me/saved-jobs')
@UseGuards(AuthGuard)
export class CandidateSavedJobsController {
  constructor(private readonly service: MatchingService) {}

  @Get()
  getSavedJobs(@CurrentUser() user: AuthUser) {
    return this.service.getCandidateSavedJobs(user);
  }

  @Post(':jobSlug')
  saveJob(@CurrentUser() user: AuthUser, @Param('jobSlug') jobSlug: string) {
    return this.service.saveJobForCandidate(user, jobSlug);
  }

  @Delete(':jobSlug')
  unsaveJob(@CurrentUser() user: AuthUser, @Param('jobSlug') jobSlug: string) {
    return this.service.unsaveJobForCandidate(user, jobSlug);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [
    WorkspaceCandidateSearchController,
    WorkspaceJobMatchesController,
    CandidateSavedJobsController,
  ],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
