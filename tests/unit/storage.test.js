import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyResume } from '../../src/core/resume.js';
import { HISTORY_LIMIT, HISTORY_PREFIX, RESUMES_KEY, ResumeStore } from '../../src/core/storage.js';

/** Minimal in-memory implementation of the Web Storage API. */
class MemoryStorage {
  #map = new Map();
  get length() {
    return this.#map.size;
  }
  key(i) {
    return [...this.#map.keys()][i] ?? null;
  }
  getItem(k) {
    return this.#map.has(k) ? this.#map.get(k) : null;
  }
  setItem(k, v) {
    this.#map.set(k, String(v));
  }
  removeItem(k) {
    this.#map.delete(k);
  }
  clear() {
    this.#map.clear();
  }
}

const resume = (name) => ({ ...createEmptyResume(), fullName: name });

describe('ResumeStore', () => {
  /** @type {MemoryStorage} */
  let storage;
  let clock;
  let ids;
  /** @type {ResumeStore} */
  let store;

  beforeEach(() => {
    storage = new MemoryStorage();
    clock = Date.parse('2026-01-01T00:00:00Z');
    ids = 0;
    store = new ResumeStore(storage, { now: () => clock, makeId: () => `r${++ids}` });
  });

  it('creates, updates and lists newest first', () => {
    const a = store.save({ template: 'classic', data: resume('Ann') });
    clock += 1000;
    const b = store.save({ template: 'modern', data: resume('Bob') });
    clock += 1000;
    store.save({ id: a.id, template: 'classic', data: resume('Ann 2') });

    const list = store.list();
    expect(list.map((r) => r.title)).toEqual(['Ann 2', 'Bob']);
    expect(store.get(a.id)?.createdAt).toBe(a.createdAt);
    expect(store.latest()?.id).toBe(a.id);
    expect(b.id).toBe('r2');
  });

  it('stores a deep copy, so later mutations do not leak in', () => {
    const data = resume('Ann');
    const r = store.save({ template: 'classic', data });
    data.fullName = 'Mutated';
    expect(store.get(r.id)?.data.fullName).toBe('Ann');
  });

  it('reads resumes written by v1 of the app', () => {
    storage.setItem(
      RESUMES_KEY,
      JSON.stringify([
        { id: 'old', title: 'R&amp;D', template: 'template2', data: { fullName: 'R&amp;D', skills: ['Go'] } },
      ]),
    );
    const r = store.get('old');
    expect(r?.title).toBe('R&D');
    expect(r?.data.skills).toEqual([{ name: 'Go' }]);
  });

  it('survives corrupted storage', () => {
    storage.setItem(RESUMES_KEY, '{not json');
    expect(store.list()).toEqual([]);
    storage.setItem(RESUMES_KEY, JSON.stringify([null, 1, { title: 'no id' }]));
    expect(store.list()).toEqual([]);
  });

  it('duplicates with a new id and a "(copy)" title', () => {
    const a = store.save({ template: 'bold', data: resume('Ann') });
    const copy = store.duplicate(a.id);
    expect(copy?.id).not.toBe(a.id);
    expect(copy?.title).toBe('Ann (copy)');
    expect(store.list()).toHaveLength(2);
    expect(store.duplicate('missing')).toBeNull();
  });

  it('removes a resume together with its history', () => {
    const a = store.save({ template: 'classic', data: resume('Ann') });
    expect(storage.getItem(HISTORY_PREFIX + a.id)).not.toBeNull();
    store.remove(a.id);
    expect(store.list()).toEqual([]);
    expect(storage.getItem(HISTORY_PREFIX + a.id)).toBeNull();
  });

  it('removeAll clears every resume and history key', () => {
    store.save({ template: 'classic', data: resume('A') });
    store.save({ template: 'classic', data: resume('B') });
    store.removeAll();
    expect(storage.length).toBe(0);
  });

  describe('history', () => {
    it('throttles snapshots to one per minute and skips identical content', () => {
      const a = store.save({ template: 'classic', data: resume('v1') });
      clock += 10_000;
      store.save({ id: a.id, template: 'classic', data: resume('v2') }); // too soon
      clock += 60_000;
      store.save({ id: a.id, template: 'classic', data: resume('v2') });
      clock += 60_000;
      store.save({ id: a.id, template: 'classic', data: resume('v2') }); // identical
      expect(store.history(a.id).map((s) => s.data.fullName)).toEqual(['v1', 'v2']);
    });

    it(`keeps at most ${HISTORY_LIMIT} snapshots`, () => {
      const a = store.save({ template: 'classic', data: resume('v0') });
      for (let i = 1; i <= HISTORY_LIMIT + 5; i++) {
        clock += 61_000;
        store.save({ id: a.id, template: 'classic', data: resume(`v${i}`) });
      }
      const h = store.history(a.id);
      expect(h).toHaveLength(HISTORY_LIMIT);
      expect(h.at(-1)?.data.fullName).toBe(`v${HISTORY_LIMIT + 5}`);
    });

    it('restores an earlier version', () => {
      const a = store.save({ template: 'classic', data: resume('old') });
      clock += 61_000;
      store.save({ id: a.id, template: 'modern', data: resume('new') });
      const restored = store.restore(a.id, 0);
      expect(restored?.data.fullName).toBe('old');
      expect(restored?.template).toBe('classic');
      expect(store.restore(a.id, 99)).toBeNull();
    });
  });

  describe('import / export', () => {
    it('round-trips a full backup without overwriting existing resumes', () => {
      store.save({ template: 'classic', data: resume('Ann') });
      const backup = JSON.parse(JSON.stringify(store.exportAll()));
      const created = store.import(backup);
      expect(created).toHaveLength(1);
      expect(store.list()).toHaveLength(2);
    });

    it('accepts a single exported resume and legacy shapes', () => {
      expect(store.import({ template: 'modern', data: { fullName: 'One' } })[0].title).toBe('One');
      expect(store.import([{ data: { fullName: 'Two' } }])[0].title).toBe('Two');
    });

    it('rejects files without resumes', () => {
      expect(() => store.import({ hello: 'world' })).toThrow(/No resumes/);
    });
  });

  it('reports usage in bytes', () => {
    store.save({ template: 'classic', data: resume('Ann') });
    const u = store.usage();
    expect(u.resumes).toBeGreaterThan(0);
    expect(u.history).toBeGreaterThan(0);
    expect(u.total).toBe(u.resumes + u.history);
    expect(u.ratio).toBeGreaterThan(0);
  });
});
