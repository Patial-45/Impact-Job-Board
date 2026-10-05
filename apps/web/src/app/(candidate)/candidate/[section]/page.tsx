import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';
import { getCandidateProfile, getCandidateApplications, getCandidateSavedJobs } from '@/lib/api';
import { CandidateProfileForm } from '@/components/candidate-profile-form';
import { CandidateResumeManager } from '@/components/candidate-resume-manager';
import { CandidateApplicationsList } from '@/components/candidate-applications-list';
import { CandidateSavedJobs } from '@/components/candidate-saved-jobs';

const pages: Record<string, { title: string; description: string }> = {
  profile: {
    title: 'Your profile',
    description: 'Present your experience, education, skills, and goals in one place.',
  },
  jobs: { title: 'Discover jobs', description: 'Relevant opportunities will appear here.' },
  applications: {
    title: 'Your applications',
    description: 'Follow each application from submission to decision.',
  },
  saved: { title: 'Saved jobs', description: 'Keep interesting opportunities close.' },
  resume: {
    title: 'Your resume',
    description: 'Manage resume versions with private, secured object storage.',
  },
  settings: { title: 'Account settings', description: 'Manage your account preferences.' },
};

const fallbackProfile = {
  id: '',
  userId: '',
  headline: '',
  bio: '',
  location: '',
  yearsOfExperience: null,
  phone: '',
  websiteUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  searchVisible: true,
  openToRemote: true,
  experiences: [],
  educations: [],
  skills: [],
  resumes: [],
};

export default async function CandidateSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();

  if (section === 'profile') {
    const profile = (await getCandidateProfile()) || fallbackProfile;
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-1">
            CANDIDATE PROFILE
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.description}</p>
        </div>
        <CandidateProfileForm initialProfile={profile} />
      </div>
    );
  }

  if (section === 'resume') {
    const profile = (await getCandidateProfile()) || fallbackProfile;
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-1">
            CANDIDATE ASSETS
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.description}</p>
        </div>
        <CandidateResumeManager initialResumes={profile.resumes || []} />
      </div>
    );
  }

  if (section === 'applications') {
    const applications = await getCandidateApplications();
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-1">
            APPLICATION TRACKER
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.description}</p>
        </div>
        <CandidateApplicationsList initialApplications={applications} />
      </div>
    );
  }

  if (section === 'saved') {
    const savedJobs = await getCandidateSavedJobs();
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-1">
            SAVED ROLES
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.description}</p>
        </div>
        <CandidateSavedJobs initialSavedJobs={savedJobs} />
      </div>
    );
  }

  return <ShellPage eyebrow="CANDIDATE" title={page.title} description={page.description} />;
}

