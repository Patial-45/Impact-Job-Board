'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Textarea } from '@executive-match/ui';
import type { ApplicationData } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const PIPELINE_COLUMNS: Array<{ key: string; label: string; nextStage?: string }> = [
  { key: 'APPLIED', label: 'Applied', nextStage: 'SCREENING' },
  { key: 'SCREENING', label: 'Screening', nextStage: 'INTERVIEW' },
  { key: 'INTERVIEW', label: 'Interview', nextStage: 'OFFER' },
  { key: 'OFFER', label: 'Offer', nextStage: 'HIRED' },
  { key: 'HIRED', label: 'Hired' },
];

export function AtsPipelineBoard({
  workspaceSlug,
  jobSlug,
  jobTitle,
  initialApplications,
}: {
  workspaceSlug: string;
  jobSlug: string;
  jobTitle: string;
  initialApplications: ApplicationData[];
}) {
  const [applications, setApplications] = useState(applicationsNormalize(initialApplications));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailData, setDetailData] = useState<ApplicationData | null>(null);

  // Note form state
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Reject modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Helper to ensure stage uppercase
  function applicationsNormalize(apps: ApplicationData[]) {
    return apps.map((a) => ({
      ...a,
      currentStage: a.currentStage ? a.currentStage.toUpperCase() : 'APPLIED',
    }));
  }

  // Filter applications by search
  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = app.candidateProfile?.user?.profile?.displayName?.toLowerCase() || '';
    const email = app.candidateProfile?.user?.email?.toLowerCase() || '';
    const headline = app.candidateProfile?.headline?.toLowerCase() || '';
    const skills = app.candidateProfile?.skills?.map((s) => s.name.toLowerCase()).join(' ') || '';
    return name.includes(q) || email.includes(q) || headline.includes(q) || skills.includes(q);
  });

  const handleAdvanceStage = async (appId: string, nextStage: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/applications/${encodeURIComponent(appId)}/stage`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            stage: nextStage,
            notes: `Candidate moved to ${nextStage}`,
          }),
        },
      );

      if (response.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  currentStage: nextStage.toUpperCase(),
                  status:
                    nextStage === 'HIRED'
                      ? 'HIRED'
                      : nextStage === 'OFFER'
                      ? 'OFFERED'
                      : nextStage === 'INTERVIEW'
                      ? 'INTERVIEWING'
                      : 'IN_REVIEW',
                }
              : a,
          ),
        );
        if (selectedApp?.id === appId) {
          fetchApplicationDetail(appId);
        }
      }
    } catch {
      // Handle error
    }
  };

  const handleReject = async (appId: string) => {
    setSubmittingReject(true);
    try {
      const response = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/applications/${encodeURIComponent(appId)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'REJECTED',
            reason: rejectReason.trim() || undefined,
          }),
        },
      );

      if (response.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === appId
              ? { ...a, status: 'REJECTED', rejectedReason: rejectReason }
              : a,
          ),
        );
        setRejectingAppId(null);
        setRejectReason('');
        if (selectedApp?.id === appId) {
          fetchApplicationDetail(appId);
        }
      }
    } catch {
      // Handle error
    } finally {
      setSubmittingReject(false);
    }
  };

  const fetchApplicationDetail = async (appId: string) => {
    setSelectedApp(applications.find((a) => a.id === appId) || null);
    setLoadingDetail(true);
    try {
      const response = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/applications/${encodeURIComponent(appId)}`,
        {
          credentials: 'include',
        },
      );
      if (response.ok) {
        const data = await response.json();
        setDetailData(data);
      }
    } catch {
      // Handle error
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailData || !noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const response = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/applications/${encodeURIComponent(detailData.id)}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: noteContent.trim() }),
        },
      );

      if (response.ok) {
        const newNote = await response.json();
        setDetailData((prev) =>
          prev
            ? {
                ...prev,
                notes: [newNote, ...(prev.notes || [])],
              }
            : null,
        );
        setNoteContent('');
      }
    } catch {
      // Handle error
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/workspace/${workspaceSlug}/jobs`}
              className="text-xs font-semibold text-primary hover:underline inline-block"
            >
              ← Back to Job Requisitions
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <Link
              href={`/jobs/${jobSlug}`}
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground inline-block"
            >
              Public Listing ↗
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{jobTitle}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recruiter ATS Pipeline • {applications.length} Candidates Total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by candidate name, skill, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground w-64 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {PIPELINE_COLUMNS.map((col) => {
          const colApps = filteredApps.filter(
            (a) => a.currentStage === col.key && a.status !== 'REJECTED' && a.status !== 'WITHDRAWN',
          );

          return (
            <div
              key={col.key}
              className="bg-card/50 rounded-xl border border-border p-3 space-y-3 min-h-[500px] flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {col.label}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colApps.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                    No candidates
                  </div>
                ) : (
                  colApps.map((app) => (
                    <Card
                      key={app.id}
                      variant="outline"
                      className="p-3.5 space-y-3 hover:border-primary/50 transition-colors shadow-sm bg-card"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4
                            onClick={() => fetchApplicationDetail(app.id)}
                            className="text-xs font-bold text-foreground hover:text-primary cursor-pointer truncate max-w-[150px]"
                          >
                            {app.candidateProfile?.user?.profile?.displayName || 'Applicant'}
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(app.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {app.candidateProfile?.headline && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {app.candidateProfile.headline}
                          </p>
                        )}
                      </div>

                      {/* Skills pills */}
                      {app.candidateProfile?.skills && app.candidateProfile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.candidateProfile.skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Resume & Notes Indicators */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1">
                          {app.resume ? '📄 Resume' : 'No Resume'}
                        </span>
                        <span>
                          💬 {app._count?.notes || 0} note{app._count?.notes === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {col.nextStage && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[10px] py-1 px-2 flex-1 h-7"
                            onClick={() => handleAdvanceStage(app.id, col.nextStage!)}
                          >
                            Advance →
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] py-1 px-2 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setRejectingAppId(app.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] py-1 px-2 h-7"
                          onClick={() => fetchApplicationDetail(app.id)}
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejected / Withdrawn Section */}
      {filteredApps.some((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN') && (
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Disqualified & Withdrawn ({filteredApps.filter((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {filteredApps
              .filter((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN')
              .map((app) => (
                <Card key={app.id} variant="outline" className="p-3 space-y-2 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {app.candidateProfile?.user?.profile?.displayName || 'Applicant'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {app.rejectedReason || app.withdrawnReason || 'No reason specified'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] w-full py-1 h-6"
                    onClick={() => fetchApplicationDetail(app.id)}
                  >
                    View Record
                  </Button>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Candidate Dossier Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {detailData?.candidateProfile?.user?.profile?.displayName || 'Candidate Profile'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {detailData?.candidateProfile?.user?.email} • Applied on{' '}
                  {new Date(selectedApp.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setDetailData(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading dossier...</div>
            ) : detailData ? (
              <div className="space-y-6 text-xs">
                {/* Stage & Status Badges */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground">Pipeline Stage:</span>
                    <Badge variant="accent">{detailData.currentStage}</Badge>
                    <Badge variant="neutral">{detailData.status}</Badge>
                  </div>

                  {detailData.resumeDownloadUrl && (
                    <a
                      href={detailData.resumeDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90"
                    >
                      Download Resume ↗
                    </a>
                  )}
                </div>

                {/* Candidate Overview */}
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                    Candidate Overview
                  </h4>
                  <div className="p-3.5 rounded-lg border border-border space-y-2">
                    {detailData.candidateProfile?.headline && (
                      <p className="font-semibold text-foreground text-sm">
                        {detailData.candidateProfile.headline}
                      </p>
                    )}
                    {detailData.candidateProfile?.bio && (
                      <p className="text-muted-foreground leading-relaxed">
                        {detailData.candidateProfile.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-muted-foreground pt-1">
                      {detailData.candidateProfile?.location && (
                        <span>📍 {detailData.candidateProfile.location}</span>
                      )}
                      {detailData.candidateProfile?.yearsOfExperience !== null && (
                        <span>⏳ {detailData.candidateProfile?.yearsOfExperience} years experience</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Note */}
                {detailData.coverLetter && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      Candidate Pitch / Cover Letter
                    </h4>
                    <div className="p-3.5 rounded-lg bg-muted/30 border border-border whitespace-pre-line text-foreground/90">
                      {detailData.coverLetter}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {detailData.candidateProfile?.experiences &&
                  detailData.candidateProfile.experiences.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                        Career History
                      </h4>
                      <div className="space-y-2">
                        {detailData.candidateProfile.experiences.map((exp) => (
                          <div key={exp.id} className="p-3 rounded-lg border border-border space-y-1">
                            <div className="flex justify-between font-semibold text-foreground">
                              <span>{exp.title}</span>
                              <span className="text-muted-foreground font-normal">
                                {new Date(exp.startDate).getFullYear()} -{' '}
                                {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                              </span>
                            </div>
                            <p className="text-primary font-medium">{exp.companyName}</p>
                            {exp.description && (
                              <p className="text-muted-foreground pt-1">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Skills */}
                {detailData.candidateProfile?.skills &&
                  detailData.candidateProfile.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                        Skills & Competencies
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {detailData.candidateProfile.skills.map((skill, idx) => (
                          <Badge key={idx} variant={skill.isPrimary ? 'accent' : 'neutral'}>
                            {skill.name} {skill.yearsOfExperience ? `(${skill.yearsOfExperience}y)` : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Recruiter Private Notes */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                    Internal Recruiter Notes ({detailData.notes?.length || 0})
                  </h4>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Add confidential evaluation note for the team..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={submittingNote || !noteContent.trim()}
                      >
                        {submittingNote ? 'Adding...' : 'Post Note'}
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailData.notes && detailData.notes.length > 0 ? (
                      detailData.notes.map((n) => (
                        <div key={n.id} className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {n.author?.profile?.displayName || n.author?.email || 'Recruiter'}
                            </span>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-foreground/90 whitespace-pre-line">{n.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No notes posted yet.</p>
                    )}
                  </div>
                </div>

                {/* Stage Audit History */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                    Stage Audit Trail
                  </h4>
                  <div className="space-y-1.5">
                    {detailData.stageHistory?.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-[11px] text-muted-foreground py-1 border-b border-border/40 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{h.stage}</span>
                          {h.notes && <span>• {h.notes}</span>}
                        </div>
                        <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Disqualify Candidate</h3>
            <p className="text-xs text-muted-foreground">
              Mark this candidate as REJECTED. They will be moved out of active interview stages.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reason for Rejection <span className="text-muted-foreground font-normal">(Internal or applicant facing)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                placeholder="e.g. Compensation expectations out of band, lack of required cloud experience"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setRejectingAppId(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(rejectingAppId)}
                disabled={submittingReject}
              >
                {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
