'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@executive-match/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    let active = true;
    async function verify() {
      setStatus('verifying');
      try {
        const res = await fetch(`${apiUrl}/auth/verify-email/confirm`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!active) return;

        if (res.ok) {
          setStatus('success');
        } else {
          const body = await res.json().catch(() => ({}));
          setStatus('error');
          setErrorMessage(
            body?.message || 'Verification token is invalid, expired, or has already been used.',
          );
        }
      } catch {
        if (active) {
          setStatus('error');
          setErrorMessage('Unable to connect to verification server. Please try again.');
        }
      }
    }

    verify();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <Card style={{ maxWidth: '480px', width: '100%', margin: '60px auto' }}>
      <CardHeader>
        <span className="ui-eyebrow">ACCOUNT VERIFICATION</span>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Confirming your email address for Executive Match</CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              No verification token was detected in your link. If you recently registered, please
              check your inbox for the link we sent, or sign in to request a new link.
            </p>
          </div>
        ) : status === 'verifying' ? (
          <div>
            <p style={{ color: 'var(--ink)', fontWeight: 500 }}>
              Verifying your email token with our secure servers...
            </p>
          </div>
        ) : status === 'success' ? (
          <div style={{ backgroundColor: 'var(--soft)', padding: '16px', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
              Email verified successfully!
            </strong>
            <p style={{ color: 'var(--ink)', fontSize: '14px', margin: 0 }}>
              Your account is now fully verified. You have full access to workspace creation and recruitment tools.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff2f2', padding: '16px', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--color-danger, #d13438)', display: 'block', marginBottom: '8px' }}>
              Verification Failed
            </strong>
            <p style={{ color: '#602020', fontSize: '14px', margin: 0 }}>{errorMessage}</p>
          </div>
        )}
      </CardContent>
      <CardFooter style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {status === 'success' ? (
          <Link href="/login">
            <Button variant="primary">Proceed to Log In</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="outline">Return to Sign In</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="public-shell-page" style={{ padding: '40px 24px' }}>
      <Suspense fallback={<p style={{ textAlign: 'center' }}>Loading verification...</p>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
