import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getViewer } from '@/lib/api';
const links = [
  { href: '/candidate', label: 'Dashboard' },
  { href: '/candidate/jobs', label: 'Discover jobs' },
  { href: '/candidate/applications', label: 'Applications' },
  { href: '/candidate/interviews', label: 'Interviews' },
  { href: '/candidate/offers', label: 'Offers' },
  { href: '/candidate/saved', label: 'Saved jobs' },
  { href: '/candidate/profile', label: 'Profile' },
  { href: '/candidate/resume', label: 'Resume' },
  { href: '/candidate/settings', label: 'Settings' },
];
export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  return (
    <AppShell kind="Candidate" email={viewer.email} links={links}>
      {children}
    </AppShell>
  );
}
