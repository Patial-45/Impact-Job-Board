export type StoredFile = { key: string; contentType: string; sizeBytes: number; checksum?: string };
export interface ObjectStorage {
  createUploadUrl(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresInSeconds: number;
  }): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }>;
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
export type StorageDriver = 'local' | 's3' | 'r2';
