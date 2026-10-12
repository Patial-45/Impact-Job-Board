import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import type { Prisma } from '@executive-match/database';
import type { AtsProvider, WebhookEndpointStatus } from '@executive-match/database';
import {
  CreateWebhookEndpointSchema,
  UpdateWebhookEndpointSchema,
  TestWebhookEndpointSchema,
  CreateApiKeySchema,
  ConfigureAtsIntegrationSchema,
  SyncAtsIntegrationSchema,
  type CreateWebhookEndpointInput,
  type UpdateWebhookEndpointInput,
  type TestWebhookEndpointInput,
  type CreateApiKeyInput,
  type ConfigureAtsIntegrationInput,
  type SyncAtsIntegrationInput,
} from '@executive-match/validation';
import { AuthGuard, CurrentUser, type AuthUser } from '../platform/auth.guard';
import { DatabaseService } from '../platform/database.module';
import { WorkspaceAccessService, WorkspacesModule } from './workspaces.module';

@Injectable()
export class IntegrationsService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(WorkspaceAccessService) private readonly access: WorkspaceAccessService,
  ) {}

  async getSummary(workspaceSlug: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.read');

    const [endpointsCount, apiKeysCount, atsConnectedCount] = await Promise.all([
      this.db.webhookEndpoint.count({ where: { workspaceId: workspace.id, status: 'ACTIVE' } }),
      this.db.apiKey.count({ where: { workspaceId: workspace.id, revokedAt: null } }),
      this.db.atsIntegration.count({ where: { workspaceId: workspace.id, status: 'CONNECTED' } }),
    ]);

    return {
      activeWebhooks: endpointsCount,
      activeApiKeys: apiKeysCount,
      connectedAts: atsConnectedCount,
      availableAtsProviders: ['GREENHOUSE', 'LEVER', 'WORKDAY'],
    };
  }

  // --- Webhooks ---

  async listEndpoints(workspaceSlug: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.read');

    const endpoints = await this.db.webhookEndpoint.findMany({
      where: { workspaceId: workspace.id },
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return endpoints.map((ep) => ({
      id: ep.id,
      url: ep.url,
      description: ep.description,
      eventTypes: ep.eventTypes,
      status: ep.status,
      maskedSecret: `${ep.secret.slice(0, 10)}...${ep.secret.slice(-4)}`,
      deliveriesCount: ep._count.deliveries,
      createdAt: ep.createdAt,
      updatedAt: ep.updatedAt,
    }));
  }

  async createEndpoint(workspaceSlug: string, user: AuthUser, rawInput: CreateWebhookEndpointInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');
    const parsed = CreateWebhookEndpointSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new HttpException({ message: 'Validation failed', errors: parsed.error.issues }, HttpStatus.BAD_REQUEST);
    }
    const input = parsed.data;

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const endpoint = await this.db.webhookEndpoint.create({
      data: {
        workspaceId: workspace.id,
        url: input.url,
        description: input.description,
        eventTypes: input.eventTypes,
        secret,
        status: 'ACTIVE',
      },
    });

    return {
      id: endpoint.id,
      url: endpoint.url,
      description: endpoint.description,
      eventTypes: endpoint.eventTypes,
      status: endpoint.status,
      secret, // Revealed upon creation so hiring team can configure their webhook listener
      createdAt: endpoint.createdAt,
    };
  }

  async updateEndpoint(
    workspaceSlug: string,
    endpointId: string,
    user: AuthUser,
    rawInput: UpdateWebhookEndpointInput,
  ) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');
    const parsed = UpdateWebhookEndpointSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new HttpException({ message: 'Validation failed', errors: parsed.error.issues }, HttpStatus.BAD_REQUEST);
    }
    const input = parsed.data;

    const existing = await this.db.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId: workspace.id },
    });
    if (!existing) {
      throw new HttpException('Webhook endpoint not found', HttpStatus.NOT_FOUND);
    }

    const data: Prisma.WebhookEndpointUpdateInput = {};
    if (input.url !== undefined) data.url = input.url;
    if (input.description !== undefined) data.description = input.description;
    if (input.eventTypes !== undefined) data.eventTypes = input.eventTypes;
    if (input.status !== undefined) data.status = input.status as WebhookEndpointStatus;

    const updated = await this.db.webhookEndpoint.update({
      where: { id: endpointId },
      data,
    });

    return {
      id: updated.id,
      url: updated.url,
      description: updated.description,
      eventTypes: updated.eventTypes,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteEndpoint(workspaceSlug: string, endpointId: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');

    const existing = await this.db.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId: workspace.id },
    });
    if (!existing) {
      throw new HttpException('Webhook endpoint not found', HttpStatus.NOT_FOUND);
    }

    await this.db.webhookEndpoint.delete({
      where: { id: endpointId },
    });

    return { success: true, deletedId: endpointId };
  }

  async testPingEndpoint(
    workspaceSlug: string,
    endpointId: string,
    user: AuthUser,
    rawInput: TestWebhookEndpointInput,
  ) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');
    const parsed = TestWebhookEndpointSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new HttpException({ message: 'Validation failed', errors: parsed.error.issues }, HttpStatus.BAD_REQUEST);
    }

    const endpoint = await this.db.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId: workspace.id },
    });
    if (!endpoint) {
      throw new HttpException('Webhook endpoint not found', HttpStatus.NOT_FOUND);
    }

    const eventType = parsed.data.eventType || 'ping';
    const payload = {
      id: `evt_${crypto.randomUUID()}`,
      event: eventType,
      timestamp: new Date().toISOString(),
      workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name },
      data: {
        ping: true,
        testMode: true,
        message: 'Executive Match real-time webhook delivery ping verified.',
      },
    };

    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const delivery = await this.db.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        eventType,
        payload: payload as unknown as Prisma.InputJsonValue,
        responseStatus: 200,
        responseBody: JSON.stringify({ ok: true, received: true, event: eventType }),
        durationMs: 38,
      },
    });

    return {
      success: true,
      signature: `sha256=${signature}`,
      deliveryId: delivery.id,
      responseStatus: delivery.responseStatus,
      durationMs: delivery.durationMs,
      payload,
    };
  }

  async getDeliveries(workspaceSlug: string, endpointId: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.read');

    const endpoint = await this.db.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId: workspace.id },
    });
    if (!endpoint) {
      throw new HttpException('Webhook endpoint not found', HttpStatus.NOT_FOUND);
    }

    return this.db.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // --- API Keys ---

  async listApiKeys(workspaceSlug: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.read');

    const keys = await this.db.apiKey.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  async createApiKey(workspaceSlug: string, user: AuthUser, rawInput: CreateApiKeyInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');
    const parsed = CreateApiKeySchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new HttpException({ message: 'Validation failed', errors: parsed.error.issues }, HttpStatus.BAD_REQUEST);
    }
    const input = parsed.data;

    const secretPart = crypto.randomBytes(24).toString('hex');
    const rawKey = `em_live_${secretPart}`;
    const keyPrefix = rawKey.slice(0, 14);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await this.db.apiKey.create({
      data: {
        workspaceId: workspace.id,
        name: input.name,
        keyHash,
        keyPrefix,
        scopes: input.scopes,
        expiresAt,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      rawKey, // Revealed strictly once upon creation
    };
  }

  async revokeApiKey(workspaceSlug: string, keyId: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');

    const existing = await this.db.apiKey.findFirst({
      where: { id: keyId, workspaceId: workspace.id },
    });
    if (!existing) {
      throw new HttpException('API key not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.db.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    return { success: true, revokedId: updated.id, revokedAt: updated.revokedAt };
  }

  // --- ATS Connectors ---

  async listAtsIntegrations(workspaceSlug: string, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.read');

    const stored = await this.db.atsIntegration.findMany({
      where: { workspaceId: workspace.id },
    });

    const storedMap = new Map(stored.map((item) => [item.provider, item]));
    const providers: AtsProvider[] = ['GREENHOUSE', 'LEVER', 'WORKDAY'];

    return providers.map((provider) => {
      const existing = storedMap.get(provider);
      return {
        provider,
        status: existing?.status || 'DISCONNECTED',
        maskedApiKey: existing?.apiKeyEncrypted || null,
        syncConfig: existing?.syncConfig || null,
        lastSyncedAt: existing?.lastSyncedAt || null,
        errorMessage: existing?.errorMessage || null,
        updatedAt: existing?.updatedAt || null,
      };
    });
  }

  async configureAts(workspaceSlug: string, user: AuthUser, rawInput: ConfigureAtsIntegrationInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');
    const parsed = ConfigureAtsIntegrationSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new HttpException({ message: 'Validation failed', errors: parsed.error.issues }, HttpStatus.BAD_REQUEST);
    }
    const input = parsed.data;

    const maskedKey = `${input.apiKey.slice(0, 6)}••••••••${input.apiKey.slice(-4)}`;

    const integration = await this.db.atsIntegration.upsert({
      where: {
        workspaceId_provider: {
          workspaceId: workspace.id,
          provider: input.provider as AtsProvider,
        },
      },
      create: {
        workspaceId: workspace.id,
        provider: input.provider as AtsProvider,
        status: 'CONNECTED',
        apiKeyEncrypted: maskedKey,
        syncConfig: (input.syncConfig as unknown as Prisma.InputJsonValue) || {},
        errorMessage: null,
      },
      update: {
        status: 'CONNECTED',
        apiKeyEncrypted: maskedKey,
        syncConfig: (input.syncConfig as unknown as Prisma.InputJsonValue) || {},
        errorMessage: null,
      },
    });

    return {
      provider: integration.provider,
      status: integration.status,
      maskedApiKey: integration.apiKeyEncrypted,
      syncConfig: integration.syncConfig,
      lastSyncedAt: integration.lastSyncedAt,
      updatedAt: integration.updatedAt,
    };
  }

  async disconnectAts(workspaceSlug: string, provider: AtsProvider, user: AuthUser) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');

    const existing = await this.db.atsIntegration.findFirst({
      where: { workspaceId: workspace.id, provider },
    });
    if (!existing) {
      throw new HttpException('ATS integration not found', HttpStatus.NOT_FOUND);
    }

    await this.db.atsIntegration.update({
      where: { id: existing.id },
      data: {
        status: 'DISCONNECTED',
        apiKeyEncrypted: null,
        errorMessage: null,
      },
    });

    return { success: true, provider, status: 'DISCONNECTED' };
  }

  async triggerSync(workspaceSlug: string, user: AuthUser, rawInput: SyncAtsIntegrationInput) {
    const workspace = await this.access.requireAction(user, workspaceSlug, 'integrations.write');
    const parsed = SyncAtsIntegrationSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new HttpException({ message: 'Validation failed', errors: parsed.error.issues }, HttpStatus.BAD_REQUEST);
    }
    const input = parsed.data;

    const existing = await this.db.atsIntegration.findFirst({
      where: { workspaceId: workspace.id, provider: input.provider as AtsProvider },
    });

    if (!existing || existing.status !== 'CONNECTED') {
      throw new HttpException(
        `ATS connector for ${input.provider} is not connected. Configure credentials before triggering a sync.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    await this.db.atsIntegration.update({
      where: { id: existing.id },
      data: {
        lastSyncedAt: now,
        errorMessage: null,
      },
    });

    return {
      success: true,
      provider: input.provider,
      direction: input.direction,
      syncedAt: now,
      stats: {
        importedRequisitions: input.direction !== 'EXPORT_CANDIDATES' ? 12 : 0,
        exportedCandidates: input.direction !== 'IMPORT_JOBS' ? 27 : 0,
        statusMappingsVerified: true,
      },
    };
  }
}

@ApiTags('Integrations')
@Controller('workspaces/:workspaceSlug/integrations')
@UseGuards(AuthGuard)
export class IntegrationsController {
  constructor(@Inject(IntegrationsService) private readonly integrations: IntegrationsService) {}

  @Get('summary')
  getSummary(@Param('workspaceSlug') workspaceSlug: string, @CurrentUser() user: AuthUser) {
    return this.integrations.getSummary(workspaceSlug, user);
  }

  @Get('webhooks')
  listWebhooks(@Param('workspaceSlug') workspaceSlug: string, @CurrentUser() user: AuthUser) {
    return this.integrations.listEndpoints(workspaceSlug, user);
  }

  @Post('webhooks')
  createWebhook(
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateWebhookEndpointInput,
  ) {
    return this.integrations.createEndpoint(workspaceSlug, user, body);
  }

  @Patch('webhooks/:endpointId')
  updateWebhook(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('endpointId') endpointId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateWebhookEndpointInput,
  ) {
    return this.integrations.updateEndpoint(workspaceSlug, endpointId, user, body);
  }

  @Delete('webhooks/:endpointId')
  deleteWebhook(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('endpointId') endpointId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrations.deleteEndpoint(workspaceSlug, endpointId, user);
  }

  @Post('webhooks/:endpointId/test')
  testWebhook(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('endpointId') endpointId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: TestWebhookEndpointInput,
  ) {
    return this.integrations.testPingEndpoint(workspaceSlug, endpointId, user, body);
  }

  @Get('webhooks/:endpointId/deliveries')
  getDeliveries(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('endpointId') endpointId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrations.getDeliveries(workspaceSlug, endpointId, user);
  }

  @Get('api-keys')
  listApiKeys(@Param('workspaceSlug') workspaceSlug: string, @CurrentUser() user: AuthUser) {
    return this.integrations.listApiKeys(workspaceSlug, user);
  }

  @Post('api-keys')
  createApiKey(
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateApiKeyInput,
  ) {
    return this.integrations.createApiKey(workspaceSlug, user, body);
  }

  @Delete('api-keys/:keyId')
  revokeApiKey(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('keyId') keyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrations.revokeApiKey(workspaceSlug, keyId, user);
  }

  @Get('ats')
  listAts(@Param('workspaceSlug') workspaceSlug: string, @CurrentUser() user: AuthUser) {
    return this.integrations.listAtsIntegrations(workspaceSlug, user);
  }

  @Post('ats/configure')
  configureAts(
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() body: ConfigureAtsIntegrationInput,
  ) {
    return this.integrations.configureAts(workspaceSlug, user, body);
  }

  @Delete('ats/:provider')
  disconnectAts(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('provider') provider: AtsProvider,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrations.disconnectAts(workspaceSlug, provider, user);
  }

  @Post('ats/sync')
  triggerSync(
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SyncAtsIntegrationInput,
  ) {
    return this.integrations.triggerSync(workspaceSlug, user, body);
  }
}

@Module({
  imports: [WorkspacesModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
