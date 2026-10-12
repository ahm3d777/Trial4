import { displayUrl, escapeHTML as e, renderRichText } from '../core/escape.js';
import { SECTION_LABELS } from '../core/schema.js';
import { joinSections } from '../core/sections.js';

/**
 * Building blocks shared by every template. Templates differ in layout and
 * CSS (see src/styles/resume.css); the markup for each section is common,
 * which keeps all six templates consistent and every value escaped.
 *
 * @typedef {import('../core/resume.js').ResumeData} ResumeData
 */

/**
 * @param {ResumeData} d
 * @returns {{ kind: string, text: string }[]}
 */
export function contactItems(d) {
  return [
    ['email', d.email],
    ['phone', d.phone],
    ['location', d.location],
    ['website', displayUrl(d.website)],
    ['linkedin', displayUrl(d.linkedin)],
    ['github', displayUrl(d.github)],
  ]
    .filter(([, v]) => v)
    .map(([kind, text]) => ({ kind, text }));
}

/**
 * @param {ResumeData} d
 * @param {string} [cls]
 */
export function contactList(d, cls = 'r-contact') {
  const items = contactItems(d);
  if (!items.length) return '';
  return `<ul class="${cls}">${items
    .map((c) => `<li class="r-contact__${c.kind}">${e(c.text)}</li>`)
    .join('')}</ul>`;
}

/**
 * @param {ResumeData} d
 * @param {{ tag?: string }} [opts]
 */
export function nameBlock(d, { tag = 'h1' } = {}) {
  return `<${tag} class="r-name">${e(d.fullName || 'Your Name')}</${tag}>${
    d.headline ? `<p class="r-headline">${e(d.headline)}</p>` : ''
  }`;
}

/**
 * @param {string} key
 * @param {string} body
 * @param {string} [title]
 */
function wrap(key, body, title = SECTION_LABELS[key]) {
  return `<section class="r-section r-section--${key}"><h2 class="r-section__title">${e(
    title,
  )}</h2>${body}</section>`;
}

/**
 * @param {{ title: string, meta?: string, sub?: string, body?: string }} item
 */
function item({ title, meta = '', sub = '', body = '' }) {
  return `<article class="r-item"><header class="r-item__head"><h3 class="r-item__title">${title}</h3>${
    meta ? `<span class="r-item__meta">${meta}</span>` : ''
  }</header>${sub ? `<p class="r-item__sub">${sub}</p>` : ''}${body}</article>`;
}

const join = (...parts) => parts.filter(Boolean).map(e).join(' · ');

/** @type {Record<string, (d: ResumeData) => string>} */
export const sectionBodies = {
  summary: (d) => `<div class="r-summary">${renderRichText(d.summary)}</div>`,

  experience: (d) =>
    d.experience
      .map((x) =>
        item({
          title: e(x.position || 'Position'),
          meta: e(x.duration),
          sub: join(x.company, x.location),
          body: renderRichText(x.description),
        }),
      )
      .join(''),

  education: (d) =>
    d.education
      .map((x) =>
        item({
          title: e([x.degree, x.major].filter(Boolean).join(', ') || 'Degree'),
          meta: e(x.year),
          sub: join(x.school, x.location),
          body:
            x.gpa || x.honors
              ? `<p class="r-item__detail">${join(x.gpa && `GPA ${x.gpa}`, x.honors)}</p>`
              : '',
        }),
      )
      .join(''),

  projects: (d) =>
    d.projects
      .map((x) =>
        item({
          title: e(x.name || 'Project'),
          meta: x.link ? `<span class="r-link">${e(displayUrl(x.link))}</span>` : '',
          body:
            renderRichText(x.description) +
            (x.technologies ? `<p class="r-item__tech">${e(x.technologies)}</p>` : ''),
        }),
      )
      .join(''),

  skills: (d) => `<ul class="r-skills">${d.skills.map((s) => `<li>${e(s.name)}</li>`).join('')}</ul>`,

  certifications: (d) =>
    `<ul class="r-certs">${d.certifications
      .map(
        (c) =>
          `<li><span class="r-certs__name">${e(c.name)}</span>${
            c.issuer || c.date ? `<span class="r-certs__meta">${join(c.issuer, c.date)}</span>` : ''
          }</li>`,
      )
      .join('')}</ul>`,

  languages: (d) =>
    `<ul class="r-langs">${d.languages
      .map(
        (l) =>
          `<li><span class="r-langs__name">${e(l.name)}</span>${
            l.proficiency ? `<span class="r-langs__level">${e(l.proficiency)}</span>` : ''
          }</li>`,
      )
      .join('')}</ul>`,
};

/**
 * Render every non-empty section to HTML, keyed by section.
 * @param {ResumeData} d
 * @param {Record<string, string>} [titles]  Per-template heading overrides.
 * @returns {Record<string, string>}
 */
export function renderSectionMap(d, titles = {}) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, body] of Object.entries(sectionBodies)) {
    const hasContent = key === 'summary' ? Boolean(d.summary) : d[key].length > 0;
    out[key] = hasContent ? wrap(key, body(d), titles[key]) : '';
  }
  return out;
}

/**
 * @param {ResumeData} d
 * @param {Record<string, string>} map
 * @param {string[]} [allowed]
 */
export function sections(d, map, allowed) {
  return joinSections(map, d.sectionSettings, allowed);
}
