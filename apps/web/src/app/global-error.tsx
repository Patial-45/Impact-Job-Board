'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">Critical System Error</h1>
          <p className="text-neutral-400 text-sm mb-6">
            A fatal error interrupted the core application layout.
          </p>

          {error.digest && (
            <div className="inline-block px-3 py-1 rounded bg-neutral-800 text-xs font-mono text-neutral-400 mb-6">
              Digest: {error.digest}
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reload System
          </button>
        </div>
      </body>
    </html>
  );
}
