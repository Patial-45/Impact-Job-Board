'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@executive-match/ui';
import type { SavedJobItem } from '@/lib/api';

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
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      {savedJobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-xl">
            🔖
          </div>
          <h3 className="font-bold text-foreground text-lg">No saved jobs yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Bookmark interesting roles while exploring opportunities to keep them organized and apply when ready.
          </p>
          <div className="pt-2">
            <Link href="/jobs">
              <Button variant="primary">Explore Job Opportunities</Button>
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
                variant="outline"
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {job.company?.name || 'Company'}
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
                    {job.location && <span>📍 {job.location}</span>}
                    {salary && <span>💰 {salary}</span>}
                    <span>Saved on {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((s) => (
                        <span
                          key={s.id || s.name}
                          className="px-2 py-0.5 text-xs bg-muted/60 text-muted-foreground rounded"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 self-end md:self-center">
                  <Link href={`/jobs/${job.slug}`}>
                    <Button variant="primary" size="sm">
                      Apply / View Role
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() => handleRemove(job.id)}
                    className="text-red-600 hover:bg-red-500/10 hover:border-red-500/30"
                  >
                    {isRemoving ? 'Removing...' : 'Remove'}
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
