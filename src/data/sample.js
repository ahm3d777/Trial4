import { normalizeResume } from '../core/resume.js';

/**
 * A fictional resume used for the "Try with sample data" button, the
 * landing-page gallery and the README screenshots. All names, companies
 * and contact details are invented.
 */
export const SAMPLE_RESUME = normalizeResume({
  version: 2,
  fullName: 'Maya Chen',
  headline: 'Senior Frontend Engineer',
  email: 'maya.chen@example.com',
  phone: '+1 (415) 555-0142',
  location: 'San Francisco, CA',
  website: 'mayachen.dev',
  linkedin: 'linkedin.com/in/mayachen-example',
  github: 'github.com/mayachen-example',
  summary:
    'Frontend engineer with 7 years of experience building fast, accessible products used by millions. I turn ambiguous problems into shipped features, care deeply about performance budgets, and enjoy growing the engineers around me.',
  experience: [
    {
      position: 'Senior Frontend Engineer',
      company: 'Northwind Labs',
      location: 'Remote',
      duration: 'Mar 2022 – Present',
      description:
        '- Led the rebuild of the checkout flow in React and TypeScript, lifting conversion 11% across 2M monthly sessions\n- Cut largest contentful paint from 3.8 s to 1.6 s by introducing route-level code splitting and image CDN rules\n- Created the team’s accessibility checklist; resolved 140+ WCAG 2.2 AA issues ahead of an enterprise audit\n- Mentored four engineers, two of whom were promoted within a year',
    },
    {
      position: 'Frontend Engineer',
      company: 'Brightline Health',
      location: 'Oakland, CA',
      duration: 'Jun 2019 – Feb 2022',
      description:
        '- Shipped a patient-scheduling app now handling 40k bookings a week\n- Built a shared component library (48 components) adopted by three product teams\n- Introduced visual-regression tests, reducing UI bugs reaching production by 60%',
    },
    {
      position: 'Software Engineer',
      company: 'Fieldnote Studio',
      location: 'Seattle, WA',
      duration: 'Aug 2017 – May 2019',
      description:
        '- Delivered 12 client web apps on time and on budget\n- Automated deploys with GitHub Actions, taking release time from hours to minutes',
    },
  ],
  education: [
    {
      degree: 'B.Sc.',
      major: 'Computer Science',
      school: 'Pacific Coast University',
      location: 'Seattle, WA',
      year: '2017',
      gpa: '3.8 / 4.0',
      honors: 'Graduated magna cum laude',
    },
  ],
  projects: [
    {
      name: 'tiny-a11y',
      link: 'github.com/mayachen-example/tiny-a11y',
      description: 'A 3 kB accessibility linter for design tokens, with 1.2k GitHub stars.',
      technologies: 'TypeScript, Node.js, Vitest',
    },
  ],
  skills: [
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'CSS & Tailwind',
    'Web performance',
    'Accessibility (WCAG)',
    'GraphQL',
    'Playwright',
    'Design systems',
  ].map((name) => ({ name })),
  certifications: [{ name: 'Certified Professional in Web Accessibility', issuer: 'IAAP', date: '2023' }],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Mandarin', proficiency: 'Professional' },
  ],
  compactMode: false,
  paper: 'a4',
});
