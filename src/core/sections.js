import { SECTION_KEYS } from './schema.js';

/**
 * @typedef {{ order: string[], hidden: string[] }} SectionSettings
 */

/**
 * Sanitise section order/visibility settings: unknown keys are dropped,
 * missing keys are appended in their default position, duplicates removed.
 * @param {unknown} [raw]
 * @returns {SectionSettings}
 */
export function normalizeSectionSettings(raw) {
  const input = raw && typeof raw === 'object' ? /** @type {any} */ (raw) : {};
  const order = Array.isArray(input.order)
    ? [...new Set(input.order.filter((k) => SECTION_KEYS.includes(k)))]
    : [];
  for (const key of SECTION_KEYS) if (!order.includes(key)) order.push(key);
  const hidden = Array.isArray(input.hidden)
    ? [...new Set(input.hidden.filter((k) => SECTION_KEYS.includes(k)))]
    : [];
  return { order, hidden };
}

/**
 * Join pre-rendered section HTML in the user's chosen order, skipping
 * hidden sections and sections that don't belong to this column.
 *
 * @param {Record<string, string>} rendered  sectionKey → HTML ('' when empty)
 * @param {SectionSettings} settings
 * @param {string[]} [allowed]  Restrict to these keys (e.g. a sidebar).
 * @returns {string}
 */
export function joinSections(rendered, settings, allowed = SECTION_KEYS) {
  return settings.order
    .filter((key) => allowed.includes(key) && !settings.hidden.includes(key))
    .map((key) => rendered[key] || '')
    .join('');
}

/**
 * Return a copy of `list` with the item at `from` moved to `to`.
 * Out-of-range indices return an unchanged copy.
 * @template T
 * @param {T[]} list
 * @param {number} from
 * @param {number} to
 * @returns {T[]}
 */
export function moveItem(list, from, to) {
  const copy = list.slice();
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length || from === to) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
