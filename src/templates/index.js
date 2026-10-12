import { toRenderable } from '../core/resume.js';
import { contactList, nameBlock, renderSectionMap, sections } from './shared.js';

/**
 * @typedef {import('../core/resume.js').ResumeData} ResumeData
 * @typedef {Object} TemplateDef
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} accent   Swatch colour shown in the picker.
 * @property {(d: ResumeData) => string} render  Receives already-cleaned data.
 */

const SIDEBAR_KEYS = ['skills', 'languages', 'certifications'];
const MAIN_KEYS = ['summary', 'experience', 'education', 'projects'];

/** @type {TemplateDef[]} */
export const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Centered header, single column. Safe for every applicant-tracking system.',
    accent: '#1f3a5f',
    render: (d) => `
      <header class="r-header">${nameBlock(d)}${contactList(d)}</header>
      ${sections(d, renderSectionMap(d))}`,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Dark sidebar for contact details and skills; experience gets the room.',
    accent: '#1e293b',
    render: (d) => {
      const map = renderSectionMap(d);
      return `
      <div class="r-columns">
        <aside class="r-sidebar">
          ${nameBlock(d)}
          <section class="r-section r-section--contact"><h2 class="r-section__title">Contact</h2>${contactList(d)}</section>
          ${sections(d, map, SIDEBAR_KEYS)}
        </aside>
        <div class="r-main">${sections(d, map, MAIN_KEYS)}</div>
      </div>`;
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Full-width colour header and skill chips. Good for product and design roles.',
    accent: '#0f766e',
    render: (d) => `
      <header class="r-header">${nameBlock(d)}${contactList(d)}</header>
      <div class="r-body">${sections(d, renderSectionMap(d))}</div>`,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Serif typography and a right-hand column. Suits senior and leadership roles.',
    accent: '#6b1d2a',
    render: (d) => {
      const map = renderSectionMap(d, { experience: 'Professional experience', skills: 'Core skills' });
      return `
      <header class="r-header">${nameBlock(d)}${contactList(d)}</header>
      <div class="r-columns">
        <div class="r-main">${sections(d, map, MAIN_KEYS)}</div>
        <aside class="r-sidebar">${sections(d, map, SIDEBAR_KEYS)}</aside>
      </div>`;
    },
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Monospace accents and compact spacing. Fits a lot on one page.',
    accent: '#0e7490',
    render: (d) => `
      <header class="r-header">${nameBlock(d)}${contactList(d)}</header>
      ${sections(d, renderSectionMap(d))}`,
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Traditional CV layout in black and white with small-caps headings.',
    accent: '#262626',
    render: (d) => `
      <header class="r-header">${nameBlock(d)}${contactList(d)}</header>
      ${sections(d, renderSectionMap(d, { experience: 'Experience', projects: 'Selected projects' }))}`,
  },
];

/** v1 used numbered ids; keep old saved resumes on the same design. */
const LEGACY_IDS = {
  template1: 'classic',
  template2: 'modern',
  template3: 'bold',
  template4: 'executive',
  template5: 'technical',
  template6: 'academic',
};

export const DEFAULT_TEMPLATE = 'classic';

/** @param {string | null | undefined} id */
export function resolveTemplateId(id) {
  const key = String(id || '');
  const mapped = LEGACY_IDS[key] ?? key;
  return TEMPLATES.some((t) => t.id === mapped) ? mapped : DEFAULT_TEMPLATE;
}

/** @param {string} id */
export function getTemplate(id) {
  const resolved = resolveTemplateId(id);
  return /** @type {TemplateDef} */ (TEMPLATES.find((t) => t.id === resolved));
}

/**
 * Render a resume to an HTML string. All user values are escaped.
 * @param {string} templateId
 * @param {ResumeData} data
 * @returns {string}
 */
export function renderResume(templateId, data) {
  const tpl = getTemplate(templateId);
  const d = toRenderable(data);
  return `<div class="resume tpl-${tpl.id}">${tpl.render(d)}</div>`;
}
