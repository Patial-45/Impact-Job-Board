'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@executive-match/ui';
import type { SavedJobItem } from '@/lib/api';
import {
  Bookmark,
  Building2,
  MapPin,
  DollarSign,
  Trash2,
  ArrowRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function CandidateSavedJobs({ initialSavedJobs }: { initialSavedJobs: SavedJobItem[] }) {
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>(initialSavedJobs);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRemove(jobId: string) {
    setRemovingId(jobId);
    setErrorMessage(null);
    try {
      const res = await fetch(`${apiUrl}/candidates/me/saved-jobs/${encodeURIComponent(jobId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to remove saved job');
      }
      setSavedJobs((prev) => prev.filter((item) => item.jobId !== jobId));
    } catch {
      setErrorMessage('Could not remove this bookmark. Please try again.');
    } finally {
      setRemovingId(null);
    }
  }

  function formatSalary(job: SavedJobItem['job']) {
    if (!job.minSalary && !job.maxSalary) return null;
    const cur = job.currency || 'USD';
    if (job.minSalary && job.maxSalary) {
      return `${cur} ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}`;
    }
    if (job.minSalary) return `From ${cur} ${job.minSalary.toLocaleString()}`;
    return `Up to ${cur} ${job.maxSalary?.toLocaleString()}`;
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedJobs.length === 0 ? (
        <Card className="card-3d p-12 text-center border-dashed border-border/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-lg">No saved jobs yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Bookmark interesting roles while exploring opportunities to keep them organized and apply when ready.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/jobs">
              <Button variant="primary" className="btn-3d text-xs font-semibold gap-1.5">
                <span>Explore Job Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedJobs.map((item) => {
            const job = item.job;
            const salary = formatSalary(job);
            const isRemoving = removingId === job.id;

            return (
              <Card
                key={item.id}
                className="card-3d p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{job.company?.name || 'Company'}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Badge variant={job.remoteType === 'REMOTE' ? 'success' : 'neutral'}>
                      {job.remoteType}
                    </Badge>
                    {job.employmentType && (
                      <Badge variant="outline">{job.employmentType.replace('_', ' ')}</Badge>
                    )}
                    {job.experienceLevel && (
                      <Badge variant="neutral">{job.experienceLevel}</Badge>
                    )}
                  </div>

                  <Link href={`/jobs/${job.slug}`} className="block group">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{job.location}</span>
                      </span>
                    )}
                    {salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{salary}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Saved on {new Date(item.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((s) => (
                        <span
                          key={s.id || s.name}
                          className="px-2 py-0.5 text-xs bg-muted/60 text-muted-foreground rounded-md"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 self-end md:self-center shrink-0">
                  <Link href={`/jobs/${job.slug}`}>
                    <Button variant="primary" size="sm" className="btn-3d text-xs font-semibold gap-1.5">
                      <span>Apply / View Role</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() => handleRemove(job.id)}
                    className="btn-3d-secondary text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
