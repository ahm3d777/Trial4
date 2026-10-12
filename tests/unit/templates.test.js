import { describe, expect, it } from 'vitest';
import { createEmptyResume } from '../../src/core/resume.js';
import { SAMPLE_RESUME } from '../../src/data/sample.js';
import { TEMPLATES, getTemplate, renderResume, resolveTemplateId } from '../../src/templates/index.js';

const XSS = '<img src=x onerror="alert(1)">';

function hostile() {
  const d = structuredClone(SAMPLE_RESUME);
  d.fullName = XSS;
  d.headline = XSS;
  d.email = XSS;
  d.website = XSS;
  d.summary = XSS;
  d.experience[0].position = XSS;
  d.experience[0].description = `- ${XSS}`;
  d.skills[0].name = XSS;
  d.languages[0].name = XSS;
  d.certifications[0].issuer = XSS;
  d.projects[0].link = XSS;
  return d;
}

describe.each(TEMPLATES.map((t) => [t.id]))('template "%s"', (id) => {
  it('renders the sample resume with every section', () => {
    const html = renderResume(id, SAMPLE_RESUME);
    expect(html).toContain(`tpl-${id}`);
    expect(html).toContain('Maya Chen');
    for (const key of [
      'summary',
      'experience',
      'education',
      'projects',
      'skills',
      'certifications',
      'languages',
    ]) {
      expect(html).toContain(`r-section--${key}`);
    }
  });

  it('escapes every user-supplied value', () => {
    const html = renderResume(id, hostile());
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/onerror="/);
  });

  it('omits empty and hidden sections', () => {
    const d = createEmptyResume();
    d.fullName = 'Only Name';
    let html = renderResume(id, d);
    expect(html).not.toContain('r-section--experience');
    expect(html).toContain('Only Name');

    const s = structuredClone(SAMPLE_RESUME);
    s.sectionSettings.hidden = ['skills', 'experience'];
    html = renderResume(id, s);
    expect(html).not.toContain('r-section--skills');
    expect(html).not.toContain('r-section--experience');
  });
});

describe('template ids', () => {
  it('maps v1 numeric ids and falls back to the default', () => {
    expect(resolveTemplateId('template4')).toBe('executive');
    expect(resolveTemplateId('modern')).toBe('modern');
    expect(resolveTemplateId('nope')).toBe('classic');
    expect(resolveTemplateId(undefined)).toBe('classic');
    expect(getTemplate('template2').name).toBe('Modern');
  });

  it('renders single-column templates in the user’s chosen section order', () => {
    const d = structuredClone(SAMPLE_RESUME);
    d.sectionSettings.order = [
      'skills',
      'summary',
      'experience',
      'education',
      'projects',
      'certifications',
      'languages',
    ];
    const html = renderResume('classic', d);
    expect(html.indexOf('r-section--skills')).toBeLessThan(html.indexOf('r-section--summary'));
  });
});
