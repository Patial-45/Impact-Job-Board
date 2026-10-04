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


