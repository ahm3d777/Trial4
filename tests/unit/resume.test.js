import { describe, expect, it } from 'vitest';
import {
  completeness,
  createEmptyResume,
  normalizeResume,
  toRenderable,
  visibleSections,
} from '../../src/core/resume.js';
import { SECTION_KEYS } from '../../src/core/schema.js';
import { SAMPLE_RESUME } from '../../src/data/sample.js';

/** A resume exactly as v1 of the app stored it in localStorage. */
const LEGACY = {
  fullName: 'Ayesha &amp; Co',
  email: 'ayesha@example.com',
  summary: 'I&#039;m &lt;great&gt;',
  education: [
    { degree: 'B.Sc.', major: '', school: 'Dhaka', location: '', year: '2019', gpa: '', honors: '' },
  ],
  experience: [{ position: 'Dev', company: 'X', location: '', duration: '', description: '' }],
  skills: ['React', 'Node.js'],
  projects: [],
  certifications: [],
  languages: [{ name: 'Bangla', proficiency: 'Native' }],
  sectionSettings: { order: ['education', 'summary', 'bogus'], hidden: ['projects', 'bogus'] },
  compactMode: true,
};

describe('normalizeResume', () => {
  it('migrates v1 data: unescapes HTML, converts skill strings, keeps settings', () => {
    const d = normalizeResume(LEGACY);
    expect(d.version).toBe(2);
    expect(d.fullName).toBe('Ayesha & Co');
    expect(d.summary).toBe("I'm <great>");
    expect(d.skills).toEqual([{ name: 'React' }, { name: 'Node.js' }]);
    expect(d.languages).toEqual([{ name: 'Bangla', proficiency: 'Native' }]);
    expect(d.compactMode).toBe(true);
    expect(d.sectionSettings.order.slice(0, 2)).toEqual(['education', 'summary']);
    expect(d.sectionSettings.order).toHaveLength(SECTION_KEYS.length);
    expect(d.sectionSettings.hidden).toEqual(['projects']);
  });

  it('does not unescape v2 data (a literal "&amp;" stays literal)', () => {
    expect(normalizeResume({ version: 2, fullName: 'A &amp; B' }).fullName).toBe('A &amp; B');
  });

  it('never throws on garbage and returns a valid empty resume', () => {
    for (const junk of [null, undefined, 42, 'x', [], { experience: 'nope', skills: [null, 3] }]) {
      const d = normalizeResume(junk);
      expect(d.fullName).toBe('');
      expect(Array.isArray(d.experience)).toBe(true);
      expect(d.paper).toBe('a4');
    }
  });

  it('drops unknown fields and empty entries', () => {
    const d = normalizeResume({ version: 2, evil: '<script>', experience: [{ position: '', company: '' }] });
    expect(d).not.toHaveProperty('evil');
    expect(d.experience).toEqual([]);
  });
});

describe('toRenderable', () => {
  it('trims strings and removes blank entries', () => {
    const d = createEmptyResume();
    d.fullName = '  Jane  ';
    d.skills = [{ name: ' TS ' }, { name: '' }];
    const r = toRenderable(d);
    expect(r.fullName).toBe('Jane');
    expect(r.skills).toEqual([{ name: 'TS' }]);
    expect(r.experience).toEqual([]);
  });
});

describe('completeness', () => {
  it('is 0 for an empty resume and suggests the name first', () => {
    expect(completeness(createEmptyResume())).toEqual({ score: 0, nextTip: 'Add your full name.' });
  });
  it('is 100 for the sample resume', () => {
    expect(completeness(SAMPLE_RESUME)).toEqual({ score: 100, nextTip: null });
  });
});

describe('visibleSections', () => {
  it('follows the chosen order and skips hidden or empty sections', () => {
    const d = structuredClone(SAMPLE_RESUME);
    d.sectionSettings = {
      order: ['skills', ...SECTION_KEYS.filter((k) => k !== 'skills')],
      hidden: ['summary'],
    };
    d.certifications = [];
    const v = visibleSections(d);
    expect(v[0]).toBe('skills');
    expect(v).not.toContain('summary');
    expect(v).not.toContain('certifications');
  });
});
