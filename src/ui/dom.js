/** Small DOM helpers shared by the UI modules. */

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T}
 */
export function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return /** @type {T} */ (el);
}

/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {HTMLElement[]}
 */
export function $$(selector, root = document) {
  return /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(selector)));
}

/**
 * Debounce with `flush()` and `cancel()` so pending work can be forced
 * (e.g. save immediately when the tab is hidden).
 * @template {(...args: any[]) => void} F
 * @param {F} fn
 * @param {number} wait
 */
export function debounce(fn, wait) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {any[] | null} */
  let pending = null;
  const run = () => {
    timer = undefined;
    const args = pending;
    pending = null;
    if (args) fn(...args);
  };
  /** @param {Parameters<F>} args */
  const debounced = (...args) => {
    pending = args;
    clearTimeout(timer);
    timer = setTimeout(run, wait);
  };
  debounced.flush = () => {
    clearTimeout(timer);
    run();
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    pending = null;
  };
  debounced.pending = () => pending !== null;
  return debounced;
}

/**
 * Trigger a browser download for in-memory content.
 * @param {BlobPart} content
 * @param {string} filename
 * @param {string} type
 */
export function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Ask the user for a file and resolve with its text (or null if cancelled). */
export function pickTextFile(accept = 'application/json,.json') {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/** True when a modifier-key shortcut matches (Ctrl on Windows/Linux, ⌘ on macOS). */
export function isMod(/** @type {KeyboardEvent} */ e) {
  return e.ctrlKey || e.metaKey;
}
