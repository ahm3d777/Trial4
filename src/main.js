import './styles/main.css';
import './styles/resume.css';

import { SAMPLE_RESUME } from './data/sample.js';
import { TEMPLATES, renderResume } from './templates/index.js';
import { icons } from './ui/icons.js';
import { initThemeToggle } from './ui/theme.js';
import { escapeHTML as e } from './core/escape.js';

for (const el of document.querySelectorAll('[data-icon]')) {
  el.innerHTML = icons[/** @type {HTMLElement} */ (el).dataset.icon || ''] ?? '';
}
initThemeToggle();

/** @type {HTMLElement} */ (document.getElementById('year')).textContent = String(new Date().getFullYear());

// Hero: two live-rendered sample resumes.
for (const el of document.querySelectorAll('[data-hero-template]')) {
  const id = /** @type {HTMLElement} */ (el).dataset.heroTemplate || 'classic';
  el.innerHTML = `<div class="sheet-inner">${renderResume(id, SAMPLE_RESUME)}</div>`;
}

// Gallery: every template, rendered from the same sample data, scaled to fit its card.
const gallery = /** @type {HTMLElement} */ (document.getElementById('template-gallery'));
gallery.innerHTML = TEMPLATES.map(
  (t) => `<figure class="group">
    <a href="./editor.html?template=${t.id}" class="gallery-sheet relative block aspect-[794/1123] transition duration-300 group-hover:-translate-y-1" aria-label="Start with the ${e(t.name)} template">
      <div class="sheet-inner pointer-events-none" aria-hidden="true">${renderResume(t.id, SAMPLE_RESUME)}</div>
    </a>
    <figcaption class="mt-4"><span class="font-semibold">${e(t.name)}</span><span class="mt-1 block text-sm text-ink-500 dark:text-ink-400">${e(t.description)}</span></figcaption>
  </figure>`,
).join('');

// Keep gallery sheets scaled to their card width.
const fit = () => {
  for (const sheet of gallery.querySelectorAll('.gallery-sheet')) {
    /** @type {HTMLElement} */ (sheet).style.setProperty('--s', String(sheet.clientWidth / 794));
  }
};
new ResizeObserver(fit).observe(gallery);
