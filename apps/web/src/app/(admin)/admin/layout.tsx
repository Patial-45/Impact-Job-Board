import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getViewer } from '@/lib/api';

const adminLinks = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/workspaces', label: 'Workspaces' },
  { href: '/admin/companies', label: 'Companies' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/system', label: 'System & Audit' },
  { href: '/admin/settings', label: 'Settings' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (!['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(viewer.globalRole)) notFound();
  return (
    <AppShell
      kind="Platform Admin"
      email={viewer.email}
      links={adminLinks}
    >
      {children}
    </AppShell>
  );
}
