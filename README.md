# SEO Meta Inspector

A Chrome extension that extracts and displays SEO-relevant meta tags from any webpage, grouped by type for quick inspection.

## Features

- **Page summary** — shows Title, Description, URL, and HTML `lang` attribute at a glance
- **Character count warnings** — highlights title and description lengths that fall outside SEO best-practice ranges
- **Grouped meta tags** — organises all `<meta>` tags into labelled, collapsible sections
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

## Installation

This extension is not published to the Chrome Web Store. Load it manually:

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `seo-ext/` folder

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
seo-ext/
├── manifest.json   # Chrome Manifest v3
├── popup.html      # Extension popup shell
├── popup.css       # Styles
├── popup.js        # Data extraction and rendering logic
├── content.js      # Reference copy of the extraction function
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read the URL of the current tab |
| `scripting` | Inject the extraction function into the page to read its DOM |

No data is sent to any external server. Everything runs locally in your browser.

## Author

David Campillo — v1.0.2
