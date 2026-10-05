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




