/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { CandidatesService } from './candidates.module';
import type { DatabaseService } from '../platform/database.module';
import { MemoryStorageProvider } from '@executive-match/storage';

function createMockDb() {
  return {
    candidateProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    candidateExperience: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    candidateEducation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    candidateSkill: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    candidateResume: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as DatabaseService;
}

describe('CandidatesService - Profiles and Workflows', () => {
  it('returns existing candidate profile if found', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    const mockProfile = {
      id: 'cand-123',
      userId: 'user-123',
      headline: 'Principal Architect',
      experiences: [],
      educations: [],
      skills: [],
      resumes: [],
      user: { id: 'user-123', email: 'architect@example.com' },
    };

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValueOnce(mockProfile as any);

    const result = await service.getOrCreateProfile('user-123');
    expect(result.id).toBe('cand-123');
    expect(result.headline).toBe('Principal Architect');
    expect(db.candidateProfile.create).not.toHaveBeenCalled();
  });

  it('creates a new candidate profile if none exists', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateProfile.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'new-cand-456',
        userId: 'user-456',
        headline: null,
        experiences: [],
        educations: [],
        skills: [],
        resumes: [],
      } as any);

    vi.mocked(db.candidateProfile.create).mockResolvedValueOnce({
      id: 'new-cand-456',
      userId: 'user-456',
    } as any);

    const result = await service.getOrCreateProfile('user-456');
    expect(result.id).toBe('new-cand-456');
    expect(db.candidateProfile.create).toHaveBeenCalledWith({
      data: { userId: 'user-456' },
    });
  });

  it('updates profile fields with validated payload', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateProfile.upsert).mockResolvedValueOnce({
      id: 'cand-123',
      userId: 'user-123',
      headline: 'Engineering Manager',
      location: 'Berlin, Germany',
      yearsOfExperience: 10,
    } as any);

    const result = await service.updateProfile('user-123', {
      headline: 'Engineering Manager',
      location: 'Berlin, Germany',
      yearsOfExperience: 10,
      searchVisible: true,
      openToRemote: true,
    });

    expect(result.headline).toBe('Engineering Manager');
    expect(db.candidateProfile.upsert).toHaveBeenCalled();
  });

  it('adds and updates candidate work experiences', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-123',
      userId: 'user-123',
    } as any);

    vi.mocked(db.candidateExperience.create).mockResolvedValueOnce({
      id: 'exp-1',
      candidateProfileId: 'cand-123',
      companyName: 'Stripe',
      title: 'Senior Engineer',
    } as any);

    const created = await service.addExperience('user-123', {
      companyName: 'Stripe',
      title: 'Senior Engineer',
      startDate: '2021-01-01T00:00:00.000Z',
      isCurrent: true,
      description: 'Payments infrastructure',
    });

    expect(created.id).toBe('exp-1');
    expect(created.companyName).toBe('Stripe');

    // Update experience
    vi.mocked(db.candidateExperience.findFirst).mockResolvedValueOnce({
      id: 'exp-1',
      candidateProfileId: 'cand-123',
    } as any);

    vi.mocked(db.candidateExperience.update).mockResolvedValueOnce({
      id: 'exp-1',
      title: 'Staff Engineer',
    } as any);

    const updated = await service.updateExperience('user-123', 'exp-1', {
      title: 'Staff Engineer',
    });

    expect(updated.title).toBe('Staff Engineer');
  });

  it('adds skills with uniqueness handling', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-123',
      userId: 'user-123',
    } as any);

    vi.mocked(db.candidateSkill.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.candidateSkill.create).mockResolvedValueOnce({
      id: 'skill-1',
      name: 'Rust',
      yearsOfExperience: 3,
      isPrimary: true,
    } as any);

    const skill = await service.addSkill('user-123', {
      name: 'Rust',
      yearsOfExperience: 3,
      isPrimary: true,
    });

    expect(skill.name).toBe('Rust');
    expect(skill.isPrimary).toBe(true);
  });
});

describe('CandidatesService - Resume Upload & Storage Management', () => {
  it('requests upload URL with signed headers and sanitized fileKey', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-777',
      userId: 'user-777',
    } as any);

    const result = await service.requestResumeUploadUrl('user-777', {
      fileName: 'My Resume (2026).pdf',
      mimeType: 'application/pdf',
      fileSize: 250_000,
    });

    expect(result.method).toBe('PUT');
    expect(result.uploadUrl).toContain('sig=');
    expect(result.fileKey).toContain('resumes/cand-777/');
    expect(result.fileKey).toContain('My_Resume__2026_.pdf');
  });

  it('confirms resume upload and assigns primary status', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateProfile.findUnique).mockResolvedValue({
      id: 'cand-777',
      userId: 'user-777',
    } as any);

    vi.mocked(db.candidateResume.count).mockResolvedValueOnce(0);
    vi.mocked(db.candidateResume.create).mockResolvedValueOnce({
      id: 'res-1',
      candidateProfileId: 'cand-777',
      fileName: 'resume.pdf',
      isPrimary: true,
      parsingStatus: 'PENDING',
    } as any);

    const confirmed = await service.confirmResumeUpload('user-777', {
      fileKey: 'resumes/cand-777/resume.pdf',
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      fileSize: 100_000,
      setAsPrimary: true,
    });

    expect(confirmed.id).toBe('res-1');
    expect(confirmed.isPrimary).toBe(true);
  });

  it('deletes resume from both storage provider and database', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    const deleteSpy = vi.spyOn(storage, 'delete');

    vi.mocked(db.candidateResume.findFirst).mockResolvedValueOnce({
      id: 'res-del-1',
      candidateProfileId: 'cand-777',
      fileKey: 'resumes/cand-777/to-delete.pdf',
    } as any);

    const result = await service.deleteResume('user-777', 'res-del-1');

    expect(result.success).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith('resumes/cand-777/to-delete.pdf');
    expect(db.candidateResume.delete).toHaveBeenCalledWith({
      where: { id: 'res-del-1' },
    });
  });

  it('generates secure download URL for existing resume', async () => {
    const db = createMockDb();
    const storage = new MemoryStorageProvider();
    const service = new CandidatesService(db, storage);

    vi.mocked(db.candidateResume.findFirst).mockResolvedValueOnce({
      id: 'res-dl-1',
      candidateProfileId: 'cand-777',
      fileKey: 'resumes/cand-777/my-resume.pdf',
      fileName: 'my-resume.pdf',
    } as any);

    const download = await service.getResumeDownloadUrl('user-777', 'res-dl-1');

    expect(download.fileName).toBe('my-resume.pdf');
    expect(download.downloadUrl).toContain('/download?key=resumes%2Fcand-777%2Fmy-resume.pdf');
    expect(download.downloadUrl).toContain('sig=');
  });
});
