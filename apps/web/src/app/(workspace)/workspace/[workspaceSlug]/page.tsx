import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard, Button } from '@executive-match/ui';

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const base = `/workspace/${workspaceSlug}`;

  return (
    <main className="shell-page" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header className="shell-header">
        <span className="ui-eyebrow">EMPLOYER WORKSPACE</span>
        <h1>Workspace Overview</h1>
        <p>Monitor your active hiring pipeline, manage roles, and collaborate with your hiring team.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard title="Active Roles" value="0" description="Open job requisitions" />
        <StatCard title="Total Applicants" value="0" description="Across all active jobs" />
        <StatCard title="Shortlisted" value="0" description="Awaiting team review" />
        <StatCard title="Scheduled Interviews" value="0" description="Next 7 days" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Team Collaboration</CardTitle>
            <CardDescription>Coordinate hiring with hiring managers and interviewers</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Invite colleagues with specific roles (Admin, Recruiter, Viewer) to streamline reviews and keep candidate notes confidential.
            </p>
            <Link href={`${base}/team`}>
              <Button variant="primary">Manage Team Members</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Postings</CardTitle>
            <CardDescription>Publish structured roles with candidate match criteria</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Draft position requirements, skills, and compensation bands. Publishing activates public discovery and applicant processing.
            </p>
            <Link href={`${base}/jobs`}>
              <Button variant="secondary">View Roles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

