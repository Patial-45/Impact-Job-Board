import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@executive-match/email': path.resolve(__dirname, '../../packages/email/src/index.ts'),
    },
  },
});
