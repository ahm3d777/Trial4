import { escapeHTML as e } from '../core/escape.js';
import { formatBytes, formatDateTime, relativeTime } from '../core/format.js';
import { getTemplate, renderResume } from '../templates/index.js';
import { icons } from '../ui/icons.js';

/**
 * "My resumes" dialog: a card per saved resume with a live thumbnail.
 *
 * @typedef {import('../core/storage.js').ResumeStore} ResumeStore
 * @typedef {import('../core/storage.js').ResumeRecord} ResumeRecord
 */

const THUMB_SCALE = 0.3;

/**
 * @param {ResumeRecord} r
 * @param {boolean} isCurrent
 */
function cardHTML(r, isCurrent) {
  const tpl = getTemplate(r.template);
  return `<article class="group flex flex-col overflow-hidden rounded-xl border ${
    isCurrent ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-ink-200 dark:border-ink-700'
  } bg-white dark:bg-ink-800" data-id="${e(r.id)}">
    <button type="button" class="relative block h-44 overflow-hidden border-b border-ink-200 bg-ink-100 dark:border-ink-700 dark:bg-ink-900" data-card-action="open" aria-label="Open ${e(r.title)}">
      <div class="pointer-events-none absolute left-1/2 top-3 w-[794px] origin-top-left bg-white shadow" style="margin-left:${-397 * THUMB_SCALE}px;transform:scale(${THUMB_SCALE})" aria-hidden="true">${renderResume(
        r.template,
        r.data,
      )}</div>
      ${isCurrent ? '<span class="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-950">Open</span>' : ''}
    </button>
    <div class="flex flex-1 flex-col gap-1 p-4">
      <h3 class="truncate font-semibold">${e(r.title)}</h3>
      <p class="text-xs text-ink-500 dark:text-ink-400">${e(tpl.name)} · <time datetime="${e(r.updatedAt)}" title="${e(
        formatDateTime(r.updatedAt),
      )}">Edited ${e(relativeTime(r.updatedAt))}</time></p>
      <div class="mt-3 flex gap-1">
        <button type="button" class="btn-secondary flex-1 py-1.5" data-card-action="open">Open</button>
        <button type="button" class="icon-btn" data-card-action="duplicate" aria-label="Duplicate ${e(r.title)}" title="Duplicate">${icons.copy}</button>
        <button type="button" class="icon-btn" data-card-action="history" aria-label="Version history for ${e(r.title)}" title="Version history">${icons.history}</button>
        <button type="button" class="icon-btn hover:!text-red-600" data-card-action="delete" aria-label="Delete ${e(r.title)}" title="Delete">${icons.trash}</button>
      </div>
    </div>
  </article>`;
}

/**
 * @param {{ store: ResumeStore, currentId: string|null }} ctx
 */
export function renderDashboard({ store, currentId }) {
  const grid = /** @type {HTMLElement} */ (document.getElementById('resume-grid'));
  const list = store.list();
  const newCard = `<button type="button" data-card-action="new" class="flex min-h-[18rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 text-sm font-semibold text-ink-500 transition hover:border-amber-500 hover:text-amber-700 dark:border-ink-700 dark:text-ink-400 dark:hover:text-amber-400"><span class="[&>svg]:h-6 [&>svg]:w-6">${icons.plus}</span>New resume</button>`;
  grid.innerHTML = newCard + list.map((r) => cardHTML(r, r.id === currentId)).join('');

  const usage = store.usage();
  const pct = (usage.ratio * 100).toFixed(1);
  /** @type {HTMLElement} */ (document.getElementById('storage-text')).textContent =
    `${list.length} resume${list.length === 1 ? '' : 's'} · ${formatBytes(usage.total)} used (${pct}% of ~5 MB browser storage)`;
  const fill = /** @type {HTMLElement} */ (document.getElementById('storage-fill'));
  fill.style.width = `${Math.max(1, usage.ratio * 100)}%`;
  fill.classList.toggle('bg-red-500', usage.ratio > 0.8);
  /** @type {HTMLButtonElement} */ (document.getElementById('delete-all-btn')).disabled = list.length === 0;
  /** @type {HTMLButtonElement} */ (document.getElementById('export-all-btn')).disabled = list.length === 0;
}

/**
 * @param {{ store: ResumeStore, id: string }} ctx
 */
export function renderHistory({ store, id }) {
  const record = store.get(id);
  const list = /** @type {HTMLElement} */ (document.getElementById('history-list'));
  /** @type {HTMLElement} */ (document.getElementById('history-name')).textContent = record?.title ?? '';
  const history = store.history(id);
  if (!history.length) {
    list.innerHTML =
      '<li class="rounded-lg bg-ink-50 p-6 text-center text-sm text-ink-500 dark:bg-ink-800 dark:text-ink-400">No earlier versions yet. Keep editing — versions are saved at most once a minute.</li>';
    return;
  }
  list.innerHTML = history
    .map((snap, i) => ({ snap, i }))
    .reverse()
    .map(
      ({
        snap,
        i,
      }) => `<li class="flex items-center justify-between gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
        <div><p class="text-sm font-medium">${e(formatDateTime(snap.timestamp))}</p>
        <p class="text-xs text-ink-500 dark:text-ink-400">${e(relativeTime(snap.timestamp))} · ${e(
          getTemplate(snap.template).name,
        )}</p></div>
        <button type="button" class="btn-outline py-1.5" data-restore="${i}">Restore</button>
      </li>`,
    )
    .join('');
}
