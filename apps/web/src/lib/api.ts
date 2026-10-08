import { cookies } from 'next/headers';
import type { Viewer } from '@executive-match/types';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export async function getViewer(): Promise<Viewer | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/auth/me`, { headers: { cookie }, cache: 'no-store' });
    if (!response.ok) return null;
    const body = (await response.json()) as { user: Viewer };
    return body.user;
  } catch {
    return null;
  }
}
export async function getWorkspace(
  slug: string,
): Promise<{ id: string; slug: string; name: string; role: string } | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(slug)}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function getMyWorkspaces(): Promise<
  Array<{ id: string; slug: string; name: string; role: string; joinedAt?: string }>
> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/workspaces`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const body = (await response.json()) as {
      items: Array<{ id: string; slug: string; name: string; role: string; joinedAt?: string }>;
    };
    return body.items || [];
  } catch {
    return [];
  }
}

export type CandidateProfileData = {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  phone: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  searchVisible: boolean;
  openToRemote: boolean;
  experiences: Array<{
    id: string;
    companyName: string;
    title: string;
    location: string | null;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string;
    endDate: string | null;
    description: string | null;
  }>;
  skills: Array<{
    id: string;
    name: string;
    yearsOfExperience: number | null;
    isPrimary: boolean;
  }>;
  resumes: Array<{
    id: string;
    fileName: string;
    fileKey: string;
    fileSize: number;
    mimeType: string;
    isPrimary: boolean;
    parsingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
  }>;
  user?: {
    id: string;
    email: string;
    profile?: {
      displayName: string;
    };
  };
};

export async function getCandidateProfile(): Promise<CandidateProfileData | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me`, {
      headers: { cookie },
      cache: 'no-store',
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export type JobData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  department: string | null;
  location: string | null;
  remoteType: 'ONSITE' | 'HYBRID' | 'REMOTE';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  minSalary: number | null;
  maxSalary: number | null;
  currency: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  publishedAt?: string | null;
  createdAt?: string;
  skills: Array<{ id: string; name: string; isRequired: boolean }>;
  company?: {
    name: string;
    slug: string;
    logoKey: string | null;
    industry: string | null;
    location: string | null;
    description?: string | null;
    website?: string | null;
    size?: string | null;
  };
};

export type CompanyData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  logoKey: string | null;
  bannerKey: string | null;
  jobs?: JobData[];
};

export async function getPublicJobs(params?: Record<string, string>): Promise<{
  items: JobData[];
  page: number;
  pageSize: number;
  total: number;
}> {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${apiUrl}/jobs${query ? `?${query}` : ''}`, {
      next: { revalidate: 10 },
    });
    if (!response.ok) return { items: [], page: 1, pageSize: 20, total: 0 };
    return await response.json();
  } catch {
    return { items: [], page: 1, pageSize: 20, total: 0 };
  }
}

export async function getPublicJob(slug: string): Promise<JobData | null> {
  try {
    const response = await fetch(`${apiUrl}/jobs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 10 },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function getPublicCompany(slug: string): Promise<CompanyData | null> {
  try {
    const response = await fetch(`${apiUrl}/companies/${encodeURIComponent(slug)}`, {
      next: { revalidate: 10 },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function getWorkspaceCompany(workspaceSlug: string): Promise<CompanyData | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/company`, {
      headers: { cookie },
      cache: 'no-store',
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function getWorkspaceJobs(workspaceSlug: string): Promise<JobData[]> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs`, {
      headers: { cookie },
      cache: 'no-store',
    });
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
}

export type ApplicationData = {
  id: string;
  jobId: string;
  candidateProfileId: string;
  resumeId: string | null;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
  currentStage: string;
  coverLetter?: string | null;
  rejectedReason?: string | null;
  withdrawnReason?: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    slug: string;
    title: string;
    department?: string | null;
    location?: string | null;
    remoteType?: 'ONSITE' | 'HYBRID' | 'REMOTE';
    employmentType?: string;
    status?: string;
    workspace?: {
      slug: string;
      company?: {
        name: string;
        slug: string;
        logoKey: string | null;
      } | null;
    };
  };
  candidateProfile?: {
    id: string;
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    yearsOfExperience?: number | null;
    openToRemote?: boolean;
    user?: {
      email: string;
      profile?: {
        displayName?: string | null;
        avatarKey?: string | null;
      } | null;
    };
    skills?: Array<{ name: string; yearsOfExperience?: number | null; isPrimary: boolean }>;
    experiences?: Array<{
      id: string;
      companyName: string;
      title: string;
      startDate: string;
      endDate?: string | null;
      isCurrent: boolean;
      description?: string | null;
    }>;
    educations?: Array<{
      id: string;
      institution: string;
      degree: string;
      fieldOfStudy?: string | null;
      startDate: string;
      endDate?: string | null;
    }>;
  };
  resume?: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
    parsingStatus?: string;
  } | null;
  resumeDownloadUrl?: string | null;
  _count?: { notes: number };
  stageHistory?: Array<{
    id: string;
    stage: string;
    notes?: string | null;
    createdAt: string;
    changedByUser?: {
      email: string;
      profile?: { displayName: string | null } | null;
    } | null;
  }>;
  notes?: Array<{
    id: string;
    content: string;
    createdAt: string;
    author?: {
      email: string;
      profile?: { displayName: string | null } | null;
    };
  }>;
};

export async function getCandidateApplications(): Promise<ApplicationData[]> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me/applications`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getJobApplications(
  workspaceSlug: string,
  jobSlug: string,
): Promise<{ items: ApplicationData[]; total: number }> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(jobSlug)}/applications`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getApplicationDetail(
  workspaceSlug: string,
  applicationId: string,
): Promise<ApplicationData | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/applications/${encodeURIComponent(applicationId)}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export type CandidateSearchResult = {
  id: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  openToRemote: boolean;
  searchVisible: boolean;
  user?: {
    id: string;
    email: string;
    profile?: {
      displayName: string | null;
      avatarKey?: string | null;
    } | null;
  };
  skills: Array<{ id?: string; name: string; yearsOfExperience?: number | null; isPrimary: boolean }>;
  experiences: Array<{
    id: string;
    companyName: string;
    title: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string;
    endDate: string | null;
  }>;
  isSaved?: boolean;
  savedCandidateId?: string | null;
  match?: {
    overallScore: number;
    skillsScore: number;
    experienceScore: number;
    locationScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    locationCompatible: boolean;
    summary: string;
  };
  aiMatch?: {
    overallScore: number;
    skillsScore: number;
    semanticScore: number;
    experienceScore: number;
    locationScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    explanation: string;
    cosineSimilarity: number;
    calculatedAt?: string;
  };
};

export type CandidateSearchResponse = {
  items: CandidateSearchResult[];
  total: number;
  page: number;
  pageSize: number;
};

export type JobMatchItem = {
  candidate: CandidateSearchResult;
  match: {
    overallScore: number;
    skillsScore: number;
    experienceScore: number;
    locationScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    locationCompatible: boolean;
    summary: string;
  };
};

export type SavedJobItem = {
  id: string;
  jobId: string;
  createdAt: string;
  job: JobData;
};

export async function searchWorkspaceCandidates(
  workspaceSlug: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<CandidateSearchResponse> {
  const cookie = (await cookies()).toString();
  try {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          cleanParams[key] = String(val);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/candidates/search${query ? `?${query}` : ''}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { items: [], total: 0, page: 1, pageSize: 20 };
    return await response.json();
  } catch {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

export async function getWorkspaceJobMatches(
  workspaceSlug: string,
  jobSlug: string,
): Promise<{ items: JobMatchItem[]; total: number; jobTitle: string }> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(jobSlug)}/matches`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { items: [], total: 0, jobTitle: '' };
    return await response.json();
  } catch {
    return { items: [], total: 0, jobTitle: '' };
  }
}

export async function getCandidateSavedJobs(): Promise<SavedJobItem[]> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me/saved-jobs`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export type AiJobMatchItem = {
  candidate: CandidateSearchResult;
  overallScore: number;
  skillsScore: number;
  semanticScore: number;
  experienceScore: number;
  locationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  cosineSimilarity: number;
  calculatedAt: string;
};

export type AiMatchesResponse = {
  job: { id: string; title: string; slug: string };
  items: AiJobMatchItem[];
  total: number;
  weights: {
    deterministic: number;
    semantic: number;
  };
};

export async function getWorkspaceJobAiMatches(
  workspaceSlug: string,
  jobSlug: string,
  params?: { minScore?: number; semanticWeight?: number; limit?: number },
): Promise<AiMatchesResponse | null> {
  const cookie = (await cookies()).toString();
  try {
    const cleanParams: Record<string, string> = {};
    if (params) {
      if (params.minScore !== undefined) cleanParams.minScore = String(params.minScore);
      if (params.semanticWeight !== undefined) cleanParams.semanticWeight = String(params.semanticWeight);
      if (params.limit !== undefined) cleanParams.limit = String(params.limit);
    }
    const query = new URLSearchParams(cleanParams).toString();
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(jobSlug)}/ai-matches${query ? `?${query}` : ''}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function recomputeWorkspaceJobAiMatches(
  workspaceSlug: string,
  jobSlug: string,
  data?: { candidateProfileId?: string; force?: boolean },
): Promise<{ recomputedCount: number; status?: string } | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(jobSlug)}/ai-matches/recompute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie,
        },
        body: JSON.stringify(data || {}),
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export type InterviewParticipantData = {
  id: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    email: string;
    profile?: { displayName: string | null };
  };
};

export type InterviewScorecardData = {
  id: string;
  evaluatorId: string;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE';
  overallRating: number;
  technicalRating?: number | null;
  communicationRating?: number | null;
  leadershipRating?: number | null;
  cultureRating?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  notes?: string | null;
  submittedAt: string;
  evaluator?: {
    id: string;
    email: string;
    profile?: { displayName: string | null };
  };
};

export type InterviewItem = {
  id: string;
  workspaceId: string;
  applicationId: string;
  title: string;
  type: 'SCREENING' | 'TECHNICAL' | 'BEHAVIORAL' | 'EXECUTIVE' | 'FINAL';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW';
  scheduledAt: string;
  durationMinutes: number;
  location?: string | null;
  timezone: string;
  notes?: string | null;
  cancellationReason?: string | null;
  application: {
    id: string;
    currentStage: string;
    status: string;
    candidateProfile: {
      id: string;
      headline?: string | null;
      location?: string | null;
      user?: {
        email: string;
        profile?: { displayName: string | null };
      };
    };
    job: {
      id: string;
      title: string;
      slug: string;
      company?: { name: string; slug: string };
    };
  };
  participants: InterviewParticipantData[];
  scorecards: InterviewScorecardData[];
};

export type CandidateInterviewItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string | null;
  timezone: string;
  application: {
    id: string;
    job: {
      id: string;
      title: string;
      slug: string;
      company?: { name: string; slug: string };
      workspace?: { company?: { name: string; slug: string } | null };
    };
  };
};

export type AssessmentItem = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  timeLimitMinutes?: number | null;
  passingScore?: number | null;
  createdAt: string;
  _count?: { invites: number };
};

export async function getWorkspaceInterviews(
  workspaceSlug: string,
  params?: { status?: string; type?: string },
): Promise<{ items: InterviewItem[]; total: number }> {
  const cookie = (await cookies()).toString();
  try {
    const cleanParams: Record<string, string> = {};
    if (params?.status) cleanParams.status = params.status;
    if (params?.type) cleanParams.type = params.type;
    const query = new URLSearchParams(cleanParams).toString();

    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/interviews${query ? `?${query}` : ''}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getWorkspaceInterviewDetails(
  workspaceSlug: string,
  interviewId: string,
): Promise<{ interview: InterviewItem } | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/interviews/${encodeURIComponent(interviewId)}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getCandidateInterviews(): Promise<{ items: CandidateInterviewItem[] }> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me/interviews`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return { items: [] };
    return await response.json();
  } catch {
    return { items: [] };
  }
}

export async function getWorkspaceAssessments(
  workspaceSlug: string,
): Promise<{ items: AssessmentItem[] }> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/assessments`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { items: [] };
    return await response.json();
  } catch {
    return { items: [] };
  }
}

export type OfferSignatureItem = {
  id: string;
  offerId: string;
  signerName: string;
  signerEmail: string;
  signatureText: string;
  signedAt: string;
};

export type OnboardingTaskItem = {
  id: string;
  workspaceId: string;
  offerId: string;
  title: string;
  description?: string | null;
  category: string;
  required: boolean;
  status: 'PENDING' | 'COMPLETED' | 'WAIVED';
  dueDate?: string | null;
  completedAt?: string | null;
};

export type OfferItem = {
  id: string;
  workspaceId: string;
  applicationId: string;
  jobTitle: string;
  baseSalary: number;
  currency: string;
  bonus?: string | null;
  equity?: string | null;
  signOnBonus?: number | null;
  startDate: string;
  expiresAt: string;
  workLocation: string;
  offerLetter?: string | null;
  notes?: string | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'RESCINDED';
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  rescindReason?: string | null;
  declineReason?: string | null;
  createdAt: string;
  application: {
    id: string;
    status: string;
    currentStage: string;
    candidateProfile: {
      id: string;
      headline?: string | null;
      user: {
        email: string;
        profile?: { displayName?: string | null } | null;
      };
    };
    job: {
      id: string;
      title: string;
      slug: string;
    };
  };
  createdBy: {
    id: string;
    email: string;
    profile?: { displayName?: string | null } | null;
  };
  approvedBy?: {
    id: string;
    email: string;
    profile?: { displayName?: string | null } | null;
  } | null;
  signature?: OfferSignatureItem | null;
  onboardingTasks?: OnboardingTaskItem[];
  _count?: {
    onboardingTasks: number;
  };
};

export type CandidateOfferItem = {
  id: string;
  jobTitle: string;
  baseSalary: number;
  currency: string;
  bonus?: string | null;
  equity?: string | null;
  signOnBonus?: number | null;
  startDate: string;
  expiresAt: string;
  workLocation: string;
  offerLetter?: string | null;
  status: 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'RESCINDED';
  sentAt?: string | null;
  respondedAt?: string | null;
  declineReason?: string | null;
  application: {
    id: string;
    job: {
      id: string;
      title: string;
      slug: string;
      workspace: {
        name: string;
        company?: {
          name: string;
          slug: string;
          location?: string | null;
        } | null;
      };
    };
  };
  signature?: OfferSignatureItem | null;
  onboardingTasks?: OnboardingTaskItem[];
};

export type CandidateOnboardingResponse = {
  tasks: Array<
    OnboardingTaskItem & {
      offer: {
        id: string;
        jobTitle: string;
        startDate: string;
        workspace: {
          name: string;
          company?: { name: string; slug: string } | null;
        };
      };
    }
  >;
  completedCount: number;
  totalCount: number;
};

export async function getWorkspaceOffers(
  workspaceSlug: string,
  status?: string,
): Promise<{ items: OfferItem[]; total: number }> {
  const cookie = (await cookies()).toString();
  try {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers${query}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getWorkspaceOfferDetails(
  workspaceSlug: string,
  offerId: string,
): Promise<{ offer: OfferItem } | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(
      `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(offerId)}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getCandidateOffers(): Promise<{ items: CandidateOfferItem[] }> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me/offers`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return { items: [] };
    return await response.json();
  } catch {
    return { items: [] };
  }
}

export async function getCandidateOfferDetails(
  offerId: string,
): Promise<{ offer: CandidateOfferItem } | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me/offers/${encodeURIComponent(offerId)}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getCandidateOnboarding(): Promise<CandidateOnboardingResponse> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${apiUrl}/candidates/me/onboarding`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return { tasks: [], completedCount: 0, totalCount: 0 };
    return await response.json();
  } catch {
    return { tasks: [], completedCount: 0, totalCount: 0 };
  }
}







