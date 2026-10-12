/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import * as crypto from 'crypto';
import { IntegrationsService } from './integrations.module';
import type { DatabaseService } from '../platform/database.module';
import type { WorkspaceAccessService } from './workspaces.module';

function createMockDb() {
  return {
    webhookEndpoint: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    webhookDelivery: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    apiKey: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    atsIntegration: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  } as unknown as DatabaseService;
}

function createMockAccessService() {
  return {
    requireAction: vi.fn(),
  } as unknown as WorkspaceAccessService;
}

const mockUser = {
  id: 'u-admin-1',
  email: 'admin@acme.com',
  globalRole: 'USER',
};

const mockWorkspace = {
  id: 'ws-123',
  slug: 'acme-talent',
  name: 'Acme Talent Corp',
};

describe('IntegrationsService - Webhooks, API Keys & ATS Connectors', () => {
  it('getSummary: returns aggregated counts across webhooks, api keys and ATS', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new IntegrationsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue(mockWorkspace as any);
    vi.mocked(db.webhookEndpoint.count).mockResolvedValue(3);
    vi.mocked(db.apiKey.count).mockResolvedValue(2);
    vi.mocked(db.atsIntegration.count).mockResolvedValue(1);

    const summary = await service.getSummary('acme-talent', mockUser as any);

    expect(summary.activeWebhooks).toBe(3);
    expect(summary.activeApiKeys).toBe(2);
    expect(summary.connectedAts).toBe(1);
    expect(summary.availableAtsProviders).toEqual(['GREENHOUSE', 'LEVER', 'WORKDAY']);
  });

  it('createEndpoint: creates webhook with cryptographically secure whsec_ secret', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new IntegrationsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue(mockWorkspace as any);
    vi.mocked(db.webhookEndpoint.create as any).mockImplementation(async ({ data }: any) => ({
      id: 'ep-999',
      workspaceId: data.workspaceId,
      url: data.url,
      description: data.description,
      eventTypes: data.eventTypes,
      secret: data.secret,
      status: data.status,
      createdAt: new Date(),
    }));

    const result = await service.createEndpoint('acme-talent', mockUser as any, {
      url: 'https://webhook.site/test-receiver',
      description: 'Staging webhook',
      eventTypes: ['application.created', 'offer.signed'],
    });

    expect(result.id).toBe('ep-999');
    expect(result.url).toBe('https://webhook.site/test-receiver');
    expect(result.secret.startsWith('whsec_')).toBe(true);
    expect(result.eventTypes).toEqual(['application.created', 'offer.signed']);
  });

  it('testPingEndpoint: generates HMAC-SHA256 signature and records delivery log', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new IntegrationsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue(mockWorkspace as any);
    vi.mocked(db.webhookEndpoint.findFirst).mockResolvedValue({
      id: 'ep-999',
      workspaceId: 'ws-123',
      secret: 'whsec_secret1234567890',
      url: 'https://webhook.site/test',
    } as any);

    vi.mocked(db.webhookDelivery.create).mockResolvedValue({
      id: 'del-101',
      endpointId: 'ep-999',
      eventType: 'ping',
      responseStatus: 200,
      durationMs: 38,
    } as any);

    const result = await service.testPingEndpoint('acme-talent', 'ep-999', mockUser as any, {
      eventType: 'ping',
    });

    expect(result.success).toBe(true);
    expect(result.deliveryId).toBe('del-101');
    expect(result.signature.startsWith('sha256=')).toBe(true);
    expect(result.payload.workspace.id).toBe('ws-123');
  });

  it('createApiKey: hashes secret with SHA-256 and reveals rawKey once upon creation', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new IntegrationsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue(mockWorkspace as any);
    let capturedData: any = null;
    vi.mocked(db.apiKey.create as any).mockImplementation(async ({ data }: any) => {
      capturedData = data;
      return {
        id: 'key-123',
        name: data.name,
        keyPrefix: data.keyPrefix,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      };
    });

    const result = await service.createApiKey('acme-talent', mockUser as any, {
      name: 'Zapier Automation Integration',
      scopes: ['read', 'write'],
      expiresInDays: 30,
    });

    expect(result.id).toBe('key-123');
    expect(result.name).toBe('Zapier Automation Integration');
    expect(result.rawKey.startsWith('em_live_')).toBe(true);
    expect(capturedData.keyPrefix).toBe(result.rawKey.slice(0, 14));

    // Verify stored keyHash is the SHA-256 of rawKey
    const expectedHash = crypto.createHash('sha256').update(result.rawKey).digest('hex');
    expect(capturedData.keyHash).toBe(expectedHash);
  });

  it('revokeApiKey: updates revokedAt timestamp', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new IntegrationsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue(mockWorkspace as any);
    vi.mocked(db.apiKey.findFirst).mockResolvedValue({
      id: 'key-123',
      workspaceId: 'ws-123',
    } as any);

    const now = new Date();
    vi.mocked(db.apiKey.update).mockResolvedValue({
      id: 'key-123',
      revokedAt: now,
    } as any);

    const result = await service.revokeApiKey('acme-talent', 'key-123', mockUser as any);
    expect(result.success).toBe(true);
    expect(result.revokedId).toBe('key-123');
    expect(result.revokedAt).toBe(now);
  });

  it('configureAts & triggerSync: connects provider and executes sync dispatch', async () => {
    const db = createMockDb();
    const access = createMockAccessService();
    const service = new IntegrationsService(db, access);

    vi.mocked(access.requireAction).mockResolvedValue(mockWorkspace as any);
    vi.mocked(db.atsIntegration.upsert).mockResolvedValue({
      provider: 'GREENHOUSE',
      status: 'CONNECTED',
      apiKeyEncrypted: 'gh_har••••••••9988',
      syncConfig: { autoSync: true },
      lastSyncedAt: null,
      updatedAt: new Date(),
    } as any);

    const configResult = await service.configureAts('acme-talent', mockUser as any, {
      provider: 'GREENHOUSE',
      apiKey: 'gh_harvest_live_key_9988',
      syncConfig: { autoSync: true },
    });

    expect(configResult.provider).toBe('GREENHOUSE');
    expect(configResult.status).toBe('CONNECTED');
    expect(configResult.maskedApiKey).toContain('••••••••');

    // Test triggerSync
    vi.mocked(db.atsIntegration.findFirst).mockResolvedValue({
      id: 'ats-1',
      workspaceId: 'ws-123',
      provider: 'GREENHOUSE',
      status: 'CONNECTED',
    } as any);

    const syncResult = await service.triggerSync('acme-talent', mockUser as any, {
      provider: 'GREENHOUSE',
      direction: 'FULL_SYNC',
    });

    expect(syncResult.success).toBe(true);
    expect(syncResult.provider).toBe('GREENHOUSE');
    expect(syncResult.stats.importedRequisitions).toBe(12);
    expect(syncResult.stats.exportedCandidates).toBe(27);
  });
});
