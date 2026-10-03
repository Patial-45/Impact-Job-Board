import Link from 'next/link';
import { Badge, Button, Card, PageHeader } from '@executive-match/ui';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Starter Workspace',
      badge: 'Early Access',
      description: 'For boutique agencies and early-stage companies making critical senior hires.',
      price: '$0',
      period: 'during Phase 1 preview',
      features: [
        '1 Company Workspace',
        'Up to 3 Active Job Requisitions',
        'Structured Candidate Evidence Cards',
        'Standard ATS Pipeline Stages',
        'Database Tenant Isolation',
      ],
      cta: 'Start with Preview',
      href: '/register',
      variant: 'outline' as const,
    },
    {
      name: 'Growth Team',
      badge: 'Recommended',
      description: 'For scaling engineering organizations hiring across multiple technical teams.',
      price: '$249',
      period: 'per workspace / month (planned)',
      features: [
        'Unlimited Active Requisitions',
        'Granular RBAC (Owner, Admin, Recruiter, Viewer)',
        'Explainable AI Matching Evidence Breakdown',
        'Collaborative Candidate Notes & Review Rubrics',
        'Resume Intelligence & Skill Normalization',
        'Priority ATS Inflow Processing',
      ],
      cta: 'Request Workspace Access',
      href: '/register',
      variant: 'primary' as const,
    },
    {
      name: 'Enterprise Platform',
      badge: 'Custom',
      description: 'For multi-entity organizations requiring dedicated telemetry and custom governance.',
      price: 'Custom',
      period: 'annual agreement',
      features: [
        'Multi-Workspace Management',
        'Custom Pipeline Stages & Approval Workflows',
        'Dedicated Provider Port Routing',
        'Audit Log Exports & SOC 2 Compliance Data',
        'Dedicated Technical Onboarding Support',
      ],
      cta: 'Contact Platform Team',
      href: '/about',
      variant: 'outline' as const,
    },
  ];

  return (
    <main className="container simple-page">
      <PageHeader
        eyebrow="WORKSPACE ACCESS"
        title="Predictable pricing for thoughtful hiring"
        description="Choose a workspace plan built for your team size. Transparent terms, no candidate placement percentage fees."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '36px' }}>
        {tiers.map((tier) => (
          <Card key={tier.name} className="ui-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="text-label">{tier.name}</span>
                <Badge variant={tier.variant === 'primary' ? 'accent' : 'neutral'} size="sm">
                  {tier.badge}
                </Badge>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ font: '800 36px var(--font-display)', letterSpacing: '-0.05em' }}>
                  {tier.price}
                </div>
                <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{tier.period}</small>
              </div>

              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
                {tier.description}
              </p>

              <div style={{ borderTop: '1px solid var(--line-subtle)', paddingTop: '20px', marginBottom: '28px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '12px' }}>
                  Included Capabilities
                </span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px', color: 'var(--ink)' }}>
                  {tier.features.map((feat) => (
                    <li key={feat} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: '800' }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href={tier.href}>
              <Button variant={tier.variant} style={{ width: '100%' }}>
                {tier.cta} ↗
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
