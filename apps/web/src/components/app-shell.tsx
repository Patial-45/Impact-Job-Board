import Link from 'next/link';
import type { ReactNode } from 'react';
import { Avatar, Badge } from '@executive-match/ui';

export function AppShell({
  kind,
  label,
  email,
  links,
  children,
}: {
  kind: string;
  label?: string;
  email: string;
  links: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/" className="wordmark" aria-label="Executive Match Home">
          <span className="brand-mark" aria-hidden="true">
            EM<span>.</span>
          </span>
          <span>Executive Match</span>
        </Link>

        {label && (
          <div className="workspace-tag">
            <span>{label}</span>
          </div>
        )}

        <nav className="app-nav" aria-label={`${kind} navigation`}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="app-sidebar-bottom">
          <div className="shell-tenant-indicator">
            <span className="tenant-dot" aria-hidden="true" />
            <span>{kind} Portal</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <Badge variant="neutral" size="sm">
              {kind.toUpperCase()}
            </Badge>
            {label && <span className="topbar-crumb">/ {label}</span>}
          </div>

          <div className="topbar-right">
            <div className="topbar-account">
              <Avatar name={email} size="sm" />
              <span className="shell-user">{email}</span>
            </div>
            <Link href="/login" className="topbar-signout">
              Sign out
            </Link>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
