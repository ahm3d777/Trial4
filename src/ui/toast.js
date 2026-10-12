/**
 * Non-blocking notifications rendered into a polite live region.
 *
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} [type]
 * @param {{ duration?: number, action?: { label: string, onClick: () => void } }} [opts]
 */
export function toast(message, type = 'info', { duration = 3200, action } = {}) {
  let region = document.getElementById('toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.className =
      'pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end';
    document.body.append(region);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.dataset.type = type;
  el.append(Object.assign(document.createElement('span'), { textContent: message }));

  const dismiss = () => {
    el.style.transition = 'opacity 200ms, transform 200ms';
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px)';
    setTimeout(() => el.remove(), 220);
  };

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'ml-2 rounded-md px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      dismiss();
    });
    el.append(btn);
  }

  region.append(el);
  setTimeout(dismiss, action ? Math.max(duration, 6000) : duration);
}
