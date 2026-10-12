import { unescapeHTML } from './escape.js';
import { LIST_SECTIONS, PAPER_SIZES, PERSONAL_FIELDS, SECTION_KEYS } from './schema.js';
import { normalizeSectionSettings } from './sections.js';
import { isValidEmail } from './validation.js';

export const SCHEMA_VERSION = 2;

/**
 * @typedef {Record<string, string>} Entry
 * @typedef {Object} ResumeData
 * @property {number} version
 * @property {string} fullName
 * @property {string} headline
 * @property {string} email
 * @property {string} phone
 * @property {string} location
 * @property {string} website
 * @property {string} linkedin
 * @property {string} github
 * @property {string} summary
 * @property {Entry[]} experience
 * @property {Entry[]} education
 * @property {Entry[]} projects
 * @property {Entry[]} skills
 * @property {Entry[]} certifications
 * @property {Entry[]} languages
 * @property {{order: string[], hidden: string[]}} sectionSettings
 * @property {boolean} compactMode
 * @property {'a4'|'letter'} paper
 */

/** @returns {Entry} */
export function createEntry(sectionKey) {
  const def = LIST_SECTIONS[sectionKey];
  if (!def) throw new Error(`Unknown section "${sectionKey}"`);
  return Object.fromEntries(def.fields.map((f) => [f.key, '']));
}

/** @returns {ResumeData} */
export function createEmptyResume() {
  return {
    version: SCHEMA_VERSION,
    ...Object.fromEntries(PERSONAL_FIELDS.map((f) => [f.key, ''])),
    summary: '',
    experience: [createEntry('experience')],
    education: [createEntry('education')],
    projects: [],
    skills: [createEntry('skills'), createEntry('skills'), createEntry('skills')],
    certifications: [],
    languages: [],
    sectionSettings: normalizeSectionSettings(),
    compactMode: false,
    paper: 'a4',
  };
}

const str = (v) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));

/**
 * Coerce anything that looks like resume data — including the v1 format,
 * which HTML-escaped values before saving, stored skills as plain strings
 * and named the language field inconsistently — into a valid v2 object.
 * Never throws; unknown keys are dropped.
 *
 * @param {unknown} raw
 * @returns {ResumeData}
 */
export function normalizeResume(raw) {
  const input = raw && typeof raw === 'object' ? /** @type {Record<string, any>} */ (raw) : {};
  const legacy = !input.version || input.version < SCHEMA_VERSION;
  const clean = (v) => (legacy ? unescapeHTML(str(v)) : str(v));
  const base = createEmptyResume();

  for (const f of PERSONAL_FIELDS) base[f.key] = clean(input[f.key]);
  base.summary = clean(input.summary);

  for (const [key, def] of Object.entries(LIST_SECTIONS)) {
    const list = Array.isArray(input[key]) ? input[key] : [];
    base[key] = list
      .map((item) => {
        // v1 stored skills as bare strings
        const obj = typeof item === 'string' ? { name: item } : item && typeof item === 'object' ? item : {};
        // v1 previews read languages from `language`, storage used `name`
        if (key === 'languages' && !obj.name && obj.language) obj.name = obj.language;
        return Object.fromEntries(def.fields.map((f) => [f.key, clean(obj[f.key])]));
      })
      .filter((e) => !isEntryEmpty(key, e));
  }

  base.sectionSettings = normalizeSectionSettings(input.sectionSettings);
  base.compactMode = Boolean(input.compactMode);
  base.paper = input.paper in PAPER_SIZES ? input.paper : 'a4';
  return base;
}

/**
 * @param {string} sectionKey
 * @param {Entry} entry
 */
export function isEntryEmpty(sectionKey, entry) {
  const def = LIST_SECTIONS[sectionKey];
  return !def.meaningful.some((k) => entry[k] && entry[k].trim());
}

/**
 * The data a template should render: entries the user left blank are
 * removed and every string is trimmed.
 * @param {ResumeData} data
 * @returns {ResumeData}
 */
export function toRenderable(data) {
  const out = { ...data };
  for (const f of PERSONAL_FIELDS) out[f.key] = str(data[f.key]).trim();
  out.summary = str(data.summary).trim();
  for (const key of Object.keys(LIST_SECTIONS)) {
    out[key] = (data[key] || [])
      .filter((e) => !isEntryEmpty(key, e))
      .map((e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, str(v).trim()])));
  }
  return out;
}

/**
 * A 0–100 completeness score plus the most useful next step, so the
 * progress meter can coach instead of just counting.
 * @param {ResumeData} data
 * @returns {{ score: number, nextTip: string | null }}
 */
export function completeness(data) {
  const d = toRenderable(data);
  const checks = [
    [Boolean(d.fullName), 'Add your full name.'],
    [isValidEmail(d.email), 'Add a valid email address.'],
    [Boolean(d.headline), 'Add a headline — the role you want next.'],
    [Boolean(d.phone || d.location), 'Add a phone number or location.'],
    [d.summary.length >= 80, 'Write a 2–3 sentence summary.'],
    [d.experience.length > 0, 'Add at least one position.'],
    [d.experience.some((e) => e.description.length > 40), 'Describe your achievements in a role.'],
    [d.education.length > 0, 'Add your education.'],
    [d.skills.length >= 5, 'List at least five skills.'],
    [
      Boolean(d.linkedin || d.github || d.website) || d.projects.length > 0,
      'Add a project or a link to your work.',
    ],
  ];
  const done = checks.filter(([ok]) => ok).length;
  const next = checks.find(([ok]) => !ok);
  return { score: Math.round((done / checks.length) * 100), nextTip: next ? next[1] : null };
}

/** Section keys that have content and are not hidden, in display order. */
export function visibleSections(data) {
  const d = toRenderable(data);
  const { order, hidden } = d.sectionSettings;
  return order
    .filter((k) => SECTION_KEYS.includes(k) && !hidden.includes(k))
    .filter((k) => (k === 'summary' ? Boolean(d.summary) : d[k].length > 0));
}
