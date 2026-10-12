import { toFileName } from '../core/escape.js';
import { PAPER_SIZES } from '../core/schema.js';

/**
 * Two ways to get a PDF:
 *
 * 1. `printResume` – the browser's own print-to-PDF. Produces real, selectable
 *    vector text that applicant-tracking systems can parse. Recommended.
 * 2. `downloadImagePdf` – one-click file download via html2pdf.js. Convenient,
 *    but the text is rasterised, so it is offered as the secondary option.
 */

const PAGE_STYLE_ID = 'print-page-style';

/**
 * Copy the rendered paper into #print-root and set the @page size.
 * Called for our Print button and for the browser's own Ctrl/⌘+P.
 * @param {HTMLElement} paper
 * @param {'a4'|'letter'} paperKey
 */
export function preparePrint(paper, paperKey) {
  let root = document.getElementById('print-root');
  if (!root) {
    root = Object.assign(document.createElement('div'), { id: 'print-root' });
    document.body.append(root);
  }
  const clone = /** @type {HTMLElement} */ (paper.cloneNode(true));
  clone.removeAttribute('id');
  clone.style.transform = 'none';
  root.replaceChildren(clone);

  const size = paperKey === 'letter' ? 'letter' : 'A4';
  let style = document.getElementById(PAGE_STYLE_ID);
  if (!style) {
    style = Object.assign(document.createElement('style'), { id: PAGE_STYLE_ID });
    document.head.append(style);
  }
  // Zero page margins: the resume carries its own padding, and
  // box-decoration-break (see main.css) repeats it on continuation pages.
  style.textContent = `@media print { @page { size: ${size}; margin: 0; } }`;
}

/**
 * @param {HTMLElement} paper
 * @param {{ paper: 'a4'|'letter', title: string }} opts
 */
export function printResume(paper, { paper: paperKey, title }) {
  preparePrint(paper, paperKey);
  // Browsers use document.title as the default "Save as PDF" file name.
  const previous = document.title;
  document.title = toFileName(title, 'Resume');
  const restore = () => {
    document.title = previous;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

/**
 * @param {HTMLElement} paper
 * @param {{ paper: 'a4'|'letter', title: string }} opts
 */
export async function downloadImagePdf(paper, { paper: paperKey, title }) {
  const { default: html2pdf } = await import('html2pdf.js');
  const size = PAPER_SIZES[paperKey] || PAPER_SIZES.a4;

  // Render an unscaled copy off-screen so the preview zoom can't affect output.
  const sandbox = document.createElement('div');
  sandbox.style.cssText = `position:fixed;left:-10000px;top:0;width:${size.widthPx}px;`;
  const clone = /** @type {HTMLElement} */ (paper.cloneNode(true));
  clone.removeAttribute('id');
  clone.style.transform = 'none';
  clone.classList.add('is-exporting');
  sandbox.append(clone);
  document.body.append(sandbox);

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: `${toFileName(title, 'Resume')}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: [size.widthMm, size.heightMm], orientation: 'portrait' },
        pagebreak: { mode: ['css'], avoid: ['.r-item'] },
      })
      .from(clone)
      .save();
  } finally {
    sandbox.remove();
  }
}
