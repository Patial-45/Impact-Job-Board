'use client';

import React, { useState } from 'react';
import { Card, Badge, Button } from '@executive-match/ui';
import type { AdminUserItem } from '@/lib/api';

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
          className={`p-3 text-xs rounded-md ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(search, roleFilter)}
            className="w-full max-w-sm px-3 py-1.5 text-xs rounded-md border border-input bg-background"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              fetchUsers(search, e.target.value);
            }}
            className="px-3 py-1.5 text-xs rounded-md border border-input bg-background"
          >
            <option value="">All Global Roles</option>
            <option value="USER">USER</option>
            <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <Button variant="outline" className="text-xs" onClick={() => fetchUsers(search, roleFilter)} disabled={loading}>
            {loading ? 'Searching...' : 'Filter'}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Showing {users.length} of {initialTotal} users
        </span>
      </div>

      {/* Users table */}
      <Card variant="outline" className="overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">User / Name</th>
                  <th className="p-3.5">Candidate Profile</th>
                  <th className="p-3.5">Workspaces</th>
                  <th className="p-3.5">Global Role</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{u.profile?.displayName || 'Unnamed User'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      {u.candidate ? (
                        <div className="text-xs text-foreground max-w-xs truncate">
                          {u.candidate.headline || 'Profile Active'}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {u.memberships.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.memberships.map((m) => (
                            <Badge key={m.workspace.id} variant="neutral">
                              {m.workspace.name} ({m.role})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">0 Workspaces</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          u.globalRole === 'SUPER_ADMIN'
                            ? 'danger'
                            : u.globalRole === 'PLATFORM_ADMIN'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {u.globalRole}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <select
                        value={u.globalRole}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 text-xs rounded border border-input bg-background font-medium"
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
          <div className="p-10 text-center text-sm text-muted-foreground">
            No platform users found matching criteria.
          </div>
        )}
      </Card>
    </div>
  );
}
