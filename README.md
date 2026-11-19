# CiteVerify

A scientific claim and citation review workspace built with React, TypeScript, Vite, and Tailwind CSS. Inter and Merriweather are bundled locally.

## Features

- A 24-claim illustrative report with supported, partly supported, unsupported, and contradictory findings.
- Synchronized manuscript highlights, searchable claim index, evidence confidence, source records, and side-by-side passage comparison.
- Human review decisions, reviewer notes, a timestamped audit trail, and reversible overrides.
- PDF and structured JSON downloads containing the full report and review history.
- Local PDF, TXT, and Markdown import, with real text extraction and manual source attachment.
- Responsive document/evidence views, keyboard navigation, reader zoom, and expanded reading mode.

## Data and privacy

The initial manuscript and source excerpts are illustrative demonstration data, not a live literature search. Imported files are processed in the browser. Extracted candidate claims remain unverified until the reviewer supplies a source and records a judgment; no external AI service is called. Workspace data is saved in local storage. Export the report before replacing the current manuscript.

## Build and validate

```sh
npm install
npm run build
npm run lint
```

The production build is written to `dist/`. PDF parsing and report generation load on demand.

The Python Playwright test scripts use a temporary static server that shuts down at the end of each run:

```sh
python scripts/test_workspace.py
python scripts/preview_check.py
```

The end-to-end suite covers claim selection, all status filters, search, comparison, document controls, review persistence, export contents, source attachment, PDF import, and mobile navigation.

## Credits

Reviewer avatar photograph: Alexander Krivitskiy, Pexels. Interface icons: Lucide.
