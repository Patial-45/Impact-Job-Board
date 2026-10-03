import Link from 'next/link';
import { Button, Card, PageHeader } from '@executive-match/ui';

export default function AboutPage() {
  const principles = [
    {
      index: '01',
      title: 'Evidence over Algorithmic Hype',
      description:
        'We reject black-box scores that rank candidates without explanations. AI should extract and present structured evidence; people retain full ownership of every hiring decision.',
    },
    {
      index: '02',
      title: 'Tenant Isolation by Design',
      description:
        'Every employer workspace is isolated at the database layer. Candidate notes, pipeline stages, and requisition details are never mixed across company boundaries.',
    },
    {
      index: '03',
      title: 'Respect for Candidate Craft',
      description:
        'Resumes are often over-condensed reflections of years of craft. We structure experience, architecture scale, and growth direction so senior talent is evaluated accurately.',
    },
    {
      index: '04',
      title: 'Solo Developer Clarity',
      description:
        'Built with a disciplined modular monolith: TypeScript, Next.js, NestJS, PostgreSQL, and Prisma. Clean abstractions, strong types, and low operational overhead.',
    },
  ];

  return (
    <main className="container simple-page">
      <PageHeader
        eyebrow="OUR PHILOSOPHY"
        title="Better signals. Better decisions."
        description="Executive Match is built on the belief that hiring should be an evidence-based conversation rather than a keyword lottery."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '40px' }}>
        {principles.map((p) => (
          <Card key={p.index} className="ui-card">
            <span className="text-mono" style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '13px' }}>
              {p.index}
            </span>
            <h3 style={{ font: '700 20px / 1.3 var(--font-display)', margin: '14px 0 8px', letterSpacing: '-0.03em' }}>
              {p.title}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.65', margin: 0 }}>
              {p.description}
            </p>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: '60px', padding: '40px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h3 style={{ font: '700 22px var(--font-display)', margin: '0 0 6px' }}>Ready to experience considered hiring?</h3>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>Join candidates and hiring teams building with verified evidence.</p>
        </div>
        <Link href="/register">
          <Button size="lg">Get Started Today ↗</Button>
        </Link>
      </div>
    </main>
  );
}
