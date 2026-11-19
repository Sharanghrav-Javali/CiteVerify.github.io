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

The initial manuscript, source records, confidence values, and assessment labels are illustrative demonstration data. They are not independent verification results, and no live academic literature search or AI service is connected. Uploaded files are processed locally in the browser. Extracted candidate passages remain unverified until a reviewer supplies source evidence and records a judgment. PDF locations refer to source PDF pages; TXT and Markdown locations are generated passage groups. Scanned PDFs need OCR before upload. PDFs over 150 pages are not processed.

Workspace data is saved in this browser's local storage. Opening another paper replaces the current report and its review activity; export a copy first if you need to keep it.

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
