import { EmptyState, PageHeader } from '@executive-match/ui';
export default function JobsPage() {
  return (
    <main className="container simple-page">
      <PageHeader
        eyebrow="DISCOVER"
        title="Explore opportunities"
        description="Published roles will appear here as hiring teams join."
      />
      <EmptyState
        title="The first roles are on their way"
        description="Create a profile to be ready when job discovery opens."
      />
    </main>
  );
}
