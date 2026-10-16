'use client';

import { useState } from 'react';
import { Button, Badge, Input } from '@executive-match/ui';
import type { CandidateSearchResult, JobData } from '@/lib/api';
import {
  Search,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  X,
  ShieldCheck,
  Loader2,
  Building2,
  Calendar,
  Eye,
  RefreshCw,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { TalentRadar3D } from '@/components/talent-radar-3d';

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

  // AI Matching states
  const [useAiMatching, setUseAiMatching] = useState(false);
  const [recomputingAi, setRecomputingAi] = useState(false);
  const [aiRecomputedMsg, setAiRecomputedMsg] = useState<string | null>(null);

  // Selected candidate for talent dossier modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSearchResult | null>(null);

  // Bookmark loading state
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [bookmarkNotes, setBookmarkNotes] = useState<string>('');

  async function performSearch(overrideJobSlug?: string, forceAi?: boolean) {
    setLoading(true);
    setAiRecomputedMsg(null);
    try {
      const activeJob = overrideJobSlug !== undefined ? overrideJobSlug : selectedJobSlug;
      const isAi = forceAi !== undefined ? forceAi : useAiMatching;

      if (isAi && activeJob) {
        // Fetch AI Hybrid Matches
        const res = await fetch(
          `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(activeJob)}/ai-matches?limit=40`,
          { credentials: 'include' },
        );
        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: CandidateSearchResult[] = (data.items || []).map((item: any) => ({
            ...item.candidate,
            aiMatch: {
              overallScore: item.overallScore,
              skillsScore: item.skillsScore,
              semanticScore: item.semanticScore,
              experienceScore: item.experienceScore,
              locationScore: item.locationScore,
              matchedSkills: item.matchedSkills,
              missingSkills: item.missingSkills,
              explanation: item.explanation,
              cosineSimilarity: item.cosineSimilarity,
              calculatedAt: item.calculatedAt,
            },
            match: {
              overallScore: item.overallScore,
              skillsScore: item.skillsScore,
              experienceScore: item.experienceScore,
              locationScore: item.locationScore,
              matchedSkills: item.matchedSkills,
              missingSkills: item.missingSkills,
              locationCompatible: item.locationScore > 0,
              summary: item.explanation,
            },
          }));
          setCandidates(mapped);
          setTotal(data.total || mapped.length);
          return;
        }
      }

      // Default deterministic search
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

  async function handleRecomputeJobAi() {
    if (!selectedJobSlug) return;
    setRecomputingAi(true);
    setAiRecomputedMsg(null);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(selectedJobSlug)}/ai-matches/recompute`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: true }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAiRecomputedMsg(
          `Successfully recomputed dense vector embeddings for ${data.recomputedCount} candidate(s).`,
        );
        await performSearch(selectedJobSlug, true);
      }
    } finally {
      setRecomputingAi(false);
    }
  }

  async function handleRecomputeSingleCandidateAi(candId: string) {
    if (!selectedJobSlug) return;
    setRecomputingAi(true);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(selectedJobSlug)}/ai-matches/recompute`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateProfileId: candId, force: true }),
        },
      );
      if (res.ok) {
        await performSearch(selectedJobSlug, true);
        const updated = await fetch(
          `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/candidates/${encodeURIComponent(candId)}/ai-match/${encodeURIComponent(selectedJobSlug)}`,
          { credentials: 'include' },
        );
        if (updated.ok) {
          const upData = await updated.json();
          setSelectedCandidate((prev) =>
            prev && prev.id === candId
              ? {
                  ...prev,
                  aiMatch: {
                    overallScore: upData.match.overallScore,
                    skillsScore: upData.match.skillsScore,
                    semanticScore: upData.match.semanticScore,
                    experienceScore: upData.match.experienceScore,
                    locationScore: upData.match.locationScore,
                    matchedSkills: upData.match.matchedSkills,
                    missingSkills: upData.match.missingSkills,
                    explanation: upData.match.explanation,
                    cosineSimilarity: upData.cosineSimilarity,
                  },
                }
              : prev,
          );
        }
      }
    } finally {
      setRecomputingAi(false);
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
        const res = await fetch(
          `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/candidates/${encodeURIComponent(cand.id)}/save`,
          {
            method: 'DELETE',
            credentials: 'include',
          },
        );
        if (res.ok) {
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === cand.id ? { ...c, isSaved: false, savedCandidateId: null } : c,
            ),
          );
          if (selectedCandidate?.id === cand.id) {
            setSelectedCandidate((prev) =>
              prev ? { ...prev, isSaved: false, savedCandidateId: null } : null,
            );
          }
        }
      } else {
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
              c.id === cand.id
                ? { ...c, isSaved: true, savedCandidateId: data.savedCandidate?.id }
                : c,
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
      {/* 3D Search & Filter Hero Panel */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-primary" />
              Discover Talent
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search executive talent by name, headline, industry, or key technologies..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  className="w-full pl-10 h-11 bg-background/80 border-border text-sm"
                />
              </div>
              <Button
                variant="primary"
                onClick={() => performSearch()}
                disabled={loading}
                className="btn-3d h-11 px-6 flex items-center gap-2 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              Target Requisition
            </label>
            <select
              value={selectedJobSlug}
              onChange={(e) => {
                const slug = e.target.value;
                setSelectedJobSlug(slug);
                performSearch(slug);
              }}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="">All Requisitions (General Search)</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.slug}>
                  {job.title} ({job.remoteType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Required Skills & Filters */}
        <div className="pt-4 border-t border-border grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Core Competencies & Stack
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Distributed Systems, Kubernetes, TypeScript..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="text-xs h-9 bg-background/80"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSkill}
                className="btn-3d-secondary h-9 px-3 text-xs shrink-0"
              >
                + Add Skill
              </Button>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-primary/10 border border-primary/20 text-primary font-medium"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-red-500 font-bold ml-1 transition-colors"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSkills([]);
                    performSearch();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-2 self-center"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-1">
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-xs font-semibold text-muted-foreground">Min Exp</label>
              <select
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                className="h-9 w-full px-2.5 rounded-md border border-border bg-background text-xs text-foreground"
              >
                <option value="">Any Level</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="8">8+ Years (Staff)</option>
                <option value="10">10+ Years (Exec)</option>
              </select>
            </div>

            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-xs font-semibold text-muted-foreground">Location</label>
              <select
                value={openToRemote === undefined ? '' : String(openToRemote)}
                onChange={(e) => {
                  const val = e.target.value;
                  setOpenToRemote(val === '' ? undefined : val === 'true');
                }}
                className="h-9 w-full px-2.5 rounded-md border border-border bg-background text-xs text-foreground"
              >
                <option value="">All Locations</option>
                <option value="true">Remote Only</option>
                <option value="false">Onsite / Any</option>
              </select>
            </div>

            <div className="pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => performSearch()}
                className="btn-3d-secondary h-9 px-3.5 text-xs font-medium"
              >
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header & Match Engine Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{candidates.length}</strong> of{' '}
            <strong className="text-foreground">{total}</strong> qualified profiles
          </span>
          {selectedJobSlug && (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Filtered for Requisition
            </Badge>
          )}
        </div>

        {selectedJobSlug && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setUseAiMatching(false);
                  performSearch(selectedJobSlug, false);
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  !useAiMatching
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Deterministic</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseAiMatching(true);
                  performSearch(selectedJobSlug, true);
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  useAiMatching
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Semantic Match</span>
              </button>
            </div>

            {useAiMatching && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecomputeJobAi}
                disabled={recomputingAi || loading}
                className="btn-3d-secondary text-xs h-8 px-3 flex items-center gap-1.5"
              >
                {recomputingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{recomputingAi ? 'Embedding...' : 'Recalculate Vectors'}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {aiRecomputedMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{aiRecomputedMsg}</span>
        </div>
      )}

      {/* Candidate Cards Grid */}
      {candidates.length === 0 ? (
        <div className="card-3d p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-primary">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-foreground text-lg">No matching executive profiles</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Try broadening your search keywords, reducing required experience thresholds, or toggling between
            deterministic and semantic matching engines.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              className="btn-3d-secondary"
              onClick={() => {
                setQuery('');
                setSkills([]);
                setMinExp('');
                setOpenToRemote(undefined);
                setSelectedJobSlug('');
                setUseAiMatching(false);
                performSearch('', false);
              }}
            >
              Reset All Search Filters
            </Button>
          </div>
        </div>
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
            const aiMatch = cand.aiMatch;
            const isSaved = cand.isSaved;
            const isSaving = bookmarkingId === cand.id;

            return (
              <div
                key={cand.id}
                className="card-3d p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 group hover:border-primary/50 transition-all"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Modern 3D Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 text-primary font-black flex items-center justify-center text-base shadow-sm">
                      {initials}
                    </div>
                    {cand.openToRemote && (
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm"
                        title="Remote Ready"
                      />
                    )}
                  </div>

                  {/* Candidate Bio & Dossier info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {displayName}
                      </h3>
                      {cand.yearsOfExperience !== null && (
                        <Badge variant="neutral" className="bg-muted text-muted-foreground text-xs">
                          {cand.yearsOfExperience} yrs exp
                        </Badge>
                      )}
                      {cand.openToRemote && (
                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                          Remote Ready
                        </Badge>
                      )}
                      {cand.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {cand.location}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-foreground/90">
                      {cand.headline || 'Senior Executive / Engineering Leader'}
                    </p>

                    {cand.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {cand.bio}
                      </p>
                    )}

                    {/* Recent Experience */}
                    {cand.experiences && cand.experiences.length > 0 && cand.experiences[0] && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">Recent:</span>
                        <span>{cand.experiences[0].title} at {cand.experiences[0].companyName}</span>
                        {cand.experiences[0].isCurrent && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Current</Badge>
                        )}
                      </div>
                    )}

                    {/* Verified Skill Pills */}
                    {cand.skills && cand.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {cand.skills.map((s) => {
                          const isMatchedSkill = (
                            aiMatch?.matchedSkills ||
                            match?.matchedSkills ||
                            []
                          ).some((ms) => ms.toLowerCase() === s.name.toLowerCase());
                          return (
                            <span
                              key={s.id || s.name}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium inline-flex items-center gap-1 transition-all ${
                                isMatchedSkill
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
                                  : 'bg-muted/70 text-muted-foreground border border-border/50'
                              }`}
                            >
                              {isMatchedSkill && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                              <span>{s.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Match diagnostics highlight container */}
                    {aiMatch ? (
                      <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            Hybrid AI Fit (70% Skills • 30% Dense Vector)
                          </span>
                          <span className="font-black text-primary text-sm">
                            {aiMatch.overallScore}% Overall Match
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{aiMatch.explanation}</p>
                        {aiMatch.missingSkills.length > 0 && (
                          <div className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5 pt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              <strong>Requisition Skill Gaps:</strong> {aiMatch.missingSkills.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      match && (
                        <div className="mt-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              Deterministic Criteria Breakdown
                            </span>
                            <span className="font-bold text-primary text-sm">
                              {match.overallScore}% Score
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{match.summary}</p>
                          {match.missingSkills.length > 0 && (
                            <div className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5 pt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                <strong>Requisition Skill Gaps:</strong> {match.missingSkills.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Right Actions & Score Badges */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 pt-3 md:pt-0 shrink-0 border-t md:border-t-0 border-border">
                  {aiMatch ? (
                    <div className="text-right space-y-1">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border shadow-sm ${
                          aiMatch.overallScore >= 80
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                            : aiMatch.overallScore >= 60
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40'
                              : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{aiMatch.overallScore}% AI Fit</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Vector: {aiMatch.semanticScore}% • Cosine: {aiMatch.cosineSimilarity}
                      </div>
                    </div>
                  ) : (
                    match && (
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black border shadow-sm ${
                            match.overallScore >= 80
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                              : match.overallScore >= 60
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40'
                                : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          <span>{match.overallScore}% Fit</span>
                        </div>
                      </div>
                    )
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isSaved ? 'primary' : 'outline'}
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleToggleSave(cand)}
                      className={`btn-3d-secondary h-9 px-3 flex items-center gap-1.5 text-xs ${
                        isSaved ? 'bg-primary text-primary-foreground border-primary' : ''
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isSaved ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                      <span>{isSaving ? '...' : isSaved ? 'Saved' : 'Save'}</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedCandidate(cand)}
                      className="btn-3d h-9 px-3.5 text-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dossier</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Talent Dossier Drawer / Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="card-3d w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-6 bg-card border-border shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-5 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary font-black flex items-center justify-center text-xl shadow-md">
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
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>{selectedCandidate.headline || 'Senior Executive'}</span>
                    {selectedCandidate.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedCandidate.location}
                        </span>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {selectedCandidate.yearsOfExperience !== null && (
                      <Badge variant="neutral" className="text-xs">
                        {selectedCandidate.yearsOfExperience} Yrs Exp
                      </Badge>
                    )}
                    {selectedCandidate.openToRemote && (
                      <Badge variant="success" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        Remote Ready
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      Verified Talent Pool
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Semantic & Hybrid Diagnostics Modal Section */}
            {selectedCandidate.aiMatch ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      AI Hybrid Semantic Breakdown
                    </span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Calibrated 70% Deterministic Feature Fit + 30% Dense Vector Cosine Similarity
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">
                      {selectedCandidate.aiMatch.overallScore}%
                    </span>
                    <div className="text-[10px] text-muted-foreground font-semibold">Hybrid Match</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 rounded-xl bg-background/80 border border-border shadow-sm">
                    <div className="font-black text-foreground text-sm">
                      {selectedCandidate.aiMatch.skillsScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">Skills (70%)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border shadow-sm">
                    <div className="font-black text-primary text-sm">
                      {selectedCandidate.aiMatch.semanticScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">Vector (30%)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border shadow-sm">
                    <div className="font-mono font-black text-foreground text-sm">
                      {selectedCandidate.aiMatch.cosineSimilarity}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">Cosine Sim</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border shadow-sm">
                    <div className="font-black text-foreground text-sm">
                      {selectedCandidate.aiMatch.locationScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">Remote Match</div>
                  </div>
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed">
                  {selectedCandidate.aiMatch.explanation}
                </p>

                {selectedCandidate.aiMatch.missingSkills.length > 0 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong>Requisition Skill Gaps:</strong> {selectedCandidate.aiMatch.missingSkills.join(', ')}
                    </span>
                  </div>
                )}

                {selectedJobSlug && (
                  <div className="pt-1 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecomputeSingleCandidateAi(selectedCandidate.id)}
                      disabled={recomputingAi}
                      className="btn-3d-secondary text-xs h-8 flex items-center gap-1.5"
                    >
                      {recomputingAi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{recomputingAi ? 'Recalculating...' : 'Re-embed & Score Candidate'}</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              selectedCandidate.match && (
                <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Deterministic Diagnostics
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {selectedCandidate.match.overallScore}% Compatibility
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-background border border-border">
                      <div className="font-bold text-foreground">{selectedCandidate.match.skillsScore}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-0.5">Skills</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background border border-border">
                      <div className="font-bold text-foreground">{selectedCandidate.match.experienceScore}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-0.5">Seniority</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background border border-border">
                      <div className="font-bold text-foreground">{selectedCandidate.match.locationScore}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-0.5">Location</div>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {selectedCandidate.match.summary}
                  </p>
                  {selectedCandidate.match.missingSkills.length > 0 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Requisition Skill Gaps:</strong> {selectedCandidate.match.missingSkills.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )
            )}

            {/* 3D Talent Competency Radar */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Executive Competency Radar
                </h4>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  3D Multi-Axis Benchmark
                </span>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/50 p-2 shadow-xs">
                <TalentRadar3D
                  candidateName={selectedCandidate.user?.profile?.displayName || 'Executive Candidate'}
                  roleTitle={selectedCandidate.headline || 'Senior Executive'}
                />
              </div>
            </div>

            {/* Candidate Bio */}
            {selectedCandidate.bio && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
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
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Verified Skills & Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((s) => (
                    <Badge key={s.id || s.name} variant={s.isPrimary ? 'accent' : 'neutral'} className="text-xs py-1 px-2.5">
                      {s.name}
                      {s.yearsOfExperience ? ` (${s.yearsOfExperience}y)` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Work History & Leadership
              </h4>
              {selectedCandidate.experiences && selectedCandidate.experiences.length > 0 ? (
                <div className="space-y-3">
                  {selectedCandidate.experiences.map((exp) => (
                    <div
                      key={exp.id || `${exp.companyName}-${exp.title}`}
                      className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{exp.title}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exp.startDate).getFullYear()} -{' '}
                          {exp.isCurrent
                            ? 'Present'
                            : exp.endDate
                              ? new Date(exp.endDate).getFullYear()
                              : ''}
                        </span>
                      </div>
                      <div className="text-xs text-primary font-semibold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {exp.companyName}
                      </div>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground pt-1 whitespace-pre-wrap leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No experience history submitted.</p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                Education & Credentials
              </h4>
              {selectedCandidate.educations && selectedCandidate.educations.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedCandidate.educations.map((edu) => (
                    <div
                      key={edu.id || `${edu.institution}-${edu.degree}`}
                      className="p-3.5 rounded-xl bg-muted/30 border border-border/80"
                    >
                      <div className="font-bold text-xs text-foreground">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No education history recorded.</p>
              )}
            </div>

            {/* Recruiter Private Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Workspace Internal Notes
              </label>
              <Input
                placeholder="Optional recruiter notes (e.g. strong technical leadership, follow up next month)..."
                value={bookmarkNotes}
                onChange={(e) => setBookmarkNotes(e.target.value)}
                className="text-xs h-10 bg-background/80"
              />
            </div>

            {/* Candidate Privacy Safeguard Notice */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Candidate Consent & Privacy Safeguard
              </div>
              <p>
                Candidate profiles in the talent pool are visible with candidate consent (
                <code>searchVisible: true</code>). Direct resume file binary downloads remain secured
                and are exclusively released when the candidate formally submits an application to your
                workspace requisitions.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant={selectedCandidate.isSaved ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleToggleSave(selectedCandidate)}
                disabled={bookmarkingId === selectedCandidate.id}
                className="btn-3d text-xs h-9 px-4 flex items-center gap-1.5"
              >
                {selectedCandidate.isSaved ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved in Workspace</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save Candidate</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCandidate(null)}
                className="btn-3d-secondary text-xs h-9 px-4"
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
