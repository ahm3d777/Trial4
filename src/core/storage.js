import { unescapeHTML } from './escape.js';
import { normalizeResume } from './resume.js';

/** Key names are kept from v1 so existing users keep their data. */
export const RESUMES_KEY = 'resumes';
export const HISTORY_PREFIX = 'resume_history_';
export const STORAGE_BUDGET = 5 * 1024 * 1024; // what most browsers allow per origin

export const HISTORY_LIMIT = 15;
export const HISTORY_MIN_INTERVAL_MS = 60_000;

/**
 * @typedef {import('./resume.js').ResumeData} ResumeData
 * @typedef {Object} ResumeRecord
 * @property {string} id
 * @property {string} title
 * @property {string} template
 * @property {ResumeData} data
 * @property {string} createdAt
 * @property {string} updatedAt
 * @typedef {{ timestamp: string, title: string, template: string, data: ResumeData }} Snapshot
 */

/** @returns {string} */
function defaultId() {
  const rand =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `resume_${rand}`;
}

/**
 * Persistence layer for resumes and their autosave history.
 *
 * Takes a `Storage`-compatible object so it can be unit-tested with an
 * in-memory fake, and a clock so time-based behaviour is deterministic.
 */
export class ResumeStore {
  /**
   * @param {Storage} storage
   * @param {{ now?: () => number, makeId?: () => string }} [options]
   */
  constructor(storage, { now = Date.now, makeId = defaultId } = {}) {
    this.storage = storage;
    this.now = now;
    this.makeId = makeId;
  }

  /** @returns {ResumeRecord[]} newest first */
  list() {
    return this.#readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /** @param {string} id */
  get(id) {
    return this.#readAll().find((r) => r.id === id) ?? null;
  }

  /** Most recently edited resume, if any. */
  latest() {
    return this.list()[0] ?? null;
  }

  /**
   * Create or update a resume.
   * @param {{ id?: string|null, template: string, data: ResumeData }} input
   * @returns {ResumeRecord}
   */
  save({ id, template, data }) {
    const all = this.#readAll();
    const stamp = new Date(this.now()).toISOString();
    const existing = id ? all.find((r) => r.id === id) : undefined;
    /** @type {ResumeRecord} */
    const record = {
      id: existing?.id ?? id ?? this.makeId(),
      title: data.fullName?.trim() || 'Untitled resume',
      template,
      data: structuredClone(data),
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    const next = existing ? all.map((r) => (r.id === record.id ? record : r)) : [...all, record];
    this.#writeAll(next);
    this.#recordSnapshot(record);
    return record;
  }

  /** @param {string} id */
  duplicate(id) {
    const source = this.get(id);
    if (!source) return null;
    const copy = this.save({ id: null, template: source.template, data: source.data });
    const renamed = { ...copy, title: `${source.title} (copy)` };
    this.#writeAll(this.#readAll().map((r) => (r.id === copy.id ? renamed : r)));
    return renamed;
  }

  /** @param {string} id */
  remove(id) {
    this.#writeAll(this.#readAll().filter((r) => r.id !== id));
    this.storage.removeItem(HISTORY_PREFIX + id);
  }

  removeAll() {
    for (const r of this.#readAll()) this.storage.removeItem(HISTORY_PREFIX + r.id);
    this.storage.removeItem(RESUMES_KEY);
  }

  /**
   * @param {string} id
   * @returns {Snapshot[]} oldest first
   */
  history(id) {
    const list = this.#parse(this.storage.getItem(HISTORY_PREFIX + id), []);
    return Array.isArray(list) ? list.map((s) => ({ ...s, data: normalizeResume(s.data) })) : [];
  }

  /**
   * Restore a snapshot as the current version of its resume.
   * @param {string} id
   * @param {number} index
   */
  restore(id, index) {
    const snap = this.history(id)[index];
    if (!snap) return null;
    return this.save({ id, template: snap.template, data: snap.data });
  }

  /** Bytes used by this app, split by kind. */
  usage() {
    let resumes = 0;
    let history = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key === null) continue;
      const size = (key.length + (this.storage.getItem(key)?.length ?? 0)) * 2; // UTF-16
      if (key === RESUMES_KEY) resumes += size;
      else if (key.startsWith(HISTORY_PREFIX)) history += size;
    }
    const total = resumes + history;
    return { resumes, history, total, ratio: Math.min(1, total / STORAGE_BUDGET) };
  }

  /** Serializable backup of every resume. */
  exportAll() {
    return {
      app: 'folio',
      version: 2,
      exportedAt: new Date(this.now()).toISOString(),
      resumes: this.list(),
    };
  }

  /**
   * Import a backup (from {@link exportAll}) or a single exported resume.
   * Imported resumes always get fresh ids so nothing is overwritten.
   * @param {unknown} payload
   * @returns {ResumeRecord[]} the records that were created
   */
  import(payload) {
    const p = /** @type {any} */ (payload);
    let items = [];
    if (Array.isArray(p?.resumes)) items = p.resumes;
    else if (Array.isArray(p)) items = p;
    else if (p && typeof p === 'object' && (p.data || p.fullName !== undefined)) items = [p];
    if (!items.length) throw new Error('No resumes found in that file.');

    return items.map((item) => {
      const data = normalizeResume(item.data ?? item);
      return this.save({ id: null, template: String(item.template || 'classic'), data });
    });
  }

  // ---------------------------------------------------------------------------

  /** @returns {ResumeRecord[]} */
  #readAll() {
    const raw = this.#parse(this.storage.getItem(RESUMES_KEY), []);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r) => r && typeof r === 'object' && typeof r.id === 'string')
      .map((r) => {
        const data = normalizeResume(r.data);
        const fallback = new Date(0).toISOString();
        return {
          id: r.id,
          title:
            typeof r.title === 'string' && r.title.trim()
              ? unescapeHTML(r.title)
              : data.fullName || 'Untitled resume',
          template: typeof r.template === 'string' ? r.template : 'classic',
          data,
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : fallback,
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : fallback,
        };
      });
  }

  /** @param {ResumeRecord[]} list */
  #writeAll(list) {
    this.storage.setItem(RESUMES_KEY, JSON.stringify(list));
  }

  /** @param {ResumeRecord} record */
  #recordSnapshot(record) {
    try {
      const key = HISTORY_PREFIX + record.id;
      const list = this.#parse(this.storage.getItem(key), []);
      const history = Array.isArray(list) ? list : [];
      const last = history.at(-1);
      if (last) {
        const same =
          last.template === record.template && JSON.stringify(last.data) === JSON.stringify(record.data);
        const tooSoon = this.now() - new Date(last.timestamp).getTime() < HISTORY_MIN_INTERVAL_MS;
        if (same || tooSoon) return;
      }
      history.push({
        timestamp: record.updatedAt,
        title: record.title,
        template: record.template,
        data: record.data,
      });
      this.storage.setItem(key, JSON.stringify(history.slice(-HISTORY_LIMIT)));
    } catch {
      // History is a safety net; never let it break a save.
    }
  }

  /**
   * @param {string|null} json
   * @param {any} fallback
   */
  #parse(json, fallback) {
    if (!json) return fallback;
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }
}
