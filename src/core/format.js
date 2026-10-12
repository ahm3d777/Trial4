/**
 * "just now", "5 minutes ago", "3 days ago".
 * @param {string|number|Date} when
 * @param {number} [now]
 */
export function relativeTime(when, now = Date.now()) {
  const seconds = Math.round((now - new Date(when).getTime()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 45) return 'just now';
  const units = [
    ['minute', 60],
    ['hour', 60 * 60],
    ['day', 60 * 60 * 24],
    ['month', 60 * 60 * 24 * 30],
    ['year', 60 * 60 * 24 * 365],
  ];
  let label = 'minute';
  let size = 60;
  for (const [name, s] of units) {
    if (seconds >= s) [label, size] = [name, s];
  }
  const n = Math.max(1, Math.round(seconds / size));
  return `${n} ${label}${n === 1 ? '' : 's'} ago`;
}

/** @param {number} bytes */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** @param {string|number|Date} when */
export function formatDateTime(when) {
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
