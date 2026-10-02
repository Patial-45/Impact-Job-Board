'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@executive-match/ui';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
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
            displayName: String(form.get('displayName') || ''),
          }),
        });
        if (!registered.ok)
          throw new Error(
            registered.status === 409
              ? 'This email is already registered.'
              : 'Please check your details and try again.',
          );
      }
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Could not sign in with those credentials.');
      router.push('/candidate');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Full name
            <Input name="displayName" autoComplete="name" required maxLength={120} />
          </label>
        )}
        <label>
          Email address
          <Input name="email" type="email" autoComplete="email" required maxLength={320} />
        </label>
        <label>
          Password
          <Input
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'register' ? 12 : 1}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <Button disabled={busy} type="submit">
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>
      <p className="auth-switch">
        {mode === 'login' ? (
          <>
            New here? <Link href="/register">Create an account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        )}
      </p>
    </>
  );
}
