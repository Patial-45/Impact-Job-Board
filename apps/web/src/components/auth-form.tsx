'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { Button, Input } from '@executive-match/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    try {
      if (mode === 'register') {
        const registered = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            displayName: String(form.get('displayName') || '').trim(),
          }),
        });

        if (!registered.ok) {
          const errBody = await registered.json().catch(() => ({}));
          throw new Error(
            errBody.message ||
              (registered.status === 409
                ? 'This email is already registered.'
                : 'Please check your details and try again.'),
          );
        }
      }

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Could not sign in with those credentials.');
      }

      router.push('/candidate');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <form className="auth-form space-y-4" onSubmit={submit}>
        {mode === 'register' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Full Name</span>
            </label>
            <Input
              name="displayName"
              placeholder="e.g. Alex Rivera"
              autoComplete="name"
              required
              maxLength={120}
              className="w-full"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>Email Address</span>
          </label>
          <Input
            name="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            required
            maxLength={320}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Password</span>
            </label>
            {mode === 'login' && (
              <Link
                href="/reset-password"
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 12 : 1}
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === 'register' && (
            <p className="text-[11px] text-gray-500 font-mono">
              Must be at least 12 characters.
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          disabled={busy}
          type="submit"
          className="btn-3d w-full flex items-center justify-center gap-2 font-bold shadow-md"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Log in' : 'Create account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        {mode === 'login' ? (
          <div>
            <span>Don&apos;t have an account yet? </span>
            <Link href="/register" className="font-bold text-emerald-800 hover:text-emerald-950 underline">
              Create an account
            </Link>
          </div>
        ) : (
          <div>
            <span>Already have an account? </span>
            <Link href="/login" className="font-bold text-emerald-800 hover:text-emerald-950 underline">
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
