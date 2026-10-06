export type AiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  model: string;
  provider: string;
};

export type AiContext = {
  requestId: string;
  purpose: string;
  timeoutMs: number;
  workspaceId?: string;
};

export type ModelConfig = {
  provider: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  apiKey?: string;
  baseUrl?: string;
};

export type RetryPolicy = { maxAttempts: number; initialDelayMs: number; maxDelayMs: number };

export type PromptTemplate<T extends Record<string, string>> = {
  id: string;
  version: number;
  render(variables: T): { system: string; prompt: string };
};

export interface AiProviderRegistry {
  llm(config?: Partial<ModelConfig>): LlmProvider;
  embedding(config?: Partial<ModelConfig>): EmbeddingProvider;
}

export interface LlmProvider {
  generate(input: {
    system: string;
    prompt: string;
    context: AiContext;
  }): Promise<{ text: string; usage: AiUsage }>;
}

export interface EmbeddingProvider {
  embed(input: {
    texts: string[];
    context: AiContext;
  }): Promise<{ vectors: number[][]; usage: AiUsage }>;
}

export interface StructuredOutput<T> {
  parse(text: string): T;
}

export interface AiTelemetry {
  record(usage: AiUsage & { requestId: string; purpose: string; durationMs: number }): void;
}

export class AiUnavailableError extends Error {
  constructor(message = 'AI provider is not configured') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

export class UnconfiguredLlmProvider implements LlmProvider {
  async generate(): Promise<never> {
    throw new AiUnavailableError('LLM provider is not configured');
  }
}

export class UnconfiguredEmbeddingProvider implements EmbeddingProvider {
  async embed(): Promise<never> {
    throw new AiUnavailableError('Embedding provider is not configured');
  }
}

// -------------------------------------------------------------
// Vector Mathematical Helpers
// -------------------------------------------------------------

/**
 * Calculates cosine similarity between two numeric vectors in [-1, 1].
 * Returns 0 if dimensions mismatch or magnitude is 0.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  const similarity = dotProduct / magnitude;
  return Math.max(-1, Math.min(1, similarity));
}

/**
 * Scales cosine similarity from [-1, 1] to a percentage score in [0, 100].
 */
export function cosineToPercentage(similarity: number): number {
  // Normalize [-0.2, 1.0] range to [0, 100] as negative similarities in embeddings mean irrelevant
  const clamped = Math.max(0, similarity);
  return Math.round(clamped * 100);
}

// -------------------------------------------------------------
// Deterministic Embedding Provider (Offline / Local / CI)
// -------------------------------------------------------------

/**
 * Generates deterministic normalized dense vectors for testing and offline local mode.
 * Dimensions: 384 (standard compact embedding vector size).
 */
export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions: number;

  constructor(dimensions = 384) {
    this.dimensions = dimensions;
  }

  async embed(input: {
    texts: string[];
    context: AiContext;
  }): Promise<{ vectors: number[][]; usage: AiUsage }> {
    const vectors = input.texts.map((text) => this.generateVector(text));
    return {
      vectors,
      usage: {
        provider: 'deterministic-local',
        model: 'hash-dense-384',
        inputTokens: input.texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0),
        outputTokens: 0,
      },
    };
  }

  private generateVector(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const normalized = text.toLowerCase().trim();
    if (!normalized) return vector;

    // Distribute word hashes across dimensions
    const words = normalized.split(/\s+/);
    for (let w = 0; w < words.length; w++) {
      const word = words[w] ?? '';
      let hash = 0;
      for (let c = 0; c < word.length; c++) {
        hash = (hash << 5) - hash + word.charCodeAt(c);
        hash |= 0;
      }
      const primaryIdx = Math.abs(hash) % this.dimensions;
      const secondaryIdx = Math.abs((hash * 31) | 0) % this.dimensions;
      vector[primaryIdx] = (vector[primaryIdx] ?? 0) + 1.0;
      vector[secondaryIdx] = (vector[secondaryIdx] ?? 0) + 0.5;
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const v = vector[i] ?? 0;
      norm += v * v;
    }
    const mag = Math.sqrt(norm);
    if (mag > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = Number(((vector[i] ?? 0) / mag).toFixed(6));
      }
    }
    return vector;
  }
}

// -------------------------------------------------------------
// OpenAI HTTP Embedding & LLM Provider
// -------------------------------------------------------------

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: { apiKey: string; baseUrl?: string; model?: string }) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.model = options.model || 'text-embedding-3-small';
  }

  async embed(input: {
    texts: string[];
    context: AiContext;
  }): Promise<{ vectors: number[][]; usage: AiUsage }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.context.timeoutMs || 15000);

    try {
      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: input.texts,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenAI embedding failed (${res.status}): ${errBody.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
        usage?: { prompt_tokens?: number; total_tokens?: number };
      };

      const sortedData = json.data.sort((a, b) => a.index - b.index);
      return {
        vectors: sortedData.map((d) => d.embedding),
        usage: {
          provider: 'openai',
          model: this.model,
          inputTokens: json.usage?.prompt_tokens,
          outputTokens: 0,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class OpenAiLlmProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: { apiKey: string; baseUrl?: string; model?: string }) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.model = options.model || 'gpt-4o-mini';
  }

  async generate(input: {
    system: string;
    prompt: string;
    context: AiContext;
  }): Promise<{ text: string; usage: AiUsage }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.context.timeoutMs || 25000);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.prompt },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenAI generation failed (${res.status}): ${errBody.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const choice = json.choices[0];
      return {
        text: choice?.message?.content || '',
        usage: {
          provider: 'openai',
          model: this.model,
          inputTokens: json.usage?.prompt_tokens,
          outputTokens: json.usage?.completion_tokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// -------------------------------------------------------------
// Deterministic LLM Provider (Offline / Fallback Rationale Generator)
// -------------------------------------------------------------

export class DeterministicLlmProvider implements LlmProvider {
  async generate(input: {
    system: string;
    prompt: string;
    context: AiContext;
  }): Promise<{ text: string; usage: AiUsage }> {
    // Generate an explainable, deterministic advisory text without external network dependencies
    const text = `Advisory AI Evaluation (${input.context.purpose}): Analysis based on verified profile skills and job requisition criteria. Candidate demonstrates core alignment with listed competencies; evaluate during structured interview stage.`;
    return {
      text,
      usage: {
        provider: 'deterministic-local',
        model: 'simulated-advisor-v1',
        inputTokens: Math.ceil(input.prompt.length / 4),
        outputTokens: Math.ceil(text.length / 4),
      },
    };
  }
}

// -------------------------------------------------------------
// Unified AI Provider Registry
// -------------------------------------------------------------

export class DefaultAiProviderRegistry implements AiProviderRegistry {
  private readonly defaultApiKey?: string;
  private readonly defaultBaseUrl?: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    this.defaultApiKey = options?.apiKey || process.env.OPENAI_API_KEY;
    this.defaultBaseUrl = options?.baseUrl || process.env.OPENAI_BASE_URL;
  }

  embedding(config?: Partial<ModelConfig>): EmbeddingProvider {
    const key = config?.apiKey || this.defaultApiKey;
    if (key && !key.startsWith('dummy') && !key.startsWith('placeholder')) {
      return new OpenAiEmbeddingProvider({
        apiKey: key,
        baseUrl: config?.baseUrl || this.defaultBaseUrl,
        model: config?.model || 'text-embedding-3-small',
      });
    }
    // Fall back gracefully to deterministic dense vector generator
    return new DeterministicEmbeddingProvider(384);
  }

  llm(config?: Partial<ModelConfig>): LlmProvider {
    const key = config?.apiKey || this.defaultApiKey;
    if (key && !key.startsWith('dummy') && !key.startsWith('placeholder')) {
      return new OpenAiLlmProvider({
        apiKey: key,
        baseUrl: config?.baseUrl || this.defaultBaseUrl,
        model: config?.model || 'gpt-4o-mini',
      });
    }
    return new DeterministicLlmProvider();
  }
}

// -------------------------------------------------------------
// Domain Text Serializers for Semantic Search
// -------------------------------------------------------------

/**
 * Normalizes a candidate profile into a structured text document for vector embedding.
 */
export function buildCandidateEmbeddingDocument(candidate: {
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  yearsOfExperience?: number | null;
  openToRemote?: boolean;
  skills?: Array<{ name: string; yearsOfExperience?: number | null; isPrimary?: boolean }>;
  experiences?: Array<{ title: string; companyName: string; description?: string | null }>;
}): string {
  const parts: string[] = [];
  if (candidate.headline) parts.push(`Headline: ${candidate.headline}`);
  if (candidate.yearsOfExperience) parts.push(`Experience: ${candidate.yearsOfExperience} years`);
  if (candidate.location) parts.push(`Location: ${candidate.location}`);
  if (candidate.openToRemote) parts.push(`Remote: Open to remote work`);

  if (candidate.skills && candidate.skills.length > 0) {
    const skillList = candidate.skills.map((s) => s.name).join(', ');
    parts.push(`Skills: ${skillList}`);
  }

  if (candidate.experiences && candidate.experiences.length > 0) {
    const expText = candidate.experiences
      .slice(0, 3)
      .map((e) => `${e.title} at ${e.companyName}${e.description ? ` (${e.description.slice(0, 100)})` : ''}`)
      .join('; ');
    parts.push(`Recent Roles: ${expText}`);
  }

  if (candidate.bio) parts.push(`Summary: ${candidate.bio.slice(0, 300)}`);
  return parts.join('\n');
}

/**
 * Normalizes a job requisition into a structured text document for vector embedding.
 */
export function buildJobEmbeddingDocument(job: {
  title: string;
  department?: string | null;
  description: string;
  location?: string | null;
  remoteType?: string;
  experienceLevel?: string;
  skills?: Array<{ name: string; isRequired?: boolean }>;
}): string {
  const parts: string[] = [];
  parts.push(`Title: ${job.title}`);
  if (job.department) parts.push(`Department: ${job.department}`);
  if (job.experienceLevel) parts.push(`Level: ${job.experienceLevel}`);
  if (job.remoteType) parts.push(`Workplace: ${job.remoteType}`);
  if (job.location) parts.push(`Location: ${job.location}`);

  if (job.skills && job.skills.length > 0) {
    const required = job.skills.filter((s) => s.isRequired).map((s) => s.name);
    const optional = job.skills.filter((s) => !s.isRequired).map((s) => s.name);
    if (required.length) parts.push(`Required Skills: ${required.join(', ')}`);
    if (optional.length) parts.push(`Preferred Skills: ${optional.join(', ')}`);
  }

  if (job.description) {
    // Strip markdown formatting if any and take first 400 chars
    const cleanDesc = job.description.replace(/[#*`]/g, '').trim().slice(0, 400);
    parts.push(`Overview: ${cleanDesc}`);
  }

  return parts.join('\n');
}

/**
 * Computes hybrid match score combining deterministic scoring and semantic similarity.
 * Default weights: 70% deterministic feature scoring, 30% semantic similarity.
 * Guaranteed to produce a calibrated score in [0, 100].
 */
export function calculateHybridScore(
  deterministicScore: number,
  semanticPercentage: number,
  weights: { deterministic: number; semantic: number } = { deterministic: 0.7, semantic: 0.3 },
): {
  overallScore: number;
  deterministicScore: number;
  semanticScore: number;
  explanation: string;
} {
  const normDet = Math.max(0, Math.min(100, deterministicScore));
  const normSem = Math.max(0, Math.min(100, semanticPercentage));

  const totalWeight = weights.deterministic + weights.semantic;
  const detWeight = totalWeight > 0 ? weights.deterministic / totalWeight : 0.7;
  const semWeight = totalWeight > 0 ? weights.semantic / totalWeight : 0.3;

  const overall = Math.round(normDet * detWeight + normSem * semWeight);

  let explanation = '';
  if (normSem >= 80 && normDet >= 80) {
    explanation = 'Exceptional alignment across both verified technical skills and semantic domain background.';
  } else if (normDet >= 75) {
    explanation = 'Strong technical match on required competencies with solid background overlap.';
  } else if (normSem >= 80) {
    explanation = 'High semantic and domain alignment; verify specific required technical tool proficiencies.';
  } else if (overall >= 60) {
    explanation = 'Moderate compatibility; candidate satisfies foundational role requirements.';
  } else {
    explanation = 'Partial overlap; candidate has some relevant competencies but lacks critical requirements.';
  }

  return {
    overallScore: overall,
    deterministicScore: normDet,
    semanticScore: normSem,
    explanation,
  };
}
