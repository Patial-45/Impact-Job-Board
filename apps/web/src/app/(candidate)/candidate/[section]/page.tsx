import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';
const pages: Record<string, { title: string; description: string }> = {
  profile: {
    title: 'Your profile',
    description: 'Present your experience and goals in one place.',
  },
  jobs: { title: 'Discover jobs', description: 'Relevant opportunities will appear here.' },
  applications: {
    title: 'Your applications',
    description: 'Follow each application from submission to decision.',
  },
  saved: { title: 'Saved jobs', description: 'Keep interesting opportunities close.' },
  resume: {
    title: 'Your resume',
    description: 'Manage resume versions when uploads become available.',
  },
  settings: { title: 'Account settings', description: 'Manage your account preferences.' },
};
export default async function CandidateSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();
  return <ShellPage eyebrow="CANDIDATE" title={page.title} description={page.description} />;
}
