'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge } from '@executive-match/ui';
import type { CandidateProfileData } from '@/lib/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Download,
  Trash2,
  Star,
  AlertCircle,
} from 'lucide-react';

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
      <Card className="card-3d p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Upload Resume</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload your latest executive CV in PDF or DOCX format (up to 10MB).
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-card/40 backdrop-blur-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
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
            <span className="btn-3d inline-flex items-center justify-center font-semibold rounded-lg px-4 py-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer gap-2">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Select Resume File'}</span>
            </span>
          </label>
        </div>
      </Card>

      {/* Resumes List */}
      <Card className="card-3d p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Your Resumes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your CV versions. The primary resume is automatically highlighted to recruiters.
          </p>
        </div>

        {resumes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
            No resumes uploaded yet.
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {resumes.map((resume) => (
              <div key={resume.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{resume.fileName}</h3>
                      {resume.isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Star className="w-3 h-3 fill-emerald-500" />
                          <span>Primary</span>
                        </span>
                      )}
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
                      className="btn-3d-secondary text-xs gap-1"
                      onClick={() => handleSetPrimary(resume.id)}
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Set Primary</span>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="btn-3d-secondary text-xs gap-1"
                    loading={downloadingId === resume.id}
                    onClick={() => handleDownload(resume.id)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-3d-secondary text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1"
                    onClick={() => handleDelete(resume.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
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
