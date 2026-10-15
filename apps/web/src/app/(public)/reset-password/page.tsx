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
import {
  KeyRound,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <Card className="card-3d max-w-md w-full mx-auto my-12 border border-border/80 shadow-xl backdrop-blur-xs">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="ui-eyebrow text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
              ACCOUNT RECOVERY
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
          <CardDescription>
            Enter a strong new password for your account (minimum 12 characters).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmDone ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <strong className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Password Updated!
                </strong>
                <p className="text-muted-foreground leading-relaxed">
                  Your password has been successfully reset. All prior active sessions have been revoked.
                </p>
              </div>
            </div>
          ) : (
            <form id="confirm-form" onSubmit={handleConfirm} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={12}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={12}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {confirmError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{confirmError}</span>
                </div>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
          {confirmDone ? (
            <Link href="/login">
              <Button variant="primary" className="btn-3d text-xs font-semibold">
                Log In Now
              </Button>
            </Link>
          ) : (
            <Button
              form="confirm-form"
              type="submit"
              variant="primary"
              disabled={confirmBusy}
              className="btn-3d text-xs font-semibold"
            >
              {confirmBusy ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="card-3d max-w-md w-full mx-auto my-12 border border-border/80 shadow-xl backdrop-blur-xs">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="ui-eyebrow text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
            ACCOUNT RECOVERY
          </span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
        <CardDescription>
          Enter your registered email address and we will dispatch a secure link to reset your credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requestSent ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <strong className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                Instructions Dispatched
              </strong>
              <p className="text-muted-foreground leading-relaxed text-xs">
                If an account matches <strong>{requestEmail}</strong>, you will receive an email shortly with a secure link to reset your password.
              </p>
            </div>
          </div>
        ) : (
          <form id="request-form" onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email address
              </label>
              <Input
                type="email"
                required
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            {requestError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{requestError}</span>
              </div>
            )}
          </form>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
        {!requestSent && (
          <Button
            form="request-form"
            type="submit"
            variant="primary"
            disabled={requestBusy}
            className="btn-3d text-xs font-semibold"
          >
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
