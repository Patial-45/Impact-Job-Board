'use client';

import { useState } from 'react';
import { Card, Button, Badge, Input } from '@executive-match/ui';
import type { OfferItem } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function WorkspaceOffers({
  workspaceSlug,
  initialOffers,
}: {
  workspaceSlug: string;
  initialOffers: OfferItem[];
}) {
  const [offers, setOffers] = useState<OfferItem[]>(initialOffers);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Create offer modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [baseSalary, setBaseSalary] = useState(180000);
  const [currency, setCurrency] = useState('USD');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');
  const [signOnBonus, setSignOnBonus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [workLocation, setWorkLocation] = useState('Remote / Hybrid');
  const [offerLetter, setOfferLetter] = useState('');
  const [notes, setNotes] = useState('');

  // Selected Offer Detail modal state
  const [activeOffer, setActiveOffer] = useState<OfferItem | null>(null);

  // Rescind modal state
  const [rescindingOffer, setRescindingOffer] = useState<OfferItem | null>(null);
  const [rescindReason, setRescindReason] = useState('');
  const [isRescinding, setIsRescinding] = useState(false);

  // Add task state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('GENERAL');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function reloadOffers() {
    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOffers(data.items || []);
      }
    } catch {
      // silently handle reload errors
    }
  }

  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFeedbackMsg(null);

    try {
      const payload: Record<string, unknown> = {
        applicationId,
        jobTitle,
        baseSalary: Number(baseSalary),
        currency,
        bonus: bonus ? bonus.trim() : null,
        equity: equity ? equity.trim() : null,
        signOnBonus: signOnBonus ? Number(signOnBonus) : null,
        startDate: new Date(startDate).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        workLocation,
        offerLetter: offerLetter ? offerLetter.trim() : null,
        notes: notes ? notes.trim() : null,
      };

      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate offer');
      }

      setFeedbackMsg({ type: 'success', text: 'Job offer drafted successfully.' });
      setIsCreateOpen(false);
      resetCreateForm();
      await reloadOffers();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to draft job offer.',
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(offerId: string) {
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(offerId)}/approve`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to approve offer');
      setFeedbackMsg({ type: 'success', text: 'Offer approved internally.' });
      await reloadOffers();
      if (activeOffer?.id === offerId) {
        setActiveOffer((prev) => (prev ? { ...prev, approvedAt: new Date().toISOString() } : null));
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to approve offer.',
      });
    }
  }

  async function handleSend(offerId: string) {
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(offerId)}/send`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to dispatch offer to candidate');
      setFeedbackMsg({ type: 'success', text: 'Official offer letter dispatched to candidate.' });
      await reloadOffers();
      if (activeOffer?.id === offerId) {
        setActiveOffer((prev) =>
          prev ? { ...prev, status: 'SENT', sentAt: new Date().toISOString() } : null,
        );
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send offer.',
      });
    }
  }

  async function handleRescind(e: React.FormEvent) {
    e.preventDefault();
    if (!rescindingOffer) return;
    setIsRescinding(true);

    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(rescindingOffer.id)}/rescind`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason: rescindReason }),
        },
      );
      if (!res.ok) throw new Error('Failed to rescind offer');
      setFeedbackMsg({ type: 'success', text: 'Job offer rescinded.' });
      setRescindingOffer(null);
      setRescindReason('');
      await reloadOffers();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to rescind offer.',
      });
    } finally {
      setIsRescinding(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOffer) return;
    setAddingTask(true);

    try {
      const payload: Record<string, unknown> = {
        title: taskTitle.trim(),
        category: taskCategory,
        required: true,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      };

      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(activeOffer.id)}/tasks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error('Failed to add onboarding task');
      setFeedbackMsg({ type: 'success', text: 'Onboarding task added.' });
      setIsAddTaskOpen(false);
      setTaskTitle('');
      setTaskDueDate('');

      // Refresh offer details
      const detailRes = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(activeOffer.id)}`,
        { credentials: 'include' },
      );
      if (detailRes.ok) {
        const data = await detailRes.json();
        setActiveOffer(data.offer);
      }
      await reloadOffers();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add task.',
      });
    } finally {
      setAddingTask(false);
    }
  }

  async function handleToggleTaskStatus(taskId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/tasks/${encodeURIComponent(taskId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      if (!res.ok) throw new Error('Failed to update task status');

      if (activeOffer) {
        const detailRes = await fetch(
          `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/offers/${encodeURIComponent(activeOffer.id)}`,
          { credentials: 'include' },
        );
        if (detailRes.ok) {
          const data = await detailRes.json();
          setActiveOffer(data.offer);
        }
      }
    } catch {
      // ignore
    }
  }

  function resetCreateForm() {
    setApplicationId('');
    setJobTitle('');
    setBaseSalary(180000);
    setBonus('');
    setEquity('');
    setSignOnBonus('');
    setStartDate('');
    setExpiresAt('');
    setOfferLetter('');
    setNotes('');
  }

  const filteredOffers =
    activeTab === 'ALL' ? offers : offers.filter((o) => o.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border">
          {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'RESCINDED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {tab === 'ALL'
                ? `All (${offers.length})`
                : `${tab} (${offers.filter((o) => o.status === tab).length})`}
            </button>
          ))}
        </div>

        <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="text-xs">
          + Draft Job Offer
        </Button>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3">
          <div className="text-3xl">📜</div>
          <h3 className="text-base font-bold text-foreground">No job offers found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {activeTab === 'ALL'
              ? 'No offers have been generated yet. Select a qualified candidate from your ATS pipeline to draft an official offer.'
              : `No offers currently in ${activeTab} status.`}
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="text-xs">
              Create First Offer
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((item) => {
            const candidateName =
              item.application.candidateProfile?.user?.profile?.displayName ||
              item.application.candidateProfile?.user?.email ||
              'Candidate';

            const isAccepted = item.status === 'ACCEPTED';
            const isSent = item.status === 'SENT';
            const isDraft = item.status === 'DRAFT' || item.status === 'PENDING_APPROVAL';

            return (
              <Card
                key={item.id}
                variant="outline"
                className="p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{item.jobTitle}</h3>
                      <p className="text-xs text-muted-foreground">
                        Candidate: <strong className="text-foreground">{candidateName}</strong>
                      </p>
                    </div>
                    <Badge
                      variant={
                        isAccepted
                          ? 'success'
                          : isSent
                            ? 'accent'
                            : item.status === 'RESCINDED'
                              ? 'neutral'
                              : 'neutral'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-md bg-muted/30 border border-border text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                        Base Salary
                      </span>
                      <span className="font-bold text-foreground">
                        {item.currency} ${item.baseSalary.toLocaleString()}
                      </span>
                    </div>
                    {item.bonus && (
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                          Bonus
                        </span>
                        <span className="text-foreground">{item.bonus}</span>
                      </div>
                    )}
                    {item.equity && (
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                          Equity
                        </span>
                        <span className="text-foreground">{item.equity}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                        Target Start
                      </span>
                      <span className="text-foreground">
                        {new Date(item.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {item.signature && (
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
                      <span>✍️ Signed by: {item.signature.signerName}</span>
                      <span className="text-[10px] opacity-80">
                        {new Date(item.signature.signedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {item._count && item._count.onboardingTasks > 0 && (
                    <div className="text-[11px] text-muted-foreground">
                      📋 {item._count.onboardingTasks} Onboarding Tasks configured
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => setActiveOffer(item)}
                  >
                    View Details
                  </Button>

                  {isDraft && (
                    <>
                      {!item.approvedAt && (
                        <Button
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleApprove(item.id)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        className="text-xs"
                        onClick={() => handleSend(item.id)}
                      >
                        Send Offer →
                      </Button>
                    </>
                  )}

                  {(isDraft || isSent) && (
                    <Button
                      variant="outline"
                      className="text-xs text-red-400 hover:text-red-300 ml-auto"
                      onClick={() => setRescindingOffer(item)}
                    >
                      Rescind
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 bg-background border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Draft Official Job Offer</h2>
                <p className="text-xs text-muted-foreground">
                  Specify compensation terms, start date, and legal agreement.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Application ID *
                </label>
                <Input
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="UUID of candidate application"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Official Job Title *
                </label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Principal Staff Software Engineer"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Base Annual Salary ($) *
                  </label>
                  <Input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Currency
                  </label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Bonus Details
                  </label>
                  <Input
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    placeholder="e.g. 20% annual performance bonus"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Equity Grant
                  </label>
                  <Input
                    value={equity}
                    onChange={(e) => setEquity(e.target.value)}
                    placeholder="e.g. 0.5% ISO options (4y vest)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Sign-on Bonus ($)
                  </label>
                  <Input
                    type="number"
                    value={signOnBonus}
                    onChange={(e) => setSignOnBonus(e.target.value)}
                    placeholder="e.g. 25000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Work Location *
                  </label>
                  <Input
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Hybrid - New York, NY"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Target Start Date *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Offer Expiry Date *
                  </label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Offer Letter Content (Markdown)
                </label>
                <textarea
                  value={offerLetter}
                  onChange={(e) => setOfferLetter(e.target.value)}
                  placeholder="Official congratulatory note and terms summary..."
                  rows={4}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Internal Recruiter Notes
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Confidential approval notes or compensation rationale"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Drafting...' : 'Save Draft Offer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* OFFER DETAILS & ONBOARDING MODAL */}
      {activeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 bg-background border-border shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{activeOffer.jobTitle}</h2>
                  <Badge variant={activeOffer.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                    {activeOffer.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Offer ID: <span className="font-mono">{activeOffer.id}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveOffer(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Compensation breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Base</span>
                <span className="text-sm font-bold text-foreground">
                  ${activeOffer.baseSalary.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Bonus</span>
                <span className="font-medium text-foreground">{activeOffer.bonus || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Equity</span>
                <span className="font-medium text-foreground">{activeOffer.equity || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Start Date</span>
                <span className="font-medium text-foreground">
                  {new Date(activeOffer.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Signature Certificate if Accepted */}
            {activeOffer.signature && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">✅ Legally Signed E-Signature</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(activeOffer.signature.signedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Signer: <strong className="text-foreground">{activeOffer.signature.signerName}</strong> ({activeOffer.signature.signerEmail})
                </div>
                <div className="font-serif italic text-base text-foreground pl-2 border-l-2 border-emerald-500">
                  {activeOffer.signature.signatureText}
                </div>
              </div>
            )}

            {/* Onboarding Checklist Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Onboarding Checklist</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Required verification and preparation tasks for this candidate.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsAddTaskOpen(!isAddTaskOpen)}
                >
                  {isAddTaskOpen ? 'Cancel' : '+ Add Task'}
                </Button>
              </div>

              {/* Add task inline form */}
              {isAddTaskOpen && (
                <form
                  onSubmit={handleAddTask}
                  className="p-3.5 rounded-lg bg-muted/30 border border-border space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Task Title *</label>
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Verify legal identity & right to work"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Category</label>
                      <select
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        className="w-full h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground"
                      >
                        <option value="GENERAL">General</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="DOCUMENTATION">Documentation</option>
                        <option value="IT_SETUP">IT & Hardware</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Due Date</label>
                      <Input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" disabled={addingTask} className="w-full text-xs">
                    {addingTask ? 'Adding...' : 'Save Task to Checklist'}
                  </Button>
                </form>
              )}

              {/* Task list */}
              {(!activeOffer.onboardingTasks || activeOffer.onboardingTasks.length === 0) ? (
                <p className="text-xs text-muted-foreground italic p-3 text-center bg-muted/20 rounded border border-border">
                  No onboarding tasks added yet. When candidate accepts the offer, standard tasks are auto-seeded.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeOffer.onboardingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-3 text-xs hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'COMPLETED'}
                          onChange={() => handleToggleTaskStatus(task.id, task.status)}
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
                          <span className="text-[10px] text-muted-foreground block">
                            {task.category} {task.dueDate ? `• Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                      </div>
                      <Badge variant={task.status === 'COMPLETED' ? 'success' : 'neutral'}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setActiveOffer(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* RESCIND MODAL */}
      {rescindingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 space-y-4 bg-background border-border shadow-2xl">
            <h3 className="text-base font-bold text-foreground">Rescind Job Offer</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to rescind the offer for{' '}
              <strong className="text-foreground">{rescindingOffer.jobTitle}</strong>? Please provide
              an explicit reason for the audit log.
            </p>

            <form onSubmit={handleRescind} className="space-y-3">
              <textarea
                value={rescindReason}
                onChange={(e) => setRescindReason(e.target.value)}
                placeholder="Reason for rescinding (e.g. Requisition cancelled, business restructuring)..."
                required
                rows={3}
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRescindingOffer(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isRescinding}
                >
                  {isRescinding ? 'Rescinding...' : 'Confirm Rescind'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
