'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Badge } from '@executive-match/ui';
import type { JobData } from '@/lib/api';
import {
  Briefcase,
  Plus,
  Building2,
  MapPin,
  DollarSign,
  Trash2,
  ArrowRight,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function WorkspaceJobs({
  workspaceSlug,
  initialJobs,
}: {
  workspaceSlug: string;
  initialJobs: JobData[];
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [remoteType, setRemoteType] = useState<'ONSITE' | 'HYBRID' | 'REMOTE'>('REMOTE');
  const [employmentType, setEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'>('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState<'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'>('MID');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<Array<{ name: string; isRequired: boolean }>>([]);

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    setSkills([...skills, { name: skillInput.trim(), isRequired: true }]);
    setSkillInput('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          department: department || null,
          location: location || null,
          remoteType,
          employmentType,
          experienceLevel,
          minSalary: minSalary ? Number(minSalary) : null,
          maxSalary: maxSalary ? Number(maxSalary) : null,
          description,
          skills: skills.length > 0 ? skills : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message ? JSON.stringify(errorData.message) : 'Failed to create job');
      }

      const newJob = await res.json();
      setJobs([newJob, ...jobs]);
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDepartment('');
      setLocation('');
      setDescription('');
      setMinSalary('');
      setMaxSalary('');
      setSkills([]);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating job opening');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobSlug: string, nextStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED') => {
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(jobSlug)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setJobs(jobs.map((j) => (j.slug === jobSlug ? { ...j, status: updated.status } : j)));
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteJob = async (jobSlug: string) => {
    if (!confirm('Are you sure you want to remove this job opening?')) return;
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/jobs/${encodeURIComponent(jobSlug)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (res.ok) {
        setJobs(jobs.filter((j) => j.slug !== jobSlug));
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Requisition Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure active and draft roles, publishing states, and target competencies.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="btn-3d h-10 px-4 text-xs flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job</span>
        </Button>
      </div>

      {showCreateModal && (
        <div className="card-3d p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Create Executive Requisition
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateJob} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Job Title *</label>
                <Input
                  placeholder="e.g. VP of Engineering / Head of Platform"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 bg-background/80"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Department</label>
                <Input
                  placeholder="e.g. Infrastructure, Security, Product"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-10 bg-background/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Remote Policy</label>
                <select
                  value={remoteType}
                  onChange={(e) => setRemoteType(e.target.value as 'ONSITE' | 'HYBRID' | 'REMOTE')}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP')}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE')}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="ENTRY">Entry</option>
                  <option value="MID">Mid-level</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead / Staff</option>
                  <option value="EXECUTIVE">Executive / VP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Primary Location</label>
                <Input
                  placeholder="e.g. San Francisco, CA / London, UK"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 bg-background/80"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Min Salary ($ USD)</label>
                <Input
                  type="number"
                  placeholder="e.g. 180000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="h-10 bg-background/80"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Max Salary ($ USD)</label>
                <Input
                  type="number"
                  placeholder="e.g. 260000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="h-10 bg-background/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Job Description & Responsibilities *</label>
              <Textarea
                rows={5}
                required
                placeholder="Outline mission, key business outcomes, engineering challenges, and technical stack..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-background/80"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Required Competencies & Skills
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Kubernetes, Golang, High Scale, Architecture"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSkill}
                  className="btn-3d-secondary text-xs h-9 px-3"
                >
                  Add Skill
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      <span>{s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="hover:text-danger ml-0.5 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="btn-3d text-xs h-10 px-5"
              >
                Create Draft Requisition
              </Button>
            </div>
          </form>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="card-3d p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-primary">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-foreground text-lg">No active requisitions</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Create your first executive role opening to initiate AI semantic candidate matching and begin receiving applications.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="btn-3d text-xs h-10 px-5"
            >
              Post a Job Opening
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card-3d p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:border-primary/50 transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <Badge
                    variant={
                      job.status === 'PUBLISHED'
                        ? 'success'
                        : job.status === 'DRAFT'
                        ? 'warning'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {job.status === 'PUBLISHED' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500 inline" />}
                    {job.status === 'DRAFT' && <Clock className="w-3 h-3 mr-1 text-amber-500 inline" />}
                    {job.status}
                  </Badge>
                  <Badge variant="neutral" className="text-xs bg-muted text-muted-foreground">
                    {job.remoteType}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                  {job.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.department}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location || 'Remote'}
                  </span>
                  <span>•</span>
                  <span>{job.employmentType.replace('_', ' ')}</span>
                  {job.minSalary && job.maxSalary && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.slice(0, 6).map((s) => (
                      <span
                        key={s.id}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground border border-border/50"
                      >
                        {s.name}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="text-[11px] text-muted-foreground self-center">
                        +{job.skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                <Link href={`/workspace/${workspaceSlug}/jobs/${job.slug}`}>
                  <Button variant="primary" size="sm" className="btn-3d text-xs h-9 px-3 flex items-center gap-1.5">
                    <span>ATS Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>

                {job.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(job.slug, 'PUBLISHED')}
                    className="btn-3d-secondary text-xs h-9 px-3 text-emerald-600 dark:text-emerald-400"
                  >
                    Publish
                  </Button>
                )}

                {job.status === 'PUBLISHED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(job.slug, 'CLOSED')}
                    className="btn-3d-secondary text-xs h-9 px-3"
                  >
                    Close
                  </Button>
                )}

                {job.status === 'CLOSED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(job.slug, 'PUBLISHED')}
                    className="btn-3d-secondary text-xs h-9 px-3"
                  >
                    Reopen
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger/80 h-9 px-2.5"
                  onClick={() => handleDeleteJob(job.slug)}
                  title="Delete Job Opening"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
