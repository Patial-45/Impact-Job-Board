import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.module';
import type { DatabaseService } from '../platform/database.module';

describe('HealthController', () => {
  let controller: HealthController;
  let mockDb: { $queryRaw: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };
    controller = new HealthController(mockDb as unknown as DatabaseService);
  });

  describe('liveness probe', () => {
    it('returns status ok and uptime for live()', () => {
      const result = controller.live();
      expect(result.status).toBe('ok');
      expect(typeof result.uptimeSeconds).toBe('number');
      expect(result.timestamp).toBeDefined();
    });

    it('returns status ok for liveness() alias', () => {
      const result = controller.liveness();
      expect(result.status).toBe('ok');
      expect(typeof result.uptimeSeconds).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('readiness probe', () => {
    it('returns ready with database and memory metrics when DB ping succeeds', async () => {
      const result = await controller.ready();
      expect(result.status).toBe('ready');
      expect(result.database.status).toBe('connected');
      expect(typeof result.database.latencyMs).toBe('number');
      expect(typeof result.memory.heapUsedMb).toBe('number');
      expect(typeof result.uptimeSeconds).toBe('number');
      expect(mockDb.$queryRaw).toHaveBeenCalled();
    });

    it('returns ready for readiness() alias', async () => {
      const result = await controller.readiness();
      expect(result.status).toBe('ready');
      expect(result.database.status).toBe('connected');
    });

    it('throws ServiceUnavailableException when DB query fails', async () => {
      mockDb.$queryRaw.mockRejectedValueOnce(new Error('Connection terminated'));
      await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('legacy health endpoint', () => {
    it('returns ok when DB query succeeds', async () => {
      const result = await controller.health();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('ok');
      expect(typeof result.latencyMs).toBe('number');
    });

    it('throws ServiceUnavailableException when DB query fails', async () => {
      mockDb.$queryRaw.mockRejectedValueOnce(new Error('DB unreachable'));
      await expect(controller.health()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
