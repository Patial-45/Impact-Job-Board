'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Card, Badge } from '@executive-match/ui';
import type { JobData } from '@/lib/api';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Active & Draft Openings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace roles, publication status, and talent requirements.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Post New Job
        </Button>
      </div>

      {showCreateModal && (
        <Card variant="outline" className="p-6 bg-card/50">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Create Job Opening</h3>
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                placeholder="e.g. Lead Full-Stack Engineer"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Department"
                placeholder="e.g. Engineering, Product"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Remote Policy</label>
                <select
                  value={remoteType}
                  onChange={(e) => setRemoteType(e.target.value as 'ONSITE' | 'HYBRID' | 'REMOTE')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
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
              <Input
                label="Location"
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                label="Min Salary ($)"
                type="number"
                placeholder="e.g. 140000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
              />
              <Input
                label="Max Salary ($)"
                type="number"
                placeholder="e.g. 190000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
              />
            </div>

            <Textarea
              label="Job Description & Responsibilities"
              rows={5}
              required
              placeholder="Outline role expectations, mission, stack, and interview process..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Required Skills</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, Go"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
                  Add Skill
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="hover:text-danger ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Create Draft Job
              </Button>
            </div>
          </form>
        </Card>
      )}

      {jobs.length === 0 ? (
        <Card variant="outline" className="p-8 text-center space-y-3">
          <p className="text-base font-semibold text-foreground">No job openings yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first job listing to start receiving candidate applications.
          </p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Post a Job
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              variant="outline"
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-base text-foreground">{job.title}</h3>
                  <Badge
                    variant={
                      job.status === 'PUBLISHED'
                        ? 'success'
                        : job.status === 'DRAFT'
                        ? 'warning'
                        : 'outline'
                    }
                  >
                    {job.status}
                  </Badge>
                  <Badge variant="neutral">{job.remoteType}</Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  {job.department ? `${job.department} • ` : ''}
                  {job.location || 'Remote'} • {job.employmentType.replace('_', ' ')}
                  {job.minSalary && job.maxSalary
                    ? ` • $${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`
                    : ''}
                </p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills.slice(0, 5).map((s) => (
                      <span
                        key={s.id}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                <Link href={`/workspace/${workspaceSlug}/jobs/${job.slug}`}>
                  <Button variant="outline" size="sm">
                    ATS Pipeline ↗
                  </Button>
                </Link>
                {job.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(job.slug, 'PUBLISHED')}
                  >
                    Publish
                  </Button>
                )}
                {job.status === 'PUBLISHED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(job.slug, 'CLOSED')}
                  >
                    Close Job
                  </Button>
                )}
                {job.status === 'CLOSED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(job.slug, 'PUBLISHED')}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger/80"
                  onClick={() => handleDeleteJob(job.slug)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
