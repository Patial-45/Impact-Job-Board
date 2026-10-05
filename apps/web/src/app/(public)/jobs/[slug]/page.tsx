import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicJob } from '@/lib/api';
import { Badge, Button, Card } from '@executive-match/ui';
import { JobApplyModal } from '@/components/job-apply-modal';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getPublicJob(slug);

  if (!job) {
    notFound();
  }

  const company = job.company;

  return (
    <main className="container simple-page space-y-8">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link href="/jobs" className="text-xs font-semibold text-primary hover:underline">
          ← Back to all opportunities
        </Link>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">
              {company ? (
                <Link
                  href={`/companies/${company.slug}`}
                  className="text-primary hover:underline font-semibold"
                >
                  {company.name}
                </Link>
              ) : (
                'Confidential Employer'
              )}
            </span>
            <span>•</span>
            <span className="text-sm text-muted-foreground">{job.location || 'Remote'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {job.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Badge variant="accent">{job.remoteType}</Badge>
            <Badge variant="neutral">{job.employmentType.replace('_', ' ')}</Badge>
            <Badge variant="outline">{job.experienceLevel} LEVEL</Badge>
            {job.minSalary && job.maxSalary && (
              <Badge variant="success">
                ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} {job.currency}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <JobApplyModal
            jobSlug={job.slug}
            jobTitle={job.title}
            companyName={company?.name}
          />
        </div>
      </div>

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Skills */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">About the Position</h2>
            <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-line leading-relaxed text-sm sm:text-base">
              {job.description}
            </div>
          </section>

          {job.skills && job.skills.length > 0 && (
            <section className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground">Required & Preferred Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      skill.isRequired
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {skill.name} {skill.isRequired && '★'}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-base">Ready to make an impact?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Join our talent network and let AI match your verified experience.
              </p>
            </div>
            <Link href="/register">
              <Button variant="primary">Create Candidate Profile ↗</Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Company & Metadata Card */}
        <div className="space-y-6">
          {company && (
            <Card variant="outline" className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {company.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">{company.name}</h3>
                  <p className="text-xs text-muted-foreground">{company.industry || 'Technology'}</p>
                </div>
              </div>

              {company.description && (
                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                  {company.description}
                </p>
              )}

              <div className="pt-2 border-t border-border space-y-2 text-xs">
                {company.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{company.location}</span>
                  </div>
                )}
                {company.size && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company Size</span>
                    <span className="font-medium text-foreground">{company.size} employees</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website</span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Visit site ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link href={`/companies/${company.slug}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full">
                    View Company Profile
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          <Card variant="outline" className="p-6 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Role Summary</h3>
            <div className="space-y-2 text-xs divide-y divide-border/60">
              <div className="flex justify-between pt-1.5 first:pt-0">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium text-foreground">{job.department || 'General'}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-muted-foreground">Workplace</span>
                <span className="font-medium text-foreground">{job.remoteType}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{job.employmentType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium text-foreground">{job.experienceLevel}</span>
              </div>
              {job.publishedAt && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-muted-foreground">Posted Date</span>
                  <span className="font-medium text-foreground">
                    {new Date(job.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
