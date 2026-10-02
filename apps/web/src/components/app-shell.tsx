import Link from 'next/link';
import type { ReactNode } from 'react';
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
        <Link href="/" className="wordmark">
          <span className="brand-mark">
            EM<span>.</span>
          </span>
          <span>Executive Match</span>
        </Link>
        {label && <div className="workspace-tag">{label}</div>}
        <nav className="app-nav" aria-label={`${kind} navigation`}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="app-sidebar-bottom">{kind} workspace</div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <span className="shell-eyebrow">{kind.toUpperCase()}</span>
          <span className="shell-user">{email}</span>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
