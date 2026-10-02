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
