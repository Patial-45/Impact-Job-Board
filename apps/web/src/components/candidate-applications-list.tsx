'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@executive-match/ui';
import type { ApplicationData } from '@/lib/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  AlertCircle,
  Briefcase,
  Sparkles,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STAGES_ORDER = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

export function CandidateApplicationsList({
  initialApplications,
}: {
  initialApplications: ApplicationData[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: string) => {
    setSubmittingWithdraw(true);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${apiUrl}/candidates/me/applications/${encodeURIComponent(applicationId)}/withdraw`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason: withdrawReason.trim() || undefined }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.message || 'Failed to withdraw application');
        setSubmittingWithdraw(false);
        return;
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: 'WITHDRAWN', withdrawnReason: withdrawReason }
            : app,
        ),
      );
      setWithdrawingId(null);
      setWithdrawReason('');
    } catch {
      setErrorMsg('Network error while processing withdrawal.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const getStatusBadgeVariant = (
    status: string,
  ): 'outline' | 'danger' | 'neutral' | 'accent' | 'success' | 'warning' => {
    switch (status) {
      case 'HIRED':
        return 'success';
      case 'OFFERED':
        return 'accent';
      case 'INTERVIEWING':
        return 'accent';
      case 'IN_REVIEW':
        return 'neutral';
      case 'REJECTED':
        return 'danger';
      case 'WITHDRAWN':
        return 'outline';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-3d p-4 space-y-1 hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Applied</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">{applications.length}</div>
        </Card>

        <Card className="card-3d p-4 space-y-1 hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">In Review</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {applications.filter((a) => a.status === 'IN_REVIEW' || a.status === 'SUBMITTED').length}
          </div>
        </Card>

        <Card className="card-3d p-4 space-y-1 hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Interviews</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {applications.filter((a) => a.status === 'INTERVIEWING' || a.status === 'OFFERED').length}
          </div>
        </Card>

        <Card className="card-3d p-4 space-y-1 hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Decisions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {applications.filter((a) => a.status === 'HIRED' || a.status === 'REJECTED').length}
          </div>
        </Card>
      </div>

      {applications.length === 0 ? (
        <Card className="card-3d p-12 text-center space-y-4 border-dashed border-border/80">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No applications submitted yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Explore open executive requisitions and submit your application with your verified profile and resume.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/jobs">
              <Button variant="primary" className="btn-3d text-xs font-semibold gap-1.5">
                <span>Discover Opportunities</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const currentStageIdx = STAGES_ORDER.indexOf(app.currentStage.toUpperCase());
            const isTerminal = app.status === 'REJECTED' || app.status === 'WITHDRAWN';

            return (
              <Card key={app.id} className="card-3d p-6 space-y-5 hover:border-primary/40 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {app.job?.workspace?.company?.name || 'Hiring Organization'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                      {app.job?.slug ? (
                        <Link href={`/jobs/${app.job.slug}`}>{app.job.title}</Link>
                      ) : (
                        app.job?.title
                      )}
                    </h3>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {app.job?.department && (
                        <Badge variant="neutral">{app.job.department}</Badge>
                      )}
                      {app.job?.remoteType && (
                        <Badge variant="outline">{app.job.remoteType}</Badge>
                      )}
                      {app.resume && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span>{app.resume.fileName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start">
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                    {app.status !== 'WITHDRAWN' && app.status !== 'HIRED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWithdrawingId(app.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pipeline Stage Visualizer */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
                    <span className="text-foreground font-semibold">Stage: {app.currentStage}</span>
                    <span>Status: {app.status}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {STAGES_ORDER.map((stageName, idx) => {
                      const isComplete = !isTerminal && currentStageIdx >= idx;
                      const isCurrent = !isTerminal && currentStageIdx === idx;

                      return (
                        <div key={stageName} className="space-y-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isTerminal
                                ? 'bg-muted'
                                : isComplete
                                ? 'bg-emerald-500 shadow-xs'
                                : 'bg-muted/60'
                            } ${isCurrent ? 'ring-2 ring-emerald-500/40 animate-pulse' : ''}`}
                          />
                          <p className="text-[10px] text-center text-muted-foreground truncate uppercase font-medium">
                            {stageName.toLowerCase()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cover Letter Excerpt */}
                {app.coverLetter && (
                  <div className="text-xs text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/40">
                    <p className="font-semibold text-muted-foreground mb-1">Your Note:</p>
                    <p className="line-clamp-2 leading-relaxed">{app.coverLetter}</p>
                  </div>
                )}

                {/* Withdrawn Note */}
                {app.status === 'WITHDRAWN' && app.withdrawnReason && (
                  <div className="text-xs text-muted-foreground italic">
                    Withdrawal note: &ldquo;{app.withdrawnReason}&rdquo;
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="card-3d w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-foreground">Withdraw Application</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to withdraw your application? This notifies the hiring team and halts review.
            </p>

            {errorMsg && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reason for Withdrawal <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Accepted another position, relocation timing"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                className="btn-3d-secondary text-xs"
                onClick={() => {
                  setWithdrawingId(null);
                  setErrorMsg(null);
                }}
                disabled={submittingWithdraw}
              >
                Keep Application
              </Button>
              <Button
                variant="danger"
                className="btn-3d text-xs font-semibold"
                onClick={() => handleWithdraw(withdrawingId)}
                disabled={submittingWithdraw}
              >
                {submittingWithdraw ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
