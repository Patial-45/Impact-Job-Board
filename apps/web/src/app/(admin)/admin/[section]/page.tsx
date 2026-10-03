import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';

const pages: Record<string, { title: string; description: string }> = {
  users: {
    title: 'Platform Users',
    description: 'Audit registered users, accounts, and platform privileges.',
  },
  workspaces: {
    title: 'Workspaces & Tenants',
    description: 'Manage tenant workspaces and verify boundary isolation.',
  },
  companies: {
    title: 'Companies',
    description: 'Review employer company profiles and directory status.',
  },
  jobs: {
    title: 'All Requisitions',
    description: 'Platform-wide view of published and draft job postings.',
  },
  applications: {
    title: 'Applications',
    description: 'System-wide application volumes, stages, and status telemetry.',
  },
  system: {
    title: 'System & Health',
    description: 'Queue telemetry, database metrics, and security audit logs.',
  },
  settings: {
    title: 'Platform Settings',
    description: 'Global configuration flags and provider registry parameters.',
  },
};

export default async function AdminSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();
  return <ShellPage eyebrow="ADMINISTRATION" title={page.title} description={page.description} />;
}
