import { highlight, suggest } from '../core/suggest.js';
import { SUGGESTION_DATA } from '../data/suggestions.js';

/**
 * Accessible autocomplete (WAI-ARIA combobox pattern) for any input with a
 * `data-suggest="<dataset>"` attribute. One listbox is shared and moved to
 * whichever field has focus, so dynamically added entries work for free.
 */

const RECENT_PREFIX = 'folio:recent:';
const RECENT_MAX = 12;

/** @param {string} type */
function getRecent(type) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_PREFIX + type) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** @param {string} type @param {string} value */
function addRecent(type, value) {
  try {
    const list = [value, ...getRecent(type).filter((x) => x.toLowerCase() !== value.toLowerCase())];
    localStorage.setItem(RECENT_PREFIX + type, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* ignore */
  }
}

/**
 * @param {HTMLElement} root  Container whose inputs should get suggestions.
 */
export function initAutocomplete(root) {
  const list = document.createElement('ul');
  list.id = 'ac-listbox';
  list.className = 'ac-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  /** @type {HTMLInputElement | null} */
  let input = null;
  /** @type {string[]} */
  let options = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    options = [];
    active = -1;
    if (input) {
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
  };

  const setActive = (i) => {
    active = i;
    list.querySelectorAll('[role="option"]').forEach((el, idx) => {
      el.setAttribute('aria-selected', String(idx === i));
      if (idx === i) el.scrollIntoView({ block: 'nearest' });
    });
    if (input) {
      if (i >= 0) input.setAttribute('aria-activedescendant', `ac-opt-${i}`);
      else input.removeAttribute('aria-activedescendant');
    }
  };

  const render = () => {
    if (!input) return;
    const type = input.dataset.suggest || '';
    const query = input.value;
    options = suggest(query, [getRecent(type), SUGGESTION_DATA[type] || []], 8);
    if (!options.length || document.activeElement !== input) return close();

    list.replaceChildren(
      ...options.map((text, i) => {
        const li = document.createElement('li');
        li.id = `ac-opt-${i}`;
        li.className = 'ac-option';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        for (const part of highlight(text, query)) {
          li.append(
            part.match
              ? Object.assign(document.createElement('mark'), { textContent: part.text })
              : part.text,
          );
        }
        return li;
      }),
    );
    const field = input.closest('.field');
    if (field && list.parentElement !== field) field.append(list);
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(-1);
  };

  const choose = (i) => {
    if (!input || !options[i]) return;
    const value = options[i];
    input.value = value;
    addRecent(input.dataset.suggest || '', value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  };

  root.addEventListener('focusin', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (!(t instanceof HTMLInputElement) || !t.dataset.suggest) return;
    input = t;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
  });

  root.addEventListener('input', (e) => {
    if (e.target === input && e.isTrusted) render();
  });

  root.addEventListener('focusout', (e) => {
    if (e.target === input) setTimeout(close, 120);
  });

  root.addEventListener('keydown', (e) => {
    if (e.target !== input) return;
    if (list.hidden) {
      if (e.key === 'ArrowDown' && input) {
        e.preventDefault();
        render();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((active + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(active <= 0 ? options.length - 1 : active - 1);
        break;
      case 'Enter':
        if (active >= 0) {
          e.preventDefault();
          choose(active);
        }
        break;
      case 'Tab':
        if (active >= 0) choose(active);
        else close();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  });

  // mousedown (not click) so the input doesn't blur first.
  list.addEventListener('mousedown', (e) => {
    const li = /** @type {HTMLElement} */ (e.target).closest('[role="option"]');
    if (!li) return;
    e.preventDefault();
    choose(Number(li.id.replace('ac-opt-', '')));
  });

  return { close };
}
