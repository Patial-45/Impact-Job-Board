'use client';

import React, { useState } from 'react';
import { Badge, Button } from '@executive-match/ui';
import type { AdminUserItem } from '@/lib/api';
import {
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AdminUsersTableProps {
  initialUsers: AdminUserItem[];
  initialTotal: number;
}

export function AdminUsersTable({ initialUsers, initialTotal }: AdminUsersTableProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async (s = search, r = roleFilter) => {
    setLoading(true);
    setMessage(null);
    try {
      const q = new URLSearchParams();
      if (s) q.set('search', s);
      if (r) q.set('globalRole', r);
      const res = await fetch(`/api/v1/admin/users?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalRole: newRole }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message?.message || errorData.message || 'Failed to update role');
      }

      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, globalRole: updated.globalRole } : u)),
      );
      setMessage({ text: `Successfully updated user role to ${newRole}`, type: 'success' });
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'Role change failed',
        type: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card-3d p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email, name, or candidate profile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers(search, roleFilter)}
              className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground shadow-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              fetchUsers(search, e.target.value);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium shadow-sm"
          >
            <option value="">All Global Roles</option>
            <option value="USER">USER</option>
            <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <Button
            variant="outline"
            className="btn-3d-secondary text-xs h-9 px-3.5 flex items-center gap-1.5"
            onClick={() => fetchUsers(search, roleFilter)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5 text-primary" />}
            <span>Filter</span>
          </Button>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
          Showing <strong className="text-foreground">{users.length}</strong> of {initialTotal} platform identities
        </span>
      </div>

      {/* Users table */}
      <div className="card-3d overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
                <tr>
                  <th className="p-4">User / Name</th>
                  <th className="p-4">Candidate Profile</th>
                  <th className="p-4">Tenant Workspaces</th>
                  <th className="p-4">Global Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{u.profile?.displayName || 'Unnamed User'}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="p-4">
                      {u.candidate ? (
                        <div className="text-xs text-foreground max-w-xs truncate font-medium">
                          {u.candidate.headline || 'Profile Active'}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.memberships.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {u.memberships.map((m) => (
                            <Badge key={m.workspace.id} variant="neutral" className="text-[11px]">
                              {m.workspace.name} ({m.role})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">0 Workspaces</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          u.globalRole === 'SUPER_ADMIN'
                            ? 'danger'
                            : u.globalRole === 'PLATFORM_ADMIN'
                              ? 'warning'
                              : 'neutral'
                        }
                        className="text-xs"
                      >
                        {u.globalRole === 'SUPER_ADMIN' && <ShieldAlert className="w-3 h-3 mr-1 text-red-500 inline" />}
                        {u.globalRole === 'PLATFORM_ADMIN' && <ShieldCheck className="w-3 h-3 mr-1 text-amber-500 inline" />}
                        {u.globalRole === 'USER' && <Shield className="w-3 h-3 mr-1 text-muted-foreground inline" />}
                        {u.globalRole}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={u.globalRole}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground font-semibold shadow-xs"
                      >
                        <option value="USER">Make USER</option>
                        <option value="PLATFORM_ADMIN">Make PLATFORM_ADMIN</option>
                        <option value="SUPER_ADMIN">Make SUPER_ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No platform users found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
