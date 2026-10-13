import React from 'react';
import Link from 'next/link';
import { Compass, Briefcase, Home, Search } from 'lucide-react';
import { Button } from '@executive-match/ui';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="card-3d max-w-lg w-full text-center p-8 sm:p-12 border border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 mb-6 shadow-inner">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mb-3">
          Error 404
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-3">
          Page not found
        </h1>

        <p className="text-[var(--muted)] text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          The executive requisition, dossier, or resource you are looking for does not exist or has been relocated.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link href="/">
            <Button variant="primary" className="w-full sm:w-auto inline-flex items-center gap-2">
              <Home className="w-4 h-4" /> Return Home
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" className="w-full sm:w-auto inline-flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Discover Jobs
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-[var(--border)] text-xs text-[var(--muted)] flex items-center justify-center gap-2">
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span>Need help? Check our open requisitions or contact platform support.</span>
        </div>
      </div>
    </div>
  );
}
