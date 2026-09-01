# SEO Meta Inspector

A Chrome extension that extracts and displays SEO-relevant meta tags from any webpage, grouped by type for quick inspection.

## Features

- **Page summary** — shows Title, Description, URL, HTML `lang` attribute, and og:image thumbnail at a glance
- **og:image preview** — displays Open Graph image as a 200px-wide clickable thumbnail with CORS detection and error handling
- **Character count warnings** — highlights title and description lengths that fall outside SEO best-practice ranges
- **Grouped meta tags** — organises all `<meta>` tags into labelled, collapsible sections
- **JSON-LD inspector** — lists every JSON-LD entity on the page by `@type`, with syntax-highlighted source
- **Copy to clipboard** — exports all extracted data as formatted JSON with one click

## Meta tag groups

| Group | What it captures |
|---|---|
| **General** | `description`, `keywords`, `robots`, `viewport`, `author`, `charset`, and other standard name-based tags |
| **Elastic Search** | Tags with `class="elastic"` (e.g. `<meta class="elastic" name="business_area" content="EL"/>`) |
| **Open Graph** | `og:*`, `article:*`, `book:*`, `profile:*`, `music:*`, `video:*` — via both `property` and `name` attributes |
| **Twitter Card** | `twitter:*` tags |
| **Facebook** | `fb:*` tags |
| **Property** | Any other `property`-based tags not covered above |
| **HTTP Equiv** | `http-equiv` pragma tags |

General, Elastic Search, and Open Graph groups are expanded by default. All others start collapsed.

## JSON-LD tab

Lists the structured data the page declares in `<script type="application/ld+json">` tags. Each entity gets a row headed by its `@type`, expanded by default, showing the pretty-printed source.

- A `@graph` or a top-level array is flattened into one row per entity. Nested entities (an Article's `author`, say) stay inside their parent.
- Blocks that fail to parse are reported as **⚠ Invalid JSON (script N)** with the parser's error and the raw source — a block Google cannot read is worth seeing.
- Only `application/ld+json` is read. Microdata, RDFa, and JSON-LD placed in `application/json` are not shown; Google ignores the last of those too.
- Data is read from the live DOM at inspect time, so client-side-injected JSON-LD is included.

## Installation

This extension is not published to the Chrome Web Store. Load it manually:

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `extension/` folder

The extension icon will appear in your toolbar. Click it on any page to inspect its meta tags.

## Usage

1. Navigate to any webpage
2. Click the **SEO Meta Inspector** icon in the Chrome toolbar
3. The popup displays the page summary and all meta tag groups
4. Click any group header to expand or collapse it
5. Click **Copy JSON** to copy all data to the clipboard

## Character count guidance

| Field | Warning | Error |
|---|---|---|
| Title | < 30 or > 60 chars | > 80 chars |
| Description | < 70 or > 160 chars | > 320 chars |

Values shown in orange are outside the recommended range; red indicates they are critically over or under the limit.

## File structure

```
extension/                    # Loadable Chrome extension (Load unpacked here)
├── manifest.json             # Chrome Manifest v3
├── popup.html                # Extension popup shell
├── popup.css                 # Styles
├── popup.js                  # Rendering logic; injects extractMeta into the page
├── meta-extractor.js         # extractMeta (single source); loaded by popup + tests
├── social-media-validator.js # Social media metadata extraction + validation
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

tests/                        # Dev tooling, not packaged
├── *.test.js                 # Jest test suites
└── test-runner.js            # Standalone test runner

# Project root
├── jest.config.js
└── package.json
```

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read the URL of the current tab |
| `scripting` | Inject the extraction function into the page to read its DOM |

No data is sent to any external server. Everything runs locally in your browser.

## Author

David Campillo — v2.0.0

## License

Copyright (C) 2026 David Campillo.

SEO Meta Inspector is free software, licensed under the **MIT License**. You may
use, copy, modify, and distribute it — including in closed-source and commercial
works — provided the copyright notice and permission notice are preserved. It
comes with NO WARRANTY. See the [`LICENSE`](LICENSE) file for the full text, or
<https://opensource.org/license/mit>.
