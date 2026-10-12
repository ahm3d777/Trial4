/**
 * Declarative description of a resume. The editor form, the data
 * normaliser, the completeness score and the templates are all driven
 * from this single schema, so adding a field means editing one place.
 */

/**
 * @typedef {Object} FieldDef
 * @property {string} key
 * @property {string} label
 * @property {'text'|'email'|'tel'|'url'|'textarea'|'select'} [type]
 * @property {string} [placeholder]
 * @property {string} [autocomplete]
 * @property {string} [suggest]   Key into the suggestion data set.
 * @property {string} [hint]      Short guidance shown under the label.
 * @property {number} [maxLength]
 * @property {number} [rows]
 * @property {boolean} [wide]     Span the full row in the two-column grid.
 * @property {boolean} [required]
 * @property {{value: string, label: string}[]} [options]
 */

/** @type {FieldDef[]} */
export const PERSONAL_FIELDS = [
  {
    key: 'fullName',
    label: 'Full name',
    placeholder: 'Jane Doe',
    autocomplete: 'name',
    required: true,
    wide: true,
  },
  {
    key: 'headline',
    label: 'Headline',
    placeholder: 'Senior Frontend Engineer',
    autocomplete: 'organization-title',
    suggest: 'positions',
    wide: true,
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'jane@example.com',
    autocomplete: 'email',
    required: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'tel',
    placeholder: '+1 555 123 4567',
    autocomplete: 'tel',
  },
  { key: 'location', label: 'Location', placeholder: 'Berlin, Germany', autocomplete: 'address-level2' },
  { key: 'website', label: 'Website', type: 'url', placeholder: 'janedoe.dev', autocomplete: 'url' },
  { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'linkedin.com/in/janedoe' },
  { key: 'github', label: 'GitHub', type: 'url', placeholder: 'github.com/janedoe' },
];

export const SUMMARY_MAX = 600;

export const PROFICIENCY_LEVELS = [
  { value: '', label: 'Select level' },
  { value: 'Native', label: 'Native' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Professional', label: 'Professional working' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Basic', label: 'Basic' },
];

/**
 * @typedef {Object} ListSectionDef
 * @property {string} key
 * @property {string} label
 * @property {string} singular
 * @property {string} addLabel
 * @property {FieldDef[]} fields
 * @property {string[]} meaningful  Fields that, when all blank, make an entry "empty".
 * @property {(entry: Record<string,string>) => string} title
 * @property {boolean} [compact]    Render as a single-line row.
 */

/** @type {Record<string, ListSectionDef>} */
export const LIST_SECTIONS = {
  experience: {
    key: 'experience',
    label: 'Work experience',
    singular: 'Position',
    addLabel: 'Add position',
    meaningful: ['position', 'company', 'duration', 'description'],
    title: (e) => [e.position, e.company].filter(Boolean).join(' · '),
    fields: [
      {
        key: 'position',
        label: 'Job title',
        placeholder: 'Senior Developer',
        suggest: 'positions',
        hint: 'Use the industry-standard title so applicant-tracking systems match it.',
      },
      { key: 'company', label: 'Company', placeholder: 'Acme Inc.', suggest: 'companies' },
      { key: 'location', label: 'Location', placeholder: 'Remote' },
      {
        key: 'duration',
        label: 'Dates',
        placeholder: 'Jan 2022 – Present',
      },
      {
        key: 'description',
        label: 'Achievements',
        type: 'textarea',
        rows: 5,
        maxLength: 1500,
        wide: true,
        placeholder:
          '- Cut page load time 40% by moving rendering to the edge\n- Mentored four engineers; two promoted within a year',
        hint: 'One achievement per line, starting with "-". Lead with a verb and a number.',
      },
    ],
  },
  education: {
    key: 'education',
    label: 'Education',
    singular: 'Degree',
    addLabel: 'Add education',
    meaningful: ['degree', 'major', 'school', 'year'],
    title: (e) => [e.degree, e.school].filter(Boolean).join(' · '),
    fields: [
      { key: 'degree', label: 'Degree', placeholder: 'B.Sc.', suggest: 'degrees' },
      { key: 'major', label: 'Field of study', placeholder: 'Computer Science', suggest: 'majors' },
      {
        key: 'school',
        label: 'Institution',
        placeholder: 'University of Toronto',
        suggest: 'universities',
      },
      { key: 'location', label: 'Location', placeholder: 'Toronto, Canada' },
      { key: 'year', label: 'Graduation year', placeholder: '2024', suggest: 'years' },
      { key: 'gpa', label: 'GPA / grade', placeholder: '3.8 / 4.0' },
      { key: 'honors', label: 'Honours & awards', placeholder: "Dean's List", wide: true },
    ],
  },
  projects: {
    key: 'projects',
    label: 'Projects',
    singular: 'Project',
    addLabel: 'Add project',
    meaningful: ['name', 'description', 'technologies'],
    title: (e) => e.name || '',
    fields: [
      { key: 'name', label: 'Project name', placeholder: 'Open-source design system' },
      { key: 'link', label: 'Link', type: 'url', placeholder: 'github.com/jane/project' },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 3,
        maxLength: 800,
        wide: true,
        placeholder: 'The problem, what you built, and the measurable result.',
      },
      {
        key: 'technologies',
        label: 'Tech stack',
        placeholder: 'TypeScript, React, PostgreSQL',
        wide: true,
      },
    ],
  },
  skills: {
    key: 'skills',
    label: 'Skills',
    singular: 'Skill',
    addLabel: 'Add skill',
    compact: true,
    meaningful: ['name'],
    title: (e) => e.name || '',
    fields: [{ key: 'name', label: 'Skill', placeholder: 'TypeScript', suggest: 'skills' }],
  },
  certifications: {
    key: 'certifications',
    label: 'Certifications',
    singular: 'Certification',
    addLabel: 'Add certification',
    meaningful: ['name', 'issuer'],
    title: (e) => e.name || '',
    fields: [
      {
        key: 'name',
        label: 'Certification',
        placeholder: 'AWS Solutions Architect – Associate',
        wide: true,
      },
      { key: 'issuer', label: 'Issuer', placeholder: 'Amazon Web Services' },
      { key: 'date', label: 'Date', placeholder: '2025' },
    ],
  },
  languages: {
    key: 'languages',
    label: 'Languages',
    singular: 'Language',
    addLabel: 'Add language',
    meaningful: ['name'],
    title: (e) => e.name || '',
    fields: [
      { key: 'name', label: 'Language', placeholder: 'English' },
      {
        key: 'proficiency',
        label: 'Proficiency',
        type: 'select',
        options: PROFICIENCY_LEVELS,
      },
    ],
  },
};

/** Reorderable resume sections, in their default order. */
export const SECTION_KEYS = [
  'summary',
  'experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'languages',
];

/** @type {Record<string, string>} */
export const SECTION_LABELS = {
  summary: 'Summary',
  ...Object.fromEntries(Object.values(LIST_SECTIONS).map((s) => [s.key, s.label])),
};

export const PAPER_SIZES = {
  a4: { label: 'A4', widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123 },
  letter: { label: 'US Letter', widthMm: 215.9, heightMm: 279.4, widthPx: 816, heightPx: 1056 },
};
