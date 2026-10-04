import { describe, expect, it } from 'vitest';
import { MemoryStorageProvider, LocalStorageProvider } from './index';

describe('packages/storage - MemoryStorageProvider', () => {
  it('generates signed upload URLs with expiration and signature', async () => {
    const storage = new MemoryStorageProvider();
    const result = await storage.createUploadUrl({
      key: 'resumes/cand-1/doc.pdf',
      contentType: 'application/pdf',
      maxBytes: 10 * 1024 * 1024,
      expiresInSeconds: 900,
    });

    expect(result.method).toBe('PUT');
    expect(result.headers['Content-Type']).toBe('application/pdf');
    expect(result.url).toContain('/upload?key=resumes%2Fcand-1%2Fdoc.pdf');
    expect(result.url).toContain('expires=');
    expect(result.url).toContain('sig=');
  });

  it('generates signed download URLs with expiration and signature', async () => {
    const storage = new MemoryStorageProvider();
    const url = await storage.createDownloadUrl('resumes/cand-1/doc.pdf', 3600);

    expect(url).toContain('/download?key=resumes%2Fcand-1%2Fdoc.pdf');
    expect(url).toContain('expires=');
    expect(url).toContain('sig=');
  });

  it('stores, tests existence and deletes files in memory', async () => {
    const storage = new MemoryStorageProvider();
    expect(await storage.exists('resumes/test.pdf')).toBe(false);

    storage.putFile({
      key: 'resumes/test.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024,
    });

    expect(await storage.exists('resumes/test.pdf')).toBe(true);
    expect(storage.getFile('resumes/test.pdf')?.sizeBytes).toBe(1024);

    await storage.delete('resumes/test.pdf');
    expect(await storage.exists('resumes/test.pdf')).toBe(false);
  });
});

describe('packages/storage - LocalStorageProvider', () => {
  it('delegates upload and download URL generation smoothly', async () => {
    const storage = new LocalStorageProvider();
    const upload = await storage.createUploadUrl({
      key: 'test-key.pdf',
      contentType: 'application/pdf',
      maxBytes: 5000,
      expiresInSeconds: 600,
    });
    expect(upload.method).toBe('PUT');

    const download = await storage.createDownloadUrl('test-key.pdf', 600);
    expect(download).toContain('sig=');
  });
});
