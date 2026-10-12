import { describe, expect, it } from 'vitest';
import { displayUrl, escapeHTML, renderRichText, toFileName, unescapeHTML } from '../../src/core/escape.js';

describe('escapeHTML', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escapeHTML(`<a href="x" onclick='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('returns an empty string for null and undefined, stringifies numbers', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
    expect(escapeHTML(42)).toBe('42');
  });

  it('round-trips with unescapeHTML, including the legacy &#039; form', () => {
    const raw = `R&D <team> "quoted" it's`;
    expect(unescapeHTML(escapeHTML(raw))).toBe(raw);
    expect(unescapeHTML('it&#039;s')).toBe("it's");
  });
});

describe('renderRichText', () => {
  it('turns dash, star, bullet and numbered lines into list items', () => {
    const html = renderRichText('- one\n* two\n• three\n1. four');
    expect(html).toBe('<ul class="rt-list"><li>one</li><li>two</li><li>three</li><li>four</li></ul>');
  });

  it('groups plain lines into paragraphs separated by blank lines', () => {
    expect(renderRichText('a\nb\n\nc')).toBe('<p class="rt-p">a<br>b</p><p class="rt-p">c</p>');
  });

  it('mixes paragraphs and lists in order', () => {
    expect(renderRichText('Intro\n- point')).toBe(
      '<p class="rt-p">Intro</p><ul class="rt-list"><li>point</li></ul>',
    );
  });

  it('escapes user content (no HTML injection)', () => {
    const html = renderRichText('- <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('returns empty string for blank input', () => {
    expect(renderRichText('   \n ')).toBe('');
  });
});

describe('displayUrl', () => {
  it('strips protocol, www and trailing slashes', () => {
    expect(displayUrl('https://www.github.com/jane/')).toBe('github.com/jane');
    expect(displayUrl('linkedin.com/in/jane')).toBe('linkedin.com/in/jane');
  });
});

describe('toFileName', () => {
  it('produces a safe ASCII file name', () => {
    expect(toFileName('José  García / CV')).toBe('Jose_Garcia_CV');
  });
  it('falls back when nothing usable remains', () => {
    expect(toFileName('জাওয়াদ', 'Resume')).toBe('Resume');
  });
});
