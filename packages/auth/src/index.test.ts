import { describe, expect, it } from 'vitest';
import { canPlatform, canWorkspace } from './index';
describe('roles', () => {
  it('does not allow viewers to write jobs', () =>
    expect(canWorkspace('VIEWER', 'jobs.write')).toBe(false));
  it('keeps platform administration separate', () =>
    expect(canPlatform('PLATFORM_ADMIN', 'admin.manage')).toBe(false));
});
