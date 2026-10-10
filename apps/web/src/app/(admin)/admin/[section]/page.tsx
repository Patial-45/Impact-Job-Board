import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';
import { AdminUsersTable } from '@/components/admin-users-table';
import { AdminWorkspacesTable } from '@/components/admin-workspaces-table';
import { AdminSystemTable } from '@/components/admin-system-table';
import {
  getAdminUsers,
  getAdminWorkspaces,
  getAdminAuditLogs,
  getAdminSystemHealth,
} from '@/lib/api';

const pages: Record<string, { title: string; description: string }> = {
  users: {
    title: 'Platform Users',
    description: 'Audit registered users, accounts, and platform privileges.',
  },
  workspaces: {
    title: 'Workspaces & Tenants',
    description: 'Manage tenant workspaces, active subscriptions, and verify boundary isolation.',
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
    description: 'Operational diagnostics, database latency metrics, and security audit logs.',
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

  if (section === 'users') {
    const usersData = await getAdminUsers();
    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">ADMINISTRATION</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>
        <AdminUsersTable initialUsers={usersData.items} initialTotal={usersData.total} />
      </main>
    );
  }

  if (section === 'workspaces') {
    const wsData = await getAdminWorkspaces();
    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">ADMINISTRATION</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>
        <AdminWorkspacesTable initialWorkspaces={wsData.items} initialTotal={wsData.total} />
      </main>
    );
  }

  if (section === 'system') {
    const [health, logsData] = await Promise.all([
      getAdminSystemHealth(),
      getAdminAuditLogs(),
    ]);
    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">ADMINISTRATION</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>
        <AdminSystemTable
          health={health}
          initialLogs={logsData.items}
          initialTotal={logsData.total}
        />
      </main>
    );
  }

  return <ShellPage eyebrow="ADMINISTRATION" title={page.title} description={page.description} />;
}
