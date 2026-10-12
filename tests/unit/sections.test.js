import { describe, expect, it } from 'vitest';
import { SECTION_KEYS } from '../../src/core/schema.js';
import { joinSections, moveItem, normalizeSectionSettings } from '../../src/core/sections.js';

describe('normalizeSectionSettings', () => {
  it('returns defaults for missing input', () => {
    expect(normalizeSectionSettings()).toEqual({ order: SECTION_KEYS, hidden: [] });
  });
  it('removes unknown and duplicate keys and appends missing ones', () => {
    const s = normalizeSectionSettings({ order: ['skills', 'skills', 'x'], hidden: ['x', 'summary'] });
    expect(s.order[0]).toBe('skills');
    expect(new Set(s.order).size).toBe(SECTION_KEYS.length);
    expect(s.hidden).toEqual(['summary']);
  });
});

describe('joinSections', () => {
  const html = Object.fromEntries(SECTION_KEYS.map((k) => [k, `[${k}]`]));
  it('respects order, hidden and the allowed subset', () => {
    const settings = {
      order: ['skills', 'summary', ...SECTION_KEYS.slice(1).filter((k) => k !== 'skills')],
      hidden: ['summary'],
    };
    expect(joinSections(html, settings, ['summary', 'skills', 'languages'])).toBe('[skills][languages]');
  });
});

describe('moveItem', () => {
  it('moves without mutating the input', () => {
    const input = ['a', 'b', 'c'];
    expect(moveItem(input, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(input).toEqual(['a', 'b', 'c']);
  });
  it('ignores out-of-range moves', () => {
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
  });
});
