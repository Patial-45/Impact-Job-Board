import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
  Injectable,
  Module,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../platform/database.module';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { OBJECT_STORAGE } from '../platform/storage.module';
import type { ObjectStorage } from '@executive-match/storage';
import {
  UpdateCandidateProfileSchema,
  CreateCandidateExperienceSchema,
  UpdateCandidateExperienceSchema,
  CreateCandidateEducationSchema,
  UpdateCandidateEducationSchema,
  AddCandidateSkillSchema,
  RequestResumeUploadSchema,
  ConfirmResumeUploadSchema,
} from '@executive-match/validation';

@Injectable()
export class CandidatesService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async getOrCreateProfile(userId: string) {
    let profile = await this.db.candidateProfile.findUnique({
      where: { userId },
      include: {
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        skills: { orderBy: { isPrimary: 'desc' } },
        resumes: { orderBy: { createdAt: 'desc' } },
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!profile) {
      await this.db.candidateProfile.create({
        data: { userId },
      });

      profile = await this.db.candidateProfile.findUnique({
        where: { userId },
        include: {
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          skills: { orderBy: { isPrimary: 'desc' } },
          resumes: { orderBy: { createdAt: 'desc' } },
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
      });
    }

    if (!profile) {
      throw new NotFoundException('Could not load or initialize candidate profile');
    }

    return profile;
  }

  async updateProfile(userId: string, input: unknown) {
    const parsed = UpdateCandidateProfileSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const {
      headline,
      bio,
      location,
      yearsOfExperience,
      phone,
      websiteUrl,
      linkedinUrl,
      githubUrl,
      searchVisible,
      openToRemote,
    } = parsed.data;

    return this.db.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        headline,
        bio,
        location,
        yearsOfExperience,
        phone,
        websiteUrl: websiteUrl || null,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,
        searchVisible: searchVisible ?? true,
        openToRemote: openToRemote ?? true,
      },
      update: {
        headline,
        bio,
        location,
        yearsOfExperience,
        phone,
        websiteUrl: websiteUrl !== undefined ? websiteUrl || null : undefined,
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl || null : undefined,
        githubUrl: githubUrl !== undefined ? githubUrl || null : undefined,
        searchVisible,
        openToRemote,
      },
      include: {
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        skills: { orderBy: { isPrimary: 'desc' } },
        resumes: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // --- Experiences ---

  async addExperience(userId: string, input: unknown) {
    const parsed = CreateCandidateExperienceSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const profile = await this.getOrCreateProfile(userId);
    const { companyName, title, location, startDate, endDate, isCurrent, description } = parsed.data;

    return this.db.candidateExperience.create({
      data: {
        candidateProfileId: profile.id,
        companyName,
        title,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: Boolean(isCurrent),
        description,
      },
    });
  }

  async updateExperience(userId: string, experienceId: string, input: unknown) {
    const parsed = UpdateCandidateExperienceSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const experience = await this.db.candidateExperience.findFirst({
      where: { id: experienceId, candidateProfile: { userId } },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    const { companyName, title, location, startDate, endDate, isCurrent, description } = parsed.data;

    return this.db.candidateExperience.update({
      where: { id: experienceId },
      data: {
        companyName,
        title,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        isCurrent,
        description,
      },
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const experience = await this.db.candidateExperience.findFirst({
      where: { id: experienceId, candidateProfile: { userId } },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    await this.db.candidateExperience.delete({
      where: { id: experienceId },
    });

    return { success: true };
  }

  // --- Education ---

  async addEducation(userId: string, input: unknown) {
    const parsed = CreateCandidateEducationSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const profile = await this.getOrCreateProfile(userId);
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = parsed.data;

    return this.db.candidateEducation.create({
      data: {
        candidateProfileId: profile.id,
        institution,
        degree,
        fieldOfStudy,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description,
      },
    });
  }

  async updateEducation(userId: string, educationId: string, input: unknown) {
    const parsed = UpdateCandidateEducationSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const education = await this.db.candidateEducation.findFirst({
      where: { id: educationId, candidateProfile: { userId } },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    const { institution, degree, fieldOfStudy, startDate, endDate, description } = parsed.data;

    return this.db.candidateEducation.update({
      where: { id: educationId },
      data: {
        institution,
        degree,
        fieldOfStudy,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        description,
      },
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const education = await this.db.candidateEducation.findFirst({
      where: { id: educationId, candidateProfile: { userId } },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    await this.db.candidateEducation.delete({
      where: { id: educationId },
    });

    return { success: true };
  }

  // --- Skills ---

  async addSkill(userId: string, input: unknown) {
    const parsed = AddCandidateSkillSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const profile = await this.getOrCreateProfile(userId);
    const { name, yearsOfExperience, isPrimary } = parsed.data;

    const existing = await this.db.candidateSkill.findUnique({
      where: {
        candidateProfileId_name: {
          candidateProfileId: profile.id,
          name,
        },
      },
    });

    if (existing) {
      return this.db.candidateSkill.update({
        where: { id: existing.id },
        data: {
          yearsOfExperience: yearsOfExperience ?? existing.yearsOfExperience,
          isPrimary: isPrimary ?? existing.isPrimary,
        },
      });
    }

    return this.db.candidateSkill.create({
      data: {
        candidateProfileId: profile.id,
        name,
        yearsOfExperience,
        isPrimary: Boolean(isPrimary),
      },
    });
  }

  async deleteSkill(userId: string, skillId: string) {
    const skill = await this.db.candidateSkill.findFirst({
      where: { id: skillId, candidateProfile: { userId } },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    await this.db.candidateSkill.delete({
      where: { id: skillId },
    });

    return { success: true };
  }

  // --- Resumes & Uploads ---

  async requestResumeUploadUrl(userId: string, input: unknown) {
    const parsed = RequestResumeUploadSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const profile = await this.getOrCreateProfile(userId);
    const sanitizedName = parsed.data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `resumes/${profile.id}/${randomUUID()}-${sanitizedName}`;

    const upload = await this.storage.createUploadUrl({
      key: fileKey,
      contentType: parsed.data.mimeType,
      maxBytes: parsed.data.fileSize,
      expiresInSeconds: 900,
    });

    return {
      uploadUrl: upload.url,
      method: upload.method,
      headers: upload.headers,
      fileKey,
    };
  }

  async confirmResumeUpload(userId: string, input: unknown) {
    const parsed = ConfirmResumeUploadSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpException({ code: 'VALIDATION_ERROR', message: parsed.error.flatten() }, 400);
    }

    const profile = await this.getOrCreateProfile(userId);
    const { fileKey, fileName, mimeType, fileSize, setAsPrimary } = parsed.data;

    const existingCount = await this.db.candidateResume.count({
      where: { candidateProfileId: profile.id },
    });

    const isPrimary = setAsPrimary || existingCount === 0;

    if (isPrimary) {
      await this.db.candidateResume.updateMany({
        where: { candidateProfileId: profile.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.db.candidateResume.create({
      data: {
        candidateProfileId: profile.id,
        fileKey,
        fileName,
        mimeType,
        fileSize,
        isPrimary,
        parsingStatus: 'PENDING',
      },
    });
  }

  async listResumes(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    return this.db.candidateResume.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setPrimaryResume(userId: string, resumeId: string) {
    const resume = await this.db.candidateResume.findFirst({
      where: { id: resumeId, candidateProfile: { userId } },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    await this.db.candidateResume.updateMany({
      where: { candidateProfileId: resume.candidateProfileId, isPrimary: true },
      data: { isPrimary: false },
    });

    return this.db.candidateResume.update({
      where: { id: resumeId },
      data: { isPrimary: true },
    });
  }

  async deleteResume(userId: string, resumeId: string) {
    const resume = await this.db.candidateResume.findFirst({
      where: { id: resumeId, candidateProfile: { userId } },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    await this.storage.delete(resume.fileKey);

    await this.db.candidateResume.delete({
      where: { id: resumeId },
    });

    return { success: true };
  }

  async getResumeDownloadUrl(userId: string, resumeId: string) {
    const resume = await this.db.candidateResume.findFirst({
      where: { id: resumeId, candidateProfile: { userId } },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const downloadUrl = await this.storage.createDownloadUrl(resume.fileKey, 3600);
    return { downloadUrl, fileName: resume.fileName };
  }
}

@Controller('candidates')
@UseGuards(AuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.candidatesService.getOrCreateProfile(user.id);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.candidatesService.updateProfile(user.id, body);
  }

  @Post('me/experiences')
  async addExperience(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.candidatesService.addExperience(user.id, body);
  }

  @Patch('me/experiences/:id')
  async updateExperience(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.candidatesService.updateExperience(user.id, id, body);
  }

  @Delete('me/experiences/:id')
  async deleteExperience(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.candidatesService.deleteExperience(user.id, id);
  }

  @Post('me/educations')
  async addEducation(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.candidatesService.addEducation(user.id, body);
  }

  @Patch('me/educations/:id')
  async updateEducation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.candidatesService.updateEducation(user.id, id, body);
  }

  @Delete('me/educations/:id')
  async deleteEducation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.candidatesService.deleteEducation(user.id, id);
  }

  @Post('me/skills')
  async addSkill(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.candidatesService.addSkill(user.id, body);
  }

  @Delete('me/skills/:id')
  async deleteSkill(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.candidatesService.deleteSkill(user.id, id);
  }

  @Post('me/resumes/upload-url')
  async requestResumeUploadUrl(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.candidatesService.requestResumeUploadUrl(user.id, body);
  }

  @Post('me/resumes/confirm')
  async confirmResumeUpload(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.candidatesService.confirmResumeUpload(user.id, body);
  }

  @Get('me/resumes')
  async listResumes(@CurrentUser() user: AuthUser) {
    return this.candidatesService.listResumes(user.id);
  }

  @Patch('me/resumes/:id/primary')
  async setPrimaryResume(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.candidatesService.setPrimaryResume(user.id, id);
  }

  @Delete('me/resumes/:id')
  async deleteResume(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.candidatesService.deleteResume(user.id, id);
  }

  @Get('me/resumes/:id/download')
  async getResumeDownloadUrl(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.candidatesService.getResumeDownloadUrl(user.id, id);
  }
}

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
