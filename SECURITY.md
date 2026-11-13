# Security Policy

## Supported versions

Only the latest version on the `main` branch receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems. Instead, use GitHub's [private vulnerability reporting](https://github.com/erencagliz/cv-builder/security/advisories/new) for this repository.

Include a description of the issue, steps to reproduce and the impact you expect. You should receive an acknowledgement within a few days. Once a fix is available, the advisory will be published with credit to the reporter unless you prefer to stay anonymous.

## Scope

CV Builder runs entirely in the browser and has no backend. The most relevant classes of issues are:

- Script injection through imported files, share links or CV content
- Data leaking out of the browser (for example through share links or third-party requests)
- Escaping the data boundary of the Typst template so that user text is evaluated as code
