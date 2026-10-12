/**
 * Pointer-based drag-to-reorder (mouse, pen and touch) for any list whose
 * items have `data-index` and contain a `[data-drag-handle]`.
 * Keyboard users reorder with the explicit up/down buttons instead.
 *
 * Works on lists that are re-rendered: listeners are delegated to `root`.
 *
 * @param {HTMLElement} root
 * @param {(list: HTMLElement, from: number, to: number) => void} onMove
 */
export function initSortable(root, onMove) {
  /** @type {{ list: HTMLElement, item: HTMLElement, from: number, to: number, pointerId: number } | null} */
  let drag = null;

  /** @param {HTMLElement} list */
  const itemsOf = (list) =>
    /** @type {HTMLElement[]} */ (
      Array.from(list.children).filter((el) => el instanceof HTMLElement && el.dataset.index)
    );

  const clearMarks = () => {
    if (!drag) return;
    for (const el of itemsOf(drag.list)) {
      delete el.dataset.dropTarget;
      delete el.dataset.dragging;
    }
  };

  root.addEventListener('pointerdown', (e) => {
    const handle = /** @type {HTMLElement} */ (e.target).closest('[data-drag-handle]');
    if (!handle || e.button !== 0) return;
    const item = /** @type {HTMLElement | null} */ (handle.closest('[data-index]'));
    const list = /** @type {HTMLElement | null} */ (item?.parentElement ?? null);
    if (!item || !list) return;
    e.preventDefault();
    const from = Number(item.dataset.index);
    drag = { list, item, from, to: from, pointerId: e.pointerId };
    item.dataset.dragging = 'true';
    handle.setPointerCapture(e.pointerId);
  });

  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    // Pick the item whose centre is closest to the pointer (works for grids too).
    let best = drag.from;
    let bestDist = Infinity;
    for (const el of itemsOf(drag.list)) {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (d < bestDist) [best, bestDist] = [Number(el.dataset.index), d];
    }
    drag.to = best;
    for (const el of itemsOf(drag.list)) {
      if (Number(el.dataset.index) === best && best !== drag.from) el.dataset.dropTarget = 'true';
      else delete el.dataset.dropTarget;
    }
  });

  const finish = (/** @type {PointerEvent} */ e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { list, from, to } = drag;
    clearMarks();
    drag = null;
    if (from !== to && e.type === 'pointerup') onMove(list, from, to);
  };
  root.addEventListener('pointerup', finish);
  root.addEventListener('pointercancel', finish);
}
