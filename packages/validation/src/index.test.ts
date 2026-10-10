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
  UpdateCompanySchema,
  JobSlugSchema,
  CreateJobSchema,
  UpdateJobStatusSchema,
  JobQuerySchema,
  ApplyJobSchema,
  UpdateApplicationStageSchema,
  UpdateApplicationStatusSchema,
  WithdrawApplicationSchema,
  CreateApplicationNoteSchema,
  ApplicationQuerySchema,
  CandidateSearchQuerySchema,
  SaveCandidateSchema,
  AiMatchQuerySchema,
  RecomputeAiMatchSchema,
  CreateInterviewSchema,
  UpdateInterviewSchema,
  CancelInterviewSchema,
  SubmitScorecardSchema,
  CreateAssessmentSchema,
  InviteAssessmentSchema,
  CompleteAssessmentSchema,
  CreateOfferSchema,
  UpdateOfferSchema,
  RescindOfferSchema,
  AcceptOfferSchema,
  DeclineOfferSchema,
  CreateOnboardingTaskSchema,
  UpdateOnboardingTaskStatusSchema,
  AdminUserQuerySchema,
  AdminUpdateUserRoleSchema,
  AdminWorkspaceQuerySchema,
  AdminAuditLogQuerySchema,
  AdminSupportElevationSchema,
  AdminModerateJobSchema,
  AnalyticsQuerySchema,
  UpdateSubscriptionSchema,
  CancelSubscriptionSchema,
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

describe('validation - Company and Job schemas', () => {
  it('validates company updates', () => {
    expect(
      UpdateCompanySchema.safeParse({
        name: 'Acme Technologies',
        website: 'https://acme.tech',
        industry: 'FinTech',
        size: '51-200',
        location: 'San Francisco, CA',
      }).success,
    ).toBe(true);

    expect(
      UpdateCompanySchema.safeParse({
        website: 'not-a-valid-url',
      }).success,
    ).toBe(false);
  });

  it('validates job slugs', () => {
    expect(JobSlugSchema.safeParse('staff-software-engineer').success).toBe(true);
    expect(JobSlugSchema.safeParse('ai_engineer').success).toBe(false);
    expect(JobSlugSchema.safeParse('invalid--slug').success).toBe(false);
    expect(JobSlugSchema.safeParse('trailing-').success).toBe(false);
  });

  it('validates job creation payloads with skills', () => {
    expect(
      CreateJobSchema.safeParse({
        title: 'Senior Backend Engineer',
        description: 'We are seeking an experienced Go/PostgreSQL engineer.',
        department: 'Engineering',
        location: 'New York, NY',
        remoteType: 'HYBRID',
        employmentType: 'FULL_TIME',
        experienceLevel: 'SENIOR',
        minSalary: 160000,
        maxSalary: 210000,
        skills: [
          { name: 'Go', isRequired: true },
          { name: 'PostgreSQL', isRequired: true },
          { name: 'Kubernetes', isRequired: false },
        ],
      }).success,
    ).toBe(true);

    // Rejects too-short descriptions
    expect(
      CreateJobSchema.safeParse({
        title: 'Too short',
        description: 'short',
      }).success,
    ).toBe(false);
  });

  it('validates job status transitions', () => {
    expect(UpdateJobStatusSchema.safeParse({ status: 'PUBLISHED' }).success).toBe(true);
    expect(UpdateJobStatusSchema.safeParse({ status: 'CLOSED' }).success).toBe(true);
    expect(UpdateJobStatusSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(false);
  });

  it('validates job search queries with pagination', () => {
    const parsed = JobQuerySchema.safeParse({
      query: 'engineer',
      remoteType: 'REMOTE',
      page: '2',
      pageSize: '10',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.pageSize).toBe(10);
      expect(parsed.data.remoteType).toBe('REMOTE');
    }
  });
});

describe('validation - Applications and ATS schemas', () => {
  it('validates job application submission with optional resume and cover letter', () => {
    expect(
      ApplyJobSchema.safeParse({
        resumeId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position.',
      }).success,
    ).toBe(true);

    expect(
      ApplyJobSchema.safeParse({
        resumeId: 'not-a-uuid',
      }).success,
    ).toBe(false);

    expect(
      ApplyJobSchema.safeParse({}).success,
    ).toBe(true);
  });

  it('validates stage movement in ATS pipeline', () => {
    expect(
      UpdateApplicationStageSchema.safeParse({
        stage: 'INTERVIEW',
        notes: 'Passed screening assessment successfully.',
      }).success,
    ).toBe(true);

    expect(
      UpdateApplicationStageSchema.safeParse({
        stage: '',
      }).success,
    ).toBe(false);
  });

  it('validates application status transitions', () => {
    expect(
      UpdateApplicationStatusSchema.safeParse({
        status: 'OFFERED',
      }).success,
    ).toBe(true);

    expect(
      UpdateApplicationStatusSchema.safeParse({
        status: 'REJECTED',
        reason: 'Candidate accepted another offer.',
      }).success,
    ).toBe(true);

    expect(
      UpdateApplicationStatusSchema.safeParse({
        status: 'INVALID_STATUS',
      }).success,
    ).toBe(false);
  });

  it('validates candidate withdrawal', () => {
    expect(
      WithdrawApplicationSchema.safeParse({
        reason: 'Accepted another role.',
      }).success,
    ).toBe(true);

    expect(
      WithdrawApplicationSchema.safeParse({}).success,
    ).toBe(true);
  });

  it('validates recruiter application notes', () => {
    expect(
      CreateApplicationNoteSchema.safeParse({
        content: 'Strong executive presence during preliminary call.',
      }).success,
    ).toBe(true);

    expect(
      CreateApplicationNoteSchema.safeParse({
        content: '',
      }).success,
    ).toBe(false);
  });

  it('validates ATS application queries', () => {
    const parsed = ApplicationQuerySchema.safeParse({
      stage: 'INTERVIEW',
      status: 'IN_REVIEW',
      page: '1',
      pageSize: '25',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.stage).toBe('INTERVIEW');
      expect(parsed.data.status).toBe('IN_REVIEW');
      expect(parsed.data.pageSize).toBe(25);
    }
  });
});

describe('validation - Candidate Search & Matching schemas', () => {
  it('validates recruiter candidate search query params', () => {
    const parsed = CandidateSearchQuerySchema.safeParse({
      query: 'kubernetes engineer',
      skills: 'Go, Terraform',
      minExperience: '5',
      maxExperience: '12',
      location: 'New York',
      openToRemote: 'true',
      page: '1',
      pageSize: '20',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minExperience).toBe(5);
      expect(parsed.data.maxExperience).toBe(12);
      expect(parsed.data.openToRemote).toBe(true);
    }
  });

  it('validates recruiter save candidate notes', () => {
    expect(
      SaveCandidateSchema.safeParse({
        notes: 'Top candidate for VP Infrastructure role.',
      }).success,
    ).toBe(true);

    expect(
      SaveCandidateSchema.safeParse({}).success,
    ).toBe(true);
  });

  it('validates AI match query parameters and defaults', () => {
    const parsed = AiMatchQuerySchema.safeParse({
      minScore: '75',
      semanticWeight: '0.4',
      limit: '30',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minScore).toBe(75);
      expect(parsed.data.semanticWeight).toBe(0.4);
      expect(parsed.data.limit).toBe(30);
    }

    const defaultParsed = AiMatchQuerySchema.safeParse({});
    expect(defaultParsed.success).toBe(true);
    if (defaultParsed.success) {
      expect(defaultParsed.data.semanticWeight).toBe(0.3);
      expect(defaultParsed.data.limit).toBe(20);
    }
  });

  it('validates recompute AI match input', () => {
    expect(
      RecomputeAiMatchSchema.safeParse({
        candidateProfileId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        force: true,
      }).success,
    ).toBe(true);

    expect(
      RecomputeAiMatchSchema.safeParse({}).success,
    ).toBe(true);

    expect(
      RecomputeAiMatchSchema.safeParse({
        candidateProfileId: 'not-a-uuid',
      }).success,
    ).toBe(false);
  });
});

describe('validation - Interview and Assessment schemas', () => {
  it('validates interview creation payload', () => {
    const valid = {
      applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Technical Round 1',
      type: 'TECHNICAL',
      scheduledAt: '2026-10-15T14:00:00.000Z',
      durationMinutes: 60,
      location: 'https://meet.google.com/abc-defg-hij',
      timezone: 'America/New_York',
      notes: 'Focus on distributed caching and concurrency patterns.',
      participantUserIds: ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    };
    expect(CreateInterviewSchema.safeParse(valid).success).toBe(true);

    // Rejects invalid date
    expect(
      CreateInterviewSchema.safeParse({
        ...valid,
        scheduledAt: 'invalid-date',
      }).success,
    ).toBe(false);

    // Rejects duration < 15 min
    expect(
      CreateInterviewSchema.safeParse({
        ...valid,
        durationMinutes: 10,
      }).success,
    ).toBe(false);
  });

  it('validates interview update and cancellation', () => {
    expect(
      UpdateInterviewSchema.safeParse({
        title: 'Rescheduled Senior Engineering Panel',
        status: 'RESCHEDULED',
        durationMinutes: 45,
      }).success,
    ).toBe(true);

    expect(
      CancelInterviewSchema.safeParse({
        cancellationReason: 'Candidate requested postponement due to travel.',
      }).success,
    ).toBe(true);
  });

  it('validates scorecard submission', () => {
    const valid = {
      recommendation: 'STRONG_HIRE',
      overallRating: 5,
      technicalRating: 5,
      communicationRating: 4,
      leadershipRating: 4,
      cultureRating: 5,
      strengths: 'Outstanding grasp of systems architecture and algorithmic design.',
      weaknesses: 'Minimal prior experience with Kubernetes on bare metal.',
      notes: 'Strong candidate for our Platform team.',
    };
    expect(SubmitScorecardSchema.safeParse(valid).success).toBe(true);

    // Rejects ratings outside 1-5
    expect(
      SubmitScorecardSchema.safeParse({
        ...valid,
        overallRating: 6,
      }).success,
    ).toBe(false);

    expect(
      SubmitScorecardSchema.safeParse({
        ...valid,
        overallRating: 0,
      }).success,
    ).toBe(false);
  });

  it('validates assessment creation, invite, and completion', () => {
    expect(
      CreateAssessmentSchema.safeParse({
        title: 'Senior Systems Engineering Assessment',
        description: 'Timed evaluation covering SQL optimization and high throughput queues.',
        timeLimitMinutes: 60,
        passingScore: 75,
      }).success,
    ).toBe(true);

    expect(
      InviteAssessmentSchema.safeParse({
        assessmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        applicationId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        expiresInDays: 14,
      }).success,
    ).toBe(true);

    expect(
      CompleteAssessmentSchema.safeParse({
        score: 88,
        feedback: 'Candidate successfully passed performance and optimization benchmarks.',
      }).success,
    ).toBe(true);

    // Rejects score > 100
    expect(
      CompleteAssessmentSchema.safeParse({
        score: 110,
      }).success,
    ).toBe(false);
  });
});

describe('validation - Offers and Onboarding schemas', () => {
  it('validates offer creation and rejects negative or zero base salary', () => {
    const validOffer = {
      applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      jobTitle: 'Principal Staff Engineer',
      baseSalary: 235000,
      currency: 'USD',
      bonus: '20% target performance bonus',
      equity: '0.5% options vesting over 4 years',
      signOnBonus: 25000,
      startDate: new Date('2026-11-01T09:00:00Z').toISOString(),
      expiresAt: new Date('2026-10-25T18:00:00Z').toISOString(),
      workLocation: 'Hybrid - New York, NY',
      offerLetter: 'We are thrilled to offer you the Principal Staff Engineer role.',
      notes: 'Approved by compensation committee on Oct 8.',
    };

    expect(CreateOfferSchema.safeParse(validOffer).success).toBe(true);

    // Rejects non-positive salary
    expect(
      CreateOfferSchema.safeParse({
        ...validOffer,
        baseSalary: 0,
      }).success,
    ).toBe(false);

    expect(
      CreateOfferSchema.safeParse({
        ...validOffer,
        baseSalary: -50000,
      }).success,
    ).toBe(false);
  });

  it('validates offer updating and rescinding', () => {
    expect(
      UpdateOfferSchema.safeParse({
        baseSalary: 250000,
        bonus: '25% target performance bonus',
      }).success,
    ).toBe(true);

    expect(
      RescindOfferSchema.safeParse({
        reason: 'Requisition cancelled due to organizational restructuring.',
      }).success,
    ).toBe(true);

    expect(
      RescindOfferSchema.safeParse({
        reason: '',
      }).success,
    ).toBe(false);
  });

  it('validates candidate offer acceptance with legal agreement', () => {
    expect(
      AcceptOfferSchema.safeParse({
        signerName: 'Jane Doe',
        signatureText: 'Jane Doe',
        consentConfirmed: true,
      }).success,
    ).toBe(true);

    // Rejects if consent is false
    expect(
      AcceptOfferSchema.safeParse({
        signerName: 'Jane Doe',
        signatureText: 'Jane Doe',
        consentConfirmed: false,
      }).success,
    ).toBe(false);

    expect(
      DeclineOfferSchema.safeParse({
        reason: 'Accepted a competing offer.',
      }).success,
    ).toBe(true);
  });

  it('validates onboarding task creation and status changes', () => {
    expect(
      CreateOnboardingTaskSchema.safeParse({
        title: 'Sign Employee Confidentiality Agreement',
        description: 'Review and sign the proprietary information and inventions agreement.',
        category: 'COMPLIANCE',
        required: true,
      }).success,
    ).toBe(true);

    expect(
      UpdateOnboardingTaskStatusSchema.safeParse({
        status: 'COMPLETED',
      }).success,
    ).toBe(true);

    expect(
      UpdateOnboardingTaskStatusSchema.safeParse({
        status: 'INVALID_STATUS',
      }).success,
    ).toBe(false);
  });
});

describe('validation - Platform Admin schemas', () => {
  it('validates admin user queries', () => {
    expect(AdminUserQuerySchema.safeParse({}).success).toBe(true);
    expect(
      AdminUserQuerySchema.safeParse({
        search: 'john@example.com',
        globalRole: 'PLATFORM_ADMIN',
        page: 2,
        pageSize: 50,
      }).success,
    ).toBe(true);
    expect(
      AdminUserQuerySchema.safeParse({
        globalRole: 'NON_EXISTENT_ROLE',
      }).success,
    ).toBe(false);
  });

  it('validates user role modifications', () => {
    expect(AdminUpdateUserRoleSchema.safeParse({ globalRole: 'PLATFORM_ADMIN' }).success).toBe(true);
    expect(AdminUpdateUserRoleSchema.safeParse({ globalRole: 'SUPER_ADMIN' }).success).toBe(true);
    expect(AdminUpdateUserRoleSchema.safeParse({ globalRole: 'USER' }).success).toBe(true);
    expect(AdminUpdateUserRoleSchema.safeParse({ globalRole: 'INVALID' }).success).toBe(false);
  });

  it('validates workspace queries', () => {
    expect(AdminWorkspaceQuerySchema.safeParse({}).success).toBe(true);
    expect(AdminWorkspaceQuerySchema.safeParse({ search: 'acme' }).success).toBe(true);
  });

  it('validates audit log queries', () => {
    expect(AdminAuditLogQuerySchema.safeParse({}).success).toBe(true);
    expect(
      AdminAuditLogQuerySchema.safeParse({
        action: 'USER_ROLE_UPDATED',
        targetType: 'USER',
      }).success,
    ).toBe(true);
  });

  it('validates support elevation requests', () => {
    expect(
      AdminSupportElevationSchema.safeParse({
        workspaceSlug: 'acme-corp',
        reason: 'Investigating billing invoice synchronization issue for customer ticket #402',
        scope: 'READ_ONLY',
        durationHours: 4,
      }).success,
    ).toBe(true);

    // Reason too short
    expect(
      AdminSupportElevationSchema.safeParse({
        workspaceSlug: 'acme-corp',
        reason: 'fix',
      }).success,
    ).toBe(false);

    // Duration exceeding max 24 hours
    expect(
      AdminSupportElevationSchema.safeParse({
        workspaceSlug: 'acme-corp',
        reason: 'Investigating issue for customer ticket #402',
        durationHours: 48,
      }).success,
    ).toBe(false);
  });

  it('validates admin job moderation', () => {
    expect(
      AdminModerateJobSchema.safeParse({
        status: 'CLOSED',
        moderationReason: 'Contains terms violating platform recruitment policy',
      }).success,
    ).toBe(true);

    expect(
      AdminModerateJobSchema.safeParse({
        status: 'INVALID_STATUS',
      }).success,
    ).toBe(false);
  });
});

describe('validation - Analytics & Billing schemas', () => {
  it('validates analytics query date range', () => {
    expect(AnalyticsQuerySchema.safeParse({}).success).toBe(true);
    expect(
      AnalyticsQuerySchema.safeParse({
        from: '2026-01-01T00:00:00Z',
        to: '2026-06-01T00:00:00Z',
        jobId: '123e4567-e89b-12d3-a456-426614174000',
      }).success,
    ).toBe(true);
    expect(
      AnalyticsQuerySchema.safeParse({
        from: 'not-a-date',
      }).success,
    ).toBe(false);
  });

  it('validates subscription updates and cancellations', () => {
    expect(
      UpdateSubscriptionSchema.safeParse({
        tier: 'GROWTH',
        billingCycle: 'ANNUAL',
      }).success,
    ).toBe(true);

    expect(
      UpdateSubscriptionSchema.safeParse({
        tier: 'INVALID_TIER',
      }).success,
    ).toBe(false);

    expect(
      CancelSubscriptionSchema.safeParse({
        reason: 'Downsizing hiring operations this quarter',
      }).success,
    ).toBe(true);
  });
});






