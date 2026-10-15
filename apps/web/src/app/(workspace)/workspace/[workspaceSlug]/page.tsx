import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  Award,
  Kanban,
  Sparkles,
  BarChart3,
  Calendar,
  Key,
  ShieldCheck,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { getWorkspace, getWorkspaceJobs, getWorkspaceAnalytics } from '@/lib/api';
import { StatCard, Button, Badge } from '@executive-match/ui';

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const base = `/workspace/${workspaceSlug}`;

  const [workspace, jobs, analytics] = await Promise.all([
    getWorkspace(workspaceSlug),
    getWorkspaceJobs(workspaceSlug),
    getWorkspaceAnalytics(workspaceSlug),
  ]);

  const activeJobsCount = jobs.filter((j) => j.status === 'PUBLISHED').length;
  const totalApplicants = analytics?.summary.totalApplicants ?? 0;
  const activePipelineCount = analytics?.summary.activePipelineCount ?? 0;
  const totalOffers = analytics?.offers.totalOffers ?? 0;
  const acceptedOffers = analytics?.offers.accepted ?? 0;

  return (
    <main className="shell-page space-y-8 max-w-7xl pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60 font-mono">
              EMPLOYER WORKSPACE
            </span>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              ROLE: {workspace?.role || 'MEMBER'}
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-tight">
            {workspace?.name || 'Workspace Overview'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Coordinate hiring workflows, evaluate candidate evidence, and manage team requisitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`${base}/jobs`}>
            <Button variant="secondary" size="md" className="flex items-center gap-1.5 font-semibold">
              <Briefcase className="w-4 h-4 text-gray-600" />
              <span>All Roles</span>
            </Button>
          </Link>
          <Link href={`${base}/jobs`}>
            <Button variant="primary" size="md" className="flex items-center gap-1.5 font-bold shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3D Elevated Live Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-3d rounded-xl">
          <StatCard
            title="Active Requisitions"
            value={String(activeJobsCount || jobs.length)}
            description={`${jobs.length} total roles recorded`}
          />
        </div>
        <div className="card-3d rounded-xl">
          <StatCard
            title="Total Applicants"
            value={String(totalApplicants)}
            description="Across all published requisitions"
          />
        </div>
        <div className="card-3d rounded-xl">
          <StatCard
            title="Active in Pipeline"
            value={String(activePipelineCount)}
            description="Awaiting review or in interviews"
          />
        </div>
        <div className="card-3d rounded-xl">
          <StatCard
            title="Offers Generated"
            value={String(totalOffers)}
            description={`${acceptedOffers} accepted offers`}
          />
        </div>
      </div>

      {/* High-Impact 3D Action Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            Recruitment Command Center
          </h2>
          <span className="text-xs text-gray-500 font-mono">Isolated Workspace Boundary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: ATS Kanban Pipeline */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Kanban className="w-5 h-5" />
                </div>
                <Badge variant="accent" size="sm">Pipeline</Badge>
              </div>
              <h3 className="font-display font-bold text-base text-gray-900 mb-1.5 group-hover:text-emerald-950 transition-colors">
                Candidate Pipeline
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Move applicants across customized stages with internal collaboration notes and feedback scorecards.
              </p>
            </div>
            <Link href={`${base}/pipeline`} className="pt-2">
              <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-1.5 font-bold shadow-xs">
                <span>Open Kanban Board</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Card 2: AI Matching & Semantic Search */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">AI Semantic</Badge>
              </div>
              <h3 className="font-display font-bold text-base text-gray-900 mb-1.5 group-hover:text-emerald-950 transition-colors">
                Candidate Discovery
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Discover qualified talent using 1536-dimensional hybrid embeddings and transparent evidence scoring.
              </p>
            </div>
            <Link href={`${base}/candidates`} className="pt-2">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5 font-semibold">
                <span>Discover Candidates</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Card 3: Interviews & Scorecards */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <Badge variant="outline" size="sm">Coordination</Badge>
              </div>
              <h3 className="font-display font-bold text-base text-gray-900 mb-1.5 group-hover:text-emerald-950 transition-colors">
                Interviews & Scorecards
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Schedule technical rounds, assign interviewer rubrics, and collect standardized ratings.
              </p>
            </div>
            <Link href={`${base}/interviews`} className="pt-2">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5 font-semibold">
                <span>View Interviews</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Card 4: Analytics & Funnel */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <Badge variant="neutral" size="sm">Insights</Badge>
              </div>
              <h3 className="font-display font-bold text-base text-gray-900 mb-1.5 group-hover:text-emerald-950 transition-colors">
                Recruitment Analytics
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Track stage conversion rates, average time-to-hire, interviewer calibration, and offer metrics.
              </p>
            </div>
            <Link href={`${base}/analytics`} className="pt-2">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5 font-semibold">
                <span>Explore Metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Card 5: Offers & E-Signatures */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <Badge variant="neutral" size="sm">Closing</Badge>
              </div>
              <h3 className="font-display font-bold text-base text-gray-900 mb-1.5 group-hover:text-emerald-950 transition-colors">
                Offers & Digital Signatures
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Generate compensation letters, route approvals, and collect verifiable digital signatures.
              </p>
            </div>
            <Link href={`${base}/offers`} className="pt-2">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5 font-semibold">
                <span>Manage Offers</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Card 6: Integrations, Webhooks & ATS */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Key className="w-5 h-5" />
                </div>
                <Badge variant="outline" size="sm">Enterprise</Badge>
              </div>
              <h3 className="font-display font-bold text-base text-gray-900 mb-1.5 group-hover:text-emerald-950 transition-colors">
                Integrations & Webhooks
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Connect external ATS systems (Greenhouse, Lever, Workday) and manage live webhook event feeds.
              </p>
            </div>
            <Link href={`${base}/integrations`} className="pt-2">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5 font-semibold">
                <span>Configure Integrations</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Security & Tenant Isolation Notice */}
      <div className="p-4 px-6 rounded-xl bg-gray-50/80 border border-gray-200/70 flex items-center justify-between gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>All data strictly isolated to workspace &apos;{workspace?.name}&apos; ({workspaceSlug})</span>
        </div>
        <Link href={`${base}/team`} className="font-semibold text-emerald-800 hover:text-emerald-950">
          Manage Team Permissions →
        </Link>
      </div>
    </main>
  );
}
