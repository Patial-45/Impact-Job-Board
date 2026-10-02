import { z } from 'zod';
export const RegisterSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(120),
});
export const LoginSchema = z.object({ email: z.email().max(320), password: z.string().min(1) });
export const WorkspaceSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
