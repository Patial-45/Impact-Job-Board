'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@executive-match/ui';
import type { ApplicationData } from '@/lib/api';

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
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Applied</p>
          <p className="text-2xl font-bold text-foreground mt-1">{applications.length}</p>
        </Card>
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">In Review</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {applications.filter((a) => a.status === 'IN_REVIEW' || a.status === 'SUBMITTED').length}
          </p>
        </Card>
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Interviews</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {applications.filter((a) => a.status === 'INTERVIEWING' || a.status === 'OFFERED').length}
          </p>
        </Card>
        <Card variant="outline" className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Decisions</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {applications.filter((a) => a.status === 'HIRED' || a.status === 'REJECTED').length}
          </p>
        </Card>
      </div>

      {applications.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-dashed">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold">
            📋
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No applications submitted yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Explore open executive requisitions and submit your application with your profile and resume.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/jobs">
              <Button variant="primary">Discover Opportunities ↗</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const currentStageIdx = STAGES_ORDER.indexOf(app.currentStage.toUpperCase());
            const isTerminal = app.status === 'REJECTED' || app.status === 'WITHDRAWN';

            return (
              <Card key={app.id} variant="outline" className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-primary">
                        {app.job?.workspace?.company?.name || 'Hiring Organization'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
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
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          📄 {app.resume.fileName}
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
                    <span>Progress: {app.currentStage}</span>
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
                                ? 'bg-primary'
                                : 'bg-muted/60'
                            } ${isCurrent ? 'ring-2 ring-primary/40' : ''}`}
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
                    <p className="line-clamp-2">{app.coverLetter}</p>
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
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Withdraw Application</h3>
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                placeholder="e.g. Accepted another position, relocation timing"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
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
