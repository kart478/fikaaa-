import { describe, expect, it } from 'vitest';
import { compatibilityScore } from '../src/services/matching.service.js';

describe('matching compatibility scoring', () => {
  it('rewards shared interests more than activity preferences', () => {
    expect(compatibilityScore({ sharedInterests: 2, sharedPreferences: 0, sameArea: false, compatibleActivity: false }))
      .toBeGreaterThan(compatibilityScore({ sharedInterests: 0, sharedPreferences: 2, sameArea: false, compatibleActivity: false }));
  });

  it('caps compatibility at 100', () => {
    expect(compatibilityScore({ sharedInterests: 20, sharedPreferences: 10, sameArea: true, compatibleActivity: true })).toBe(100);
  });
});
