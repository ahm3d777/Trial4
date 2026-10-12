# Contributing to Folio

Thanks for taking the time to help.

## Setup

```bash
npm install
npx playwright install chromium   # once, for end-to-end tests
npm run dev
```

## Before you open a pull request

```bash
npm run check      # lint, formatting, unit tests with coverage, production build
npm run test:e2e   # Playwright, desktop and mobile
```

CI runs the same commands, so a green local run means a green PR.

## Guidelines

- **Keep `src/core` pure.** No DOM access there; that's what keeps it unit-testable. UI code belongs in `src/editor` or `src/ui`.
- **Escape at render time.** Any user value that ends up in an HTML string goes through `escapeHTML` or `renderRichText`. Store raw values, never escaped ones.
- **Adding a field?** Add it to `src/core/schema.js`. The form, the normaliser and the completeness score are driven from the schema. Then render it in `src/templates/shared.js`.
- **Adding a template?** Add an entry to `TEMPLATES` in `src/templates/index.js` and a `.tpl-<id>` block in `src/styles/resume.css`. Use `calc(N * var(--u))` instead of raw `px` so shrink-to-fit keeps working. The template test suite picks it up automatically.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Screenshots** for any visual change, please, in both light and dark mode.
- Never paste real personal data into issues, tests or fixtures. Use `example.com` addresses and `555` phone numbers.
