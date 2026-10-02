import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
export const metadata: Metadata = { title: 'Create an account' };
export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="ui-eyebrow">GET STARTED</span>
        <h1>Make your next move.</h1>
        <p>Create an account to join Executive Match.</p>
        <AuthForm mode="register" />
      </section>
      <aside className="auth-aside">
        <span className="section-index">EXECUTIVE MATCH / ACCESS</span>
        <strong>A better match begins with better context.</strong>
        <p>Build your profile and be ready for what comes next.</p>
      </aside>
    </main>
  );
}
