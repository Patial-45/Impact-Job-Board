'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@executive-match/ui';

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

      setInviteSuccess(`Invitation sent to ${inviteEmail} as ${inviteRole}!`);
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
    return <p style={{ color: 'var(--muted)', padding: '24px' }}>Loading workspace team...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {error && (
        <p role="alert" style={{ color: 'var(--color-danger, #d13438)', margin: 0 }}>
          {error}
        </p>
      )}

      {/* Invite Member Card */}
      <Card>
        <CardHeader>
          <span className="ui-eyebrow">COLLABORATION</span>
          <CardTitle>Invite New Team Member</CardTitle>
          <CardDescription>
            Add recruiters, hiring managers, or interviewers to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSendInvite}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto',
              gap: '16px',
              alignItems: 'flex-end',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Email address
              <Input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Role
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'RECRUITER' | 'VIEWER')}
                options={[
                  { label: 'Admin (Full management)', value: 'ADMIN' },
                  { label: 'Recruiter (Jobs, candidates, ATS)', value: 'RECRUITER' },
                  { label: 'Viewer (Read-only observation)', value: 'VIEWER' },
                ]}
              />
            </label>

            <Button type="submit" variant="primary" disabled={inviteBusy}>
              {inviteBusy ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>

          {inviteSuccess && (
            <p style={{ color: 'var(--accent)', fontSize: '14px', marginTop: '12px', fontWeight: 500 }}>
              ✓ {inviteSuccess}
            </p>
          )}
          {inviteError && (
            <p role="alert" style={{ color: 'var(--color-danger, #d13438)', fontSize: '14px', marginTop: '12px' }}>
              ✕ {inviteError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Members ({members.length})</CardTitle>
          <CardDescription>Users who have active access to this tenant workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <strong style={{ display: 'block', color: 'var(--ink)' }}>
                      {member.displayName || 'Team Member'}
                    </strong>
                    <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{member.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'OWNER' ? 'accent' : member.role === 'ADMIN' ? 'warning' : 'neutral'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {member.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--color-danger, #d13438)' }}
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            <CardDescription>Invitations awaiting recipient acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invited Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ink)' }}>{inv.email}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{inv.role}</Badge>
                    </TableCell>
                    <TableCell style={{ color: 'var(--muted)', fontSize: '13px' }}>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ color: 'var(--color-danger, #d13438)' }}
                        onClick={() => handleRevokeInvite(inv.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
