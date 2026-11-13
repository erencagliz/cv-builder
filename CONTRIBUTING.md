# Contributing

Thanks for taking the time to contribute. This document describes how to set up the project, the conventions it follows and what a pull request needs before it can be merged.

## Development setup

1. Install Node.js 20 or newer (`.nvmrc` pins the version used in CI).
2. Install dependencies and the Playwright browser:

   ```bash
   npm install
   npx playwright install chromium
   ```

3. Start the development server with `npm run dev`.

## Workflow

1. Open an issue first for anything larger than a small fix, so the approach can be agreed on before you invest time.
2. Create a branch from `main` (`fix/…`, `feat/…`, `docs/…`).
3. Keep pull requests focused on one change.
4. Run `npm run check` (lint, type-check, unit and integration tests) and `npm run test:e2e` before pushing.
5. Fill in the pull request template, including how you tested the change.

## Conventions

- **TypeScript strict mode** and **ESLint with zero warnings** are enforced in CI.
- **Formatting** follows `.editorconfig`: two spaces, LF line endings, single quotes, trailing commas, lines up to roughly 180 characters.
- **Commits** use the [Conventional Commits](https://www.conventionalcommits.org) style, for example `fix(import): keep bullet order in two-column PDFs`.
- **Tests** accompany behaviour changes. Pure logic belongs in `tests/unit`, anything that needs the Typst engine in `tests/integration`, and user flows in `tests/e2e`.

## Interface text and translations

Interface strings are written in Turkish in the components and translated to English through `src/i18n/en.ts`, which maps the exact source string to its English form. When you add or change interface text:

1. Add the string and its English translation to `src/i18n/en.ts`. Use `{0}`, `{1}` for variable parts.
2. For attribute-only text such as placeholders, prefix the key with `@`.
3. Mark regions that contain user content with `data-no-i18n` so they are never translated.

The end-to-end test `leaves no untranslated interface text in English` fails if a string is missing from the dictionary.

## ATS-related changes

Changes to the Typst template (`src/render/cv.typ`), fonts or the render model can silently break PDF text extraction. The integration suite renders every template with every font and checks the extracted text, so run `npm test` and look for regressions in `tests/integration`.

When writing regular expressions for Turkish text, remember that JavaScript's `\b` and `\w` only understand ASCII. Wrap such patterns with `unicodeWords()` from `src/ats/unicodeWord.ts`.

## Reporting bugs

Use the bug report template and include the browser, steps to reproduce and, if possible, an exported backup (`My CVs → Back up all`) with personal data removed.
