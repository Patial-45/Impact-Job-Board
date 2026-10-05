'use client';

import { useState } from 'react';
import { Card, Button, Badge, Input } from '@executive-match/ui';
import type { CandidateSearchResult, JobData } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function CandidateSearch({
  workspaceSlug,
  jobs,
  initialCandidates,
  initialTotal,
}: {
  workspaceSlug: string;
  jobs: JobData[];
  initialCandidates: CandidateSearchResult[];
  initialTotal: number;
}) {
  const [candidates, setCandidates] = useState<CandidateSearchResult[]>(initialCandidates);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  // Filters
  const [query, setQuery] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [minExp, setMinExp] = useState<string>('');
  const [openToRemote, setOpenToRemote] = useState<boolean | undefined>(undefined);
  const [selectedJobSlug, setSelectedJobSlug] = useState<string>('');

  // Selected candidate for talent dossier modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSearchResult | null>(null);

  // Bookmark loading state
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [bookmarkNotes, setBookmarkNotes] = useState<string>('');

  async function performSearch(overrideJobSlug?: string) {
    setLoading(true);
    try {
      const activeJob = overrideJobSlug !== undefined ? overrideJobSlug : selectedJobSlug;
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (skills.length > 0) params.set('skills', skills.join(','));
      if (minExp) params.set('minExperience', minExp);
      if (openToRemote !== undefined) params.set('openToRemote', String(openToRemote));
      if (activeJob) params.set('jobSlug', activeJob);

      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/candidates/search?${params.toString()}`,
        {
          credentials: 'include',
        },
      );

      if (res.ok) {
        const data = await res.json();
        setCandidates(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Keep previous candidates on error
    } finally {
      setLoading(false);
    }
  }

  function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      const newSkills = [...skills, trimmed];
      setSkills(newSkills);
      setSkillInput('');
    }
  }

  function handleRemoveSkill(s: string) {
    const newSkills = skills.filter((item) => item !== s);
    setSkills(newSkills);
  }

  async function handleToggleSave(cand: CandidateSearchResult) {
    setBookmarkingId(cand.id);
    try {
      if (cand.isSaved) {
        // Unsave
        const res = await fetch(
          `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/candidates/${encodeURIComponent(cand.id)}/save`,
          {
            method: 'DELETE',
            credentials: 'include',
          },
        );
        if (res.ok) {
          setCandidates((prev) =>
            prev.map((c) => (c.id === cand.id ? { ...c, isSaved: false, savedCandidateId: null } : c)),
          );
          if (selectedCandidate?.id === cand.id) {
            setSelectedCandidate((prev) => (prev ? { ...prev, isSaved: false, savedCandidateId: null } : null));
          }
        }
      } else {
        // Save
        const res = await fetch(
          `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/candidates/${encodeURIComponent(cand.id)}/save`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: bookmarkNotes || undefined }),
          },
        );
        if (res.ok) {
          const data = await res.json();
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === cand.id ? { ...c, isSaved: true, savedCandidateId: data.savedCandidate?.id } : c,
            ),
          );
          if (selectedCandidate?.id === cand.id) {
            setSelectedCandidate((prev) =>
              prev ? { ...prev, isSaved: true, savedCandidateId: data.savedCandidate?.id } : null,
            );
          }
        }
      }
    } finally {
      setBookmarkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Card */}
      <Card variant="outline" className="p-6 space-y-5 bg-card/60 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Search Talent
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, headline, experience, or keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                className="w-full"
              />
              <Button variant="primary" onClick={() => performSearch()} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Match Against Requisition
            </label>
            <select
              value={selectedJobSlug}
              onChange={(e) => {
                const slug = e.target.value;
                setSelectedJobSlug(slug);
                performSearch(slug);
              }}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">No Requisition Selected</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.slug}>
                  {job.title} ({job.remoteType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Skill tags & filters */}
        <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Required / Preferred Skills</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. TypeScript, React, PostgreSQL..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="text-xs h-9"
              />
              <Button variant="outline" size="sm" onClick={handleAddSkill}>
                + Add Skill
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSkills([]);
                    performSearch();
                  }}
                  className="text-xs text-muted-foreground hover:underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Min Exp</label>
              <select
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                className="h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground"
              >
                <option value="">Any</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="8">8+ Years</option>
                <option value="10">10+ Years</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Remote</label>
              <select
                value={openToRemote === undefined ? '' : String(openToRemote)}
                onChange={(e) => {
                  const val = e.target.value;
                  setOpenToRemote(val === '' ? undefined : val === 'true');
                }}
                className="h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground"
              >
                <option value="">All</option>
                <option value="true">Remote Only</option>
                <option value="false">Onsite / Any</option>
              </select>
            </div>

            <div className="pt-4">
              <Button variant="outline" size="sm" onClick={() => performSearch()}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <strong className="text-foreground">{candidates.length}</strong> of{' '}
          <strong className="text-foreground">{total}</strong> candidates
        </span>
        {selectedJobSlug && (
          <span className="text-primary font-medium">
            🎯 Deterministic AI Matching Active for Selected Requisition
          </span>
        )}
      </div>

      {/* Candidate Cards Grid */}
      {candidates.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <h3 className="font-bold text-foreground text-lg">No candidates found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Try adjusting your search keywords, clearing specific skill filters, or broadening the experience
            requirements.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setSkills([]);
                setMinExp('');
                setOpenToRemote(undefined);
                setSelectedJobSlug('');
                performSearch('');
              }}
            >
              Reset All Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {candidates.map((cand) => {
            const displayName = cand.user?.profile?.displayName || 'Anonymous Candidate';
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const match = cand.match;
            const isSaved = cand.isSaved;
            const isSaving = bookmarkingId === cand.id;

            return (
              <Card
                key={cand.id}
                variant="outline"
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar / Initials */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                    {initials}
                  </div>

                  {/* Profile info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{displayName}</h3>
                      {cand.yearsOfExperience !== null && (
                        <Badge variant="neutral">{cand.yearsOfExperience} yrs exp</Badge>
                      )}
                      {cand.openToRemote && <Badge variant="success">Open to Remote</Badge>}
                      {cand.location && (
                        <span className="text-xs text-muted-foreground">📍 {cand.location}</span>
                      )}
                    </div>

                    <p className="text-sm text-foreground/90 font-medium">
                      {cand.headline || 'Experienced Professional'}
                    </p>

                    {cand.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {cand.bio}
                      </p>
                    )}

                    {/* Work Experience Snippet */}
                    {cand.experiences && cand.experiences.length > 0 && cand.experiences[0] && (
                      <div className="text-xs text-muted-foreground pt-0.5">
                        <span className="font-semibold text-foreground">Recent:</span>{' '}
                        {cand.experiences[0].title} at {cand.experiences[0].companyName}
                        {cand.experiences[0].isCurrent ? ' (Current)' : ''}
                      </div>
                    )}

                    {/* Skills pills */}
                    {cand.skills && cand.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cand.skills.map((s) => {
                          const isMatchedSkill = match?.matchedSkills.some(
                            (ms) => ms.toLowerCase() === s.name.toLowerCase(),
                          );
                          return (
                            <span
                              key={s.id || s.name}
                              className={`px-2 py-0.5 text-xs rounded font-medium ${
                                isMatchedSkill
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-muted/60 text-muted-foreground'
                              }`}
                            >
                              {isMatchedSkill ? `✓ ${s.name}` : s.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Match Engine Evidence Summary (if active) */}
                    {match && (
                      <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/15 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Match Breakdown</span>
                          <span className="font-bold text-primary">{match.overallScore}% Overall Score</span>
                        </div>
                        <p className="text-muted-foreground leading-normal">{match.summary}</p>
                        {match.missingSkills.length > 0 && (
                          <div className="text-amber-600 dark:text-amber-400 text-xs">
                            <span className="font-medium">Missing Requisition Skills:</span>{' '}
                            {match.missingSkills.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2.5 pt-2 md:pt-0 shrink-0">
                  {/* Match Pill (if matching job is selected) */}
                  {match && (
                    <div className="text-right">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                          match.overallScore >= 80
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : match.overallScore >= 60
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                              : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {match.overallScore}% Fit
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isSaved ? 'primary' : 'outline'}
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleToggleSave(cand)}
                      className={isSaved ? 'bg-primary text-primary-foreground' : ''}
                    >
                      {isSaving ? '...' : isSaved ? '★ Bookmarked' : '☆ Bookmark'}
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(cand)}>
                      Talent Dossier →
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Talent Dossier Drawer / Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 bg-card border-border shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-lg">
                  {(selectedCandidate.user?.profile?.displayName || 'C')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedCandidate.user?.profile?.displayName || 'Anonymous Candidate'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedCandidate.headline || 'Professional Candidate'} •{' '}
                    {selectedCandidate.location || 'Location Not Specified'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCandidate.yearsOfExperience !== null && (
                      <Badge variant="neutral">{selectedCandidate.yearsOfExperience} Yrs Exp</Badge>
                    )}
                    {selectedCandidate.openToRemote && <Badge variant="success">Remote Ready</Badge>}
                    <Badge variant="outline">Talent Pool Verified</Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Match Engine Breakdown Modal Section */}
            {selectedCandidate.match && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Deterministic Match Diagnostics
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {selectedCandidate.match.overallScore}% Compatibility
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-background/60 border border-border">
                    <div className="font-bold text-foreground">
                      {selectedCandidate.match.skillsScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">Skills Match</div>
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border">
                    <div className="font-bold text-foreground">
                      {selectedCandidate.match.experienceScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">Seniority Align</div>
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border">
                    <div className="font-bold text-foreground">
                      {selectedCandidate.match.locationScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">Location/Remote</div>
                  </div>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {selectedCandidate.match.summary}
                </p>
                {selectedCandidate.match.missingSkills.length > 0 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Gaps to Requisition:</strong>{' '}
                    {selectedCandidate.match.missingSkills.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Candidate Bio */}
            {selectedCandidate.bio && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Summary & Background
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedCandidate.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Verified Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((s) => (
                    <Badge key={s.id || s.name} variant={s.isPrimary ? 'accent' : 'neutral'}>
                      {s.name}
                      {s.yearsOfExperience ? ` (${s.yearsOfExperience}y)` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Work Experience
              </h4>
              {selectedCandidate.experiences && selectedCandidate.experiences.length > 0 ? (
                <div className="space-y-3">
                  {selectedCandidate.experiences.map((exp) => (
                    <div key={exp.id} className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">{exp.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(exp.startDate).getFullYear()} -{' '}
                          {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                        </span>
                      </div>
                      <div className="text-xs text-primary font-medium">{exp.companyName}</div>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground pt-1 whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No experience entries listed.</p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Education
              </h4>
              {selectedCandidate.educations && selectedCandidate.educations.length > 0 ? (
                <div className="space-y-2">
                  {selectedCandidate.educations.map((edu) => (
                    <div key={edu.id} className="p-3 rounded-md bg-muted/30 border border-border/60">
                      <div className="font-semibold text-xs text-foreground">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No education entries listed.</p>
              )}
            </div>

            {/* Candidate Privacy Safeguard Notice */}
            <div className="p-3 rounded-md bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground">Candidate Privacy Safeguard</div>
              <p>
                Candidate profiles in the talent pool are visible with candidate consent (
                <code>searchVisible: true</code>). Direct resume file binary downloads remain secured and
                are exclusively released when the candidate formally submits an application to your workspace
                requisitions.
              </p>
            </div>

            {/* Recruiter Private Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Private Workspace Notes
              </label>
              <Input
                placeholder="Optional notes for your team (e.g. strong portfolio, follow up in Q2)..."
                value={bookmarkNotes}
                onChange={(e) => setBookmarkNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant={selectedCandidate.isSaved ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleToggleSave(selectedCandidate)}
                disabled={bookmarkingId === selectedCandidate.id}
              >
                {selectedCandidate.isSaved ? '★ Bookmarked in Workspace' : '☆ Bookmark Candidate'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(null)}>
                Close Dossier
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
