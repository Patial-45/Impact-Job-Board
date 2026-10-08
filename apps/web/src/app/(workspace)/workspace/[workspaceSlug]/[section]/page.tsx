import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShellPage } from '@/components/shell-page';
import { WorkspaceTeam } from '@/components/workspace-team';
import { WorkspaceJobs } from '@/components/workspace-jobs';
import { CandidateSearch } from '@/components/candidate-search';
import { WorkspaceInterviews } from '@/components/workspace-interviews';
import { WorkspaceOffers } from '@/components/workspace-offers';
import {
  getWorkspaceJobs,
  searchWorkspaceCandidates,
  getWorkspaceInterviews,
  getWorkspaceOffers,
} from '@/lib/api';
import { Button, Card, Badge } from '@executive-match/ui';

const pages: Record<string, { title: string; description: string }> = {
  jobs: { title: 'Jobs', description: 'Create and manage roles for your team.' },
  candidates: { title: 'Candidates', description: 'Review candidates within this workspace.' },
  applications: { title: 'Applications', description: 'Keep your hiring pipeline organized.' },
  interviews: { title: 'Interviews', description: 'Coordinate conversations with candidates.' },
  offers: {
    title: 'Offers',
    description: 'Extend job offers, track digital signatures, and manage onboarding checklists.',
  },
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

  if (section === 'jobs') {
    const jobs = await getWorkspaceJobs(workspaceSlug);
    return (
      <main className="shell-page">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">EMPLOYER</span>
          <h1>Jobs & Postings</h1>
          <p>Create and manage open positions, requirements, and hiring status.</p>
        </header>
        <WorkspaceJobs workspaceSlug={workspaceSlug} initialJobs={jobs} />
      </main>
    );
  }

  if (section === 'candidates') {
    const [jobs, searchRes] = await Promise.all([
      getWorkspaceJobs(workspaceSlug),
      searchWorkspaceCandidates(workspaceSlug),
    ]);

    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">TALENT DISCOVERY</span>
          <h1>Candidate Search & Matching</h1>
          <p>
            Explore verified talent profiles, filter by seniority and skills, and evaluate deterministic match scores
            against your open requisitions.
          </p>
        </header>
        <CandidateSearch
          workspaceSlug={workspaceSlug}
          jobs={jobs}
          initialCandidates={searchRes.items}
          initialTotal={searchRes.total}
        />
      </main>
    );
  }

  if (section === 'applications') {
    const jobs = await getWorkspaceJobs(workspaceSlug);
    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">EMPLOYER ATS</span>
          <h1>Candidate Pipelines</h1>
          <p>Select a job requisition to manage stages, review applicant dossiers, and collaborate.</p>
        </header>

        {jobs.length === 0 ? (
          <Card className="p-12 text-center border-dashed space-y-3">
            <h3 className="font-bold text-foreground">No jobs created yet</h3>
            <p className="text-sm text-muted-foreground">
              Post a job requisition to begin receiving and tracking candidate applications.
            </p>
            <div className="pt-2">
              <Link href={`/workspace/${workspaceSlug}/jobs`}>
                <Button variant="primary">Create Job Requisition</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} variant="outline" className="p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {job.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{job.remoteType}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">{job.department || 'General'}</p>
                </div>
                <div className="pt-2">
                  <Link href={`/workspace/${workspaceSlug}/jobs/${job.slug}`} className="block">
                    <Button variant="primary" className="w-full text-xs">
                      Open ATS Pipeline →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    );
  }

  if (section === 'interviews') {
    const interviewData = await getWorkspaceInterviews(workspaceSlug);
    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">INTERVIEWS & ASSESSMENTS</span>
          <h1>Interview Coordination & Scorecards</h1>
          <p>
            Schedule screening calls, technical evaluations, and leadership panels. Review evaluator
            scorecards and consolidate structured candidate debriefs.
          </p>
        </header>
        <WorkspaceInterviews
          workspaceSlug={workspaceSlug}
          initialInterviews={interviewData.items}
        />
      </main>
    );
  }

  if (section === 'offers') {
    const offerData = await getWorkspaceOffers(workspaceSlug);
    return (
      <main className="shell-page space-y-6">
        <header className="shell-header" style={{ marginBottom: '32px' }}>
          <span className="ui-eyebrow">OFFERS & ONBOARDING</span>
          <h1>Job Offers & E-Signatures</h1>
          <p>
            Draft executive compensation packages, track candidate e-signature status, and coordinate
            new hire onboarding checklists.
          </p>
        </header>
        <WorkspaceOffers
          workspaceSlug={workspaceSlug}
          initialOffers={offerData.items}
        />
      </main>
    );
  }

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

