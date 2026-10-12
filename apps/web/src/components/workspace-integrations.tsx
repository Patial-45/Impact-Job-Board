'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@executive-match/ui';
import {
  Webhook,
  Key,
  PlugZap,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Send,
  Terminal,
  Clock,
  Radio,
  Shield,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import type {
  IntegrationsSummary,
  WebhookEndpointItem,
  WebhookDeliveryItem,
  ApiKeyItem,
  AtsIntegrationItem,
} from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface WorkspaceIntegrationsProps {
  workspaceSlug: string;
  initialSummary: IntegrationsSummary | null;
  initialWebhooks: WebhookEndpointItem[];
  initialApiKeys: ApiKeyItem[];
  initialAts: AtsIntegrationItem[];
}

const AVAILABLE_WEBHOOK_EVENTS = [
  { id: 'application.created', label: 'Application Submitted' },
  { id: 'application.stage_changed', label: 'Candidate Stage Moved' },
  { id: 'interview.scheduled', label: 'Interview Scheduled' },
  { id: 'interview.completed', label: 'Scorecard Submitted' },
  { id: 'offer.created', label: 'Offer Created' },
  { id: 'offer.sent', label: 'Offer Sent to Candidate' },
  { id: 'offer.accepted', label: 'Offer Digitally Signed' },
  { id: 'offer.rejected', label: 'Offer Declined' },
  { id: 'onboarding.task_completed', label: 'Onboarding Task Done' },
];

const ATS_PROVIDERS_META = {
  GREENHOUSE: {
    name: 'Greenhouse Harvest',
    tagline: 'Sync jobs & candidates with Greenhouse Harvest API v1/v2',
    color: '#0e7c53',
    logoBadge: 'GH',
  },
  LEVER: {
    name: 'Lever Postings',
    tagline: 'Bidirectional sync with Lever ATS opportunities & webhooks',
    color: '#1a56db',
    logoBadge: 'LV',
  },
  WORKDAY: {
    name: 'Workday Human Capital',
    tagline: 'Enterprise HCM enterprise integration for executive requisitions',
    color: '#d97706',
    logoBadge: 'WD',
  },
};

export function WorkspaceIntegrations({
  workspaceSlug,
  initialSummary,
  initialWebhooks,
  initialApiKeys,
  initialAts,
}: WorkspaceIntegrationsProps) {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'apikeys' | 'ats'>('webhooks');
  const [webhooks, setWebhooks] = useState<WebhookEndpointItem[]>(initialWebhooks);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(initialApiKeys);
  const [atsList, setAtsList] = useState<AtsIntegrationItem[]>(initialAts);
  const [summary, setSummary] = useState<IntegrationsSummary | null>(initialSummary);

  // Modals & form state
  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookDesc, setNewWebhookDesc] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([
    'application.created',
    'application.stage_changed',
  ]);
  const [createdSecretAlert, setCreatedSecretAlert] = useState<{ url: string; secret: string } | null>(null);

  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read']);
  const [newKeyExpiry, setNewKeyExpiry] = useState<number | undefined>(90);
  const [createdRawKeyAlert, setCreatedRawKeyAlert] = useState<{ name: string; rawKey: string } | null>(null);

  const [selectedAtsForConfig, setSelectedAtsForConfig] = useState<'GREENHOUSE' | 'LEVER' | 'WORKDAY' | null>(null);
  const [atsApiKeyInput, setAtsApiKeyInput] = useState('');
  const [atsAutoSync, setAtsAutoSync] = useState(true);

  // Inspect deliveries modal
  const [viewDeliveriesFor, setViewDeliveriesFor] = useState<WebhookEndpointItem | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryItem[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Action status / testing
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    endpointId: string;
    signature: string;
    durationMs: number;
    status: number;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    provider: string;
    stats: { importedRequisitions: number; exportedCandidates: number };
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // --- Handlers: Webhooks ---

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-webhook');
    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url: newWebhookUrl,
          description: newWebhookDesc || undefined,
          eventTypes: newWebhookEvents,
        }),
      });

      if (!res.ok) throw new Error('Failed to create webhook endpoint');
      const created = await res.json();

      setWebhooks((prev) => [
        {
          id: created.id,
          url: created.url,
          description: created.description,
          eventTypes: created.eventTypes,
          status: created.status,
          maskedSecret: `${created.secret.slice(0, 10)}...${created.secret.slice(-4)}`,
          deliveriesCount: 0,
          createdAt: created.createdAt,
          updatedAt: created.createdAt,
        },
        ...prev,
      ]);

      setCreatedSecretAlert({ url: created.url, secret: created.secret });
      setIsAddWebhookOpen(false);
      setNewWebhookUrl('');
      setNewWebhookDesc('');
      if (summary) setSummary({ ...summary, activeWebhooks: summary.activeWebhooks + 1 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating webhook');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint? All delivery records will be erased.')) return;
    setActionLoading(`delete-wh-${id}`);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/webhooks/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to delete webhook');
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      if (summary) setSummary({ ...summary, activeWebhooks: Math.max(0, summary.activeWebhooks - 1) });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestPing = async (id: string) => {
    setActionLoading(`test-wh-${id}`);
    setTestResult(null);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/webhooks/${encodeURIComponent(id)}/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ eventType: 'ping' }),
        },
      );
      if (!res.ok) throw new Error('Test ping failed');
      const data = await res.json();
      setTestResult({
        endpointId: id,
        signature: data.signature,
        durationMs: data.durationMs,
        status: data.responseStatus,
      });
      // increment delivery count locally
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, deliveriesCount: w.deliveriesCount + 1 } : w)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Test ping failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLoadDeliveries = async (endpoint: WebhookEndpointItem) => {
    setViewDeliveriesFor(endpoint);
    setLoadingDeliveries(true);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/webhooks/${encodeURIComponent(endpoint.id)}/deliveries`,
        { credentials: 'include' },
      );
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      }
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // --- Handlers: API Keys ---

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-key');
    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          expiresInDays: newKeyExpiry || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create API key');
      const created = await res.json();

      setApiKeys((prev) => [
        {
          id: created.id,
          name: created.name,
          keyPrefix: created.keyPrefix,
          scopes: created.scopes,
          lastUsedAt: null,
          expiresAt: created.expiresAt,
          revokedAt: null,
          createdAt: created.createdAt,
        },
        ...prev,
      ]);

      setCreatedRawKeyAlert({ name: created.name, rawKey: created.rawKey });
      setIsAddKeyOpen(false);
      setNewKeyName('');
      if (summary) setSummary({ ...summary, activeApiKeys: summary.activeApiKeys + 1 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will lose access immediately.')) return;
    setActionLoading(`revoke-key-${id}`);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/api-keys/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to revoke API key');
      setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)));
      if (summary) setSummary({ ...summary, activeApiKeys: Math.max(0, summary.activeApiKeys - 1) });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Handlers: ATS Connectors ---

  const handleConfigureAts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtsForConfig) return;
    setActionLoading('save-ats');
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/ats/configure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            provider: selectedAtsForConfig,
            apiKey: atsApiKeyInput,
            syncConfig: { autoSync: atsAutoSync, syncIntervalMinutes: 60 },
          }),
        },
      );

      if (!res.ok) throw new Error('Failed to configure ATS connector');
      const updated = await res.json();

      setAtsList((prev) =>
        prev.map((item) =>
          item.provider === selectedAtsForConfig
            ? {
                ...item,
                status: 'CONNECTED',
                maskedApiKey: updated.maskedApiKey,
                syncConfig: updated.syncConfig,
                updatedAt: updated.updatedAt,
              }
            : item,
        ),
      );

      setSelectedAtsForConfig(null);
      setAtsApiKeyInput('');
      if (summary) setSummary({ ...summary, connectedAts: summary.connectedAts + 1 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to configure ATS');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectAts = async (provider: 'GREENHOUSE' | 'LEVER' | 'WORKDAY') => {
    if (!confirm(`Are you sure you want to disconnect ${provider}? Automated sync will pause.`)) return;
    setActionLoading(`disconnect-${provider}`);
    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/ats/${encodeURIComponent(provider)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to disconnect ATS');
      setAtsList((prev) =>
        prev.map((item) => (item.provider === provider ? { ...item, status: 'DISCONNECTED', maskedApiKey: null } : item)),
      );
      if (summary) setSummary({ ...summary, connectedAts: Math.max(0, summary.connectedAts - 1) });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect ATS');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerAtsSync = async (provider: 'GREENHOUSE' | 'LEVER' | 'WORKDAY') => {
    setActionLoading(`sync-${provider}`);
    setSyncResult(null);
    try {
      const res = await fetch(`${apiUrl}/workspaces/${encodeURIComponent(workspaceSlug)}/integrations/ats/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider, direction: 'FULL_SYNC' }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'ATS sync trigger failed');
      }
      const data = await res.json();
      setSyncResult({ provider, stats: data.stats });
      setAtsList((prev) =>
        prev.map((item) => (item.provider === provider ? { ...item, lastSyncedAt: data.syncedAt } : item)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 3D Metric Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="card-3d p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Active Webhooks</span>
              <div className="text-3xl font-black text-foreground mt-1 flex items-baseline gap-2">
                {summary?.activeWebhooks ?? webhooks.filter((w) => w.status === 'ACTIVE').length}
                <span className="text-xs text-muted font-normal">endpoints</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <Webhook size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Radio size={13} className="animate-pulse" />
            <span>HMAC-SHA256 Signed Deliveries</span>
          </div>
        </Card>

        <Card className="card-3d p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Active API Keys</span>
              <div className="text-3xl font-black text-foreground mt-1 flex items-baseline gap-2">
                {summary?.activeApiKeys ?? apiKeys.filter((k) => !k.revokedAt).length}
                <span className="text-xs text-muted font-normal">credentials</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
              <Key size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-teal-600 font-medium">
            <Shield size={13} />
            <span>SHA-256 One-Way Storage Hash</span>
          </div>
        </Card>

        <Card className="card-3d p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Connected ATS</span>
              <div className="text-3xl font-black text-foreground mt-1 flex items-baseline gap-2">
                {summary?.connectedAts ?? atsList.filter((a) => a.status === 'CONNECTED').length}
                <span className="text-xs text-muted font-normal">of 3 platforms</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs">
              <PlugZap size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <ArrowRightLeft size={13} />
            <span>Greenhouse, Lever & Workday</span>
          </div>
        </Card>
      </div>

      {/* Secret Generation Alerts */}
      {createdSecretAlert && (
        <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/90 shadow-3d space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Webhook Endpoint Created Successfully</span>
            </div>
            <button
              onClick={() => setCreatedSecretAlert(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-emerald-800">
            Please copy your signing secret now. You will need it to verify HMAC-SHA256 signatures in your receiver:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2.5 rounded-lg bg-white border border-emerald-200 font-mono text-xs text-emerald-950 font-semibold select-all break-all">
              {createdSecretAlert.secret}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(createdSecretAlert.secret, 'new-secret')}
              className="gap-1.5 whitespace-nowrap"
            >
              {copiedKey === 'new-secret' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === 'new-secret' ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      )}

      {createdRawKeyAlert && (
        <div className="p-5 rounded-xl border border-teal-300 bg-teal-50/90 shadow-3d space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-teal-900 font-bold">
              <CheckCircle2 size={18} className="text-teal-600" />
              <span>New API Key Generated: {createdRawKeyAlert.name}</span>
            </div>
            <button
              onClick={() => setCreatedRawKeyAlert(null)}
              className="text-teal-700 hover:text-teal-900 p-1"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
            <AlertCircle size={15} className="shrink-0 text-amber-600" />
            <span>Store this secret immediately. For security, it will NEVER be displayed again!</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2.5 rounded-lg bg-white border border-teal-200 font-mono text-xs text-teal-950 font-semibold select-all break-all">
              {createdRawKeyAlert.rawKey}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(createdRawKeyAlert.rawKey, 'new-key')}
              className="gap-1.5 whitespace-nowrap"
            >
              {copiedKey === 'new-key' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === 'new-key' ? 'Copied' : 'Copy Key'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-subtle border border-line rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'webhooks'
              ? 'bg-white text-foreground shadow-3d-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Webhook size={15} />
          <span>Webhooks & Event Deliveries</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold">
            {webhooks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'apikeys'
              ? 'bg-white text-foreground shadow-3d-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Key size={15} />
          <span>API Access Keys</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold">
            {apiKeys.filter((k) => !k.revokedAt).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ats'
              ? 'bg-white text-foreground shadow-3d-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <PlugZap size={15} />
          <span>Enterprise ATS Connectors</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold">
            {atsList.filter((a) => a.status === 'CONNECTED').length}/3
          </span>
        </button>
      </div>

      {/* TAB 1: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Registered Webhook Endpoints</h2>
              <p className="text-xs text-muted mt-0.5">
                Send real-time recruitment events to external Slack bots, HRIS pipelines, or custom webhooks.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddWebhookOpen(true)}
              className="gap-2"
            >
              <Plus size={16} />
              <span>Add Webhook Endpoint</span>
            </Button>
          </div>

          {/* Test Ping Live Result */}
          {testResult && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 shadow-3d flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  200
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                    <span>Ping Signature Computed & Verified</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {testResult.durationMs}ms
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-800 truncate max-w-xl mt-0.5">
                    {testResult.signature}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setTestResult(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {webhooks.length === 0 ? (
            <Card className="card-3d p-12 text-center border-dashed">
              <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-line flex items-center justify-center mx-auto mb-3 text-muted">
                <Webhook size={24} />
              </div>
              <h3 className="font-bold text-foreground">No Webhooks Registered</h3>
              <p className="text-xs text-muted max-w-md mx-auto mt-1 mb-5">
                Register an HTTP endpoint to receive real-time JSON events when candidates apply, advance stages, or accept offers.
              </p>
              <Button variant="primary" onClick={() => setIsAddWebhookOpen(true)} className="gap-2">
                <Plus size={16} />
                <span>Create First Endpoint</span>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {webhooks.map((ep) => (
                <Card key={ep.id} className="card-3d p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Badge variant={ep.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                        {ep.status}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-foreground break-all">{ep.url}</span>
                    </div>

                    {ep.description && <p className="text-xs text-muted">{ep.description}</p>}

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {ep.eventTypes.map((evt) => (
                        <span
                          key={evt}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-subtle border border-line text-ink-secondary"
                        >
                          {evt}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-muted pt-1">
                      <span>Secret: <span className="font-mono text-ink-secondary">{ep.maskedSecret}</span></span>
                      <span>•</span>
                      <span>{ep.deliveriesCount} deliveries</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTestPing(ep.id)}
                      disabled={actionLoading === `test-wh-${ep.id}`}
                      className="gap-1.5"
                    >
                      <Send size={13} />
                      <span>{actionLoading === `test-wh-${ep.id}` ? 'Sending...' : 'Test Ping'}</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleLoadDeliveries(ep)}
                      className="gap-1.5"
                    >
                      <Terminal size={13} />
                      <span>Logs</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(ep.id)}
                      disabled={actionLoading === `delete-wh-${ep.id}`}
                      className="text-danger hover:bg-danger-subtle p-2"
                      aria-label="Delete endpoint"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: API ACCESS KEYS */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">API Access Credentials</h2>
              <p className="text-xs text-muted mt-0.5">
                Machine-to-machine tokens to authenticate against the Executive Match REST API.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddKeyOpen(true)}
              className="gap-2"
            >
              <Plus size={16} />
              <span>Generate New API Key</span>
            </Button>
          </div>

          {apiKeys.length === 0 ? (
            <Card className="card-3d p-12 text-center border-dashed">
              <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-line flex items-center justify-center mx-auto mb-3 text-muted">
                <Key size={24} />
              </div>
              <h3 className="font-bold text-foreground">No API Keys Generated</h3>
              <p className="text-xs text-muted max-w-md mx-auto mt-1 mb-5">
                Generate keys to connect Zapier, Workato, or your internal hiring microservices.
              </p>
              <Button variant="primary" onClick={() => setIsAddKeyOpen(true)} className="gap-2">
                <Plus size={16} />
                <span>Create Key</span>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((key) => {
                const isRevoked = Boolean(key.revokedAt);
                return (
                  <Card key={key.id} className="card-3d p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={isRevoked ? 'neutral' : 'success'} size="sm">
                          {isRevoked ? 'REVOKED' : 'ACTIVE'}
                        </Badge>
                        <h4 className="font-bold text-sm text-foreground">{key.name}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted">Prefix:</span>
                        <code className="font-mono font-semibold bg-surface-subtle px-2 py-0.5 rounded border border-line">
                          {key.keyPrefix}••••••••
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        {key.scopes.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200">
                            scope:{s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-muted">
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.expiresAt && (
                          <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                        )}
                        {key.lastUsedAt && (
                          <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {!isRevoked && (
                      <div className="shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRevokeApiKey(key.id)}
                          disabled={actionLoading === `revoke-key-${key.id}`}
                          className="text-danger hover:bg-danger-subtle gap-1.5"
                        >
                          <Trash2 size={13} />
                          <span>Revoke Key</span>
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ENTERPRISE ATS CONNECTORS */}
      {activeTab === 'ats' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Enterprise ATS Synchronizers</h2>
            <p className="text-xs text-muted mt-0.5">
              Bidirectional sync with leading Applicant Tracking Systems. Requisitions, applications, and stages sync seamlessly.
            </p>
          </div>

          {syncResult && (
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50 shadow-3d flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-teal-600" />
                <div className="text-xs font-semibold text-teal-950">
                  <span>{syncResult.provider} synchronization complete: </span>
                  <span className="font-mono text-teal-900 ml-1">
                    +{syncResult.stats.importedRequisitions} jobs mapped, +{syncResult.stats.exportedCandidates} candidates synchronized
                  </span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSyncResult(null)}>
                Dismiss
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {atsList.map((ats) => {
              const meta = ATS_PROVIDERS_META[ats.provider];
              const isConnected = ats.status === 'CONNECTED';

              return (
                <Card key={ats.provider} className="card-3d p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.logoBadge}
                      </div>
                      <Badge variant={isConnected ? 'success' : 'neutral'} size="sm">
                        {ats.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground">{meta.name}</h3>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{meta.tagline}</p>
                    </div>

                    {isConnected && ats.maskedApiKey && (
                      <div className="p-3 rounded-lg bg-surface-subtle border border-line space-y-1.5">
                        <div className="text-[11px] text-muted font-medium">Harvest Secret:</div>
                        <code className="text-xs font-mono font-semibold text-foreground">
                          {ats.maskedApiKey}
                        </code>
                      </div>
                    )}

                    {isConnected && ats.lastSyncedAt && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Clock size={12} />
                        <span>Last synced: {new Date(ats.lastSyncedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-line flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTriggerAtsSync(ats.provider)}
                          disabled={actionLoading === `sync-${ats.provider}`}
                          className="flex-1 gap-1.5"
                        >
                          <RefreshCw
                            size={13}
                            className={actionLoading === `sync-${ats.provider}` ? 'animate-spin' : ''}
                          />
                          <span>{actionLoading === `sync-${ats.provider}` ? 'Syncing...' : 'Sync Now'}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectAts(ats.provider)}
                          disabled={actionLoading === `disconnect-${ats.provider}`}
                          className="text-danger hover:bg-danger-subtle"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedAtsForConfig(ats.provider)}
                        className="w-full gap-1.5"
                      >
                        <PlugZap size={13} />
                        <span>Connect {ats.provider}</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD WEBHOOK */}
      {isAddWebhookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <Card className="card-3d p-6 max-w-lg w-full space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Webhook size={18} className="text-accent" />
                <span>Register Webhook Endpoint</span>
              </h3>
              <button onClick={() => setIsAddWebhookOpen(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks/talent"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs font-mono focus:border-accent focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Zapier automation or Slack channel alerts"
                  value={newWebhookDesc}
                  onChange={(e) => setNewWebhookDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs focus:border-accent focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Subscribe to Events</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_WEBHOOK_EVENTS.map((evt) => {
                    const isChecked = newWebhookEvents.includes(evt.id);
                    return (
                      <label
                        key={evt.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked ? 'border-accent bg-emerald-50/50 text-emerald-950 font-semibold' : 'border-line text-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setNewWebhookEvents((prev) => [...prev, evt.id]);
                            else setNewWebhookEvents((prev) => prev.filter((id) => id !== evt.id));
                          }}
                          className="mt-0.5 rounded text-accent"
                        />
                        <span>{evt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddWebhookOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading === 'create-webhook'}>
                  {actionLoading === 'create-webhook' ? 'Generating Endpoint...' : 'Register Endpoint'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: ADD API KEY */}
      {isAddKeyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <Card className="card-3d p-6 max-w-md w-full space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Key size={18} className="text-teal-600" />
                <span>Generate API Key</span>
              </h3>
              <button onClick={() => setIsAddKeyOpen(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workato Sync, Staging Testing"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs focus:border-accent focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Key Expiration</label>
                <select
                  value={newKeyExpiry || 'never'}
                  onChange={(e) => setNewKeyExpiry(e.target.value === 'never' ? undefined : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs bg-white focus:border-accent focus:outline-hidden"
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days (Recommended)</option>
                  <option value="365">1 Year</option>
                  <option value="never">No Expiry (Never)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Access Scopes</label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                    <input
                      type="checkbox"
                      checked={newKeyScopes.includes('read')}
                      onChange={(e) =>
                        setNewKeyScopes((prev) =>
                          e.target.checked ? [...prev, 'read'] : prev.filter((s) => s !== 'read'),
                        )
                      }
                      className="rounded text-accent"
                    />
                    <span>Read (Requisitions & Candidates)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                    <input
                      type="checkbox"
                      checked={newKeyScopes.includes('write')}
                      onChange={(e) =>
                        setNewKeyScopes((prev) =>
                          e.target.checked ? [...prev, 'write'] : prev.filter((s) => s !== 'write'),
                        )
                      }
                      className="rounded text-accent"
                    />
                    <span>Write (Create Candidates & Notes)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddKeyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading === 'create-key'}>
                  {actionLoading === 'create-key' ? 'Hashing & Generating...' : 'Create API Key'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: CONFIGURE ATS */}
      {selectedAtsForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <Card className="card-3d p-6 max-w-md w-full space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <PlugZap size={18} style={{ color: ATS_PROVIDERS_META[selectedAtsForConfig].color }} />
                <span>Configure {ATS_PROVIDERS_META[selectedAtsForConfig].name}</span>
              </h3>
              <button onClick={() => setSelectedAtsForConfig(null)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfigureAts} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">API Harvest Key / OAuth Token</label>
                <input
                  type="password"
                  required
                  placeholder="Paste your ATS API secret here..."
                  value={atsApiKeyInput}
                  onChange={(e) => setAtsApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line text-xs font-mono focus:border-accent focus:outline-hidden"
                />
                <p className="text-[11px] text-muted">
                  Requires Read/Write permissions for Jobs, Applications, and Candidates.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={atsAutoSync}
                  onChange={(e) => setAtsAutoSync(e.target.checked)}
                  className="rounded text-accent"
                />
                <span>Enable hourly background requisition sync</span>
              </label>

              <div className="pt-4 border-t border-line flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setSelectedAtsForConfig(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading === 'save-ats'}>
                  {actionLoading === 'save-ats' ? 'Connecting...' : 'Save & Connect'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: DELIVERIES LOG */}
      {viewDeliveriesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <Card className="card-3d p-6 max-w-2xl w-full space-y-4 bg-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Terminal size={18} className="text-accent" />
                  <span>Delivery History</span>
                </h3>
                <p className="text-xs font-mono text-muted truncate max-w-lg mt-0.5">
                  {viewDeliveriesFor.url}
                </p>
              </div>
              <button onClick={() => setViewDeliveriesFor(null)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingDeliveries ? (
                <div className="p-8 text-center text-xs text-muted">Loading delivery records...</div>
              ) : deliveries.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  No event deliveries recorded yet for this endpoint.
                </div>
              ) : (
                deliveries.map((del) => (
                  <div key={del.id} className="p-3.5 rounded-lg border border-line bg-surface-subtle text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          del.responseStatus === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          HTTP {del.responseStatus || 'ERR'}
                        </span>
                        <span className="font-mono font-bold text-ink">{del.eventType}</span>
                      </div>
                      <span className="text-[11px] text-muted">
                        {new Date(del.createdAt).toLocaleTimeString()} ({del.durationMs}ms)
                      </span>
                    </div>

                    <pre className="p-2.5 rounded bg-white border border-line font-mono text-[11px] text-ink-secondary overflow-x-auto">
                      {JSON.stringify(del.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-line flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setViewDeliveriesFor(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
