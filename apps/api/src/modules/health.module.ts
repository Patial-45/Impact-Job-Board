import { Controller, Get, Inject, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../platform/database.module';
@ApiTags('health')
@Controller('health')
class HealthController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  @Get('live') live() {
    return { status: 'ok' };
  }
  @Get() async health() {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
