# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-10-12

A ground-up rebuild. See the [case study](docs/case-study/README.md) for the full story.

### Added

- New name and identity: **Folio**.
- Content / Design tabs; template picker with descriptions; A4 and US Letter paper sizes.
- Headline field; bullet-aware descriptions (lines starting with `-`, `*`, `•` or `1.` become real lists).
- Accurate page count and printed-page guides in the preview.
- "Save as PDF" through the browser's print engine (selectable, ATS-readable text) alongside the image-based quick download.
- Undo for deleted entries, <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> reordering, touch-friendly drag and drop.
- Resume-strength score with a "next best improvement" tip.
- Live template thumbnails in "My resumes"; template gallery on the landing page.
- Self-hosted fonts, so the app makes no third-party requests.
- 103 unit tests, a Playwright e2e suite, ESLint, Prettier, CI and GitHub Pages deployment.

### Changed

- Rewritten as small ES modules around a single declarative schema and state object.
- The editor moved to `editor.html`. `Resume-Editor.html` redirects there.
- Autosave no longer waits for the form to be valid.
- Native `<dialog>` modals and in-app confirmation dialogs replace `window.confirm`.

### Fixed

- **Security:** user input and imported JSON were rendered with `innerHTML` unescaped (stored XSS).
- Templates 4 to 6 (Executive, Technical, Academic) had no styles.
- 18 undefined CSS variables left autocomplete, dashboard and modals unstyled.
- `&`, `<` and quotes were saved HTML-escaped and came back as `&amp;` and similar.
- The PDF export captured the zoomed-out preview.
- Printing included the whole editor; OS dark mode overrode an explicit light-theme choice.
- The theme toggle didn't work on the landing page.
- The production build didn't bundle the app's scripts, and Tailwind purged classes used in JavaScript.

### Removed

- Duplicate `* copy.*` files, auto-generated status reports, an unused Express server and about 13 MB of unused images.

### Migration

- Resumes saved by 1.x are upgraded automatically on first load: values are unescaped, skills are converted and old template IDs are mapped.

## [1.0.0] - 2025-11-07

The original version, preserved at the `legacy-snapshot` tag.

[2.0.0]: https://github.com/ahm3d777/Trial4/compare/legacy-snapshot...v2.0.0
[1.0.0]: https://github.com/ahm3d777/Trial4/tree/legacy-snapshot
