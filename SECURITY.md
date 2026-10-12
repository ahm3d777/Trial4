# Security policy

Folio is a static, client-side app: there is no server and no user accounts, and resume data never leaves the browser. The main risks are therefore **cross-site scripting through resume content or imported files**, and **supply-chain issues in dependencies**.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's [private vulnerability reporting](https://github.com/ahm3d777/Trial4/security/advisories/new) and include steps to reproduce. You can expect an acknowledgement within a few days.

## What is in place

- All user-supplied values are escaped when they're rendered (`src/core/escape.js`), with an XSS regression test for every template.
- Imported JSON is parsed and normalised against the schema; unknown keys are dropped.
- URL fields reject non-HTTP schemes such as `javascript:`.
- No third-party scripts or fonts are loaded at runtime.
- Dependabot keeps dependencies current, and `npm audit` reports 0 known vulnerabilities in production dependencies.
