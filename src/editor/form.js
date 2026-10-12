import { escapeHTML as e } from '../core/escape.js';
import { LIST_SECTIONS, PERSONAL_FIELDS, SUMMARY_MAX } from '../core/schema.js';
import { icons } from '../ui/icons.js';

/**
 * Pure HTML builders for the editor form. Every input carries a
 * `data-bind` path (e.g. `experience.0.position`) that the editor uses to
 * write the value back into state — the DOM never *is* the state.
 *
 * @typedef {import('../core/schema.js').FieldDef} FieldDef
 * @typedef {import('../core/resume.js').ResumeData} ResumeData
 */

const fieldId = (path) => `f-${path.replace(/\./g, '-')}`;

/**
 * @param {FieldDef} f
 * @param {string} path
 * @param {string} value
 * @param {{ compact?: boolean }} [opts]
 */
export function fieldHTML(f, path, value, { compact = false } = {}) {
  const id = fieldId(path);
  const hintId = f.hint ? `${id}-hint` : '';
  const errId = `${id}-error`;
  const describedBy = [hintId, errId].filter(Boolean).join(' ');
  const common = `id="${id}" name="${e(path)}" data-bind="${e(path)}" aria-describedby="${describedBy}"${
    f.required ? ' required aria-required="true"' : ''
  }`;

  let control;
  if (f.type === 'textarea') {
    control = `<textarea class="input" ${common} rows="${f.rows || 4}"${
      f.maxLength ? ` data-maxlength="${f.maxLength}"` : ''
    } placeholder="${e(f.placeholder || '')}">${e(value)}</textarea>`;
  } else if (f.type === 'select') {
    control = `<select class="input" ${common}>${(f.options || [])
      .map(
        (o) => `<option value="${e(o.value)}"${o.value === value ? ' selected' : ''}>${e(o.label)}</option>`,
      )
      .join('')}</select>`;
  } else {
    const type = f.type === 'url' ? 'text' : f.type || 'text';
    const inputmode = f.type === 'url' ? ' inputmode="url" spellcheck="false"' : '';
    control = `<input class="input" type="${type}" ${common} value="${e(value)}" placeholder="${e(
      f.placeholder || '',
    )}"${inputmode}${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ' autocomplete="off"'}${
      f.suggest ? ` data-suggest="${f.suggest}"` : ''
    }>`;
  }

  const label = compact
    ? `<label for="${id}" class="sr-only">${e(f.label)}</label>`
    : `<label for="${id}" class="field-label">${e(f.label)}${
        f.required ? ' <span class="text-amber-600" aria-hidden="true">*</span>' : ''
      }</label>`;

  const counter =
    f.type === 'textarea' && f.maxLength
      ? `<span class="counter" data-counter-for="${id}">${value.length} / ${f.maxLength}</span>`
      : '';

  return `<div class="field${f.wide ? ' sm:col-span-2' : ''}${compact ? ' flex-1' : ''}">
    ${label}${control}
    ${f.hint && !compact ? `<p id="${hintId}" class="field-hint">${e(f.hint)}</p>` : ''}
    <p id="${errId}" class="field-error" data-error-for="${e(path)}" hidden></p>
    ${counter}
  </div>`;
}

/** @param {ResumeData} data */
export function personalHTML(data) {
  return `<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">${PERSONAL_FIELDS.map((f) =>
    fieldHTML(f, f.key, data[f.key] || ''),
  ).join('')}</div>`;
}

/** @param {ResumeData} data */
export function summaryHTML(data) {
  return fieldHTML(
    {
      key: 'summary',
      label: 'Professional summary',
      type: 'textarea',
      rows: 4,
      maxLength: SUMMARY_MAX,
      placeholder:
        'Product-minded frontend engineer with 6 years of experience shipping fast, accessible web apps…',
      hint: 'Two or three sentences: who you are, what you are best at, and what you want next.',
    },
    'summary',
    data.summary || '',
  );
}

/**
 * Title shown in an entry's header bar.
 * @param {string} sectionKey
 * @param {Record<string, string>} entry
 * @param {number} index
 */
export function entryTitle(sectionKey, entry, index) {
  const def = LIST_SECTIONS[sectionKey];
  return def.title(entry) || `${def.singular} ${index + 1}`;
}

/**
 * @param {string} sectionKey
 * @param {Record<string, string>[]} entries
 */
export function listHTML(sectionKey, entries) {
  const def = LIST_SECTIONS[sectionKey];
  const n = entries.length;
  const controls = (i) => `
    <button type="button" class="icon-btn" data-action="move" data-dir="-1" data-index="${i}" aria-label="Move up"${
      i === 0 ? ' disabled' : ''
    }>${icons.up}</button>
    <button type="button" class="icon-btn" data-action="move" data-dir="1" data-index="${i}" aria-label="Move down"${
      i === n - 1 ? ' disabled' : ''
    }>${icons.down}</button>
    <button type="button" class="icon-btn hover:!text-red-600" data-action="remove" data-index="${i}" aria-label="Remove">${
      icons.trash
    }</button>`;

  const items = entries
    .map((entry, i) => {
      const title = entryTitle(sectionKey, entry, i);
      if (def.compact) {
        return `<li class="entry flex items-center gap-1 p-1.5 pl-1" data-index="${i}">
          <span class="drag-handle" data-drag-handle title="Drag to reorder" aria-hidden="true">${icons.grip}</span>
          ${def.fields.map((f) => fieldHTML(f, `${sectionKey}.${i}.${f.key}`, entry[f.key] || '', { compact: true })).join('')}
          ${controls(i)}
        </li>`;
      }
      return `<li class="entry" data-index="${i}">
        <div class="entry-head">
          <span class="drag-handle" data-drag-handle title="Drag to reorder" aria-hidden="true">${icons.grip}</span>
          <span class="entry-title" data-entry-title>${e(title)}</span>
          ${controls(i)}
        </div>
        <div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          ${def.fields.map((f) => fieldHTML(f, `${sectionKey}.${i}.${f.key}`, entry[f.key] || '')).join('')}
        </div>
      </li>`;
    })
    .join('');

  const listClass = def.compact ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'space-y-4';
  return `<ol class="${listClass}" data-list="${sectionKey}" aria-label="${e(def.label)}">${items}</ol>
    <button type="button" class="add-btn" data-action="add" data-section="${sectionKey}">${icons.plus}${e(
      def.addLabel,
    )}</button>`;
}
