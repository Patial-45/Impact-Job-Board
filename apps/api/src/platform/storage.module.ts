import { Global, Module, type Provider } from '@nestjs/common';
import { MemoryStorageProvider, type ObjectStorage } from '@executive-match/storage';

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

const storageProvider: Provider = {
  provide: OBJECT_STORAGE,
  useFactory: (): ObjectStorage => {
    return new MemoryStorageProvider({
      signingSecret: process.env.STORAGE_SIGNING_SECRET ?? 'dev-secret-key-storage-2026',
      baseUrl: process.env.STORAGE_BASE_URL ?? 'http://localhost:4000/api/v1/storage',
    });
  },
};

@Global()
@Module({
  providers: [storageProvider],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
