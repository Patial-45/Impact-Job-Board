'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Select, Badge } from '@executive-match/ui';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Member {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedByEmail: string;
}

export function WorkspaceTeam({ workspaceSlug }: { workspaceSlug: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'RECRUITER' | 'VIEWER'>('RECRUITER');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  async function loadData() {
    setError('');
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${apiUrl}/workspaces/${workspaceSlug}/members`, { credentials: 'include' }),
        fetch(`${apiUrl}/workspaces/${workspaceSlug}/invitations`, { credentials: 'include' }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.items || []);
      }
      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvitations(data.items || []);
      }
    } catch {
      setError('Failed to load workspace team data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [workspaceSlug]);

  async function handleSendInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteBusy(true);

    try {
      const res = await fetch(`${apiUrl}/workspaces/${workspaceSlug}/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to send invitation.');
      }

      setInviteSuccess(`Invitation dispatched to ${inviteEmail} as ${inviteRole}!`);
      setInviteEmail('');
      await loadData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to invite member.');
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const res = await fetch(`${apiUrl}/workspaces/${workspaceSlug}/invitations/${inviteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // Ignored
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      const res = await fetch(`${apiUrl}/workspaces/${workspaceSlug}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body?.message || 'Cannot remove member.');
      }
    } catch {
      // Ignored
    }
  }

  if (loading) {
    return (
      <div className="card-3d p-12 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground">Loading workspace collaborators...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invite Member Card */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            WORKSPACE ACCESS CONTROL
          </span>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mt-1">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite New Collaborator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add recruiters, executive hiring managers, or interview evaluators to this tenant workspace.
          </p>
        </div>

        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Collaborator Email Address *
              </label>
              <Input
                type="email"
                required
                placeholder="colleague@enterprise.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-10 bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                Workspace Role
              </label>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'RECRUITER' | 'VIEWER')}
                options={[
                  { label: 'Admin (Full Management)', value: 'ADMIN' },
                  { label: 'Recruiter (ATS & Interviews)', value: 'RECRUITER' },
                  { label: 'Viewer (Read-Only)', value: 'VIEWER' },
                ]}
                className="h-10 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={inviteBusy}
              className="btn-3d text-xs h-10 px-5 flex items-center gap-2"
            >
              {inviteBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Workspace Invitation</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {inviteSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{inviteSuccess}</span>
          </div>
        )}
        {inviteError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}
      </div>

      {/* Active Members Table */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Active Team Members ({members.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Users currently authenticated and granted role access to this workspace.
          </p>
        </div>

        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
                <tr>
                  <th className="p-4">User / Name</th>
                  <th className="p-4">Tenant Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">
                        {member.displayName || 'Team Member'}
                      </div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          member.role === 'OWNER'
                            ? 'accent'
                            : member.role === 'ADMIN'
                            ? 'warning'
                            : 'neutral'
                        }
                        className="text-xs"
                      >
                        {member.role === 'OWNER' && <Shield className="w-3 h-3 mr-1 text-primary inline" />}
                        {member.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {member.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger/80 h-8 px-2.5 text-xs"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Pending Invitations ({invitations.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invitations awaiting recipient acceptance via email link.
            </p>
          </div>

          <div className="card-3d overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Invited Email</th>
                    <th className="p-4">Role Assigned</th>
                    <th className="p-4">Expiration Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{inv.email}</td>
                      <td className="p-4">
                        <Badge variant="neutral" className="text-xs">{inv.role}</Badge>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-3d-secondary text-xs text-danger hover:text-danger/80 h-8 px-3"
                          onClick={() => handleRevokeInvite(inv.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
