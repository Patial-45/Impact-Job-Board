'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@executive-match/ui';
import type { AdminStats, AdminSystemHealth } from '@/lib/api';

interface AdminDashboardProps {
  stats: AdminStats | null;
  health: AdminSystemHealth | null;
}

export function AdminDashboard({ stats, health }: AdminDashboardProps) {
  const [elevationOpen, setElevationOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState<'READ_ONLY' | 'SUPPORT_MAINTENANCE'>('READ_ONLY');
  const [durationHours, setDurationHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSupportElevation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/v1/admin/support-elevation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: slug,
          reason,
          scope,
          durationHours: Number(durationHours),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message?.message || errorData.message || 'Failed to grant support elevation');
      }

      setSuccessMessage(`Support elevation granted for workspace "${slug}" for ${durationHours} hours.`);
      setSlug('');
      setReason('');
      setTimeout(() => setElevationOpen(false), 2000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      {/* Platform Overview KPIs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Platform Telemetry</h2>
            <p className="text-sm text-muted-foreground">
              Aggregated system metrics across all tenants and active workloads.
            </p>
          </div>
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => setElevationOpen(true)}
          >
            🛡️ Request Support Elevation
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Total Users
            </span>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalUsers?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">All global identity records</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Workspaces
            </span>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalWorkspaces?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Isolated tenant environments</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Active Jobs
            </span>
            <div className="text-2xl font-black text-foreground">
              {stats?.publishedJobs?.toLocaleString() ?? '—'}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                / {stats?.totalJobs ?? 0} total
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Published requisitions</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Applications
            </span>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalApplications?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Candidate submissions</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Offers Extended
            </span>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalOffers?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Drafted & sent compensation packages</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Accepted Offers
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.acceptedOffers?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Completed e-signatures</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Active Subscriptions
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {stats?.activeSubscriptions?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Paying & trial workspace plans</p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              System Status
            </span>
            <div className="flex items-center space-x-2 pt-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  health?.status === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-base font-bold text-foreground">
                {health?.status ?? 'OPERATIONAL'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {health ? `${health.database.latencyMs}ms DB Latency` : 'Services live'}
            </p>
          </Card>
        </div>
      </section>

      {/* System Health Breakdown */}
      {health && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Infrastructure Diagnostics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Database Engine</span>
                <Badge variant={health.database.status === 'CONNECTED' ? 'success' : 'danger'}>
                  {health.database.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Response Latency: <span className="font-mono font-bold text-foreground">{health.database.latencyMs}ms</span>
              </div>
            </Card>

            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Memory Footprint</span>
                <Badge variant="neutral">RSS: {health.memory.rssMb} MB</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Heap Used: <span className="font-mono font-bold text-foreground">{health.memory.heapUsedMb} MB</span> / {health.memory.heapTotalMb} MB
              </div>
            </Card>

            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Process Runtime</span>
                <Badge variant="neutral">{health.nodeVersion}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Uptime: <span className="font-mono font-bold text-foreground">{formatUptime(health.uptimeSeconds)}</span>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Audit Log Activity Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Recent Security & Audit Logs</h2>
            <p className="text-sm text-muted-foreground">
              Immutable chronological record of administrative actions, role elevations, and tenant events.
            </p>
          </div>
        </div>

        <Card variant="outline" className="overflow-hidden">
          {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.recentAuditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.action.includes('ELEVATION')
                            ? 'warning'
                            : log.action.includes('ROLE')
                              ? 'neutral'
                              : 'success'
                        }
                      >
                        {log.action}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Actor: <span className="font-semibold text-foreground">{log.actorEmail}</span>
                      {log.workspace && (
                        <> · Workspace: <span className="font-medium text-foreground">{log.workspace.name}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No audit log events recorded yet.
            </div>
          )}
        </Card>
      </section>

      {/* Support Elevation Modal */}
      {elevationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg p-6 space-y-5 bg-card border-border shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Request Support Elevation</h3>
              <button
                type="button"
                onClick={() => setElevationOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with <code className="font-mono bg-muted px-1 rounded">brain/12-ADMIN-PORTAL.md</code>,
              platform administrators do not silently inherit tenant workspace access. Exceptional access requires an
              explicit business justification, defined scope, time-bound expiry, and audit logging.
            </p>

            <form onSubmit={handleSupportElevation} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Workspace Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-corp"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Elevation Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'READ_ONLY' | 'SUPPORT_MAINTENANCE')}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                >
                  <option value="READ_ONLY">READ_ONLY — Inspect records and troubleshoot state</option>
                  <option value="SUPPORT_MAINTENANCE">SUPPORT_MAINTENANCE — Active configuration adjustment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Access Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours (Standard)</option>
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Business Justification & Ticket Reference</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why support elevation is necessary (e.g., investigating webhook sync timeout for customer ticket #543)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 rounded-md">
                  {successMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setElevationOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Granting...' : 'Authorize Elevation'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
