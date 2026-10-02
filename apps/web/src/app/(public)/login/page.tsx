import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
export const metadata: Metadata = { title: 'Log in' };
export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="ui-eyebrow">WELCOME BACK</span>
        <h1>Continue your journey.</h1>
        <p>Sign in to your Executive Match account.</p>
        <AuthForm mode="login" />
      </section>
      <aside className="auth-aside">
        <span className="section-index">EXECUTIVE MATCH / ACCESS</span>
        <strong>Good hiring starts with a clearer understanding.</strong>
        <p>One place to discover, connect, and move forward.</p>
      </aside>
    </main>
  );
}
