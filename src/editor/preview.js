import { PAPER_SIZES } from '../core/schema.js';
import { renderResume } from '../templates/index.js';

/**
 * Live preview: renders the resume onto a true-size "paper" element, then
 * scales it with a CSS transform to fit the pane. Exporting always uses an
 * unscaled clone, so the zoom level never leaks into the PDF.
 *
 * @typedef {import('../core/resume.js').ResumeData} ResumeData
 */

const MIN_FIT_UNIT = 0.72; // below this text gets too small to read in print

/**
 * Shrink the resume's base unit until it fits on one page (binary search).
 * @param {HTMLElement} resumeEl
 * @param {number} pageHeight
 * @returns {number} the unit that was applied, in px
 */
export function fitToOnePage(resumeEl, pageHeight) {
  resumeEl.style.setProperty('--u', '1px');
  if (resumeEl.scrollHeight <= pageHeight) return 1;
  let lo = MIN_FIT_UNIT;
  let hi = 1;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    resumeEl.style.setProperty('--u', `${mid}px`);
    if (resumeEl.scrollHeight <= pageHeight) lo = mid;
    else hi = mid;
  }
  resumeEl.style.setProperty('--u', `${lo}px`);
  return lo;
}

/**
 * @param {{ stage: HTMLElement, host: HTMLElement, paper: HTMLElement, onMeasure?: (info: { pages: number, unit: number }) => void }} els
 */
export function createPreview({ stage, host, paper, onMeasure }) {
  let size = PAPER_SIZES.a4;
  let unit = 1;

  function rescale() {
    const style = getComputedStyle(stage);
    const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const scale = Math.min(1, available / size.widthPx);
    paper.style.transform = `scale(${scale})`;
    host.style.width = `${size.widthPx * scale}px`;
    host.style.height = `${paper.offsetHeight * scale}px`;
  }

  /**
   * @param {string} templateId
   * @param {ResumeData} data
   */
  function render(templateId, data) {
    size = PAPER_SIZES[data.paper] || PAPER_SIZES.a4;
    paper.style.setProperty('--page-w', `${size.widthPx}px`);
    paper.style.setProperty('--page-h', `${size.heightPx}px`);
    paper.innerHTML = renderResume(templateId, data);
    const resumeEl = /** @type {HTMLElement} */ (paper.firstElementChild);
    unit = data.compactMode ? fitToOnePage(resumeEl, size.heightPx) : 1;
    const pages = Math.max(1, Math.ceil((resumeEl.scrollHeight - 2) / size.heightPx));
    rescale();
    onMeasure?.({ pages, unit });
  }

  new ResizeObserver(() => rescale()).observe(stage);

  return {
    render,
    rescale,
    get paperSize() {
      return size;
    },
    get unit() {
      return unit;
    },
  };
}
