'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@executive-match/ui';
import { MailCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

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
    <Card className="card-3d max-w-md w-full mx-auto my-12 border border-border/80 shadow-xl backdrop-blur-xs">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MailCheck className="w-4 h-4" />
          </div>
          <span className="ui-eyebrow text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
            ACCOUNT VERIFICATION
          </span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Email Verification</CardTitle>
        <CardDescription>
          Confirming your email address for Executive Match
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token ? (
          <div className="p-4 rounded-xl bg-muted/50 border border-border text-sm space-y-2">
            <p className="text-muted-foreground leading-relaxed">
              No verification token was detected in your link. If you recently registered, please
              check your inbox for the link we sent, or sign in to request a new link.
            </p>
          </div>
        ) : status === 'verifying' ? (
          <div className="p-6 rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-foreground">
              Verifying your email token with our secure servers...
            </p>
          </div>
        ) : status === 'success' ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <strong className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                Email verified successfully!
              </strong>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Your account is now fully verified. You have full access to workspace creation and recruitment tools.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-950 dark:text-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <strong className="font-semibold text-red-800 dark:text-red-300 block">
                Verification Failed
              </strong>
              <p className="text-red-600 dark:text-red-400 text-xs leading-relaxed">{errorMessage}</p>
            </div>
          </div>
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
        {status === 'success' ? (
          <Link href="/login">
            <Button variant="primary" className="btn-3d text-xs font-semibold gap-1.5">
              <span>Proceed to Log In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="outline" className="btn-3d-secondary text-xs">
              Return to Sign In
            </Button>
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
