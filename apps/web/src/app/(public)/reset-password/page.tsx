'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
} from '@executive-match/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Request mode state
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Confirm mode state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmDone, setConfirmDone] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setRequestError('');
    setRequestBusy(true);

    try {
      const res = await fetch(`${apiUrl}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: requestEmail }),
      });

      if (!res.ok) {
        throw new Error('Unable to send password reset request. Please check your email address.');
      }

      setRequestSent(true);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRequestBusy(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setConfirmError('');

    if (newPassword.length < 12) {
      setConfirmError('Password must be at least 12 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setConfirmBusy(true);

    try {
      const res = await fetch(`${apiUrl}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Password reset token is invalid or has expired.');
      }

      setConfirmDone(true);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setConfirmBusy(false);
    }
  }

  if (token) {
    return (
      <Card style={{ maxWidth: '480px', width: '100%', margin: '60px auto' }}>
        <CardHeader>
          <span className="ui-eyebrow">ACCOUNT RECOVERY</span>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>Enter a strong new password for your account (at least 12 characters)</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmDone ? (
            <div style={{ backgroundColor: 'var(--soft)', padding: '16px', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
                Password Updated!
              </strong>
              <p style={{ color: 'var(--ink)', fontSize: '14px', margin: 0 }}>
                Your password has been successfully reset. All prior active sessions have been revoked.
              </p>
            </div>
          ) : (
            <form id="confirm-form" onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                New Password
                <Input
                  type="password"
                  required
                  minLength={12}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 12 characters"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                Confirm New Password
                <Input
                  type="password"
                  required
                  minLength={12}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                />
              </label>

              {confirmError && (
                <p role="alert" style={{ color: 'var(--color-danger, #d13438)', fontSize: '13px', margin: 0 }}>
                  {confirmError}
                </p>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Back to login
          </Link>
          {confirmDone ? (
            <Link href="/login">
              <Button variant="primary">Log In Now</Button>
            </Link>
          ) : (
            <Button form="confirm-form" type="submit" variant="primary" disabled={confirmBusy}>
              {confirmBusy ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: '480px', width: '100%', margin: '60px auto' }}>
      <CardHeader>
        <span className="ui-eyebrow">ACCOUNT RECOVERY</span>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>We will send instructions to your email to safely reset your password</CardDescription>
      </CardHeader>
      <CardContent>
        {requestSent ? (
          <div style={{ backgroundColor: 'var(--soft)', padding: '16px', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
              Instructions Dispatched
            </strong>
            <p style={{ color: 'var(--ink)', fontSize: '14px', margin: 0 }}>
              If an account matches <strong>{requestEmail}</strong>, you will receive an email shortly with a secure link to reset your password.
            </p>
          </div>
        ) : (
          <form id="request-form" onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Email address
              <Input
                type="email"
                required
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>

            {requestError && (
              <p role="alert" style={{ color: 'var(--color-danger, #d13438)', fontSize: '13px', margin: 0 }}>
                {requestError}
              </p>
            )}
          </form>
        )}
      </CardContent>
      <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/login" style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Back to login
        </Link>
        {!requestSent && (
          <Button form="request-form" type="submit" variant="primary" disabled={requestBusy}>
            {requestBusy ? 'Sending...' : 'Send Reset Link'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="public-shell-page" style={{ padding: '40px 24px' }}>
      <Suspense fallback={<p style={{ textAlign: 'center' }}>Loading password recovery...</p>}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
