'use client';

import React, { useState } from 'react';
import { Button, Badge } from '@executive-match/ui';
import type { WorkspaceAnalyticsData } from '@/lib/api';
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Filter,
  Star,
  Award,
  Building2,
} from 'lucide-react';

interface WorkspaceAnalyticsProps {
  workspaceSlug: string;
  initialAnalytics: WorkspaceAnalyticsData | null;
}

export function WorkspaceAnalytics({ workspaceSlug, initialAnalytics }: WorkspaceAnalyticsProps) {
  const [data, setData] = useState<WorkspaceAnalyticsData | null>(initialAnalytics);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFilterChange = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoading(true);
    try {
      const q = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
      const res = await fetch(`/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/analytics${q}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Keep previous data on network failure
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="card-3d p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-primary">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-foreground text-lg">Analytics Telemetry Unavailable</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Unable to aggregate pipeline telemetry and conversion metrics for this workspace at this time.
        </p>
      </div>
    );
  }

  const { summary, funnel, offers, interviews, jobBreakdown } = data;

  const funnelStages = [
    {
      name: 'Applied',
      count: funnel.applied,
      conversionRate: funnel.conversionRates.appliedToScreening,
      nextStage: 'Screening',
      color: 'bg-blue-500',
    },
    {
      name: 'Screening',
      count: funnel.screening,
      conversionRate: funnel.conversionRates.screeningToInterview,
      nextStage: 'Interview',
      color: 'bg-indigo-500',
    },
    {
      name: 'Interview',
      count: funnel.interview,
      conversionRate: funnel.conversionRates.interviewToOffer,
      nextStage: 'Offer',
      color: 'bg-violet-500',
    },
    {
      name: 'Offer',
      count: funnel.offer,
      conversionRate: funnel.conversionRates.offerToHire,
      nextStage: 'Hired',
      color: 'bg-amber-500',
    },
    {
      name: 'Hired',
      count: funnel.hired,
      conversionRate: funnel.conversionRates.overallConversion,
      nextStage: null,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Pipeline Metrics Filter
          </h2>
          <p className="text-xs text-muted-foreground">
            Segment pipeline conversion velocity and stage drop-offs by target requisition.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={selectedJobId}
            onChange={(e) => handleFilterChange(e.target.value)}
            disabled={loading}
            className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium shadow-sm"
          >
            <option value="">All Requisitions ({jobBreakdown.length})</option>
            {jobBreakdown.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.totalApplicants} applicants)
              </option>
            ))}
          </select>
          {selectedJobId && (
            <Button
              variant="outline"
              className="btn-3d-secondary text-xs h-9 px-3"
              onClick={() => handleFilterChange('')}
              disabled={loading}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-3d p-6 space-y-2 group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Total Applicants
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">{summary.totalApplicants}</div>
          <p className="text-xs text-muted-foreground">Received candidate dossiers</p>
        </div>

        <div className="card-3d p-6 space-y-2 group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Active in Pipeline
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {summary.activePipelineCount}
          </div>
          <p className="text-xs text-muted-foreground">Under active evaluation / interview</p>
        </div>

        <div className="card-3d p-6 space-y-2 group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Avg Time to Hire
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary.averageTimeToHireDays !== null ? `${summary.averageTimeToHireDays}d` : '—'}
          </div>
          <p className="text-xs text-muted-foreground">From submission to offer signing</p>
        </div>

        <div className="card-3d p-6 space-y-2 group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Offer Acceptance
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {summary.offerAcceptanceRate !== null ? `${summary.offerAcceptanceRate}%` : '—'}
          </div>
          <p className="text-xs text-muted-foreground">
            {offers.accepted} accepted / {offers.totalOffers} total offers
          </p>
        </div>
      </div>

      {/* Interactive Candidate Pipeline Funnel */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Hiring Funnel & Conversion Velocity
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage-by-stage progression tracking drop-off rates across recruitment checkpoints.
          </p>
        </div>

        <div className="card-3d p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {funnelStages.map((stage, idx) => (
              <div key={stage.name} className="flex flex-col space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Stage {idx + 1}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">{stage.name}</div>
                  <div className="text-2xl font-black text-foreground mt-1">{stage.count}</div>
                  <span className="text-xs text-muted-foreground">candidates</span>
                </div>

                {stage.nextStage && (
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px]">Conversion:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {stage.conversionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${stage.color} rounded-full`}
                        style={{ width: `${Math.min(100, stage.conversionRate)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Overall end-to-end applicant-to-hire conversion rate:{' '}
                <strong className="text-foreground">{funnel.conversionRates.overallConversion}%</strong>
              </span>
            </span>
            <span>
              Rejected: <strong className="text-foreground">{summary.rejectedCount}</strong> · Withdrawn:{' '}
              <strong className="text-foreground">{summary.withdrawnCount}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Offer & Interview Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offer Outcomes */}
        <div className="card-3d p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Offer Outcomes & Closing Ratio
            </h3>
            <Badge variant="success" className="text-xs">
              {offers.acceptanceRate !== null ? `${offers.acceptanceRate}% Win Rate` : 'No Offers Responded'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Accepted</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {offers.accepted}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Pending</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {offers.pending}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <span className="text-xs text-red-700 dark:text-red-300 font-semibold">Declined</span>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                {offers.declined}
              </div>
            </div>
          </div>
        </div>

        {/* Interviews & Scorecards */}
        <div className="card-3d p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary fill-primary" />
              Interview Scorecard Calibration
            </h3>
            <Badge variant="neutral" className="text-xs">
              {interviews.completedInterviews} / {interviews.totalInterviews} Completed
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-xs text-muted-foreground font-semibold">Avg Evaluator Rating</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-foreground">
                {interviews.averageRating !== null ? `${interviews.averageRating} / 5.0` : '—'}
              </span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-muted-foreground font-semibold">Evaluator Recommendations</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between">
                <span>Strong Hire:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{interviews.recommendations.STRONG_HIRE}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between">
                <span>Hire:</span>
                <strong className="text-foreground">{interviews.recommendations.HIRE}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between">
                <span>No Hire:</span>
                <strong className="text-amber-600 dark:text-amber-400">{interviews.recommendations.NO_HIRE}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between">
                <span>Strong No Hire:</span>
                <strong className="text-red-600 dark:text-red-400">{interviews.recommendations.STRONG_NO_HIRE}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requisition Breakdown Table */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Requisition Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Volume and hiring success broken down by each open or closed position.
          </p>
        </div>

        <div className="card-3d overflow-hidden">
          {jobBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Requisition Title</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Applicants</th>
                    <th className="p-4 text-center">Active Pipeline</th>
                    <th className="p-4 text-center">Hires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobBreakdown.map((j) => (
                    <tr key={j.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{j.title}</td>
                      <td className="p-4 text-muted-foreground">{j.department || '—'}</td>
                      <td className="p-4">
                        <Badge variant={j.status === 'PUBLISHED' ? 'success' : 'neutral'} className="text-xs">
                          {j.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold text-foreground">
                        {j.totalApplicants}
                      </td>
                      <td className="p-4 text-center font-bold text-blue-600 dark:text-blue-400">
                        {j.activeApplicants}
                      </td>
                      <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {j.hiresCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No job requisitions created in this workspace yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
