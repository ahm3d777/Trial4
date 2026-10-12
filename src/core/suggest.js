/**
 * Pure ranking engine behind the autocomplete. No DOM access.
 */

/**
 * Classic Levenshtein edit distance using two rolling rows (O(n) memory).
 * @param {string} a
 * @param {string} b
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Score how well `candidate` matches `query`. 0 means "no match".
 * Exact > prefix > word-prefix > substring > fuzzy (typo-tolerant).
 * Shorter candidates win ties.
 * @param {string} candidate
 * @param {string} query
 */
export function rank(candidate, query) {
  const c = candidate.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const brevity = Math.max(0, 100 - candidate.length);
  if (c === q) return 1000;
  if (c.startsWith(q)) return 500 + brevity;
  if (c.split(/[\s\-_/(),.]+/).some((w) => w.startsWith(q))) return 300 + brevity;
  if (c.includes(q)) return 200 + brevity;
  if (q.length >= 3) {
    // Compare against the same-length prefix so long candidates aren't penalised.
    const d = levenshtein(q, c.slice(0, q.length));
    if (d <= (q.length >= 5 ? 2 : 1)) return 50 - d;
  }
  return 0;
}

/**
 * Rank and de-duplicate suggestions from several sources.
 * @param {string} query
 * @param {string[][]} sources  Earlier sources win ties (e.g. recent items first).
 * @param {number} [limit]
 * @returns {string[]}
 */
export function suggest(query, sources, limit = 8) {
  const seen = new Set();
  /** @type {{ text: string, score: number, order: number }[]} */
  const pool = [];
  let order = 0;
  for (const list of sources) {
    for (const text of list) {
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push({ text, score: 0, order: order++ });
    }
  }
  if (!query.trim()) return pool.slice(0, limit).map((p) => p.text);

  return pool
    .map((p) => ({ ...p, score: rank(p.text, query) }))
    .filter((p) => p.score > 0 && p.text.toLowerCase() !== query.trim().toLowerCase())
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((p) => p.text);
}

/**
 * Split `text` into segments marking where `query` matches, so the UI can
 * bold matches without building HTML from user input.
 * @param {string} text
 * @param {string} query
 * @returns {{ text: string, match: boolean }[]}
 */
export function highlight(text, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const hit = lower.indexOf(q, i);
    if (hit === -1) break;
    if (hit > i) parts.push({ text: text.slice(i, hit), match: false });
    parts.push({ text: text.slice(hit, hit + q.length), match: true });
    i = hit + q.length;
  }
  if (i < text.length) parts.push({ text: text.slice(i), match: false });
  return parts;
}
