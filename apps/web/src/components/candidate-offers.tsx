'use client';

import { useState } from 'react';
import { Card, Button, Badge, Input } from '@executive-match/ui';
import type { CandidateOfferItem, OnboardingTaskItem } from '@/lib/api';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Building2,
  X,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

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
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Onboarding Checklist Card (if candidate has active onboarding tasks) */}
      {onboardingTasks.length > 0 && (
        <Card className="card-3d p-6 space-y-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="ui-eyebrow text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
                  NEW HIRE JOURNEY
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Your Onboarding Checklist</h2>
              <p className="text-xs text-muted-foreground">
                Complete these items before your official start date.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-foreground block">
                {completedCount} of {onboardingTasks.length} Completed ({progressPercent}%)
              </span>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mt-1.5 border border-border">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {onboardingTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl border border-border bg-card/60 backdrop-blur-xs flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'COMPLETED'}
                    onChange={() => handleCompleteTask(task.id)}
                    className="h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">Job Offers</h2>
        </div>

        {offers.length === 0 ? (
          <Card className="card-3d p-12 text-center border-dashed border-border/80 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">No active job offers yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                When an employer extends an official job offer, it will appear here with comprehensive
                compensation breakdown, benefits terms, and digital e-signature capabilities.
              </p>
            </div>
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
                  className="card-3d p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-primary/40 transition-all shadow-sm"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{item.jobTitle}</h3>
                      <Badge variant={isAccepted ? 'success' : isSent ? 'accent' : 'neutral'}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        Company: <strong className="text-foreground">{companyName}</strong>
                      </span>
                      <span>•</span>
                      <span>Location: <span className="text-foreground font-medium">{item.workLocation}</span></span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                          Base Salary
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {item.currency} ${item.baseSalary.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                          Bonus
                        </span>
                        <span className="font-semibold text-foreground">{item.bonus || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                          Equity
                        </span>
                        <span className="font-semibold text-foreground">{item.equity || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                          Start Date
                        </span>
                        <span className="font-semibold text-foreground">
                          {new Date(item.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {isAccepted && item.signature && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Digitally signed on {new Date(item.signature.signedAt).toLocaleDateString()} by{' '}
                          <strong>{item.signature.signerName}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center gap-2 justify-end">
                    {isSent && (
                      <Button
                        variant="primary"
                        className="btn-3d text-xs font-semibold w-full gap-1.5"
                        onClick={() => {
                          setActiveOffer(item);
                          setSignerName('');
                          setSignatureText('');
                          setConsentConfirmed(false);
                        }}
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>Review & Sign Offer</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    {isAccepted && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Offer Accepted</span>
                      </div>
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
          <Card className="card-3d w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 bg-background border-border shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="ui-eyebrow text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
                  OFFICIAL JOB OFFER
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{activeOffer.jobTitle}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extended by{' '}
                  <strong className="text-foreground">
                    {activeOffer.application.job.workspace?.company?.name ||
                      activeOffer.application.job.workspace?.name ||
                      'Employer'}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOffer(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compensation Terms Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                  Annual Base
                </span>
                <span className="text-base font-bold text-foreground">
                  ${activeOffer.baseSalary.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                  Bonus
                </span>
                <span className="font-semibold text-foreground">{activeOffer.bonus || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                  Equity
                </span>
                <span className="font-semibold text-foreground">{activeOffer.equity || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                  Start Date
                </span>
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
                <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {activeOffer.offerLetter}
                </div>
              </div>
            )}

            {/* Digital Signature Form */}
            <form onSubmit={handleAccept} className="space-y-4 pt-2 border-t border-border text-xs">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-foreground text-sm">Digital Acceptance & Signature</h3>
              </div>

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
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/30 border border-border">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  required
                />
                <label htmlFor="consent" className="text-[11px] text-muted-foreground cursor-pointer leading-relaxed">
                  I understand that this digital signature is legally binding under the Electronic Signatures in
                  Global and National Commerce Act (ESIGN) and uniform electronic transaction regulations.
                </label>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeclineOpen(true)}
                  className="text-xs text-red-500 hover:text-red-400 underline transition-colors"
                >
                  Decline this offer
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-3d-secondary text-xs"
                    onClick={() => setActiveOffer(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="btn-3d text-xs font-semibold"
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
          <Card className="card-3d w-full max-w-md p-6 space-y-4 bg-background border-border shadow-2xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-foreground">Decline Job Offer</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Are you sure you wish to decline this offer? This will withdraw your application from consideration.
            </p>

            <form onSubmit={handleDecline} className="space-y-3">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Optional reason for declining (e.g. accepted another offer, relocation issues)..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-input bg-background text-xs text-foreground resize-none focus:ring-1 focus:ring-primary outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="btn-3d-secondary text-xs"
                  onClick={() => setIsDeclineOpen(false)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="btn-3d text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
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
