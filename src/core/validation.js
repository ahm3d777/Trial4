/**
 * Pure validators. They are intentionally forgiving: a resume builder
 * should nudge, not block, so only clearly malformed values fail.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,22}$/;

/** @param {string} value */
export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

/** @param {string} value */
export function isValidPhone(value) {
  const v = String(value || '').trim();
  return PHONE_RE.test(v) && (v.match(/\d/g) || []).length >= 7;
}

/**
 * Accepts bare domains (`janedoe.dev`, `github.com/jane`) as well as
 * full http(s) URLs. Rejects other protocols such as `javascript:`.
 * @param {string} value
 */
export function isValidUrl(value) {
  const v = String(value || '').trim();
  if (!v || /\s/.test(v)) return false;
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(v);
  if (hasProtocol && !/^https?:\/\//i.test(v)) return false;
  try {
    const url = new URL(hasProtocol ? v : `https://${v}`);
    return /^[^.]+(\.[^.]+)+$/.test(url.hostname) && !url.hostname.endsWith('.');
  } catch {
    return false;
  }
}

/**
 * Validate the personal-details block of a resume.
 * @param {Record<string, any>} data
 * @returns {Record<string, string>} field key → message (empty when valid)
 */
export function validateResume(data) {
  /** @type {Record<string, string>} */
  const errors = {};
  const v = (k) => String(data?.[k] || '').trim();

  if (!v('fullName')) errors.fullName = 'Your name is required.';
  if (!v('email')) errors.email = 'An email address is required.';
  else if (!isValidEmail(v('email'))) errors.email = 'That email address doesn’t look right.';
  if (v('phone') && !isValidPhone(v('phone'))) errors.phone = 'That phone number doesn’t look right.';
  for (const key of ['website', 'linkedin', 'github']) {
    if (v(key) && !isValidUrl(v(key))) errors[key] = 'Enter a web address like example.com/you.';
  }
  return errors;
}
