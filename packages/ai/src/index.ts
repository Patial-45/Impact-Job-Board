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
};
export type RetryPolicy = { maxAttempts: number; initialDelayMs: number; maxDelayMs: number };
export type PromptTemplate<T extends Record<string, string>> = {
  id: string;
  version: number;
  render(variables: T): { system: string; prompt: string };
};
export interface AiProviderRegistry {
  llm(config: ModelConfig): LlmProvider;
  embedding(config: ModelConfig): EmbeddingProvider;
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
  constructor() {
    super('AI provider is not configured');
  }
}
export class UnconfiguredLlmProvider implements LlmProvider {
  async generate(): Promise<never> {
    throw new AiUnavailableError();
  }
}
export class UnconfiguredEmbeddingProvider implements EmbeddingProvider {
  async embed(): Promise<never> {
    throw new AiUnavailableError();
  }
}
