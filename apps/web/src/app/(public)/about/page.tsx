import Link from 'next/link';
import {
  BrainCircuit,
  ShieldCheck,
  Award,
  Code2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button, PageHeader } from '@executive-match/ui';

export default function AboutPage() {
  const principles = [
    {
      index: '01',
      icon: <BrainCircuit className="w-5 h-5 text-emerald-600" />,
      title: 'Evidence over Algorithmic Hype',
      description:
        'We reject black-box scores that rank candidates without explanations. AI should extract and present structured evidence; people retain full ownership of every hiring decision.',
    },
    {
      index: '02',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Tenant Isolation by Design',
      description:
        'Every employer workspace is isolated at the database layer. Candidate notes, pipeline stages, and requisition details are never mixed across company boundaries.',
    },
    {
      index: '03',
      icon: <Award className="w-5 h-5 text-emerald-600" />,
      title: 'Respect for Candidate Craft',
      description:
        'Resumes are often over-condensed reflections of years of craft. We structure experience, architecture scale, and growth direction so senior talent is evaluated accurately.',
    },
    {
      index: '04',
      icon: <Code2 className="w-5 h-5 text-emerald-600" />,
      title: 'Solo Developer Clarity',
      description:
        'Built with a disciplined modular monolith: TypeScript, Next.js, NestJS, PostgreSQL, and Prisma. Clean abstractions, strong types, and low operational overhead.',
    },
  ];

  return (
    <main className="container simple-page pb-16">
      <PageHeader
        eyebrow="OUR PHILOSOPHY"
        title="Better signals. Defensible decisions."
        description="Executive Match is built on the belief that senior hiring should be an evidence-based conversation rather than a keyword lottery."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        {principles.map((p) => (
          <div
            key={p.index}
            className="card-3d rounded-2xl p-7 bg-white/95 border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {p.icon}
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/50">
                {p.index}
              </span>
            </div>

            <h3 className="font-display font-bold text-lg text-gray-900 mb-2.5 tracking-tight group-hover:text-emerald-950 transition-colors">
              {p.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              {p.description}
            </p>
          </div>
        ))}
      </div>

      {/* Callout Banner with 3D styling */}
      <div className="mt-14 p-8 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Join the Network
          </div>
          <h3 className="font-display font-bold text-2xl text-white mb-1.5">
            Ready to experience considered hiring?
          </h3>
          <p className="text-emerald-100/80 text-sm max-w-xl">
            Join executive candidates and high-growth hiring teams making decisions backed by verified evidence.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link href="/register">
            <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold shadow-lg flex items-center gap-2">
              <span>Get Started Today</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
