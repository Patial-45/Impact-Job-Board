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


