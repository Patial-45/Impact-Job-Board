import { Controller, Get, Inject, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../platform/database.module';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get('live')
  live() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('liveness')
  liveness() {
    return this.live();
  }

  @Get('ready')
  async ready() {
    const started = Date.now();
    try {
      await this.db.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - started;
      const mem = process.memoryUsage();

      return {
        status: 'ready',
        database: {
          status: 'connected',
          latencyMs,
        },
        memory: {
          heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database readiness check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('readiness')
  readiness() {
    return this.ready();
  }

  @Get()
  async health() {
    const started = Date.now();
    try {
      await this.db.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'ok',
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}

