# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-15

First open-source release.

### Added

- CV editor with a step-by-step wizard and an all-sections view, covering every common CV section plus unlimited custom sections, 20 link types and region-specific personal fields.
- 7 templates and 20 fonts with full Latin Extended coverage, colour presets with contrast warnings, detailed typography and spacing controls, and a "fit to one page" action that respects readability limits.
- Real-text, tagged PDF output typeset with Typst compiled to WebAssembly, with ligatures and hyphenation disabled so keywords stay intact.
- ATS report that re-reads the generated PDF and scores parsing, impact, completeness, keywords and layout, with bullet-level writing feedback.
- Job match that compares a pasted posting against the CV, adds missing skills in one click and checks requirements such as experience, licences and languages.
- Cover letters with starter templates, sharing the CV design.
- Import from PDF (including two-column layouts), Word, plain text, LinkedIn exports, JSON Resume and backups.
- Export to PDF, Word, plain text, JSON Resume and full backups.
- Serverless share links and QR codes with a read-only viewer.
- Job application tracker with CSV export.
- English and Turkish interface with localized URLs (`/edit`, `/view`, `/tr/duzenle`, `/tr/goruntule`), localized metadata and share images, dark mode, responsive layout and offline support as a PWA.
- Unit, integration and end-to-end test suites, and continuous integration on GitHub Actions.

[1.0.0]: https://github.com/erencagliz/cv-builder/releases/tag/v1.0.0
