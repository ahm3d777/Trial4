import '../styles/main.css';
import '../styles/resume.css';

import {
  completeness,
  createEmptyResume,
  createEntry,
  isEntryEmpty,
  normalizeResume,
} from '../core/resume.js';
import { LIST_SECTIONS, PERSONAL_FIELDS, SECTION_LABELS } from '../core/schema.js';
import { moveItem } from '../core/sections.js';
import { ResumeStore } from '../core/storage.js';
import { toFileName } from '../core/escape.js';
import { relativeTime } from '../core/format.js';
import { validateResume } from '../core/validation.js';
import { SAMPLE_RESUME } from '../data/sample.js';
import { DEFAULT_TEMPLATE, TEMPLATES, getTemplate, resolveTemplateId } from '../templates/index.js';
import { initAutocomplete } from '../ui/autocomplete.js';
import { confirmDialog, initDialogs, openDialog } from '../ui/dialog.js';
import { $, $$, debounce, downloadFile, isMod, pickTextFile } from '../ui/dom.js';
import { icons } from '../ui/icons.js';
import { initSortable } from '../ui/sortable.js';
import { initThemeToggle } from '../ui/theme.js';
import { toast } from '../ui/toast.js';
import { renderDashboard, renderHistory } from './dashboard.js';
import { downloadImagePdf, preparePrint, printResume } from './export.js';
import { entryTitle, listHTML, personalHTML, summaryHTML } from './form.js';
import { createPreview } from './preview.js';

/** @typedef {import('../core/resume.js').ResumeData} ResumeData */

// -----------------------------------------------------------------------------
// Storage (falls back to memory when localStorage is unavailable, e.g. some
// private-browsing modes, so the editor still works for the session).
// -----------------------------------------------------------------------------
function resolveStorage() {
  try {
    const probe = '__folio_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return { storage: localStorage, persistent: true };
  } catch {
    const mem = new Map();
    /** @type {Storage} */
    const fake = {
      get length() {
        return mem.size;
      },
      key: (i) => [...mem.keys()][i] ?? null,
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => void mem.set(k, String(v)),
      removeItem: (k) => void mem.delete(k),
      clear: () => mem.clear(),
    };
    return { storage: fake, persistent: false };
  }
}

const { storage, persistent } = resolveStorage();
const store = new ResumeStore(storage);

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------
/** @type {{ id: string|null, template: string, data: ResumeData, savedAt: string|null }} */
const state = {
  id: null,
  template: DEFAULT_TEMPLATE,
  data: createEmptyResume(),
  savedAt: null,
};

/** Make sure the core lists have a blank entry to type into. */
function withStarterEntries(/** @type {ResumeData} */ data) {
  const d = structuredClone(data);
  if (!d.experience.length) d.experience.push(createEntry('experience'));
  if (!d.education.length) d.education.push(createEntry('education'));
  while (d.skills.length < 3) d.skills.push(createEntry('skills'));
  return d;
}

function hasContent(/** @type {ResumeData} */ d) {
  return (
    PERSONAL_FIELDS.some((f) => String(d[f.key] || '').trim()) ||
    Boolean(d.summary.trim()) ||
    Object.keys(LIST_SECTIONS).some((k) => d[k].some((entry) => !isEntryEmpty(k, entry)))
  );
}

// -----------------------------------------------------------------------------
// DOM references
// -----------------------------------------------------------------------------
const form = /** @type {HTMLFormElement} */ ($('#resume-form'));
const paper = $('#preview-paper');
const pageCount = $('#page-count');
const saveStatus = $('#save-status');

for (const el of $$('[data-icon]')) el.innerHTML = icons[el.dataset.icon || ''] ?? '';

const preview = createPreview({
  stage: $('#preview-stage'),
  host: $('#preview-host'),
  paper,
  onMeasure: ({ pages, unit }) => {
    const shrunk = unit < 1 ? ` · scaled to ${Math.round(unit * 100)}%` : '';
    pageCount.textContent = `${pages} page${pages === 1 ? '' : 's'}${shrunk}`;
    pageCount.classList.toggle('!text-amber-700', pages > 1);
  },
});

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------
const mount = (name) => $(`[data-mount="${name}"]`);

function renderList(/** @type {string} */ key) {
  mount(key).innerHTML = listHTML(key, state.data[key]);
}

function renderForm() {
  mount('personal').innerHTML = personalHTML(state.data);
  mount('summary').innerHTML = summaryHTML(state.data);
  for (const key of Object.keys(LIST_SECTIONS)) renderList(key);
  updateCounters();
}

function renderTemplatePicker() {
  $('#template-picker').innerHTML = TEMPLATES.map(
    (
      t,
    ) => `<label class="flex cursor-pointer gap-3 rounded-xl border border-ink-200 p-3 transition hover:border-ink-300 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/60 has-[:checked]:ring-2 has-[:checked]:ring-amber-500/20 dark:border-ink-700 dark:has-[:checked]:bg-amber-500/10">
      <input type="radio" name="template" value="${t.id}" class="sr-only" ${t.id === state.template ? 'checked' : ''}>
      <span class="mt-0.5 h-9 w-7 shrink-0 rounded border border-black/10 bg-white p-1 shadow-sm" aria-hidden="true"><span class="block h-1.5 rounded-sm" style="background:${t.accent}"></span><span class="mt-1 block h-0.5 w-4/5 rounded-sm bg-ink-200"></span><span class="mt-0.5 block h-0.5 w-3/5 rounded-sm bg-ink-200"></span></span>
      <span><span class="block text-sm font-semibold">${t.name}</span><span class="block text-xs text-ink-500 dark:text-ink-400">${t.description}</span></span>
    </label>`,
  ).join('');
}

function renderSectionManager() {
  const { order, hidden } = state.data.sectionSettings;
  $('#section-manager').innerHTML = order
    .map((key, i) => {
      const isHidden = hidden.includes(key);
      return `<li class="entry flex items-center gap-1 p-1.5" data-index="${i}" data-key="${key}">
        <span class="drag-handle" data-drag-handle aria-hidden="true">${icons.grip}</span>
        <span class="flex-1 px-1 text-sm font-medium ${isHidden ? 'text-ink-400 line-through' : ''}">${SECTION_LABELS[key]}</span>
        <button type="button" class="icon-btn" data-section-toggle="${key}" aria-pressed="${!isHidden}" aria-label="${isHidden ? 'Show' : 'Hide'} ${SECTION_LABELS[key]}">${isHidden ? icons.eyeOff : icons.eye}</button>
        <button type="button" class="icon-btn" data-section-move="-1" data-index="${i}" aria-label="Move ${SECTION_LABELS[key]} up" ${i === 0 ? 'disabled' : ''}>${icons.up}</button>
        <button type="button" class="icon-btn" data-section-move="1" data-index="${i}" aria-label="Move ${SECTION_LABELS[key]} down" ${i === order.length - 1 ? 'disabled' : ''}>${icons.down}</button>
      </li>`;
    })
    .join('');
}

function syncDesignControls() {
  for (const r of $$('input[name="template"]'))
    /** @type {HTMLInputElement} */ (r).checked = r.value === state.template;
  for (const r of $$('input[name="paper"]'))
    /** @type {HTMLInputElement} */ (r).checked = r.value === state.data.paper;
  /** @type {HTMLInputElement} */ ($('#compact-toggle')).checked = state.data.compactMode;
  renderSectionManager();
}

function renderScore() {
  const { score, nextTip } = completeness(state.data);
  $('#score-value').textContent = `${score}%`;
  $('#score-fill').style.width = `${score}%`;
  $('#score-bar').setAttribute('aria-valuenow', String(score));
  $('#score-tip').textContent = nextTip ? `Next: ${nextTip}` : 'Looking strong — ready to export.';
}

function updateCounters() {
  for (const c of $$('[data-counter-for]')) {
    const field = /** @type {HTMLTextAreaElement | null} */ (
      document.getElementById(c.dataset.counterFor || '')
    );
    if (!field) continue;
    const max = Number(field.dataset.maxlength);
    const len = field.value.length;
    c.textContent = `${len} / ${max}`;
    c.dataset.state = len > max ? 'over' : len > max * 0.9 ? 'warn' : '';
  }
}

const renderPreview = () => preview.render(state.template, state.data);
const schedulePreview = debounce(renderPreview, 120);

function renderSaveStatus() {
  if (!persistent) saveStatus.textContent = 'Storage unavailable — export a backup before leaving';
  else saveStatus.textContent = state.savedAt ? `Saved ${relativeTime(state.savedAt)}` : 'Not saved yet';
}
setInterval(renderSaveStatus, 30_000);

function renderAll() {
  renderForm();
  syncDesignControls();
  renderScore();
  renderPreview();
  renderSaveStatus();
  $('#starter').hidden = hasContent(state.data) || store.list().length > 0;
}

// -----------------------------------------------------------------------------
// Persistence
// -----------------------------------------------------------------------------
function persist({ announce = false } = {}) {
  if (!hasContent(state.data) && !state.id) return null;
  try {
    const record = store.save({ id: state.id, template: state.template, data: state.data });
    state.id = record.id;
    state.savedAt = record.updatedAt;
    renderSaveStatus();
    if (announce) toast('Resume saved', 'success');
    return record;
  } catch (err) {
    const quota = err instanceof DOMException && err.name === 'QuotaExceededError';
    toast(
      quota
        ? 'Browser storage is full — export a backup and delete old resumes.'
        : 'Could not save your resume.',
      'error',
    );
    return null;
  }
}

const autosave = debounce(() => persist(), 900);

/** Everything that should happen after the data changes. */
function commit({ preview: now = false } = {}) {
  renderScore();
  if (now) renderPreview();
  else schedulePreview();
  saveStatus.textContent = 'Saving…';
  autosave();
  $('#starter').hidden = true;
}

/**
 * @param {{ id: string|null, template: string, data: ResumeData, savedAt?: string|null }} next
 */
function load(next) {
  autosave.flush();
  state.id = next.id;
  state.template = resolveTemplateId(next.template);
  state.data = withStarterEntries(normalizeResume(next.data));
  state.savedAt = next.savedAt ?? null;
  renderAll();
  $('#editor-pane').scrollTo({ top: 0 });
}

// -----------------------------------------------------------------------------
// Form editing
// -----------------------------------------------------------------------------
/**
 * Write a value at a dotted path like `experience.0.position`.
 * @param {string} path
 * @param {string} value
 */
function setPath(path, value) {
  const [key, index, field] = path.split('.');
  if (index === undefined) state.data[key] = value;
  else state.data[key][Number(index)][field] = value;
}

/** @param {string} path */
function showFieldError(path) {
  const errors = validateResume(state.data);
  const el = form.querySelector(`[data-error-for="${CSS.escape(path)}"]`);
  const input = form.querySelector(`[data-bind="${CSS.escape(path)}"]`);
  if (!el || !input) return;
  const message = errors[path] || '';
  el.textContent = message;
  el.hidden = !message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
}

form.addEventListener('input', (e) => {
  const el = /** @type {HTMLInputElement} */ (e.target);
  const path = el.dataset.bind;
  if (!path) return;
  setPath(path, el.value);

  const [key, index] = path.split('.');
  if (index !== undefined) {
    const title = el.closest('.entry')?.querySelector('[data-entry-title]');
    if (title) title.textContent = entryTitle(key, state.data[key][Number(index)], Number(index));
  }
  if (el.getAttribute('aria-invalid') === 'true') showFieldError(path);
  if (el.dataset.maxlength) updateCounters();
  commit();
});

form.addEventListener('focusout', (e) => {
  const path = /** @type {HTMLElement} */ (e.target).dataset?.bind;
  if (path && !path.includes('.')) showFieldError(path);
});

form.addEventListener('submit', (e) => e.preventDefault());

/**
 * Move or remove an entry and keep focus somewhere sensible.
 * @param {string} key
 * @param {number} from
 * @param {number} to
 */
function moveEntry(key, from, to) {
  state.data[key] = moveItem(state.data[key], from, to);
  renderList(key);
  commit({ preview: true });
}

form.addEventListener('click', async (e) => {
  const btn = /** @type {HTMLElement} */ (e.target).closest('[data-action]');
  if (!btn) return;
  const list = btn.closest('[data-mount]');
  const key = /** @type {HTMLElement} */ (btn).dataset.section || list?.getAttribute('data-mount') || '';
  const index = Number(/** @type {HTMLElement} */ (btn).dataset.index);
  const action = /** @type {HTMLElement} */ (btn).dataset.action;

  if (action === 'add') {
    state.data[key].push(createEntry(key));
    renderList(key);
    const items = mount(key).querySelectorAll('[data-list] > [data-index]');
    /** @type {HTMLElement | null} */ (items[items.length - 1]?.querySelector('[data-bind]'))?.focus();
    commit({ preview: true });
  } else if (action === 'move') {
    const to = index + Number(/** @type {HTMLElement} */ (btn).dataset.dir);
    moveEntry(key, index, to);
    /** @type {HTMLElement | null} */ (
      mount(key).querySelector(
        `[data-index="${to}"] [data-action="move"][data-dir="${btn.getAttribute('data-dir')}"]:not(:disabled)`,
      ) ?? mount(key).querySelector(`[data-index="${to}"] [data-action="move"]:not(:disabled)`)
    )?.focus();
  } else if (action === 'remove') {
    const removed = state.data[key][index];
    state.data[key] = state.data[key].filter((_, i) => i !== index);
    renderList(key);
    commit({ preview: true });
    if (!isEntryEmpty(key, removed)) {
      toast(`${LIST_SECTIONS[key].singular} removed`, 'info', {
        action: {
          label: 'Undo',
          onClick: () => {
            state.data[key].splice(index, 0, removed);
            renderList(key);
            commit({ preview: true });
          },
        },
      });
    }
  }
});

// Alt+↑ / Alt+↓ moves the entry that contains the focused field.
form.addEventListener('keydown', (e) => {
  if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  const target = /** @type {HTMLElement} */ (e.target);
  const entry = target.closest('[data-mount] [data-index]');
  const key = target.closest('[data-mount]')?.getAttribute('data-mount');
  if (!entry || !key || !LIST_SECTIONS[key]) return;
  e.preventDefault();
  const from = Number(/** @type {HTMLElement} */ (entry).dataset.index);
  const to = from + (e.key === 'ArrowUp' ? -1 : 1);
  if (to < 0 || to >= state.data[key].length) return;
  const path = target.dataset.bind?.split('.').pop();
  moveEntry(key, from, to);
  /** @type {HTMLElement | null} */ (form.querySelector(`[data-bind="${key}.${to}.${path}"]`))?.focus();
});

initSortable(form, (list, from, to) => {
  const key = list.dataset.list;
  if (key) return moveEntry(key, from, to);
  if (list.id === 'section-manager') {
    state.data.sectionSettings.order = moveItem(state.data.sectionSettings.order, from, to);
    renderSectionManager();
    commit({ preview: true });
  }
});

initAutocomplete(form);

// -----------------------------------------------------------------------------
// Design tab
// -----------------------------------------------------------------------------
renderTemplatePicker();

form.addEventListener('change', (e) => {
  const el = /** @type {HTMLInputElement} */ (e.target);
  if (el.name === 'template') {
    state.template = resolveTemplateId(el.value);
    commit({ preview: true });
  } else if (el.name === 'paper') {
    state.data.paper = el.value === 'letter' ? 'letter' : 'a4';
    commit({ preview: true });
  } else if (el.id === 'compact-toggle') {
    state.data.compactMode = el.checked;
    commit({ preview: true });
  }
});

$('#section-manager').addEventListener('click', (e) => {
  const btn = /** @type {HTMLElement} */ (e.target).closest('button');
  if (!btn) return;
  const settings = state.data.sectionSettings;
  if (btn.dataset.sectionToggle) {
    const key = btn.dataset.sectionToggle;
    settings.hidden = settings.hidden.includes(key)
      ? settings.hidden.filter((k) => k !== key)
      : [...settings.hidden, key];
    renderSectionManager();
    /** @type {HTMLElement | null} */ (document.querySelector(`[data-section-toggle="${key}"]`))?.focus();
  } else if (btn.dataset.sectionMove) {
    const from = Number(btn.dataset.index);
    const to = from + Number(btn.dataset.sectionMove);
    settings.order = moveItem(settings.order, from, to);
    renderSectionManager();
    /** @type {HTMLElement | null} */ (
      document.querySelector(
        `[data-index="${to}"] [data-section-move="${btn.dataset.sectionMove}"]:not(:disabled)`,
      )
    )?.focus();
  } else return;
  commit({ preview: true });
});

// Editor tabs (Content / Design) with arrow-key support.
const tabs = [$('#tab-content'), $('#tab-design')];
function selectTab(/** @type {HTMLElement} */ tab) {
  for (const t of tabs) {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    $(`#${t.getAttribute('aria-controls')}`).hidden = !selected;
  }
}
for (const t of tabs) {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = tabs[(tabs.indexOf(t) + 1) % tabs.length];
    selectTab(next);
    next.focus();
  });
}

// Mobile Edit / Preview switch.
for (const btn of $$('[data-view]')) {
  if (btn.tagName !== 'BUTTON') continue;
  btn.addEventListener('click', () => {
    $('#workspace').dataset.view = btn.dataset.view;
    for (const b of $$('button[data-view]')) b.setAttribute('aria-selected', String(b === btn));
    if (btn.dataset.view === 'preview') requestAnimationFrame(() => preview.rescale());
  });
}

// -----------------------------------------------------------------------------
// Toolbar actions
// -----------------------------------------------------------------------------
$('#save-btn').addEventListener('click', () => {
  autosave.cancel();
  if (!persist({ announce: true }) && !hasContent(state.data)) toast('Add some details first.', 'warning');
});

function warnIfIncomplete() {
  const errors = validateResume(state.data);
  if (errors.fullName) toast('Tip: add your name so the file is labelled correctly.', 'warning');
}

const exportToggle = $('#export-toggle');
const exportList = $('#export-list');
function setExportMenu(open) {
  exportList.hidden = !open;
  exportToggle.setAttribute('aria-expanded', String(open));
  if (open) /** @type {HTMLElement} */ (exportList.querySelector('[role="menuitem"]'))?.focus();
}
exportToggle.addEventListener('click', () => setExportMenu(exportList.hidden));
document.addEventListener('click', (e) => {
  if (!$('#export-menu').contains(/** @type {Node} */ (e.target))) setExportMenu(false);
});
exportList.addEventListener('keydown', (e) => {
  const items = $$('[role="menuitem"]', exportList);
  const i = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));
  if (e.key === 'Escape') {
    setExportMenu(false);
    exportToggle.focus();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
  }
});

exportList.addEventListener('click', async (e) => {
  const item = /** @type {HTMLElement} */ (e.target).closest('[data-export]');
  if (!item) return;
  setExportMenu(false);
  autosave.flush();
  const title = state.data.fullName || 'Resume';
  const kind = /** @type {HTMLElement} */ (item).dataset.export;

  if (kind === 'print') {
    warnIfIncomplete();
    renderPreview();
    printResume(paper, { paper: state.data.paper, title });
  } else if (kind === 'image-pdf') {
    warnIfIncomplete();
    renderPreview();
    toast('Preparing your PDF…');
    try {
      await downloadImagePdf(paper, { paper: state.data.paper, title });
      toast('PDF downloaded', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not create the PDF. Try “Save as PDF” instead.', 'error');
    }
  } else if (kind === 'json') {
    const payload = { app: 'folio', version: 2, template: state.template, data: state.data };
    downloadFile(JSON.stringify(payload, null, 2), `${toFileName(title, 'Resume')}.json`, 'application/json');
    toast('Backup downloaded', 'success');
  }
});

// The browser's own Ctrl/⌘+P also prints just the resume.
window.addEventListener('beforeprint', () => {
  if (!document.getElementById('print-root')?.childElementCount) preparePrint(paper, state.data.paper);
});
window.addEventListener('afterprint', () => document.getElementById('print-root')?.replaceChildren());

$('#load-sample').addEventListener('click', () => {
  load({ id: null, template: 'modern', data: SAMPLE_RESUME });
  commit({ preview: true });
  toast('Example loaded — it’s saved as a new resume you can edit or delete.', 'success');
});

$('#new-resume').addEventListener('click', () => {
  autosave.flush();
  load({ id: null, template: state.template, data: createEmptyResume() });
  toast('Started a new resume. Your previous one is in “My resumes”.');
});

$('#clear-resume').addEventListener('click', async () => {
  const ok = await confirmDialog({
    title: 'Clear all fields?',
    body: 'This empties every field of the resume you are editing. Earlier versions stay available in its version history.',
    confirmLabel: 'Clear fields',
    danger: true,
  });
  if (!ok) return;
  const keep = { paper: state.data.paper, sectionSettings: state.data.sectionSettings };
  load({ id: state.id, template: state.template, data: { ...createEmptyResume(), ...keep, version: 2 } });
  commit({ preview: true });
});

// -----------------------------------------------------------------------------
// My resumes dialog
// -----------------------------------------------------------------------------
initDialogs();
const refreshDashboard = () => renderDashboard({ store, currentId: state.id });

$('#open-resumes').addEventListener('click', () => {
  autosave.flush();
  refreshDashboard();
  openDialog('dlg-resumes');
});

$('#resume-grid').addEventListener('click', async (e) => {
  const btn = /** @type {HTMLElement} */ (e.target).closest('[data-card-action]');
  if (!btn) return;
  const id = btn.closest('[data-id]')?.getAttribute('data-id') ?? '';
  const action = /** @type {HTMLElement} */ (btn).dataset.cardAction;
  const dlg = /** @type {HTMLDialogElement} */ ($('#dlg-resumes'));

  if (action === 'new') {
    dlg.close();
    $('#new-resume').click();
  } else if (action === 'open') {
    const r = store.get(id);
    if (r) load({ id: r.id, template: r.template, data: r.data, savedAt: r.updatedAt });
    dlg.close();
  } else if (action === 'duplicate') {
    const copy = store.duplicate(id);
    if (copy) toast(`Duplicated as “${copy.title}”`, 'success');
    refreshDashboard();
  } else if (action === 'history') {
    renderHistory({ store, id });
    $('#history-list').dataset.id = id;
    openDialog('dlg-history');
  } else if (action === 'delete') {
    const r = store.get(id);
    const ok = await confirmDialog({
      title: `Delete “${r?.title}”?`,
      body: 'The resume and its version history will be removed from this browser. This can’t be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    store.remove(id);
    if (state.id === id) load({ id: null, template: state.template, data: createEmptyResume() });
    refreshDashboard();
    toast('Resume deleted');
  }
});

$('#history-list').addEventListener('click', async (e) => {
  const btn = /** @type {HTMLElement} */ (e.target).closest('[data-restore]');
  if (!btn) return;
  const id = $('#history-list').dataset.id || '';
  autosave.flush();
  const restored = store.restore(id, Number(/** @type {HTMLElement} */ (btn).dataset.restore));
  if (!restored) return;
  load({ id: restored.id, template: restored.template, data: restored.data, savedAt: restored.updatedAt });
  /** @type {HTMLDialogElement} */ ($('#dlg-history')).close();
  /** @type {HTMLDialogElement} */ ($('#dlg-resumes')).close();
  toast('Version restored', 'success');
});

$('#import-btn').addEventListener('click', async () => {
  const text = await pickTextFile();
  if (text === null) return;
  try {
    const created = store.import(JSON.parse(text));
    const first = created[0];
    load({ id: first.id, template: first.template, data: first.data, savedAt: first.updatedAt });
    refreshDashboard();
    toast(`Imported ${created.length} resume${created.length === 1 ? '' : 's'}`, 'success');
  } catch (err) {
    toast(
      err instanceof SyntaxError ? 'That file isn’t valid JSON.' : String(/** @type {Error} */ (err).message),
      'error',
    );
  }
});

$('#export-all-btn').addEventListener('click', () => {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(JSON.stringify(store.exportAll(), null, 2), `folio-backup-${stamp}.json`, 'application/json');
  toast('Backup downloaded', 'success');
});

$('#delete-all-btn').addEventListener('click', async () => {
  const count = store.list().length;
  const ok = await confirmDialog({
    title: `Delete all ${count} resumes?`,
    body: 'Everything Folio has stored in this browser will be erased. Consider “Export all” first.',
    confirmLabel: 'Delete everything',
    danger: true,
  });
  if (!ok) return;
  autosave.cancel();
  store.removeAll();
  load({ id: null, template: state.template, data: createEmptyResume() });
  refreshDashboard();
  toast('All resumes deleted');
});

// -----------------------------------------------------------------------------
// Keyboard shortcuts
// -----------------------------------------------------------------------------
const mac = /Mac|iPhone|iPad/.test(navigator.platform);
const mod = mac ? '⌘' : 'Ctrl';
const SHORTCUTS = [
  [`${mod} S`, 'Save now'],
  [`${mod} P`, 'Print / save as PDF'],
  [`${mod} K`, 'Open “My resumes”'],
  ['Alt ↑ / Alt ↓', 'Move the focused entry'],
  ['↑ ↓ Enter', 'Pick an autocomplete suggestion'],
  ['?', 'Show this list'],
];
$('#shortcut-list').innerHTML = SHORTCUTS.map(
  ([keys, label]) =>
    `<div class="flex items-center justify-between py-2.5"><dt class="text-ink-600 dark:text-ink-300">${label}</dt><dd><kbd class="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-xs dark:border-ink-700 dark:bg-ink-800">${keys}</kbd></dd></div>`,
).join('');
$('#open-shortcuts').addEventListener('click', () => openDialog('dlg-shortcuts'));

document.addEventListener('keydown', (e) => {
  const typing = /** @type {HTMLElement} */ (e.target).closest('input, textarea, select, [contenteditable]');
  if (isMod(e) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    $('#save-btn').click();
  } else if (isMod(e) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#open-resumes').click();
  } else if (e.key === '?' && !typing && !document.querySelector('dialog[open]')) {
    openDialog('dlg-shortcuts');
  }
});

// Save immediately when the tab is hidden or closed.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autosave.flush();
});
window.addEventListener('pagehide', () => autosave.flush());

// -----------------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------------
initThemeToggle();
const latest = store.latest();
if (latest) load({ id: latest.id, template: latest.template, data: latest.data, savedAt: latest.updatedAt });
else load({ id: null, template: DEFAULT_TEMPLATE, data: createEmptyResume() });
// Landing-page gallery links pass ?template=<id>.
const requested = new URLSearchParams(location.search).get('template');
if (requested && TEMPLATES.some((t) => t.id === requested)) {
  state.template = requested;
  syncDesignControls();
  renderPreview();
  if (state.id) autosave();
  history.replaceState(null, '', location.pathname);
}
if (!persistent)
  toast(
    'Your browser is blocking storage, so changes won’t be kept after you leave. Use Export → Backup.',
    'warning',
    { duration: 8000 },
  );

// Expose a tiny debug/test hook (no state mutation from outside).
Object.defineProperty(window, '__folio', {
  value: Object.freeze({ getState: () => structuredClone(state), getTemplate }),
});
