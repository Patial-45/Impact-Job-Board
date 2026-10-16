'use client';

import { useState } from 'react';
import { Button, Badge, Input } from '@executive-match/ui';
import type { InterviewItem } from '@/lib/api';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  Plus,
  Star,
  AlertCircle,
  X,
  Loader2,
  Building2,
  MapPin,
  ExternalLink,
  FileText,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function WorkspaceInterviews({
  workspaceSlug,
  initialInterviews,
}: {
  workspaceSlug: string;
  initialInterviews: InterviewItem[];
}) {
  const [interviews, setInterviews] = useState<InterviewItem[]>(initialInterviews);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'SCREENING' | 'TECHNICAL' | 'BEHAVIORAL' | 'EXECUTIVE' | 'FINAL'>('TECHNICAL');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [notes, setNotes] = useState('');

  // Scorecard modal state
  const [activeScorecardInterview, setActiveScorecardInterview] = useState<InterviewItem | null>(null);
  const [submittingScorecard, setSubmittingScorecard] = useState(false);
  const [recommendation, setRecommendation] = useState<'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE'>('HIRE');
  const [overallRating, setOverallRating] = useState(4);
  const [technicalRating, setTechnicalRating] = useState(4);
  const [communicationRating, setCommunicationRating] = useState(4);
  const [cultureRating, setCultureRating] = useState(4);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [scorecardNotes, setScorecardNotes] = useState('');

  // Cancel interview modal state
  const [cancellingInterview, setCancellingInterview] = useState<InterviewItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Status/Feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function reloadInterviews() {
    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/interviews`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.items || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleScheduleInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId.trim() || !title.trim() || !scheduledAt) return;
    setScheduling(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/interviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicationId.trim(),
          title: title.trim(),
          type,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: Number(durationMinutes),
          location: location.trim() || undefined,
          timezone,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Interview successfully scheduled.' });
        setIsScheduleOpen(false);
        // Reset form
        setApplicationId('');
        setTitle('');
        setScheduledAt('');
        setLocation('');
        setNotes('');
        await reloadInterviews();
      } else {
        const err = await res.json();
        setFeedbackMsg({
          type: 'error',
          text: err.message?.toString() || 'Failed to schedule interview. Verify application ID.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error scheduling interview.' });
    } finally {
      setScheduling(false);
    }
  }

  async function handleSubmitScorecard(e: React.FormEvent) {
    e.preventDefault();
    if (!activeScorecardInterview) return;
    setSubmittingScorecard(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/interviews/${encodeURIComponent(activeScorecardInterview.id)}/scorecards`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendation,
            overallRating: Number(overallRating),
            technicalRating: Number(technicalRating),
            communicationRating: Number(communicationRating),
            cultureRating: Number(cultureRating),
            strengths: strengths.trim() || undefined,
            weaknesses: weaknesses.trim() || undefined,
            notes: scorecardNotes.trim() || undefined,
          }),
        },
      );

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Evaluation scorecard recorded successfully.' });
        setActiveScorecardInterview(null);
        // Reset
        setStrengths('');
        setWeaknesses('');
        setScorecardNotes('');
        await reloadInterviews();
      } else {
        const err = await res.json();
        setFeedbackMsg({
          type: 'error',
          text: err.message?.toString() || 'Failed to submit scorecard.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error submitting scorecard.' });
    } finally {
      setSubmittingScorecard(false);
    }
  }

  async function handleCancelInterview() {
    if (!cancellingInterview) return;
    setIsCancelling(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/interviews/${encodeURIComponent(cancellingInterview.id)}/cancel`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cancellationReason: cancellationReason.trim() || 'Cancelled by recruiter',
          }),
        },
      );

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Interview marked as cancelled.' });
        setCancellingInterview(null);
        setCancellationReason('');
        await reloadInterviews();
      } else {
        const err = await res.json();
        setFeedbackMsg({ type: 'error', text: err.message?.toString() || 'Failed to cancel interview.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error cancelling interview.' });
    } finally {
      setIsCancelling(false);
    }
  }

  const filteredInterviews = interviews.filter((i) => {
    if (activeTab === 'ALL') return true;
    return i.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header action and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border">
        {/* Filter Tabs */}
        <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40 shadow-sm">
          {(['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'SCHEDULED' && <Clock className="w-3.5 h-3.5 text-primary" />}
              {tab === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              {tab === 'CANCELLED' && <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>
                {tab === 'ALL'
                  ? `All (${interviews.length})`
                  : tab === 'SCHEDULED'
                    ? `Upcoming (${interviews.filter((i) => i.status === 'SCHEDULED').length})`
                    : tab === 'COMPLETED'
                      ? `Completed (${interviews.filter((i) => i.status === 'COMPLETED').length})`
                      : `Cancelled (${interviews.filter((i) => i.status === 'CANCELLED').length})`}
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={() => setIsScheduleOpen(true)}
          className="btn-3d h-10 px-4 text-xs flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview Round</span>
        </Button>
      </div>

      {/* Interview Cards List */}
      {filteredInterviews.length === 0 ? (
        <div className="card-3d p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-primary">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-foreground text-lg">No interviews found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {activeTab === 'ALL'
              ? 'Schedule your first interview round with active applicants in your ATS pipeline.'
              : `No interviews currently in ${activeTab.toLowerCase()} status.`}
          </p>
          {activeTab === 'ALL' && (
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => setIsScheduleOpen(true)}
                className="btn-3d text-xs h-10 px-5"
              >
                Schedule First Interview
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInterviews.map((item) => {
            const candidateName =
              item.application.candidateProfile.user?.profile?.displayName || 'Candidate';
            const candidateInitials = candidateName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const hasScorecard = item.scorecards && item.scorecards.length > 0;
            const avgRating = hasScorecard
              ? (
                  item.scorecards.reduce((acc, curr) => acc + curr.overallRating, 0) /
                  item.scorecards.length
                ).toFixed(1)
              : null;

            return (
              <div
                key={item.id}
                className="card-3d p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 group hover:border-primary/50 transition-all"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Candidate Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 text-primary font-black flex items-center justify-center text-sm shrink-0 shadow-sm">
                    {candidateInitials}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <Badge variant="neutral" className="text-xs">{item.type}</Badge>
                      <Badge
                        variant={
                          item.status === 'SCHEDULED'
                            ? 'accent'
                            : item.status === 'COMPLETED'
                              ? 'success'
                              : 'neutral'
                        }
                        className="text-xs"
                      >
                        {item.status === 'SCHEDULED' && <Clock className="w-3 h-3 mr-1 text-primary inline" />}
                        {item.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500 inline" />}
                        {item.status === 'CANCELLED' && <XCircle className="w-3 h-3 mr-1 text-muted-foreground inline" />}
                        {item.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span>Candidate:</span>
                      <strong className="text-foreground">{candidateName}</strong>
                      <span>•</span>
                      <span>For:</span>
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.application.job.title}
                      </span>
                    </div>

                    {/* Schedule Time & Location */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/80 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {new Date(item.scheduledAt).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({item.durationMinutes} min)
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1.5">
                          {item.location.startsWith('http') ? (
                            <a
                              href={item.location}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-semibold flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Join Video Call</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{item.location}</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground pt-1 line-clamp-2 leading-relaxed">
                        {item.notes}
                      </p>
                    )}

                    {/* Scorecards summary badge */}
                    {hasScorecard && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="font-semibold text-foreground">Scorecard:</span>
                        <Badge variant="success" className="text-xs flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                          <span>{avgRating} / 5.0 Rating</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.scorecards[0]?.recommendation.replace('_', ' ')}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          ({item.scorecards.length} evaluator submitted)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2.5 shrink-0 pt-2 md:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveScorecardInterview(item)}
                    className="btn-3d-secondary text-xs h-9 px-3.5 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>{hasScorecard ? 'Edit Scorecard' : 'Submit Scorecard'}</span>
                  </Button>

                  {item.status === 'SCHEDULED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancellingInterview(item)}
                      className="text-xs h-8 px-2.5 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Cancel Round
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="card-3d w-full max-w-lg p-6 sm:p-7 space-y-5 bg-card border-border shadow-2xl relative">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule Interview Round
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coordinate screening, technical, or executive interviews with an active applicant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Application ID (from ATS Pipeline) *
                </label>
                <Input
                  placeholder="Paste candidate application UUID..."
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  required
                  className="h-10 bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Round Title *
                </label>
                <Input
                  placeholder="e.g. Technical System Architecture Round"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-10 bg-background/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Interview Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(
                        e.target.value as
                          | 'SCREENING'
                          | 'TECHNICAL'
                          | 'BEHAVIORAL'
                          | 'EXECUTIVE'
                          | 'FINAL',
                      )
                    }
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs text-foreground"
                  >
                    <option value="SCREENING">Recruiter Screening</option>
                    <option value="TECHNICAL">Technical Architecture</option>
                    <option value="BEHAVIORAL">Behavioral / Leadership</option>
                    <option value="EXECUTIVE">Executive Alignment</option>
                    <option value="FINAL">Final Panel</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs text-foreground"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Scheduled Date & Time (Local) *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs text-foreground"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern (EST/EDT)</option>
                    <option value="America/Chicago">Central (CST/CDT)</option>
                    <option value="America/Los_Angeles">Pacific (PST/PDT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Meeting URL / Conference Location
                </label>
                <Input
                  placeholder="https://meet.google.com/xyz or Zoom link..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Private Internal Notes / Interviewer Focus
                </label>
                <textarea
                  placeholder="Topics to evaluate, specific questions, or guidance for the hiring team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 p-2.5 rounded-lg border border-border bg-background/80 text-xs text-foreground resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={scheduling}
                  className="btn-3d text-xs h-9 px-4 flex items-center gap-1.5"
                >
                  {scheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  <span>{scheduling ? 'Scheduling...' : 'Confirm Schedule'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scorecard Modal */}
      {activeScorecardInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="card-3d w-full max-w-lg p-6 sm:p-7 space-y-5 bg-card border-border shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  Interview Evaluation Scorecard
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidate:{' '}
                  <strong>
                    {activeScorecardInterview.application.candidateProfile.user?.profile?.displayName}
                  </strong>{' '}
                  • {activeScorecardInterview.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveScorecardInterview(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitScorecard} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Hiring Recommendation *
                </label>
                <select
                  value={recommendation}
                  onChange={(e) =>
                    setRecommendation(
                      e.target.value as
                        | 'STRONG_HIRE'
                        | 'HIRE'
                        | 'NO_HIRE'
                        | 'STRONG_NO_HIRE',
                    )
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground font-bold"
                >
                  <option value="STRONG_HIRE">🌟 Strong Hire</option>
                  <option value="HIRE">✓ Hire</option>
                  <option value="NO_HIRE">✗ No Hire</option>
                  <option value="STRONG_NO_HIRE">🛑 Strong No Hire</option>
                </select>
              </div>

              {/* Rating Scales */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Overall Rating (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={overallRating}
                    onChange={(e) => setOverallRating(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="font-bold text-primary text-center">{overallRating} / 5 Stars</div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Technical Competence</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={technicalRating}
                    onChange={(e) => setTechnicalRating(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="font-bold text-primary text-center">{technicalRating} / 5 Stars</div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Communication</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={communicationRating}
                    onChange={(e) => setCommunicationRating(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="font-bold text-primary text-center">{communicationRating} / 5 Stars</div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Culture & Leadership</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={cultureRating}
                    onChange={(e) => setCultureRating(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="font-bold text-primary text-center">{cultureRating} / 5 Stars</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Key Strengths Observed
                </label>
                <textarea
                  placeholder="Evidence observed during the technical discussion or behavioral scenarios..."
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="w-full h-16 p-2.5 rounded-lg border border-border bg-background text-xs text-foreground resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Areas for Development / Gaps
                </label>
                <textarea
                  placeholder="Concerns or missing technical proficiencies..."
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  className="w-full h-16 p-2.5 rounded-lg border border-border bg-background text-xs text-foreground resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  General Debrief Notes
                </label>
                <textarea
                  placeholder="Additional observations for the hiring committee..."
                  value={scorecardNotes}
                  onChange={(e) => setScorecardNotes(e.target.value)}
                  className="w-full h-16 p-2.5 rounded-lg border border-border bg-background text-xs text-foreground resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setActiveScorecardInterview(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submittingScorecard}
                  className="btn-3d text-xs h-9 px-4 flex items-center gap-1.5"
                >
                  {submittingScorecard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{submittingScorecard ? 'Submitting...' : 'Save Scorecard'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Interview Modal */}
      {cancellingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="card-3d w-full max-w-md p-6 space-y-4 bg-card border-border shadow-2xl relative">
            <h3 className="text-base font-bold text-foreground">Cancel Interview Session</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to cancel &quot;{cancellingInterview.title}&quot;?
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                Reason for Cancellation
              </label>
              <Input
                placeholder="e.g. Candidate withdrew, schedule conflict..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="h-10 bg-background/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingInterview(null)}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCancelInterview}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
