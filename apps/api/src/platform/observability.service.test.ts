import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObservabilityService, sanitizeMetadata } from './observability.module';

describe('ObservabilityService & sanitizeMetadata', () => {
  describe('sanitizeMetadata', () => {
    it('redacts sensitive keys recursively', () => {
      const input = {
        name: 'test',
        password: 'supersecretpassword',
        auth: {
          token: 'jwt.token.here',
          apiKey: 'em_live_123',
          normalField: 42,
        },
        items: [
          { secret: 'hush', publicVal: 'hello' },
        ],
      };

      const sanitized = sanitizeMetadata(input) as {
        name: string;
        password: string;
        auth: { token: string; apiKey: string; normalField: number };
        items: Array<{ secret: string; publicVal: string }>;
      };
      expect(sanitized.name).toBe('test');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.auth.token).toBe('[REDACTED]');
      expect(sanitized.auth.apiKey).toBe('[REDACTED]');
      expect(sanitized.auth.normalField).toBe(42);
      expect(sanitized.items[0]?.secret).toBe('[REDACTED]');
      expect(sanitized.items[0]?.publicVal).toBe('hello');
    });

    it('handles primitive values safely', () => {
      expect(sanitizeMetadata(null)).toBeNull();
      expect(sanitizeMetadata(undefined)).toBeUndefined();
      expect(sanitizeMetadata('hello')).toBe('hello');
      expect(sanitizeMetadata(123)).toBe(123);
    });

    it('truncates excessively long strings', () => {
      const longString = 'a'.repeat(600);
      const result = sanitizeMetadata(longString);
      expect(typeof result).toBe('string');
      expect((result as string).includes('[TRUNCATED]')).toBe(true);
    });
  });

  describe('ObservabilityService logger methods', () => {
    let service: ObservabilityService;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service = new ObservabilityService();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('logs structured info events with sanitized payload', () => {
      service.info('user.login', { userId: 'u-1', token: 'raw-jwt' }, 'req-1');
      expect(consoleLogSpy).toHaveBeenCalled();
      const rawLog = String(consoleLogSpy.mock.calls[0]?.[0] ?? '');
      const parsed = JSON.parse(rawLog);
      expect(parsed.level).toBe('info');
      expect(parsed.event).toBe('user.login');
      expect(parsed.correlationId).toBe('req-1');
      expect(parsed.metadata.token).toBe('[REDACTED]');
      expect(parsed.metadata.userId).toBe('u-1');
    });

    it('logs structured warn events', () => {
      service.warn('rate.limit.approaching', { ip: '127.0.0.1' }, 'req-2');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const rawWarn = String(consoleWarnSpy.mock.calls[0]?.[0] ?? '');
      const parsed = JSON.parse(rawWarn);
      expect(parsed.level).toBe('warn');
      expect(parsed.event).toBe('rate.limit.approaching');
    });

    it('logs structured error events with error name and message', () => {
      service.error('db.query.failed', new Error('Timeout connection'), { table: 'users' }, 'req-3');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const rawError = String(consoleErrorSpy.mock.calls[0]?.[0] ?? '');
      const parsed = JSON.parse(rawError);
      expect(parsed.level).toBe('error');
      expect(parsed.event).toBe('db.query.failed');
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.message).toBe('Timeout connection');
    });
  });
});
