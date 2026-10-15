import { PageHeader } from '@executive-match/ui';
import { PricingTable } from '@/components/pricing-table';

export default function PricingPage() {
  return (
    <main className="container simple-page pb-16">
      <PageHeader
        eyebrow="WORKSPACE ACCESS"
        title="Predictable pricing for thoughtful hiring"
        description="Choose a workspace plan built for your team size. Transparent terms, zero placement commissions, and complete tenant isolation."
      />

      <PricingTable />
    </main>
  );
}
