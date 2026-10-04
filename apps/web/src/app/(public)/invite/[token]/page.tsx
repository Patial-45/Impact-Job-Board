'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from '@executive-match/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  workspaceName: string;
  workspaceSlug: string;
  inviterName: string;
  expiresAt: string;
}

export default function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/invitations/${encodeURIComponent(token)}`);
        if (!active) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'This invitation is invalid or has expired.');
        }

        const data = await res.json();
        setInvitation(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load invitation.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleAccept() {
    setAcceptError('');
    setAccepting(true);

    try {
      const res = await fetch(`${apiUrl}/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
      });

      if (res.status === 401) {
        // Redirect to login with return path
        router.push(`/login?returnTo=/invite/${encodeURIComponent(token)}`);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Could not accept invitation.');
      }

      // Accepted! Redirect to employer dashboard
      router.push('/employer');
      router.refresh();
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Unable to accept invitation.');
      setAccepting(false);
    }
  }

  return (
    <main className="public-shell-page" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
      <Card style={{ maxWidth: '520px', width: '100%' }}>
        <CardHeader>
          <span className="ui-eyebrow">WORKSPACE INVITATION</span>
          <CardTitle>Join Team Workspace</CardTitle>
          <CardDescription>Collaborate on candidate sourcing and hiring decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              Verifying invitation credentials...
            </p>
          ) : error ? (
            <div style={{ backgroundColor: '#fff2f2', padding: '16px', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--color-danger, #d13438)', display: 'block', marginBottom: '8px' }}>
                Invitation Unavailable
              </strong>
              <p style={{ color: '#602020', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          ) : invitation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'var(--paper)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--ink)' }}>{invitation.workspaceName}</h3>
                  <Badge variant="accent">{invitation.role}</Badge>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 12px 0' }}>
                  Invited by <strong>{invitation.inviterName}</strong>
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                  This invitation was sent to <code>{invitation.email}</code>.
                </p>
              </div>

              {acceptError && (
                <p role="alert" style={{ color: 'var(--color-danger, #d13438)', fontSize: '13px', margin: 0 }}>
                  {acceptError}
                </p>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Decline & Return Home
          </Link>
          {invitation && (
            <Button variant="primary" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Joining Workspace...' : 'Accept Invitation'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
