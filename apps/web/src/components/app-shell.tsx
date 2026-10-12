'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { Avatar, Badge, Logo } from '@executive-match/ui';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileSignature,
  BarChart3,
  CreditCard,
  Webhook,
  UserPlus,
  Settings,
  Building2,
  FileText,
  Bookmark,
  UserCheck,
  Activity,
  Layers,
  LogOut,
  Sparkles,
} from 'lucide-react';

function getNavIcon(label: string, href: string): ComponentType<{ size?: number; className?: string; strokeWidth?: number }> {
  const normalized = label.toLowerCase();
  const normalizedHref = href.toLowerCase();

  if (normalized.includes('overview') || normalized.includes('dashboard')) return LayoutDashboard;
  if (normalized.includes('job') && !normalized.includes('saved')) return Briefcase;
  if (normalized.includes('saved')) return Bookmark;
  if (normalized.includes('candidate') && !normalized.includes('search')) return Users;
  if (normalized.includes('application')) return Layers;
  if (normalized.includes('interview')) return Calendar;
  if (normalized.includes('offer')) return FileSignature;
  if (normalized.includes('analytic')) return BarChart3;
  if (normalized.includes('billing')) return CreditCard;
  if (normalized.includes('integration') || normalized.includes('webhook') || normalizedHref.includes('integrations')) return Webhook;
  if (normalized.includes('team') || normalized.includes('member')) return UserPlus;
  if (normalized.includes('profile')) return UserCheck;
  if (normalized.includes('resume')) return FileText;
  if (normalized.includes('setting')) return Settings;
  if (normalized.includes('user')) return Users;
  if (normalized.includes('workspace')) return Building2;
  if (normalized.includes('compan')) return Building2;
  if (normalized.includes('system') || normalized.includes('audit')) return Activity;
  return Sparkles;
}

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
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand-wrapper">
          <Link href="/" aria-label="Executive Match Home" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Logo size="md" showText={true} />
          </Link>
        </div>

        {label && (
          <div className="workspace-tag">
            <span className="workspace-tag-dot" aria-hidden="true" />
            <span className="workspace-tag-text">{label}</span>
          </div>
        )}

        <nav className="app-nav" aria-label={`${kind} navigation`}>
          {links.map((link) => {
            const Icon = getNavIcon(link.label, link.href);
            const isActive =
              pathname === link.href ||
              (link.href !== '/' &&
                link.href !== '/admin' &&
                link.href !== '/candidate' &&
                !link.href.endsWith('/workspace') &&
                pathname.startsWith(link.href + '/'));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`app-nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={2} className="nav-icon" />
                <span className="nav-label">{link.label}</span>
                {isActive && <span className="nav-active-pill" aria-hidden="true" />}
              </Link>
            );
          })}
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
            <Link href="/login" className="topbar-signout" aria-label="Sign out">
              <LogOut size={14} className="signout-icon" />
              <span>Sign out</span>
            </Link>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
