import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { getPublicJobs } from '@/lib/api';
import {
  Button,
  FilterBar,
  JobCard,
  PageHeader,
  SearchInput,
} from '@executive-match/ui';

export default async function JobsPage() {
  const { items: liveJobs, total } = await getPublicJobs();

  const sampleRoles = [
    {
      id: '1',
      slug: 'principal-systems-architect',
      title: 'Principal Systems Architect',
      companyName: 'Vertex Infrastructure',
      location: 'Remote · US',
      type: 'Remote' as const,
      salary: '$190,000 - $230,000',
      postedAt: 'Yesterday',
      skills: ['Distributed Systems', 'PostgreSQL', 'Go', 'Kubernetes'],
    },
    {
      id: '2',
      slug: 'staff-full-stack-engineer',
      title: 'Staff Full Stack Engineer',
      companyName: 'Helios Data Platforms',
      location: 'New York, NY (Hybrid)',
      type: 'Hybrid' as const,
      salary: '$170,000 - $205,000',
      postedAt: '3 days ago',
      skills: ['TypeScript', 'Next.js 16', 'NestJS', 'Redis'],
    },
    {
      id: '3',
      slug: 'head-of-engineering-operations',
      title: 'Head of Engineering Operations',
      companyName: 'AeroScale Technologies',
      location: 'San Francisco, CA',
      type: 'On-site' as const,
      salary: '$220,000 - $260,000',
      postedAt: '5 days ago',
      skills: ['Technical Leadership', 'SOC 2', 'DevOps', 'Scaling'],
    },
  ];

  const hasLiveJobs = liveJobs.length > 0;

  return (
    <main className="container simple-page pb-16">
      <PageHeader
        eyebrow="DISCOVERY PORTAL"
        title="Explore opportunities"
        description="Transparent requisitions with verified salary ranges, explicit tech stacks, and explainable evidence alignment."
        actions={
          <Link href="/register">
            <Button variant="primary" className="flex items-center gap-1.5 font-bold shadow-md">
              <Sparkles className="w-4 h-4" />
              <span>Create Candidate Profile</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

      <FilterBar
        searchSlot={<SearchInput placeholder="Search roles, tech stack, or companies…" />}
        actionSlot={
          <span className="text-caption font-mono font-medium text-emerald-800">
            Showing {hasLiveJobs ? total : sampleRoles.length} curated opportunities
          </span>
        }
      />

      <div className="grid gap-5 mt-6">
        {hasLiveJobs ? (
          liveJobs.map((job) => (
            <div key={job.id} className="card-3d rounded-xl">
              <JobCard
                title={job.title}
                companyName={job.company?.name || 'Confidential'}
                location={job.location || 'Remote'}
                type={
                  job.remoteType === 'ONSITE'
                    ? 'On-site'
                    : job.remoteType === 'HYBRID'
                    ? 'Hybrid'
                    : 'Remote'
                }
                salary={
                  job.minSalary && job.maxSalary
                    ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`
                    : undefined
                }
                postedAt={job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'Recent'}
                skills={job.skills.map((s) => s.name)}
                actionSlot={
                  <Link href={`/jobs/${job.slug}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1 font-semibold">
                      <span>View Requisition</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                }
              />
            </div>
          ))
        ) : (
          sampleRoles.map((role) => (
            <div key={role.id} className="card-3d rounded-xl">
              <JobCard
                title={role.title}
                companyName={role.companyName}
                location={role.location}
                type={role.type}
                salary={role.salary}
                postedAt={role.postedAt}
                skills={role.skills}
                actionSlot={
                  <Link href="/register">
                    <Button variant="secondary" size="sm" className="flex items-center gap-1 font-semibold">
                      <span>View Alignment</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                }
              />
            </div>
          ))
        )}
      </div>
    </main>
  );
}
