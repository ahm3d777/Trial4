import { describe, expect, it } from 'vitest';
import { highlight, levenshtein, rank, suggest } from '../../src/core/suggest.js';

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['abc', '', 3],
    ['kitten', 'sitting', 3],
    ['react', 'raect', 2],
  ])('%j → %j = %i', (a, b, d) => expect(levenshtein(a, b)).toBe(d));
});

describe('rank', () => {
  it('orders exact > prefix > word prefix > substring > fuzzy', () => {
    const scores = [
      rank('React', 'react'),
      rank('Reactive', 'react'),
      rank('Learn React', 'react'),
      rank('Preact', 'react'),
      rank('Raect Native', 'react'),
    ];
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(scores.every((s) => s > 0)).toBe(true);
  });

  it('returns 0 for no match or empty query', () => {
    expect(rank('Python', 'java')).toBe(0);
    expect(rank('Python', '  ')).toBe(0);
  });
});

describe('suggest', () => {
  const data = ['JavaScript', 'Java', 'TypeScript', 'Python'];

  it('ranks, de-duplicates case-insensitively and limits results', () => {
    expect(suggest('jav', [['javascript'], data], 3)).toEqual(['Java', 'javascript']);
  });

  it('shows the first items (recent first) when the query is empty', () => {
    expect(suggest('', [['Recent'], data], 2)).toEqual(['Recent', 'JavaScript']);
  });

  it('hides a suggestion identical to what is already typed', () => {
    expect(suggest('Python', [data])).toEqual([]);
  });

  it('tolerates typos', () => {
    expect(suggest('Pyhton', [data])).toContain('Python');
  });
});

describe('highlight', () => {
  it('splits text into matched and unmatched parts, case-insensitively', () => {
    expect(highlight('JavaScript and Java', 'java')).toEqual([
      { text: 'Java', match: true },
      { text: 'Script and ', match: false },
      { text: 'Java', match: true },
    ]);
  });
});
