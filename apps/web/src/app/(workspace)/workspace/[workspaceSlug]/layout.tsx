import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getViewer, getWorkspace } from '@/lib/api';
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  const workspace = await getWorkspace(workspaceSlug);
  if (!workspace) notFound();
  const base = `/workspace/${workspaceSlug}`;
  const links = [
    { href: base, label: 'Overview' },
    { href: `${base}/jobs`, label: 'Jobs' },
    { href: `${base}/candidates`, label: 'Candidates' },
    { href: `${base}/applications`, label: 'Applications' },
    { href: `${base}/interviews`, label: 'Interviews' },
    { href: `${base}/offers`, label: 'Offers' },
    { href: `${base}/analytics`, label: 'Analytics' },
    { href: `${base}/team`, label: 'Team' },
    { href: `${base}/settings`, label: 'Settings' },
  ];
  return (
    <AppShell kind="Employer" label={workspace.name} email={viewer.email} links={links}>
      {children}
    </AppShell>
  );
}
