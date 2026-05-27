# Display og:image in Page Summary with error handling

# Display og:image in Page Summary with error handling

## Parent

Addresses #1: Add og:image thumbnail preview to Page Summary

## What to build

Add a new block element to the Page Summary section that displays the og:image as a 200px-wide clickable image preview. Position it below the "Lang" field with a "Thumbnail" label above the image. The image should be clickable to open the og:image URL in a new tab and have a border for visual separation.

Implement CORS detection using `fetch(ogImageUrl, { mode: 'cors' })` to distinguish between missing og:image, CORS-blocked images, and broken image URLs. Display appropriate placeholders:
- "No thumbnail found (og:image)" — when og:image is empty or missing
- "Image blocked by CORS" — when fetch fails with CORS error
- Broken-image icon — when image URL is invalid or load fails

Ensure consistent label formatting (title case, matches existing Page Summary style).

## Acceptance criteria

- [x] "Thumbnail" label displays above image block in Page Summary
- [x] Image is 200px wide with height auto (preserves aspect ratio)
- [x] Image is clickable and opens og:image URL in new tab
- [x] Border styling applied to image
- [x] CORS detection implemented via `fetch()`
- [x] "No thumbnail found (og:image)" placeholder shown when og:image is missing
- [x] "Image blocked by CORS" placeholder shown when CORS prevents image load
- [x] Broken-image icon placeholder shown on image load failure
- [x] Placeholder boxes are styled consistently
- [x] Label formatting is consistent with existing Page Summary labels (Title, Description, URL, Lang)
- [x] Tests cover: successful image display, CORS detection, missing og:image, load failure scenarios

## Blocked by

- #2: Extract og:image from page meta tags (needs `ogImage` in data structure)
