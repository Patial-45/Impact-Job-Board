import type { NextConfig } from 'next';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(process.cwd(), '../../.env') });
const nextConfig: NextConfig = {
  transpilePackages: ['@executive-match/ui', '@executive-match/types'],
};
export default nextConfig;
