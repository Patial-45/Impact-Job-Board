'use client';

import React, { useState } from 'react';
import { Card, Badge, Button } from '@executive-match/ui';
import type { AdminWorkspaceItem } from '@/lib/api';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            placeholder="Search workspace by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWorkspaces(search)}
            className="w-full max-w-sm px-3 py-1.5 text-xs rounded-md border border-input bg-background"
          />
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => fetchWorkspaces(search)}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Filter'}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Showing {workspaces.length} of {initialTotal} workspaces
        </span>
      </div>

      {/* Workspaces table */}
      <Card variant="outline" className="overflow-hidden">
        {workspaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Workspace / Tenant</th>
                  <th className="p-3.5">Company Profile</th>
                  <th className="p-3.5">Subscription Plan</th>
                  <th className="p-3.5 text-center">Team Members</th>
                  <th className="p-3.5 text-center">Requisitions</th>
                  <th className="p-3.5 text-center">Offers</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{w.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">/{w.slug}</div>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {w.company ? (
                        <div>
                          <span className="font-semibold text-foreground">{w.company.name}</span>
                          <div>{w.company.industry || w.company.location || 'Profile created'}</div>
                        </div>
                      ) : (
                        <span>No company linked</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          w.subscription?.tier === 'ENTERPRISE'
                            ? 'warning'
                            : w.subscription?.tier === 'GROWTH'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {w.subscription?.tier || 'STARTER'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center font-semibold text-foreground">
                      {w._count.memberships}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-foreground">
                      {w._count.jobs}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-foreground">
                      {w._count.offers}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        className="text-xs"
                        onClick={() => setSelectedSlug(w.slug)}
                      >
                        Elevate Support Access
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No workspaces found matching criteria.
          </div>
        )}
      </Card>

      {/* Support Elevation Modal */}
      {selectedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg p-6 space-y-5 bg-card border-border shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">
                Audited Elevation: <span className="font-mono text-primary">{selectedSlug}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSlug(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Provide justification reason for opening exceptional support access into this tenant workspace.
              This event will be permanently saved in the system audit trail.
            </p>

            <form onSubmit={handleGrantElevation} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Access Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'READ_ONLY' | 'SUPPORT_MAINTENANCE')}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                >
                  <option value="READ_ONLY">READ_ONLY — Investigate state, read logs & records</option>
                  <option value="SUPPORT_MAINTENANCE">SUPPORT_MAINTENANCE — Configuration repair</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Support Reason & Context</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ticket reference and diagnosis purpose..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                />
              </div>

              {elevationMessage && (
                <div
                  className={`p-3 text-xs rounded-md ${
                    elevationMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                  }`}
                >
                  {elevationMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSlug(null)}
                  disabled={elevating}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={elevating}>
                  {elevating ? 'Granting...' : 'Grant Elevation'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
