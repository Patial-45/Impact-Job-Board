import type { Metadata } from 'next';
import { ShieldCheck, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { LogoMark } from '@executive-match/ui';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Create an account · Executive Match' };

export default function RegisterPage() {
  return (
    <main className="auth-page min-h-[calc(100vh-86px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Form Panel */}
        <section className="lg:col-span-6 card-3d rounded-2xl p-8 sm:p-10 bg-white border border-gray-200/90 shadow-xl">
          <div className="mb-6">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 inline-block mb-2">
              GET STARTED
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Make your next move.
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create an account to join the Executive Match network.
            </p>
          </div>

          <AuthForm mode="register" />
        </section>

        {/* Right 3D Visual Showcase Aside */}
        <aside className="lg:col-span-6 card-3d rounded-2xl p-8 sm:p-10 bg-gradient-to-br from-emerald-950 via-teal-950 to-gray-950 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md">
                <LogoMark size="md" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base tracking-tight text-white">
                  EXECUTIVE MATCH
                </div>
                <div className="text-[11px] font-mono text-emerald-300">
                  Career Narrative & Evidence
                </div>
              </div>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug mb-3">
              A better match begins with comprehensive context.
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed mb-6">
              Build your executive profile with verified engineering scale, leadership scope, and career
              trajectories. Be ready when tier-one companies evaluate candidates.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Structured professional dossier with verified taxonomy</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transparent match explanations before applying</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100 bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Granular privacy controls & search visibility toggle</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs text-emerald-300/80 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Private & Secure By Default
            </span>
            <span>Free for Candidates</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
