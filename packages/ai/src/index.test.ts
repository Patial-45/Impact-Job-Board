import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  cosineToPercentage,
  DeterministicEmbeddingProvider,
  DefaultAiProviderRegistry,
  buildCandidateEmbeddingDocument,
  buildJobEmbeddingDocument,
  calculateHybridScore,
} from './index';

describe('packages/ai - Vector Math & Cosine Similarity', () => {
  it('calculates identical vectors as similarity 1.0', () => {
    const v1 = [1, 2, 3, 4];
    const v2 = [1, 2, 3, 4];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
  });

  it('calculates orthogonal vectors as similarity 0.0', () => {
    const v1 = [1, 0];
    const v2 = [0, 1];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 5);
  });

  it('calculates opposite vectors as similarity -1.0', () => {
    const v1 = [1, 2];
    const v2 = [-1, -2];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1.0, 5);
  });

  it('returns 0 for empty or mismatched vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 2], [1])).toBe(0);
  });

  it('scales similarity to percentage correctly', () => {
    expect(cosineToPercentage(1.0)).toBe(100);
    expect(cosineToPercentage(0.5)).toBe(50);
    expect(cosineToPercentage(0.0)).toBe(0);
    expect(cosineToPercentage(-0.5)).toBe(0);
  });
});

describe('packages/ai - Deterministic Embedding Provider', () => {
  const provider = new DeterministicEmbeddingProvider(384);

  it('generates consistent normalized vectors for identical texts', async () => {
    const res1 = await provider.embed({
      texts: ['Senior TypeScript Engineer in San Francisco'],
      context: { requestId: 'req-1', purpose: 'test', timeoutMs: 5000 },
    });
    const res2 = await provider.embed({
      texts: ['Senior TypeScript Engineer in San Francisco'],
      context: { requestId: 'req-2', purpose: 'test', timeoutMs: 5000 },
    });

    expect(res1.vectors).toHaveLength(1);
    expect(res1.vectors[0]).toHaveLength(384);
    expect(res1.vectors[0]).toEqual(res2.vectors[0]);

    // Check similarity of same text is 1.0
    const sim = cosineSimilarity(res1.vectors[0]!, res2.vectors[0]!);
    expect(sim).toBeCloseTo(1.0, 4);
  });

  it('produces higher similarity for semantically related texts than unrelated texts', async () => {
    const res = await provider.embed({
      texts: [
        'React TypeScript frontend developer web UI components',
        'Senior React Engineer building web user interfaces',
        'Chef cooking italian pasta in restaurant kitchen',
      ],
      context: { requestId: 'req-1', purpose: 'test', timeoutMs: 5000 },
    });

    const vReact1 = res.vectors[0]!;
    const vReact2 = res.vectors[1]!;
    const vChef = res.vectors[2]!;

    const simRelated = cosineSimilarity(vReact1, vReact2);
    const simUnrelated = cosineSimilarity(vReact1, vChef);

    expect(simRelated).toBeGreaterThan(simUnrelated);
  });
});

describe('packages/ai - Text Document Builders', () => {
  it('formats candidate profile document with experience and skills', () => {
    const doc = buildCandidateEmbeddingDocument({
      headline: 'Staff Full-Stack Engineer',
      yearsOfExperience: 8,
      location: 'New York, NY',
      openToRemote: true,
      skills: [{ name: 'TypeScript' }, { name: 'PostgreSQL' }],
      experiences: [
        { title: 'Tech Lead', companyName: 'Acme Corp', description: 'Led cloud migration' },
      ],
      bio: 'Passionate about distributed systems',
    });

    expect(doc).toContain('Headline: Staff Full-Stack Engineer');
    expect(doc).toContain('Experience: 8 years');
    expect(doc).toContain('Skills: TypeScript, PostgreSQL');
    expect(doc).toContain('Recent Roles: Tech Lead at Acme Corp');
  });

  it('formats job requisition document with required and preferred skills', () => {
    const doc = buildJobEmbeddingDocument({
      title: 'Principal Backend Engineer',
      department: 'Platform',
      experienceLevel: 'LEAD',
      remoteType: 'REMOTE',
      skills: [
        { name: 'Go', isRequired: true },
        { name: 'Kubernetes', isRequired: false },
      ],
      description: 'Building high throughput payment platform.',
    });

    expect(doc).toContain('Title: Principal Backend Engineer');
    expect(doc).toContain('Required Skills: Go');
    expect(doc).toContain('Preferred Skills: Kubernetes');
    expect(doc).toContain('Workplace: REMOTE');
  });
});

describe('packages/ai - Hybrid Score Calculation', () => {
  it('combines deterministic and semantic scores using default 70/30 weighting', () => {
    // 80 * 0.7 + 90 * 0.3 = 56 + 27 = 83
    const result = calculateHybridScore(80, 90);
    expect(result.overallScore).toBe(83);
    expect(result.deterministicScore).toBe(80);
    expect(result.semanticScore).toBe(90);
    expect(result.explanation).toContain('Exceptional alignment');
  });

  it('supports custom weights', () => {
    // 50 * 0.5 + 100 * 0.5 = 75
    const result = calculateHybridScore(50, 100, { deterministic: 0.5, semantic: 0.5 });
    expect(result.overallScore).toBe(75);
  });
});

describe('packages/ai - Default Registry Fallback', () => {
  it('defaults to deterministic local embedding provider when no key is set', async () => {
    const registry = new DefaultAiProviderRegistry();
    const embeddingProvider = registry.embedding();
    const res = await embeddingProvider.embed({
      texts: ['Testing default registry'],
      context: { requestId: 'req-test', purpose: 'test', timeoutMs: 3000 },
    });
    expect(res.vectors).toHaveLength(1);
    expect(res.usage.provider).toBe('deterministic-local');
  });
});
