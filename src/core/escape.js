/**
 * Output-encoding helpers. Every piece of user-provided text that ends up
 * in an HTML string MUST go through one of these functions.
 */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape a value for safe interpolation into HTML text or a quoted attribute.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Reverse of {@link escapeHTML} for the five entities it produces (plus the
 * legacy `&#039;` form). Used only to migrate data saved by v1, which
 * HTML-escaped values *before* storing them.
 * @param {string} value
 * @returns {string}
 */
export function unescapeHTML(value) {
  if (typeof value !== 'string' || !value.includes('&')) return value;
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');
}

const BULLET_RE = /^\s*(?:[-*•▪◦]|\d+[.)])\s+/;

/**
 * Turn free-form multi-line text into safe HTML. Lines that start with a
 * bullet marker (`-`, `*`, `•`, `1.` …) become list items; consecutive
 * plain lines are joined into paragraphs.
 *
 * @param {string} text
 * @param {{ listClass?: string, paragraphClass?: string }} [options]
 * @returns {string}
 */
export function renderRichText(text, options = {}) {
  if (!text || !String(text).trim()) return '';
  const { listClass = 'rt-list', paragraphClass = 'rt-p' } = options;
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');

  /** @type {string[]} */
  const out = [];
  /** @type {string[]} */
  let bullets = [];
  /** @type {string[]} */
  let para = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    out.push(`<ul class="${listClass}">${bullets.map((b) => `<li>${escapeHTML(b)}</li>`).join('')}</ul>`);
    bullets = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p class="${paragraphClass}">${para.map(escapeHTML).join('<br>')}</p>`);
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushBullets();
      flushPara();
    } else if (BULLET_RE.test(line)) {
      flushPara();
      bullets.push(line.replace(BULLET_RE, '').trim());
    } else {
      flushBullets();
      para.push(line.trim());
    }
  }
  flushBullets();
  flushPara();
  return out.join('');
}

/**
 * Display form of a URL for print: strips the protocol, `www.` and any
 * trailing slash. `https://www.github.com/jane/` → `github.com/jane`.
 * @param {string} url
 * @returns {string}
 */
export function displayUrl(url) {
  if (!url) return '';
  return String(url)
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

/**
 * Make a string safe to use as a download filename.
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string}
 */
export function toFileName(name, fallback = 'resume') {
  const cleaned = String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
}
