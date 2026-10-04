import { describe, expect, it } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  WorkspaceSlugSchema,
  VerifyEmailConfirmSchema,
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
  CreateWorkspaceSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  UpdateCandidateProfileSchema,
  CreateCandidateExperienceSchema,
  CreateCandidateEducationSchema,
  AddCandidateSkillSchema,
  RequestResumeUploadSchema,
  ConfirmResumeUploadSchema,
} from './index';

describe('validation - Authentication schemas', () => {
  it('rejects short passwords on registration', () => {
    expect(
      RegisterSchema.safeParse({ email: 'a@example.com', password: 'short', displayName: 'A' })
        .success,
    ).toBe(false);
  });

  it('accepts valid registration payload', () => {
    expect(
      RegisterSchema.safeParse({
        email: 'founder@example.com',
        password: 'secure-password-123',
        displayName: 'John Doe',
      }).success,
    ).toBe(true);
  });

  it('validates login credentials', () => {
    expect(LoginSchema.safeParse({ email: 'invalid-email', password: 'pass' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'valid@example.com', password: '' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'valid@example.com', password: 'some-password' }).success).toBe(true);
  });

  it('validates email verification token payload', () => {
    expect(VerifyEmailConfirmSchema.safeParse({ token: '' }).success).toBe(false);
    expect(VerifyEmailConfirmSchema.safeParse({ token: 'xyz123' }).success).toBe(true);
  });

  it('validates password reset request payload', () => {
    expect(PasswordResetRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(PasswordResetRequestSchema.safeParse({ email: 'user@domain.com' }).success).toBe(true);
  });

  it('validates password reset confirmation payload', () => {
    expect(PasswordResetConfirmSchema.safeParse({ token: 'abc', password: 'too-short' }).success).toBe(false);
    expect(
      PasswordResetConfirmSchema.safeParse({ token: 'abc', password: 'a-sufficiently-long-new-password' }).success,
    ).toBe(true);
  });
});

describe('validation - Workspace and Member schemas', () => {
  it('validates workspace slug rules', () => {
    expect(WorkspaceSlugSchema.safeParse('../other').success).toBe(false);
    expect(WorkspaceSlugSchema.safeParse('Invalid_Slug').success).toBe(false);
    expect(WorkspaceSlugSchema.safeParse('-leading-dash').success).toBe(false);
    expect(WorkspaceSlugSchema.safeParse('trailing-dash-').success).toBe(false);
    expect(WorkspaceSlugSchema.safeParse('acme-corp').success).toBe(true);
    expect(WorkspaceSlugSchema.safeParse('impact-job-board-2026').success).toBe(true);
  });

  it('validates workspace creation payload', () => {
    expect(CreateWorkspaceSchema.safeParse({ name: 'A', slug: 'acme' }).success).toBe(false);
    expect(CreateWorkspaceSchema.safeParse({ name: 'Acme Corp', slug: 'acme-corp' }).success).toBe(true);
  });

  it('validates member invitation payload', () => {
    expect(InviteMemberSchema.safeParse({ email: 'invalid', role: 'RECRUITER' }).success).toBe(false);
    expect(InviteMemberSchema.safeParse({ email: 'recruiter@company.com', role: 'INVALID_ROLE' }).success).toBe(false);
    expect(InviteMemberSchema.safeParse({ email: 'recruiter@company.com', role: 'RECRUITER' }).success).toBe(true);
    expect(InviteMemberSchema.safeParse({ email: 'admin@company.com', role: 'ADMIN' }).success).toBe(true);
  });

  it('validates member role update payload', () => {
    expect(UpdateMemberRoleSchema.safeParse({ role: 'OWNER' }).success).toBe(false);
    expect(UpdateMemberRoleSchema.safeParse({ role: 'ADMIN' }).success).toBe(true);
    expect(UpdateMemberRoleSchema.safeParse({ role: 'VIEWER' }).success).toBe(true);
  });
});

describe('validation - Candidate Profile and Resume schemas', () => {
  it('validates candidate profile updates', () => {
    expect(
      UpdateCandidateProfileSchema.safeParse({
        headline: 'Staff Software Engineer',
        yearsOfExperience: 8,
        websiteUrl: 'https://example.com',
        githubUrl: 'https://github.com/developer',
        searchVisible: true,
      }).success,
    ).toBe(true);

    expect(
      UpdateCandidateProfileSchema.safeParse({
        websiteUrl: 'not-a-url',
      }).success,
    ).toBe(false);
  });

  it('validates candidate work experience', () => {
    expect(
      CreateCandidateExperienceSchema.safeParse({
        companyName: 'Acme Systems',
        title: 'Senior Engineer',
        startDate: '2022-01-01T00:00:00.000Z',
        isCurrent: true,
        description: 'Led architecture and migrations.',
      }).success,
    ).toBe(true);

    expect(
      CreateCandidateExperienceSchema.safeParse({
        companyName: '',
        title: 'Senior Engineer',
        startDate: 'invalid-date',
      }).success,
    ).toBe(false);
  });

  it('validates candidate education', () => {
    expect(
      CreateCandidateEducationSchema.safeParse({
        institution: 'Stanford University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2016-09-01T00:00:00.000Z',
        endDate: '2020-06-15T00:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('validates candidate skills', () => {
    expect(
      AddCandidateSkillSchema.safeParse({
        name: 'TypeScript',
        yearsOfExperience: 5,
        isPrimary: true,
      }).success,
    ).toBe(true);

    expect(
      AddCandidateSkillSchema.safeParse({
        name: '',
      }).success,
    ).toBe(false);
  });

  it('validates resume upload requests and size/format limits', () => {
    expect(
      RequestResumeUploadSchema.safeParse({
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024 * 1024,
      }).success,
    ).toBe(true);

    // Rejects unsupported mime types (e.g. image/png or exe)
    expect(
      RequestResumeUploadSchema.safeParse({
        fileName: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        fileSize: 1024,
      }).success,
    ).toBe(false);

    // Rejects files exceeding 10MB
    expect(
      RequestResumeUploadSchema.safeParse({
        fileName: 'huge.pdf',
        mimeType: 'application/pdf',
        fileSize: 15 * 1024 * 1024,
      }).success,
    ).toBe(false);
  });

  it('validates resume upload confirmation', () => {
    expect(
      ConfirmResumeUploadSchema.safeParse({
        fileKey: 'resumes/cand-123/uuid.pdf',
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 50000,
        setAsPrimary: true,
      }).success,
    ).toBe(true);
  });
});


