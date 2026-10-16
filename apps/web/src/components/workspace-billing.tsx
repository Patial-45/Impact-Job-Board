'use client';

import React, { useState } from 'react';
import { Button, Badge } from '@executive-match/ui';
import type { WorkspaceBillingData } from '@/lib/api';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Users,
  Check,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface WorkspaceBillingProps {
  workspaceSlug: string;
  initialBilling: WorkspaceBillingData | null;
}

export function WorkspaceBilling({ workspaceSlug, initialBilling }: WorkspaceBillingProps) {
  const [data, setData] = useState<WorkspaceBillingData | null>(initialBilling);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!data) {
    return (
      <div className="card-3d p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-primary">
          <CreditCard className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-foreground text-lg">Billing Service Unavailable</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Unable to retrieve subscription and usage data for this workspace at this time.
        </p>
      </div>
    );
  }

  const { subscription, currentUsage, availablePlans } = data;

  const handleUpgrade = async (tier: 'STARTER' | 'GROWTH' | 'ENTERPRISE') => {
    setUpgradingTier(tier);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/billing/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingCycle }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message?.message || errorData.message || 'Failed to update plan');
      }

      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, subscription: updated } : prev));
      setStatusMessage({
        text: `Successfully updated workspace plan to ${tier} (${billingCycle.toLowerCase()})!`,
        type: 'success',
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Plan change failed',
        type: 'error',
      });
    } finally {
      setUpgradingTier(null);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCanceling(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/billing/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message?.message || errorData.message || 'Failed to cancel plan');
      }

      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, subscription: updated } : prev));
      setStatusMessage({
        text: 'Your subscription will not renew at the end of the current billing period.',
        type: 'success',
      });
      setCancelModalOpen(false);
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Cancellation failed',
        type: 'error',
      });
    } finally {
      setCanceling(false);
    }
  };

  const jobUsagePct = Math.min(100, Math.round((currentUsage.activeJobsCount / currentUsage.activeJobLimit) * 100));

  return (
    <div className="space-y-8">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current plan summary & Usage limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-3d p-6 sm:p-7 space-y-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Active Subscription
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <h2 className="text-2xl font-black text-foreground">{subscription.tier} Plan</h2>
                <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'} className="text-xs">
                  {subscription.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Cycle</span>
              <div className="text-sm font-bold text-foreground capitalize">
                {subscription.billingCycle.toLowerCase()}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>
              {subscription.cancelAtPeriodEnd
                ? `Your plan remains active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()} and will not auto-renew.`
                : `Renews automatically on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`}
            </span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
            {/* Active jobs meter */}
            <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-foreground">Active Requisitions</span>
                <span className="text-muted-foreground font-mono">
                  {currentUsage.activeJobsCount} / {currentUsage.activeJobLimit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${jobUsagePct >= 100 ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${jobUsagePct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {currentUsage.activeJobLimit - currentUsage.activeJobsCount} job slots remaining
              </p>
            </div>

            {/* Candidate search meter */}
            <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-foreground">Candidate Discovery Searches</span>
                <span className="text-muted-foreground font-mono">
                  {currentUsage.candidateSearchLimit} / mo
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '25%' }} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Resets on next monthly cycle
              </p>
            </div>
          </div>

          {subscription.tier !== 'STARTER' && !subscription.cancelAtPeriodEnd && (
            <div className="pt-1">
              <Button
                variant="ghost"
                className="text-xs text-red-500 hover:text-red-400 p-0 h-auto font-medium"
                onClick={() => setCancelModalOpen(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </div>

        {/* Team seats overview */}
        <div className="card-3d p-6 sm:p-7 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Workspace Team Seats
            </span>
            <div className="text-3xl font-black text-foreground">{currentUsage.membersCount}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recruiters, hiring managers, and interview evaluators actively collaborating in this workspace.
            </p>
          </div>
          <div className="pt-3 border-t border-border">
            <Badge variant="neutral" className="text-xs">Unlimited Collaborator Seats</Badge>
          </div>
        </div>
      </div>

      {/* Plan selection & comparison grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Available Subscription Tiers
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scale your hiring capacity, unlock AI matching, and enable enterprise ATS webhooks.
            </p>
          </div>

          {/* Billing cycle switch */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                billingCycle === 'ANNUAL'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual</span>
              <span className="text-emerald-500 font-black text-[11px] bg-emerald-500/10 px-1.5 py-0.2 rounded">
                -16%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = subscription.tier === plan.tier;
            const price = billingCycle === 'ANNUAL' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.tier}
                className={`card-3d p-6 sm:p-7 flex flex-col justify-between space-y-6 relative group transition-all ${
                  isCurrent ? 'ring-2 ring-primary border-primary shadow-glow' : ''
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="success" className="text-xs shadow-sm bg-emerald-500 text-white font-bold">
                      Current Active Plan
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                      {plan.name === 'Enterprise' && <Sparkles className="w-4 h-4 text-emerald-400" />}
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl font-black text-foreground">${price}</span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                    {billingCycle === 'ANNUAL' && plan.priceAnnual > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Billed annually (${plan.priceAnnual}/year)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full text-xs h-10" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="btn-3d w-full text-xs h-10 flex items-center justify-center gap-2"
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={upgradingTier !== null}
                    >
                      {upgradingTier === plan.tier ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Switching...</span>
                        </>
                      ) : (
                        <span>Select {plan.name}</span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cancel modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="card-3d w-full max-w-md p-6 sm:p-7 space-y-4 bg-card border-border shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground">Cancel Plan Subscription</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your subscription benefits will remain active until the end of your billing cycle on{' '}
              <strong className="text-foreground">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </strong>
              . After that, your workspace will revert to the Starter tier.
            </p>

            <form onSubmit={handleCancel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason for cancellation (optional)</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tell us what could have been better..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={canceling}
                  className="text-xs"
                >
                  Keep Subscription
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={canceling}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4"
                >
                  {canceling ? 'Canceling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
