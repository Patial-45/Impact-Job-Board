import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';
import { WorkspaceTeam } from '@/components/workspace-team';

const pages: Record<string, { title: string; description: string }> = {
  jobs: { title: 'Jobs', description: 'Create and manage roles for your team.' },
  candidates: { title: 'Candidates', description: 'Review candidates within this workspace.' },
  applications: { title: 'Applications', description: 'Keep your hiring pipeline organized.' },
  interviews: { title: 'Interviews', description: 'Coordinate conversations with candidates.' },
  analytics: { title: 'Analytics', description: 'Understand the progress of your hiring process.' },
  team: { title: 'Team', description: 'Collaborate with workspace members.' },
  settings: {
    title: 'Workspace settings',
    description: 'Manage your team and workspace preferences.',
  },
};

export default async function WorkspaceSection({
  params,
}: {
  params: Promise<{ workspaceSlug: string; section: string }>;
}) {
  const { workspaceSlug, section } = await params;
  const page = pages[section];
  if (!page) notFound();

  if (section === 'team') {
    return (
      <main className="shell-page">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">EMPLOYER</span>
          <h1>Team & Collaboration</h1>
          <p>Manage workspace members, role permissions, and pending invitations.</p>
        </header>
        <WorkspaceTeam workspaceSlug={workspaceSlug} />
      </main>
    );
  }

  return <ShellPage eyebrow="EMPLOYER" title={page.title} description={page.description} />;
}

