import Link from 'next/link';
import {
  Button,
  FilterBar,
  JobCard,
  PageHeader,
  SearchInput,
} from '@executive-match/ui';

export default function JobsPage() {
  const sampleRoles = [
    {
      id: '1',
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
      title: 'Head of Engineering Operations',
      companyName: 'AeroScale Technologies',
      location: 'San Francisco, CA',
      type: 'On-site' as const,
      salary: '$220,000 - $260,000',
      postedAt: '5 days ago',
      skills: ['Technical Leadership', 'SOC 2', 'DevOps', 'Scaling'],
    },
  ];

  return (
    <main className="container simple-page">
      <PageHeader
        eyebrow="DISCOVERY PORTAL"
        title="Explore opportunities"
        description="Transparent requisitions with verified salary ranges, explicit tech stacks, and evidence alignment."
        actions={
          <Link href="/register">
            <Button variant="primary">Create Candidate Profile ↗</Button>
          </Link>
        }
      />

      <FilterBar
        searchSlot={<SearchInput placeholder="Search roles, tech stack, or companies…" />}
        actionSlot={
          <span className="text-caption">Showing {sampleRoles.length} curated opportunities</span>
        }
      />

      <div style={{ display: 'grid', gap: '20px', marginTop: '24px' }}>
        {sampleRoles.map((role) => (
          <JobCard
            key={role.id}
            title={role.title}
            companyName={role.companyName}
            location={role.location}
            type={role.type}
            salary={role.salary}
            postedAt={role.postedAt}
            skills={role.skills}
            actionSlot={
              <Link href="/register">
                <Button variant="secondary" size="sm">
                  View Alignment ↗
                </Button>
              </Link>
            }
          />
        ))}
      </div>
    </main>
  );
}
