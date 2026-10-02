import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';
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
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();
  return <ShellPage eyebrow="EMPLOYER" title={page.title} description={page.description} />;
}
