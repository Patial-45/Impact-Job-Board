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

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailConfirmInput = z.infer<typeof VerifyEmailConfirmSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

