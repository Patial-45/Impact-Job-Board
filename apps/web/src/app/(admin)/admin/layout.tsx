import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getViewer } from '@/lib/api';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (!['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(viewer.globalRole)) notFound();
  return (
    <AppShell
      kind="Platform admin"
      email={viewer.email}
      links={[{ href: '/admin', label: 'Overview' }]}
    >
      {children}
    </AppShell>
  );
}
