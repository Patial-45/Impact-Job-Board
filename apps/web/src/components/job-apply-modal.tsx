'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Textarea, Card, Badge } from '@executive-match/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ResumeItem = {
  id: string;
  fileName: string;
  fileSize: number;
  isPrimary: boolean;
  parsingStatus: string;
};

export function JobApplyModal({
  jobSlug,
  jobTitle,
  companyName,
}: {
  jobSlug: string;
  jobTitle: string;
  companyName?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    setErrorMessage(null);
    setIsSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/candidates/me/resumes`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        // User is unauthenticated, redirect to login with callback
        router.push(`/login?redirect=${encodeURIComponent(`/jobs/${jobSlug}`)}`);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setResumes(data);
        const primary = data.find((r: ResumeItem) => r.isPrimary) || data[0];
        if (primary) {
          setSelectedResumeId(primary.id);
        }
      }
    } catch {
      // If fetching fails, let user submit without resume selection or retry
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiUrl}/jobs/${encodeURIComponent(jobSlug)}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          coverLetter: coverLetter.trim() || undefined,
        }),
      });

      if (response.status === 409) {
        setErrorMessage('You have already applied for this position.');
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message?.message || errorData.message || 'Failed to submit application.');
        setSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage('Network error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="primary" size="lg" onClick={handleOpen}>
        Apply Now ↗
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">Application Submitted!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your application for <strong className="text-foreground">{jobTitle}</strong> at{' '}
                    <strong className="text-foreground">{companyName || 'the hiring team'}</strong> has been received.
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <Link href="/candidate/applications">
                    <Button variant="primary">View My Applications</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Apply for {jobTitle}</h3>
                    <p className="text-xs text-muted-foreground">{companyName || 'Hiring Company'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
                  >
                    ✕
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                    {errorMessage}
                  </div>
                )}

                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading profile assets...</div>
                ) : (
                  <>
                    {/* Resume Picker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">Select Resume</label>
                        <Link
                          href="/candidate/resume"
                          target="_blank"
                          className="text-xs text-primary hover:underline"
                        >
                          + Upload new version
                        </Link>
                      </div>

                      {resumes.length === 0 ? (
                        <Card className="p-4 text-center bg-muted/40 border-dashed">
                          <p className="text-xs text-muted-foreground mb-2">No resumes found on your profile.</p>
                          <Link href="/candidate/resume" target="_blank">
                            <Button variant="outline" size="sm">
                              Upload Resume First ↗
                            </Button>
                          </Link>
                        </Card>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {resumes.map((r) => (
                            <label
                              key={r.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition-colors ${
                                selectedResumeId === r.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="resumeSelection"
                                  checked={selectedResumeId === r.id}
                                  onChange={() => setSelectedResumeId(r.id)}
                                  className="text-primary focus:ring-primary"
                                />
                                <span className="font-medium text-foreground truncate max-w-xs">{r.fileName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {r.isPrimary && <Badge variant="accent">Primary</Badge>}
                                <span className="text-muted-foreground">
                                  {(r.fileSize / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cover Letter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Cover Note / Personal Pitch <span className="text-muted-foreground font-normal">(Optional)</span>
                      </label>
                      <Textarea
                        rows={4}
                        placeholder="Highlight your executive leadership experience, relevant accomplishments, and why you are drawn to this mission..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
                      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={submitting}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
