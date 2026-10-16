'use client';

import React, { useState } from 'react';
import { Badge, Button } from '@executive-match/ui';
import type { AdminAuditLogItem, AdminSystemHealth } from '@/lib/api';
import {
  Activity,
  Database,
  Cpu,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

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
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Operational Diagnostics & Service State
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time telemetry from NestJS runtime, PostgreSQL connection pool, and host resources.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-3d p-5 space-y-2 group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                  Platform State
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    health.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="text-2xl font-black text-foreground mt-1 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{health.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">Core service cluster healthy</p>
            </div>

            <div className="card-3d p-5 space-y-2 group hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                  Database Engine
                </span>
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {health.database.latencyMs}ms Latency
              </div>
              <p className="text-xs text-muted-foreground">pgvector pool responsive</p>
            </div>

            <div className="card-3d p-5 space-y-2 group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                  Memory Heap
                </span>
                <Cpu className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {health.memory.heapUsedMb} MB
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {health.memory.heapTotalMb} MB
                </span>
              </div>
              <p className="text-xs text-muted-foreground">RSS Allocation: {health.memory.rssMb} MB</p>
            </div>

            <div className="card-3d p-5 space-y-2 group hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                  Runtime Uptime
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {formatUptime(health.uptimeSeconds)}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{health.nodeVersion}</p>
            </div>
          </div>
        </section>
      )}

      {/* Audit Log Explorer */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Cryptographic Audit Log Ledger
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Immutable activity records for compliance, RBAC elevation auditing, and security forensics.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Showing <strong className="text-foreground">{logs.length}</strong> of {initialTotal} immutable events
          </span>
        </div>

        {/* Filter bar */}
        <div className="card-3d p-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by Action (e.g. ELEVATION, ROLE)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-mono shadow-sm"
            />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by Target (e.g. USER, WORKSPACE)..."
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-mono shadow-sm"
            />
          </div>
          <Button
            variant="outline"
            className="btn-3d-secondary text-xs h-9 px-4 flex items-center gap-1.5"
            onClick={() => fetchLogs(actionFilter, targetFilter)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5 text-primary" />}
            <span>Apply Filters</span>
          </Button>
          {(actionFilter || targetFilter) && (
            <Button
              variant="ghost"
              className="text-xs text-muted-foreground h-9 px-3"
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
        <div className="card-3d overflow-hidden">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Actor Email</th>
                    <th className="p-4">Workspace Scope</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <Badge
                              variant={
                                log.action.includes('ELEVATION')
                                  ? 'warning'
                                  : log.action.includes('ROLE')
                                    ? 'neutral'
                                    : 'success'
                              }
                              className="text-xs font-mono"
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-xs text-foreground font-bold">
                              {log.targetType}
                            </div>
                            {log.targetId && (
                              <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[140px] mt-0.5">
                                {log.targetId}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-semibold text-foreground">{log.actorEmail}</div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {log.workspace ? log.workspace.name : 'Platform-Wide'}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && log.details && (
                          <tr className="bg-muted/30">
                            <td colSpan={6} className="p-5">
                              <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-primary" />
                                <span>Audit Event Cryptographic Payload:</span>
                              </div>
                              <pre className="p-4 rounded-xl bg-background border border-border text-[11px] font-mono text-foreground/90 overflow-x-auto shadow-inner leading-relaxed">
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
            <div className="p-12 text-center text-sm text-muted-foreground">
              No audit log entries matching filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
