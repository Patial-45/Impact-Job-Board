'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@executive-match/ui';
import type { AdminStats, AdminSystemHealth } from '@/lib/api';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Send,
  CheckCircle2,
  CreditCard,
  Activity,
  ShieldAlert,
  Server,
  Cpu,
  Clock,
  History,
  X,
  ShieldCheck,
  Database,
  AlertCircle,
} from 'lucide-react';

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="ui-eyebrow text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
                SYSTEM TELEMETRY
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Telemetry</h2>
            <p className="text-sm text-muted-foreground">
              Aggregated system metrics across all tenants and active workloads.
            </p>
          </div>
          <Button
            variant="outline"
            className="btn-3d-secondary text-xs font-medium gap-2 self-start sm:self-auto"
            onClick={() => setElevationOpen(true)}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Request Support Elevation</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Users</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalUsers?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">All global identity records</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Workspaces</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalWorkspaces?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Isolated tenant environments</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Active Jobs</span>
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats?.publishedJobs?.toLocaleString() ?? '—'}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                / {stats?.totalJobs ?? 0} total
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Published requisitions</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Applications</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalApplications?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Candidate submissions</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Offers Extended</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats?.totalOffers?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Drafted & sent compensation packages</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Accepted Offers</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.acceptedOffers?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Completed e-signatures</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">Active Subscriptions</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {stats?.activeSubscriptions?.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">Paying & trial workspace plans</p>
          </Card>

          <Card className="card-3d p-4 space-y-2 hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider font-semibold">System Status</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
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
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Infrastructure Diagnostics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-3d p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">Database Engine</span>
                </div>
                <Badge variant={health.database.status === 'CONNECTED' ? 'success' : 'danger'}>
                  {health.database.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Response Latency:</span>
                <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded bg-muted/60">
                  {health.database.latencyMs}ms
                </span>
              </div>
            </Card>

            <Card className="card-3d p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-foreground">Memory Footprint</span>
                </div>
                <Badge variant="neutral">RSS: {health.memory.rssMb} MB</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Heap Allocation:</span>
                <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded bg-muted/60">
                  {health.memory.heapUsedMb} MB / {health.memory.heapTotalMb} MB
                </span>
              </div>
            </Card>

            <Card className="card-3d p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-foreground">Process Runtime</span>
                </div>
                <Badge variant="neutral">{health.nodeVersion}</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Total Uptime:</span>
                <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded bg-muted/60">
                  {formatUptime(health.uptimeSeconds)}
                </span>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Audit Log Activity Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Security & Audit Logs</h2>
              <p className="text-sm text-muted-foreground">
                Immutable chronological record of administrative actions, role elevations, and tenant events.
              </p>
            </div>
          </div>
        </div>

        <Card className="card-3d overflow-hidden border border-border/80">
          {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.recentAuditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-muted/30 transition-colors">
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
          <Card className="card-3d w-full max-w-lg p-6 space-y-5 bg-card border-border shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-foreground">Request Support Elevation</h3>
              </div>
              <button
                type="button"
                onClick={() => setElevationOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">brain/12-ADMIN-PORTAL.md</code>,
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
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Elevation Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'READ_ONLY' | 'SUPPORT_MAINTENANCE')}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
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
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
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
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setElevationOpen(false)}
                  disabled={submitting}
                  className="btn-3d-secondary text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="btn-3d text-xs font-semibold"
                >
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
