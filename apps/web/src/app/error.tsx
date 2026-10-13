'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, LifeBuoy } from 'lucide-react';
import { Button } from '@executive-match/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error with optional digest
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="card-3d max-w-lg w-full text-center p-8 sm:p-12 border border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 text-rose-400 mb-6 shadow-inner">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-semibold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 inline-block mb-3">
          Application Error
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-3">
          Something went wrong
        </h1>

        <p className="text-[var(--muted)] text-sm mb-4 max-w-sm mx-auto leading-relaxed">
          An unexpected exception occurred while processing this view. Our observability team has been notified.
        </p>

        {error.digest && (
          <div className="inline-block px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-mono text-[var(--muted)] mb-6">
            Error Digest: <span className="text-emerald-400 font-semibold">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            variant="primary"
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> Return Home
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-[var(--border)] text-xs text-[var(--muted)] flex items-center justify-center gap-2">
          <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
          <span>If this issue persists, please contact Executive Match platform operations.</span>
        </div>
      </div>
    </div>
  );
}
