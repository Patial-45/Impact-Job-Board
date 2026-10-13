import { Global, Injectable, Module } from '@nestjs/common';

export interface ObservabilityLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  correlationId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const REDACT_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'apikey',
  'api_key',
  'keyhash',
  'authorization',
  'cookie',
  'signingsecret',
]);

export function sanitizeMetadata(data: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    if (data.length > 500) return `${data.slice(0, 500)}...[TRUNCATED]`;
    return data;
  }
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMetadata(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeMetadata(value, depth + 1);
    }
  }
  return result;
}

@Injectable()
export class ObservabilityService {
  private readonly sentryEnabled: boolean;

  constructor() {
    this.sentryEnabled = Boolean(process.env.SENTRY_DSN);
    if (this.sentryEnabled) {
      this.info('observability.initialized', { provider: 'sentry', dsnConfigured: true });
    }
  }

  info(event: string, metadata?: Record<string, unknown>, correlationId?: string) {
    this.emit({
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      correlationId,
      metadata: sanitizeMetadata(metadata) as Record<string, unknown> | undefined,
    });
  }

  warn(event: string, metadata?: Record<string, unknown>, correlationId?: string) {
    this.emit({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event,
      correlationId,
      metadata: sanitizeMetadata(metadata) as Record<string, unknown> | undefined,
    });
  }

  error(event: string, err: unknown, metadata?: Record<string, unknown>, correlationId?: string) {
    const errorDetails =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
          }
        : {
            name: 'UnknownError',
            message: String(err),
          };

    this.emit({
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      correlationId,
      error: errorDetails,
      metadata: sanitizeMetadata(metadata) as Record<string, unknown> | undefined,
    });
  }

  private emit(entry: ObservabilityLogEntry) {
    const formatted = JSON.stringify(entry);
    if (entry.level === 'error') {
      console.error(formatted);
    } else if (entry.level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }
}

@Global()
@Module({
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
