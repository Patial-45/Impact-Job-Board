'use client';

import { useState, type FormEvent } from 'react';
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
  Input,
} from '@executive-match/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const res = await fetch(`${apiUrl}/workspaces`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to create workspace.');
      }

      const created = await res.json();
      router.push(`/workspace/${created.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create workspace.');
      setBusy(false);
    }
  }

  return (
    <main className="public-shell-page" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
      <Card style={{ maxWidth: '540px', width: '100%' }}>
        <CardHeader>
          <span className="ui-eyebrow">NEW WORKSPACE</span>
          <CardTitle>Create Team Workspace</CardTitle>
          <CardDescription>
            Workspaces serve as the tenant boundary for companies, job postings, candidate evaluations, and team collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="create-workspace-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Company / Workspace Name
              <Input
                type="text"
                required
                minLength={2}
                maxLength={160}
                placeholder="e.g. Acme Corporation"
                value={name}
                onChange={handleNameChange}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Workspace URL Slug
              <Input
                type="text"
                required
                minLength={3}
                maxLength={80}
                placeholder="e.g. acme-corporation"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value.toLowerCase().trim());
                }}
              />
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Your team access link will be: <code>/workspace/{slug || 'your-slug'}</code>
              </span>
            </label>

            {error && (
              <p role="alert" style={{ color: 'var(--color-danger, #d13438)', fontSize: '13px', margin: 0 }}>
                {error}
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Cancel
          </Link>
          <Button form="create-workspace-form" type="submit" variant="primary" disabled={busy}>
            {busy ? 'Creating Workspace...' : 'Create Workspace'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
