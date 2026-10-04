import { createHmac } from 'node:crypto';

export type StoredFile = {
  key: string;
  contentType: string;
  sizeBytes: number;
  checksum?: string;
  data?: Buffer;
};

export interface ObjectStorage {
  createUploadUrl(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresInSeconds: number;
  }): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }>;
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists?(key: string): Promise<boolean>;
}

export type StorageDriver = 'local' | 's3' | 'r2' | 'memory';

export class MemoryStorageProvider implements ObjectStorage {
  private readonly files = new Map<string, StoredFile>();
  private readonly signingSecret: string;
  private readonly baseUrl: string;

  constructor(options?: { signingSecret?: string; baseUrl?: string }) {
    this.signingSecret = options?.signingSecret ?? 'dev-storage-signing-secret';
    this.baseUrl = options?.baseUrl ?? 'http://localhost:4000/api/v1/storage';
  }

  private sign(key: string, expiresAt: number): string {
    return createHmac('sha256', this.signingSecret)
      .update(`${key}:${expiresAt}`)
      .digest('hex');
  }

  async createUploadUrl(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresInSeconds: number;
  }): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }> {
    const expiresAt = Math.floor(Date.now() / 1000) + input.expiresInSeconds;
    const signature = this.sign(input.key, expiresAt);
    const url = `${this.baseUrl}/upload?key=${encodeURIComponent(input.key)}&expires=${expiresAt}&sig=${signature}`;
    return {
      url,
      method: 'PUT',
      headers: {
        'Content-Type': input.contentType,
      },
    };
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = this.sign(key, expiresAt);
    return `${this.baseUrl}/download?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${signature}`;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.files.has(key);
  }

  putFile(file: StoredFile): void {
    this.files.set(file.key, file);
  }

  getFile(key: string): StoredFile | undefined {
    return this.files.get(key);
  }
}

export class LocalStorageProvider implements ObjectStorage {
  private readonly memoryFallback: MemoryStorageProvider;

  constructor(options?: { uploadDir?: string; signingSecret?: string; baseUrl?: string }) {
    this.memoryFallback = new MemoryStorageProvider({
      signingSecret: options?.signingSecret,
      baseUrl: options?.baseUrl,
    });
  }

  async createUploadUrl(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresInSeconds: number;
  }): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }> {
    return this.memoryFallback.createUploadUrl(input);
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.memoryFallback.createDownloadUrl(key, expiresInSeconds);
  }

  async delete(key: string): Promise<void> {
    return this.memoryFallback.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.memoryFallback.exists(key);
  }
}

