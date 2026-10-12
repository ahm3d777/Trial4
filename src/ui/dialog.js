/**
 * Thin helpers over the native <dialog> element, which gives us focus
 * trapping, Esc-to-close and a proper modal backdrop for free.
 */

/** Wire every [data-close] button and backdrop click inside dialogs. */
export function initDialogs() {
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target === dlg || target.closest('[data-close]')) dlg.close();
    });
  }
}

/** @param {string} id */
export function openDialog(id) {
  const dlg = /** @type {HTMLDialogElement} */ (document.getElementById(id));
  if (!dlg.open) dlg.showModal();
  return dlg;
}

/**
 * Promise-based replacement for window.confirm().
 * @param {{ title: string, body?: string, confirmLabel?: string, danger?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body = '', confirmLabel = 'Confirm', danger = false }) {
  const dlg = /** @type {HTMLDialogElement} */ (document.getElementById('dlg-confirm'));
  /** @type {HTMLElement} */ (dlg.querySelector('#dlg-confirm-title')).textContent = title;
  /** @type {HTMLElement} */ (dlg.querySelector('#dlg-confirm-body')).textContent = body;
  const ok = /** @type {HTMLButtonElement} */ (dlg.querySelector('#dlg-confirm-ok'));
  ok.textContent = confirmLabel;
  ok.className = danger ? 'btn bg-red-600 text-white hover:bg-red-700' : 'btn-primary';
  dlg.returnValue = 'cancel';
  dlg.showModal();
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
  });
}
