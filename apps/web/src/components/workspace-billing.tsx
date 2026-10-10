'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@executive-match/ui';
import type { WorkspaceBillingData } from '@/lib/api';

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
      <Card className="p-12 text-center border-dashed">
        <h3 className="font-bold text-foreground">Billing Service Unavailable</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Unable to retrieve subscription and usage data for this workspace.
        </p>
      </Card>
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
          className={`p-4 rounded-md text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Current plan summary & Usage limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Current Subscription
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-black text-foreground">{subscription.tier} Plan</h2>
                <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {subscription.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Billing Cycle</span>
              <div className="text-sm font-bold text-foreground capitalize">
                {subscription.billingCycle.toLowerCase()}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {subscription.cancelAtPeriodEnd
              ? `Your plan is active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()} and will not auto-renew.`
              : `Renews automatically on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            {/* Active jobs meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Active Requisitions</span>
                <span className="text-muted-foreground font-mono">
                  {currentUsage.activeJobsCount} / {currentUsage.activeJobLimit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${jobUsagePct >= 100 ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${jobUsagePct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {currentUsage.activeJobLimit - currentUsage.activeJobsCount} job slots remaining
              </p>
            </div>

            {/* Candidate search meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Candidate Discovery Searches</span>
                <span className="text-muted-foreground font-mono">
                  {currentUsage.candidateSearchLimit} / mo
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '25%' }} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Resets each billing cycle
              </p>
            </div>
          </div>

          {subscription.tier !== 'STARTER' && !subscription.cancelAtPeriodEnd && (
            <div className="pt-2">
              <Button
                variant="ghost"
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-0 h-auto"
                onClick={() => setCancelModalOpen(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </Card>

        {/* Team seats overview */}
        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Workspace Team
            </span>
            <div className="text-3xl font-black text-foreground">{currentUsage.membersCount}</div>
            <p className="text-xs text-muted-foreground">
              Recruiters, hiring managers, and evaluators collaborating in this workspace.
            </p>
          </div>
          <div className="pt-3 border-t border-border">
            <Badge variant="neutral">Unlimited Collaborator Seats</Badge>
          </div>
        </Card>
      </div>

      {/* Plan selection & comparison grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Available Subscription Plans</h2>
            <p className="text-sm text-muted-foreground">
              Scale your hiring capacity, unlock AI matching, and enable compliance workflows.
            </p>
          </div>

          {/* Billing cycle switch */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted border border-border">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                billingCycle === 'MONTHLY'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                billingCycle === 'ANNUAL'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual <span className="text-emerald-600 font-bold ml-0.5">(-16%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = subscription.tier === plan.tier;
            const price = billingCycle === 'ANNUAL' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

            return (
              <Card
                key={plan.tier}
                variant={isCurrent ? 'default' : 'outline'}
                className={`p-6 flex flex-col justify-between space-y-6 relative ${
                  isCurrent ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="success">Current Active Plan</Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground">${price}</span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                    {billingCycle === 'ANNUAL' && plan.priceAnnual > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Billed annually (${plan.priceAnnual}/year)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full text-xs" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full text-xs"
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={upgradingTier !== null}
                    >
                      {upgradingTier === plan.tier ? 'Switching...' : `Select ${plan.name}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Cancel modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-card border-border shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Cancel Plan Subscription</h3>
            <p className="text-xs text-muted-foreground">
              Your subscription benefits will remain active until the end of your billing cycle on{' '}
              <strong className="text-foreground">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </strong>
              . After that, your workspace will revert to the Starter plan.
            </p>

            <form onSubmit={handleCancel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason for cancellation (optional)</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tell us what could have been better..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={canceling}
                >
                  Keep Subscription
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={canceling}
                >
                  {canceling ? 'Canceling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
