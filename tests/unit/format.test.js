import { describe, expect, it } from 'vitest';
import { formatBytes, relativeTime } from '../../src/core/format.js';

describe('relativeTime', () => {
  const now = Date.parse('2026-06-01T12:00:00Z');
  it.each([
    [10, 'just now'],
    [90, '2 minutes ago'],
    [60 * 60, '1 hour ago'],
    [60 * 60 * 24 * 3, '3 days ago'],
    [60 * 60 * 24 * 400, '1 year ago'],
  ])('%i seconds → %s', (s, label) => expect(relativeTime(now - s * 1000, now)).toBe(label));

  it('returns empty string for invalid dates', () => {
    expect(relativeTime('nope', now)).toBe('');
  });
});

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [2048, '2.0 KB'],
    [5 * 1024 * 1024, '5.00 MB'],
    [-1, '0 B'],
  ])('%i → %s', (n, s) => expect(formatBytes(n)).toBe(s));
});
