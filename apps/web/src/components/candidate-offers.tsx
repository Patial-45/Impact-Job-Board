'use client';

import { useState } from 'react';
import { Card, Button, Badge, Input } from '@executive-match/ui';
import type { CandidateOfferItem, OnboardingTaskItem } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function CandidateOffers({
  initialOffers,
  initialOnboardingTasks,
}: {
  initialOffers: CandidateOfferItem[];
  initialOnboardingTasks: OnboardingTaskItem[];
}) {
  const [offers, setOffers] = useState<CandidateOfferItem[]>(initialOffers);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTaskItem[]>(initialOnboardingTasks);

  // Review & Sign modal state
  const [activeOffer, setActiveOffer] = useState<CandidateOfferItem | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [signing, setSigning] = useState(false);

  // Decline modal state
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  // Feedback notification
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function reloadOffers() {
    try {
      const res = await fetch(`${apiUrl}/candidates/me/offers`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOffers(data.items || []);
      }
      const onboardRes = await fetch(`${apiUrl}/candidates/me/onboarding`, { credentials: 'include' });
      if (onboardRes.ok) {
        const data = await onboardRes.json();
        setOnboardingTasks(data.tasks || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOffer) return;
    if (!consentConfirmed) {
      setFeedbackMsg({
        type: 'error',
        text: 'You must confirm the legal agreement checkbox before submitting your signature.',
      });
      return;
    }

    setSigning(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`${apiUrl}/candidates/me/offers/${encodeURIComponent(activeOffer.id)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signerName: signerName.trim(),
          signatureText: signatureText.trim(),
          consentConfirmed: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit digital signature');
      }

      setFeedbackMsg({
        type: 'success',
        text: '🎉 Congratulations! You have accepted and digitally signed the job offer. Welcome aboard!',
      });
      setActiveOffer(null);
      await reloadOffers();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit signature.',
      });
    } finally {
      setSigning(false);
    }
  }

  async function handleDecline(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOffer) return;
    setDeclining(true);

    try {
      const res = await fetch(`${apiUrl}/candidates/me/offers/${encodeURIComponent(activeOffer.id)}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: declineReason.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to decline offer');
      }

      setFeedbackMsg({ type: 'success', text: 'You have declined this job offer.' });
      setIsDeclineOpen(false);
      setActiveOffer(null);
      setDeclineReason('');
      await reloadOffers();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to decline offer.',
      });
    } finally {
      setDeclining(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const res = await fetch(`${apiUrl}/candidates/me/onboarding/tasks/${encodeURIComponent(taskId)}/complete`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        await reloadOffers();
      }
    } catch {
      // ignore
    }
  }

  const completedCount = onboardingTasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = onboardingTasks.length > 0 ? Math.round((completedCount / onboardingTasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Onboarding Checklist Card (if candidate has active onboarding tasks) */}
      {onboardingTasks.length > 0 && (
        <Card variant="outline" className="p-6 space-y-4 border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="ui-eyebrow text-primary">NEW HIRE JOURNEY</span>
              <h2 className="text-lg font-bold text-foreground">Your Onboarding Checklist</h2>
              <p className="text-xs text-muted-foreground">
                Complete these items before your official start date.
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">
                {completedCount} of {onboardingTasks.length} Completed ({progressPercent}%)
              </span>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mt-1.5 border border-border">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {onboardingTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'COMPLETED'}
                    onChange={() => handleCompleteTask(task.id)}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                  <div>
                    <span
                      className={`font-semibold ${
                        task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <p className="text-[11px] text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant={task.status === 'COMPLETED' ? 'success' : 'neutral'}>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Offers Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground">Job Offers</h2>

        {offers.length === 0 ? (
          <Card className="p-12 text-center border-dashed space-y-3">
            <div className="text-3xl">📫</div>
            <h3 className="text-base font-bold text-foreground">No active job offers yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              When an employer extends an official job offer, it will appear here with full
              compensation details and digital signing capabilities.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((item) => {
              const companyName =
                item.application.job.workspace?.company?.name ||
                item.application.job.workspace?.name ||
                'Company';

              const isSent = item.status === 'SENT';
              const isAccepted = item.status === 'ACCEPTED';

              return (
                <Card
                  key={item.id}
                  variant="outline"
                  className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{item.jobTitle}</h3>
                      <Badge variant={isAccepted ? 'success' : isSent ? 'accent' : 'neutral'}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Company: <strong className="text-foreground">{companyName}</strong> • Location:{' '}
                      <span className="text-foreground">{item.workLocation}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30 border border-border text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                          Base Salary
                        </span>
                        <span className="font-bold text-foreground">
                          {item.currency} ${item.baseSalary.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                          Bonus
                        </span>
                        <span className="text-foreground">{item.bonus || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                          Equity
                        </span>
                        <span className="text-foreground">{item.equity || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                          Start Date
                        </span>
                        <span className="text-foreground">
                          {new Date(item.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {isAccepted && item.signature && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                        ✓ Digitally signed on {new Date(item.signature.signedAt).toLocaleDateString()} by{' '}
                        <strong>{item.signature.signerName}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center gap-2 justify-end">
                    {isSent && (
                      <Button
                        variant="primary"
                        className="text-xs w-full"
                        onClick={() => {
                          setActiveOffer(item);
                          setSignerName('');
                          setSignatureText('');
                          setConsentConfirmed(false);
                        }}
                      >
                        Review & Sign Offer →
                      </Button>
                    )}
                    {isAccepted && (
                      <Badge variant="success" className="px-3 py-1">
                        Offer Accepted
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* REVIEW & SIGN MODAL */}
      {activeOffer && !isDeclineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 bg-background border-border shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="ui-eyebrow text-primary">OFFICIAL JOB OFFER</span>
                <h2 className="text-lg font-bold text-foreground">{activeOffer.jobTitle}</h2>
                <p className="text-xs text-muted-foreground">
                  Extended by{' '}
                  <strong className="text-foreground">
                    {activeOffer.application.job.workspace?.company?.name ||
                      activeOffer.application.job.workspace?.name ||
                      'Employer'}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setActiveOffer(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Compensation Terms Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Annual Base</span>
                <span className="text-base font-bold text-foreground">
                  ${activeOffer.baseSalary.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Bonus</span>
                <span className="font-semibold text-foreground">{activeOffer.bonus || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Equity</span>
                <span className="font-semibold text-foreground">{activeOffer.equity || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Start Date</span>
                <span className="font-semibold text-foreground">
                  {new Date(activeOffer.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Offer Letter Body */}
            {activeOffer.offerLetter && (
              <div className="space-y-2">
                <label className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Letter of Employment Terms
                </label>
                <div className="p-4 rounded-lg bg-muted/20 border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {activeOffer.offerLetter}
                </div>
              </div>
            )}

            {/* Digital Signature Form */}
            <form onSubmit={handleAccept} className="space-y-4 pt-2 border-t border-border text-xs">
              <h3 className="font-bold text-foreground text-sm">Digital Acceptance & Signature</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Legal Full Name *</label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Jane Alexandria Doe"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Type Signature *</label>
                  <Input
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Type your name to digitally sign"
                    required
                    className="font-serif italic"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                  required
                />
                <label htmlFor="consent" className="text-[11px] text-muted-foreground cursor-pointer">
                  I understand that this digital signature is legally binding under the Electronic Signatures in
                  Global and National Commerce Act (ESIGN) and uniform electronic transaction regulations.
                </label>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeclineOpen(true)}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Decline this offer
                </button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveOffer(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={signing || !consentConfirmed}
                  >
                    {signing ? 'Submitting...' : 'Accept & Sign Offer'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DECLINE OFFER MODAL */}
      {isDeclineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 space-y-4 bg-background border-border shadow-2xl">
            <h3 className="text-base font-bold text-foreground">Decline Job Offer</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you wish to decline this offer? This will withdraw your application from consideration.
            </p>

            <form onSubmit={handleDecline} className="space-y-3">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Optional reason for declining (e.g. accepted another offer, relocation issues)..."
                rows={3}
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeclineOpen(false)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={declining}
                >
                  {declining ? 'Declining...' : 'Confirm Decline'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
