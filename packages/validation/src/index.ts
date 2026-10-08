import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(120),
});

export const LoginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1),
});

export const VerifyEmailConfirmSchema = z.object({
  token: z.string().trim().min(1),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email().max(320),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(12).max(128),
});

export const WorkspaceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric words separated by single hyphens');

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: WorkspaceSlugSchema,
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(160),
});

export const InviteMemberSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(['ADMIN', 'RECRUITER', 'VIEWER']),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'RECRUITER', 'VIEWER']),
});

export const UpdateCandidateProfileSchema = z.object({
  headline: z.string().trim().max(180).optional().nullable(),
  bio: z.string().trim().max(5000).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  yearsOfExperience: z.number().int().min(0).max(70).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  websiteUrl: z.string().trim().url().max(256).optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().trim().url().max(256).optional().nullable().or(z.literal('')),
  githubUrl: z.string().trim().url().max(256).optional().nullable().or(z.literal('')),
  searchVisible: z.boolean().optional(),
  openToRemote: z.boolean().optional(),
});

export const CreateCandidateExperienceSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  location: z.string().trim().max(120).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(4000).optional().nullable(),
});

export const UpdateCandidateExperienceSchema = CreateCandidateExperienceSchema.partial();

export const CreateCandidateEducationSchema = z.object({
  institution: z.string().trim().min(1).max(160),
  degree: z.string().trim().min(1).max(120),
  fieldOfStudy: z.string().trim().max(120).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const UpdateCandidateEducationSchema = CreateCandidateEducationSchema.partial();

export const AddCandidateSkillSchema = z.object({
  name: z.string().trim().min(1).max(80),
  yearsOfExperience: z.number().int().min(0).max(70).optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
] as const;

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const RequestResumeUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_RESUME_MIME_TYPES),
  fileSize: z.number().int().positive().max(MAX_RESUME_SIZE_BYTES),
});

export const ConfirmResumeUploadSchema = z.object({
  fileKey: z.string().trim().min(1).max(512),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_RESUME_MIME_TYPES),
  fileSize: z.number().int().positive().max(MAX_RESUME_SIZE_BYTES),
  setAsPrimary: z.boolean().default(true),
});

export const UpdateCompanySchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  website: z.string().trim().url().max(256).optional().nullable().or(z.literal('')),
  industry: z.string().trim().max(100).optional().nullable(),
  size: z.string().trim().max(50).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  logoKey: z.string().trim().max(512).optional().nullable(),
  bannerKey: z.string().trim().max(512).optional().nullable(),
});

export const JobSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric words separated by single hyphens');

export const CreateJobSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: JobSlugSchema.optional(),
  description: z.string().trim().min(10).max(50000),
  department: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  remoteType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).default('REMOTE'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).default('FULL_TIME'),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).default('MID'),
  minSalary: z.number().int().nonnegative().optional().nullable(),
  maxSalary: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().max(10).default('USD'),
  skills: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        isRequired: z.boolean().default(true),
      }),
    )
    .optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial();

export const UpdateJobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']),
});

export const JobQuerySchema = z.object({
  query: z.string().trim().optional(),
  department: z.string().trim().optional(),
  remoteType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  location: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const ApplyJobSchema = z.object({
  resumeId: z.string().uuid().optional().nullable(),
  coverLetter: z.string().trim().max(5000).optional().nullable(),
});

export const UpdateApplicationStageSchema = z.object({
  stage: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  reason: z.string().trim().max(255).optional().nullable(),
});

export const WithdrawApplicationSchema = z.object({
  reason: z.string().trim().max(255).optional().nullable(),
});

export const CreateApplicationNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content cannot be empty').max(5000),
});

export const ApplicationQuerySchema = z.object({
  stage: z.string().trim().optional(),
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const CandidateSearchQuerySchema = z.object({
  query: z.string().trim().optional(),
  skills: z.string().trim().optional(),
  minExperience: z.coerce.number().int().nonnegative().optional(),
  maxExperience: z.coerce.number().int().nonnegative().optional(),
  location: z.string().trim().optional(),
  openToRemote: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  jobId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const SaveCandidateSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const AiMatchQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(100).optional(),
  semanticWeight: z.coerce.number().min(0).max(1).default(0.3),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const RecomputeAiMatchSchema = z.object({
  candidateProfileId: z.string().uuid().optional(),
  force: z.boolean().default(false).optional(),
});

export const CreateInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  type: z.enum(['SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'EXECUTIVE', 'FINAL']).default('TECHNICAL'),
  scheduledAt: z.string().datetime({ message: 'Must be a valid ISO 8601 date string' }),
  durationMinutes: z.coerce.number().int().min(15).max(360).default(45),
  location: z.string().trim().max(512).optional().nullable(),
  timezone: z.string().trim().max(64).default('UTC'),
  notes: z.string().trim().max(5000).optional().nullable(),
  participantUserIds: z.array(z.string().uuid()).optional(),
});

export const UpdateInterviewSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  type: z.enum(['SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'EXECUTIVE', 'FINAL']).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW']).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(360).optional(),
  location: z.string().trim().max(512).optional().nullable(),
  timezone: z.string().trim().max(64).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const CancelInterviewSchema = z.object({
  cancellationReason: z.string().trim().min(1).max(255).optional().nullable(),
});

export const SubmitScorecardSchema = z.object({
  recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'NO_HIRE', 'STRONG_NO_HIRE']),
  overallRating: z.coerce.number().int().min(1).max(5),
  technicalRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  communicationRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  leadershipRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  cultureRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  strengths: z.string().trim().max(5000).optional().nullable(),
  weaknesses: z.string().trim().max(5000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const CreateAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  timeLimitMinutes: z.coerce.number().int().min(5).max(360).optional().nullable(),
  passingScore: z.coerce.number().int().min(1).max(100).optional().nullable(),
  questions: z.any().optional(),
});

export const InviteAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
  applicationId: z.string().uuid(),
  expiresInDays: z.coerce.number().int().min(1).max(60).default(7),
});

export const CompleteAssessmentSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  feedback: z.string().trim().max(5000).optional().nullable(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailConfirmInput = z.infer<typeof VerifyEmailConfirmSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof UpdateCandidateProfileSchema>;
export type CreateCandidateExperienceInput = z.infer<typeof CreateCandidateExperienceSchema>;
export type UpdateCandidateExperienceInput = z.infer<typeof UpdateCandidateExperienceSchema>;
export type CreateCandidateEducationInput = z.infer<typeof CreateCandidateEducationSchema>;
export type UpdateCandidateEducationInput = z.infer<typeof UpdateCandidateEducationSchema>;
export type AddCandidateSkillInput = z.infer<typeof AddCandidateSkillSchema>;
export type RequestResumeUploadInput = z.infer<typeof RequestResumeUploadSchema>;
export type ConfirmResumeUploadInput = z.infer<typeof ConfirmResumeUploadSchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof UpdateJobStatusSchema>;
export type JobQueryInput = z.infer<typeof JobQuerySchema>;
export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;
export type UpdateApplicationStageInput = z.infer<typeof UpdateApplicationStageSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;
export type WithdrawApplicationInput = z.infer<typeof WithdrawApplicationSchema>;
export type CreateApplicationNoteInput = z.infer<typeof CreateApplicationNoteSchema>;
export type ApplicationQueryInput = z.infer<typeof ApplicationQuerySchema>;
export type CandidateSearchQueryInput = z.infer<typeof CandidateSearchQuerySchema>;
export type SaveCandidateInput = z.infer<typeof SaveCandidateSchema>;
export type AiMatchQueryInput = z.infer<typeof AiMatchQuerySchema>;
export type RecomputeAiMatchInput = z.infer<typeof RecomputeAiMatchSchema>;
export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type CancelInterviewInput = z.infer<typeof CancelInterviewSchema>;
export type SubmitScorecardInput = z.infer<typeof SubmitScorecardSchema>;
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type InviteAssessmentInput = z.infer<typeof InviteAssessmentSchema>;
export type CompleteAssessmentInput = z.infer<typeof CompleteAssessmentSchema>;

export const CreateOfferSchema = z.object({
  applicationId: z.string().uuid(),
  jobTitle: z.string().trim().min(2).max(160),
  baseSalary: z.coerce.number().int().positive(),
  currency: z.string().trim().length(3).default('USD'),
  bonus: z.string().trim().max(160).optional().nullable(),
  equity: z.string().trim().max(160).optional().nullable(),
  signOnBonus: z.coerce.number().int().min(0).optional().nullable(),
  startDate: z.string().datetime({ message: 'Must be a valid ISO 8601 date string' }),
  expiresAt: z.string().datetime({ message: 'Must be a valid ISO 8601 date string' }),
  workLocation: z.string().trim().min(2).max(160),
  offerLetter: z.string().trim().max(20000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const UpdateOfferSchema = z.object({
  jobTitle: z.string().trim().min(2).max(160).optional(),
  baseSalary: z.coerce.number().int().positive().optional(),
  currency: z.string().trim().length(3).optional(),
  bonus: z.string().trim().max(160).optional().nullable(),
  equity: z.string().trim().max(160).optional().nullable(),
  signOnBonus: z.coerce.number().int().min(0).optional().nullable(),
  startDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  workLocation: z.string().trim().min(2).max(160).optional(),
  offerLetter: z.string().trim().max(20000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const RescindOfferSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const AcceptOfferSchema = z.object({
  signerName: z.string().trim().min(2).max(120),
  signatureText: z.string().trim().min(2).max(160),
  consentConfirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm legal agreement to the offer terms',
  }),
});

export const DeclineOfferSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
});

export const CreateOnboardingTaskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  category: z.string().trim().max(60).default('GENERAL'),
  required: z.boolean().default(true),
  dueDate: z.string().datetime().optional().nullable(),
});

export const UpdateOnboardingTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'WAIVED']),
});

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;
export type UpdateOfferInput = z.infer<typeof UpdateOfferSchema>;
export type RescindOfferInput = z.infer<typeof RescindOfferSchema>;
export type AcceptOfferInput = z.infer<typeof AcceptOfferSchema>;
export type DeclineOfferInput = z.infer<typeof DeclineOfferSchema>;
export type CreateOnboardingTaskInput = z.infer<typeof CreateOnboardingTaskSchema>;
export type UpdateOnboardingTaskStatusInput = z.infer<typeof UpdateOnboardingTaskStatusSchema>;






