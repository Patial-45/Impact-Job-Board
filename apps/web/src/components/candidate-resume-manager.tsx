'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge } from '@executive-match/ui';
import type { CandidateProfileData } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function CandidateResumeManager({
  initialResumes,
}: {
  initialResumes: CandidateProfileData['resumes'];
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes || []);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Resume file size must not exceed 10MB.');
      return;
    }

    // Validate mime type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Only PDF and Word (.docx/.doc) files are supported.');
      return;
    }

    setUploading(true);

    try {
      // 1. Request upload URL
      const urlRes = await fetch(`${apiUrl}/candidates/me/resumes/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!urlRes.ok) {
        throw new Error('Failed to request upload signature.');
      }

      const { uploadUrl, fileKey, headers } = await urlRes.json();

      // 2. Upload file to signed URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: headers || { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file content to storage.');
      }

      // 3. Confirm upload
      const confirmRes = await fetch(`${apiUrl}/candidates/me/resumes/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileKey,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          setAsPrimary: resumes.length === 0,
        }),
      });

      if (!confirmRes.ok) {
        throw new Error('Failed to register uploaded resume.');
      }

      const newResume = await confirmRes.json();
      setResumes((prev) => [
        newResume,
        ...prev.map((r) => (newResume.isPrimary ? { ...r, isPrimary: false } : r)),
      ]);
      setSuccessMessage(`Successfully uploaded ${file.name}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (resumeId: string) => {
    try {
      const res = await fetch(`${apiUrl}/candidates/me/resumes/${resumeId}/primary`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        setResumes((prev) =>
          prev.map((r) => ({
            ...r,
            isPrimary: r.id === resumeId,
          })),
        );
        router.refresh();
      }
    } catch {
      setErrorMessage('Could not set primary resume.');
    }
  };

  const handleDownload = async (resumeId: string) => {
    setDownloadingId(resumeId);
    try {
      const res = await fetch(`${apiUrl}/candidates/me/resumes/${resumeId}/download`, {
        credentials: 'include',
      });
      if (res.ok) {
        const { downloadUrl } = await res.json();
        window.open(downloadUrl, '_blank');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (resumeId: string) => {
    try {
      const res = await fetch(`${apiUrl}/candidates/me/resumes/${resumeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== resumeId));
        router.refresh();
      }
    } catch {
      setErrorMessage('Could not delete resume.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Upload Box */}
      <Card variant="outline" className="p-6">
        <h2 className="text-xl font-semibold mb-1 text-foreground">Upload Resume</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your latest CV in PDF or DOCX format (up to 10MB).
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
            {successMessage}
          </div>
        )}

        <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center flex flex-col items-center justify-center bg-card/30">
          <svg
            className="w-12 h-12 text-muted-foreground mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-medium text-foreground mb-1">
            Choose a resume file or drag and drop here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            PDF, DOCX up to 10MB • Secured with private signed storage
          </p>

          <label className="inline-block cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
              {uploading ? 'Uploading...' : 'Select Resume File'}
            </span>
          </label>
        </div>
      </Card>

      {/* Resumes List */}
      <Card variant="outline" className="p-6">
        <h2 className="text-xl font-semibold mb-1 text-foreground">Your Resumes</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage different versions. The primary resume is automatically highlighted to recruiters.
        </p>

        {resumes.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No resumes uploaded yet.</p>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {resumes.map((resume) => (
              <div key={resume.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {resume.fileName.endsWith('.pdf') ? 'PDF' : 'DOC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{resume.fileName}</h3>
                      {resume.isPrimary && <Badge variant="success">Primary</Badge>}
                      <Badge variant="outline">{resume.parsingStatus}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(resume.fileSize)} • Uploaded on{' '}
                      {new Date(resume.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!resume.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(resume.id)}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={downloadingId === resume.id}
                    onClick={() => handleDownload(resume.id)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger/80"
                    onClick={() => handleDelete(resume.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
