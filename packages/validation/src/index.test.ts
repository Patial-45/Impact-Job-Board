import { describe, expect, it } from 'vitest';
import { RegisterSchema, WorkspaceSlugSchema } from './index';
describe('validation', () => {
  it('rejects short passwords', () =>
    expect(
      RegisterSchema.safeParse({ email: 'a@example.com', password: 'short', displayName: 'A' })
        .success,
    ).toBe(false));
  it('rejects malformed workspace slugs', () =>
    expect(WorkspaceSlugSchema.safeParse('../other').success).toBe(false));
});
