import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidPhone, isValidUrl, validateResume } from '../../src/core/validation.js';

describe('validators', () => {
  it.each(['a@b.co', 'first.last+tag@example.org'])('accepts email %s', (v) =>
    expect(isValidEmail(v)).toBe(true),
  );
  it.each(['', 'a@b', 'no at.com', 'a@b.c'])('rejects email %j', (v) => expect(isValidEmail(v)).toBe(false));

  it.each(['+1 (415) 555-0142', '01700-000000', '+880 1700 000000'])('accepts phone %s', (v) =>
    expect(isValidPhone(v)).toBe(true),
  );
  it.each(['12', 'call me', '+1 () -'])('rejects phone %j', (v) => expect(isValidPhone(v)).toBe(false));

  it.each(['janedoe.dev', 'github.com/jane', 'https://linkedin.com/in/jane', 'http://a.b.co/x?y=1'])(
    'accepts url %s',
    (v) => expect(isValidUrl(v)).toBe(true),
  );
  it.each(['javascript:alert(1)', 'localhost', 'not a url', 'ftp://x.com', 'data:text/html,hi'])(
    'rejects url %j',
    (v) => expect(isValidUrl(v)).toBe(false),
  );
});

describe('validateResume', () => {
  it('requires a name and email', () => {
    expect(validateResume({})).toEqual({
      fullName: expect.any(String),
      email: expect.any(String),
    });
  });

  it('only checks optional fields when they are filled in', () => {
    expect(validateResume({ fullName: 'A', email: 'a@b.co' })).toEqual({});
    expect(validateResume({ fullName: 'A', email: 'a@b.co', website: 'nope', phone: '1' })).toHaveProperty(
      'website',
    );
  });
});
