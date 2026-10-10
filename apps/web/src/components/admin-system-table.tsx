'use client';

import React, { useState } from 'react';
import { Card, Badge, Button } from '@executive-match/ui';
import type { AdminAuditLogItem, AdminSystemHealth } from '@/lib/api';

interface AdminSystemTableProps {
  health: AdminSystemHealth | null;
  initialLogs: AdminAuditLogItem[];
  initialTotal: number;
}

export function AdminSystemTable({
  health,
  initialLogs,
  initialTotal,
}: AdminSystemTableProps) {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>(initialLogs);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (a = actionFilter, t = targetFilter) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (a) q.set('action', a);
      if (t) q.set('targetType', t);
      const res = await fetch(`/api/v1/admin/audit-logs?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
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
      {/* Health metrics */}
      {health && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Operational Diagnostics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs uppercase font-semibold text-muted-foreground">Platform State</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    health.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-xl font-black text-foreground">{health.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">Service cluster state</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs uppercase font-semibold text-muted-foreground">Database Engine</span>
              <div className="text-xl font-black text-foreground mt-1">
                {health.database.latencyMs}ms Latency
              </div>
              <p className="text-xs text-muted-foreground">Connection pool responsive</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs uppercase font-semibold text-muted-foreground">Memory Heap</span>
              <div className="text-xl font-black text-foreground mt-1">
                {health.memory.heapUsedMb} MB
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {health.memory.heapTotalMb} MB
                </span>
              </div>
              <p className="text-xs text-muted-foreground">RSS: {health.memory.rssMb} MB</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs uppercase font-semibold text-muted-foreground">Runtime Uptime</span>
              <div className="text-xl font-black text-foreground mt-1">
                {formatUptime(health.uptimeSeconds)}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{health.nodeVersion}</p>
            </Card>
          </div>
        </section>
      )}

      {/* Audit Log Explorer */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Audit Log Ledger</h2>
            <p className="text-sm text-muted-foreground">
              Searchable cryptographic activity log for compliance and security forensics.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {logs.length} of {initialTotal} events
          </span>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-card border border-border">
          <input
            type="text"
            placeholder="Filter by Action (e.g. ELEVATION)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value.toUpperCase())}
            className="px-3 py-1.5 text-xs rounded-md border border-input bg-background font-mono"
          />
          <input
            type="text"
            placeholder="Filter by Target (e.g. USER, WORKSPACE)..."
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value.toUpperCase())}
            className="px-3 py-1.5 text-xs rounded-md border border-input bg-background font-mono"
          />
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => fetchLogs(actionFilter, targetFilter)}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Apply Filters'}
          </Button>
          {(actionFilter || targetFilter) && (
            <Button
              variant="ghost"
              className="text-xs text-muted-foreground"
              onClick={() => {
                setActionFilter('');
                setTargetFilter('');
                fetchLogs('', '');
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Log table */}
        <Card variant="outline" className="overflow-hidden">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Workspace</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-muted/20">
                          <td className="p-3.5">
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
                          </td>
                          <td className="p-3.5">
                            <div className="font-mono text-xs text-foreground font-semibold">
                              {log.targetType}
                            </div>
                            {log.targetId && (
                              <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                                {log.targetId}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="text-xs font-semibold text-foreground">{log.actorEmail}</div>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground">
                            {log.workspace ? log.workspace.name : 'Platform-Wide'}
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && log.details && (
                          <tr className="bg-muted/30">
                            <td colSpan={6} className="p-4">
                              <div className="text-xs font-bold text-foreground mb-1">Payload Metadata:</div>
                              <pre className="p-3 rounded-md bg-background border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No audit log entries matching filters.
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
