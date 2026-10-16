'use client';

import React, { useState } from 'react';
import { Badge, Button } from '@executive-match/ui';
import type { AdminWorkspaceItem } from '@/lib/api';
import {
  Building2,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
} from 'lucide-react';

interface AdminWorkspacesTableProps {
  initialWorkspaces: AdminWorkspaceItem[];
  initialTotal: number;
}

export function AdminWorkspacesTable({
  initialWorkspaces,
  initialTotal,
}: AdminWorkspacesTableProps) {
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceItem[]>(initialWorkspaces);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Elevation state
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState<'READ_ONLY' | 'SUPPORT_MAINTENANCE'>('READ_ONLY');
  const [durationHours, setDurationHours] = useState(2);
  const [elevating, setElevating] = useState(false);
  const [elevationMessage, setElevationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchWorkspaces = async (s = search) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (s) q.set('search', s);
      const res = await fetch(`/api/v1/admin/workspaces?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.items);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  const handleGrantElevation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug) return;
    setElevating(true);
    setElevationMessage(null);
    try {
      const res = await fetch('/api/v1/admin/support-elevation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: selectedSlug,
          reason,
          scope,
          durationHours: Number(durationHours),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message?.message || errorData.message || 'Failed to grant elevation');
      }

      setElevationMessage({
        text: `Support elevation granted for "${selectedSlug}" (${durationHours}h). Recorded in audit log.`,
        type: 'success',
      });
      setTimeout(() => {
        setSelectedSlug(null);
        setReason('');
        setElevationMessage(null);
      }, 2500);
    } catch (err: unknown) {
      setElevationMessage({
        text: err instanceof Error ? err.message : 'Elevation request failed',
        type: 'error',
      });
    } finally {
      setElevating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search toolbar */}
      <div className="card-3d p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workspaces by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchWorkspaces(search)}
              className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground shadow-sm"
            />
          </div>
          <Button
            variant="outline"
            className="btn-3d-secondary text-xs h-9 px-3.5 flex items-center gap-1.5"
            onClick={() => fetchWorkspaces(search)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 text-primary" />}
            <span>Filter</span>
          </Button>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
          Showing <strong className="text-foreground">{workspaces.length}</strong> of {initialTotal} tenant workspaces
        </span>
      </div>

      {/* Workspaces table */}
      <div className="card-3d overflow-hidden">
        {workspaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
                <tr>
                  <th className="p-4">Workspace / Tenant</th>
                  <th className="p-4">Company Profile</th>
                  <th className="p-4">Plan Tier</th>
                  <th className="p-4 text-center">Team Members</th>
                  <th className="p-4 text-center">Requisitions</th>
                  <th className="p-4 text-center">Offers</th>
                  <th className="p-4 text-right">Audited Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-primary" />
                        {w.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">/{w.slug}</div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {w.company ? (
                        <div>
                          <span className="font-semibold text-foreground">{w.company.name}</span>
                          <div>{w.company.industry || w.company.location || 'Profile created'}</div>
                        </div>
                      ) : (
                        <span>No company linked</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          w.subscription?.tier === 'ENTERPRISE'
                            ? 'warning'
                            : w.subscription?.tier === 'GROWTH'
                              ? 'success'
                              : 'neutral'
                        }
                        className="text-xs"
                      >
                        <CreditCard className="w-3 h-3 mr-1 inline" />
                        {w.subscription?.tier || 'STARTER'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center font-bold text-foreground">
                      {w._count.memberships}
                    </td>
                    <td className="p-4 text-center font-bold text-foreground">
                      {w._count.jobs}
                    </td>
                    <td className="p-4 text-center font-bold text-foreground">
                      {w._count.offers}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        className="btn-3d-secondary text-xs h-8 px-3 flex items-center gap-1.5 ml-auto"
                        onClick={() => setSelectedSlug(w.slug)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Elevate Access</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No workspaces found matching criteria.
          </div>
        )}
      </div>

      {/* Support Elevation Modal */}
      {selectedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="card-3d w-full max-w-lg p-6 sm:p-7 space-y-5 bg-card border-border shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Audited Elevation: <span className="font-mono text-primary">{selectedSlug}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSlug(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {elevationMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  elevationMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {elevationMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span>{elevationMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleGrantElevation} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Reason & Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explicit business or customer ticket justification..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Elevation Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as 'READ_ONLY' | 'SUPPORT_MAINTENANCE')}
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs text-foreground"
                  >
                    <option value="READ_ONLY">Read-Only Investigation</option>
                    <option value="SUPPORT_MAINTENANCE">Support Maintenance (Write)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Duration
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs text-foreground"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours (Default)</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
                <strong>Audit Compliance Guarantee:</strong> Granting temporary elevation creates an
                immutable entry in the system audit log with your administrative user ID, timestamp, and target workspace.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSlug(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={elevating}
                  className="btn-3d text-xs h-9 px-4 flex items-center gap-1.5"
                >
                  {elevating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{elevating ? 'Granting...' : 'Grant Audited Elevation'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
