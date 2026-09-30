import { describe, expect, it } from 'vitest';
import { canLeave, canTransitionStatus, isJoinable, nextAvailabilityStatus } from '../src/services/fika.rules.js';

describe('Fika lifecycle rules', () => {
  it('allows joining only open or currently-full Fikas so availability can be recalculated safely', () => {
    expect(isJoinable('OPEN')).toBe(true);
    expect(isJoinable('FULL')).toBe(true);
    expect(isJoinable('CANCELLED')).toBe(false);
    expect(isJoinable('COMPLETED')).toBe(false);
  });

  it('calculates capacity status without opening a completed Fika', () => {
    expect(nextAvailabilityStatus('OPEN', 4, 4)).toBe('FULL');
    expect(nextAvailabilityStatus('FULL', 3, 4)).toBe('OPEN');
    expect(nextAvailabilityStatus('COMPLETED', 2, 4)).toBe('COMPLETED');
  });

  it('only permits valid status transitions and pre-start leaving', () => {
    expect(canTransitionStatus('OPEN', 'ACTIVE')).toBe(true);
    expect(canTransitionStatus('ACTIVE', 'OPEN')).toBe(false);
    expect(canTransitionStatus('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canLeave('STARTING')).toBe(true);
    expect(canLeave('ACTIVE')).toBe(false);
  });
});
