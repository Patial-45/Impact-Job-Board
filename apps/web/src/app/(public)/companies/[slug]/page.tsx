import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicCompany } from '@/lib/api';
import { Button, Card, JobCard, PageHeader } from '@executive-match/ui';

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getPublicCompany(slug);

  if (!company) {
    notFound();
  }

  const jobs = company.jobs || [];

  return (
    <main className="container simple-page space-y-8">
      <div>
        <Link href="/jobs" className="text-xs font-semibold text-primary hover:underline">
          ← Back to all opportunities
        </Link>
      </div>

      <PageHeader
        eyebrow="COMPANY PROFILE"
        title={company.name}
        description={company.description || `Discover careers and open opportunities at ${company.name}.`}
        actions={
          company.website ? (
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">Visit Website ↗</Button>
            </a>
          ) : undefined
        }
      />

      {/* Company Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground">Industry</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {company.industry || 'Not specified'}
          </p>
        </Card>
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground">Headquarters</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {company.location || 'Remote-first'}
          </p>
        </Card>
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground">Company Size</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {company.size ? `${company.size} employees` : 'Growing'}
          </p>
        </Card>
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground">Open Roles</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {jobs.length} positions
          </p>
        </Card>
      </div>

      {/* Openings Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">Current Open Positions</h2>

        {jobs.length === 0 ? (
          <Card variant="outline" className="p-8 text-center text-muted-foreground text-sm">
            No published roles available right now. Check back soon!
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                title={job.title}
                companyName={company.name}
                location={job.location || 'Remote'}
                type={job.remoteType === 'ONSITE' ? 'On-site' : job.remoteType === 'HYBRID' ? 'Hybrid' : 'Remote'}
                salary={
                  job.minSalary && job.maxSalary
                    ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`
                    : undefined
                }
                postedAt={job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'Recent'}
                skills={job.skills.map((s) => s.name)}
                actionSlot={
                  <Link href={`/jobs/${job.slug}`}>
                    <Button variant="primary" size="sm">
                      View Position ↗
                    </Button>
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
