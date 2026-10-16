import Link from 'next/link';
import {
  Sparkles,
  ArrowUpRight,
  BrainCircuit,
  Layers,
  Lock,
  FileText,
  Search,
  Users,
  UserCheck,
  Compass,
  Activity,
  FileCode2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  Button,
  CandidateCard,
  JobCard,
  MatchScore,
  PipelineStage,
  SkillBadge,
  StatCard,
} from '@executive-match/ui';
import { InteractiveHero3D } from '@/components/interactive-hero-3d';
import { MeshBackground3D } from '@/components/mesh-background-3d';
import { TalentRadar3D } from '@/components/talent-radar-3d';

export default function HomePage() {
  return (
    <main className="pb-16 relative overflow-hidden">
      {/* Ambient 3D Animated Mesh Background with Floating Luminous Orbs */}
      <MeshBackground3D />

      {/* 1. Hero Section with Interactive 3D Evidence Match Showcase */}
      <section className="hero container pt-12 pb-16">
        <div className="hero-copy">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 text-xs font-bold tracking-tight mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Evidence-Driven Senior Recruitment</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.08] mb-6">
            Find the right fit.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900">
              See why it fits.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mb-8">
            Executive Match brings candidates and hiring teams into an editorial, transparent hiring
            workflow. Every match is backed by explainable evidence—never opaque algorithmic scores.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link href="/register">
              <Button size="lg" className="flex items-center gap-2 font-bold shadow-md shadow-emerald-900/10">
                <span>Create Candidate Profile</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="flex items-center gap-2 font-semibold">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>For Hiring Teams</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI advises on requirements · People retain full hiring decisions.</span>
          </div>
        </div>

        {/* 3D Interactive Evidence Match Demonstration */}
        <div className="hero-visual-wrapper mt-8 lg:mt-0">
          <InteractiveHero3D />
        </div>
      </section>

      {/* 2. Product Narrative & Problem Statement */}
      <section className="statement py-16 bg-white/70 border-y border-gray-200/70" id="product">
        <div className="container statement-grid">
          <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-widest">
            01 / THE PROBLEM WITH HIRING
          </span>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4 leading-snug">
              Resumes are compressed. Job posts are vague. Senior hiring deserves context.
            </h2>
            <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
              Traditional recruiting tools rely on shallow keyword filters that miss exceptional candidates
              or generate unverified AI match scores that hiring managers cannot trust. Executive Match
              structures requirements and candidate experience into verifiable signals, giving both sides
              the evidence they need to move forward with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 2.5. 3D Talent Intelligence & Multi-Axis Competency Radar */}
      <section className="talent-radar-section container py-16" id="radar">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-widest">
              02 / MULTI-AXIS TALENT INTELLIGENCE
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              Multi-dimensional competency evaluation in real-time 3D.
            </h2>
            <p className="text-gray-600 text-sm mt-2 max-w-2xl">
              Compare executive candidate verified signals against requisition benchmark requirements across 6 critical dimensions with explainable evidence.
            </p>
          </div>
          <Badge variant="accent" className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive 3D Radar</span>
          </Badge>
        </div>

        <TalentRadar3D
          candidateName="Alex Vance"
          roleTitle="VP of Engineering"
        />
      </section>

      {/* 3. Product UI Preview Mockup */}
      <section className="preview-section container py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-widest">
              03 / INTERFACE PREVIEW
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              Designed for speed, clarity, and deep evaluation.
            </h2>
          </div>
          <Badge variant="accent" className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive ATS Pipeline</span>
          </Badge>
        </div>

        <div className="dashboard-preview-card card-3d rounded-2xl bg-white border border-gray-200/90 shadow-xl overflow-hidden">
          <div className="preview-topbar bg-gray-50/80 px-6 py-3.5 border-b border-gray-200/70 flex flex-wrap items-center justify-between gap-3">
            <div className="preview-tabs flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-800 text-white text-xs font-bold shadow-xs">
                Role Overview
              </span>
              <span className="px-3 py-1 rounded-lg text-gray-600 hover:text-gray-900 text-xs font-semibold">
                Shortlisted (8)
              </span>
              <span className="px-3 py-1 rounded-lg text-gray-600 hover:text-gray-900 text-xs font-semibold">
                Interviews (3)
              </span>
            </div>
            <div className="preview-status">
              <PipelineStage stage="Technical Review" order={3} active />
            </div>
          </div>

          <div className="preview-grid p-6 lg:p-8">
            <div className="preview-left">
              <CandidateCard
                name="Elena Vance"
                headline="Staff Systems Architect · Cloud Platform & Distributed Systems"
                location="San Francisco, CA (Remote)"
                matchScore={94}
                yearsExperience={11}
                skills={['TypeScript', 'PostgreSQL', 'NestJS', 'Distributed Systems', 'Kubernetes']}
              />
              <div className="preview-match-detail mt-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                  Matching Evidence Breakdown
                </span>
                <MatchScore
                  score={94}
                  showBreakdown
                  breakdown={{
                    skills: 96,
                    experience: 92,
                    growth: 90,
                  }}
                />
              </div>
            </div>

            <div className="preview-right">
              <JobCard
                title="Lead Platform Engineer"
                companyName="Horizon Executive Workspace"
                location="Remote · US / EU"
                salary="$185,000 - $225,000"
                type="Remote"
                postedAt="2 days ago"
                matchScore={94}
                skills={['Next.js 16', 'NestJS', 'PostgreSQL', 'Redis']}
              />

              <div className="preview-stats-row grid grid-cols-2 gap-4 mt-4">
                <StatCard
                  title="Qualified Inflow"
                  value="42"
                  change={{ value: '+18% vs avg', trend: 'up' }}
                />
                <StatCard
                  title="Time to First Review"
                  value="1.4d"
                  change={{ value: '-35%', trend: 'up' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Two-Sided Workflows (Candidates & Employers) */}
      <section className="workflow-section py-16 bg-gray-50/60 border-y border-gray-200/70" id="candidates">
        <div className="container">
          <div className="mb-12">
            <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-widest">
              04 / HOW IT WORKS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              Structured workflows for candidates and hiring teams.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Candidate Workflow */}
            <div className="card-3d rounded-2xl p-8 bg-white border border-gray-200/80 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    FOR CANDIDATES
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                  Own your executive career narrative.
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Build a profile that captures your real architecture and leadership strengths, not just keyword density.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Structured Profile & Resume</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Import your resume or construct your profile with validated skills, roles, and career goals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <Compass className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Contextual Job Discovery</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Browse verified roles with upfront salary ranges, tech stack details, and team context.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Transparent Match Explanations</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Inspect why a role aligns with your background, including skill overlap and domain gaps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <Activity className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Real-Time Application Tracking</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Never wonder where you stand. Track your status as applications progress through hiring stages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <Link href="/register">
                  <Button variant="primary" className="w-full flex items-center justify-center gap-2 font-bold shadow-sm">
                    <span>Get Started as Candidate</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Employer ATS Workflow */}
            <div className="card-3d rounded-2xl p-8 bg-white border border-gray-200/80 shadow-md flex flex-col justify-between" id="employers">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    FOR HIRING TEAMS
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                  Make defensible hiring decisions.
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  A unified workspace where recruiters and engineering leads evaluate senior talent with verifiable evidence.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <FileCode2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Define Objective Role Signals</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Draft job requisitions with required competencies, deal-breakers, and growth trajectories.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Evidence-Driven Shortlisting</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Review incoming applicants with structured evidence cards highlighting proven qualifications.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <Layers className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Collaborative ATS Pipeline</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Move candidates seamlessly through customizable stages with internal notes and team ratings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Secure Tenant Isolation</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Every workspace is strictly isolated at the database layer with granular team permissions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <Link href="/pricing">
                  <Button variant="secondary" className="w-full flex items-center justify-center gap-2 font-bold shadow-sm">
                    <span>Explore Team Workspace</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Modern 3D Feature Grid */}
      <section className="platform-section container py-16" id="features">
        <div className="mb-12">
          <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-widest">
            05 / PLATFORM CAPABILITIES
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Engineered for precision. Built for modern hiring teams.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-3d rounded-2xl p-7 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md">
                  01
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                Explainable AI Matching
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Advisory matching that highlights specific alignment evidence across skills, experience,
                and architectural scale.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <SkillBadge skill="Evidence Score" verified />
              <SkillBadge skill="Gap Analysis" />
            </div>
          </div>

          <div className="card-3d rounded-2xl p-7 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md">
                  02
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                Modern ATS Kanban
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Multi-stage recruiter pipeline from application to final offer with immutable audit trails and team scorecards.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <PipelineStage stage="Review" order={1} />
              <PipelineStage stage="Interview" order={2} active />
            </div>
          </div>

          <div className="card-3d rounded-2xl p-7 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md">
                  03
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                Tenant-Isolated Workspaces
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Strict database-level boundaries ensure workspace members, requisitions, and candidate feedback are never mixed.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <Badge variant="neutral">Owner</Badge>
              <Badge variant="neutral">Admin</Badge>
              <Badge variant="neutral">Recruiter</Badge>
            </div>
          </div>

          <div className="card-3d rounded-2xl p-7 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md">
                  04
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                Resume Intelligence
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Standardized extraction of experience, certifications, and technical proficiencies with privacy safeguards.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <Badge variant="accent">Private By Default</Badge>
            </div>
          </div>

          <div className="card-3d rounded-2xl p-7 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-105 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md">
                  05
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                Structured Candidate Search
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Filter talent pools by validated capabilities, location preference, and availability without keyword pollution.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <Badge variant="success">Zero Noise</Badge>
            </div>
          </div>

          <div className="card-3d rounded-2xl p-7 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md">
                  06
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                Collaborative Team Dossiers
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Collect hiring team feedback and evaluation rubrics in one consolidated candidate dossier.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <Badge variant="outline">Unified Dossier</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dual Conversion CTA Section */}
      <section className="cta-dual-section container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-3d rounded-2xl p-8 lg:p-10 bg-emerald-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 mb-8">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300 block mb-2">
                FOR CANDIDATES
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                Make room for a better match.
              </h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-md">
                Create your profile in minutes and discover senior opportunities where your real strengths are recognized.
              </p>
            </div>
            <div className="relative z-10">
              <Link href="/register">
                <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold shadow-md flex items-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="card-3d rounded-2xl p-8 lg:p-10 bg-white border border-gray-200/90 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 mb-8">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 block mb-2">
                FOR HIRING TEAMS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                Hire with evidence, not guesswork.
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Empower your recruiting team with structured applicant tracking and transparent matching context.
              </p>
            </div>
            <div className="relative z-10">
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="font-bold flex items-center gap-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50">
                  <span>Request Workspace Access</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
