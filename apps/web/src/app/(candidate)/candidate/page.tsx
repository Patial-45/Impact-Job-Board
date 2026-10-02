import { ShellPage } from '@/components/shell-page';
export default function CandidateHome() {
  return (
    <ShellPage
      eyebrow="YOUR SPACE"
      title="Welcome to your dashboard"
      description="Your profile, roles, and applications will come together here."
      links={[
        { href: '/candidate/profile', label: 'Profile' },
        { href: '/candidate/jobs', label: 'Discover jobs' },
      ]}
    />
  );
}
