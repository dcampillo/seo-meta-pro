# 1. Twitter validation accepts og:* tags as fallback

Date: 2026-06-02

## Status

Accepted

## Context

The social media validator checks that pages declare the metadata each platform
needs to render a rich preview. Originally, the Twitter platform required all of
`twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` to
be explicitly present, and reported a failure for any that were missing.

This is stricter than how Twitter/X actually behaves. In practice, Twitter falls
back to Open Graph tags when the corresponding `twitter:*` tag is absent:

- `twitter:title` ← `og:title`
- `twitter:description` ← `og:description`
- `twitter:image` ← `og:image`

`twitter:card` has no Open Graph counterpart — it tells Twitter *which* card
type to render, and OG cannot supply that information.

LinkedIn and Facebook are not affected: both feed exclusively on Open Graph
data, and the required fields for those platforms are already `og:*` tags. No
fallback configuration is needed for them.

Pages that publish full OG metadata but no Twitter-specific tags were being
reported as failing the Twitter check despite rendering correctly on Twitter.

## Decision

The Twitter platform definition declares a per-field fallback map:

```js
fallbacks: {
  'twitter:title': 'og:title',
  'twitter:description': 'og:description',
  'twitter:image': 'og:image',
}
```

A required field is satisfied if it is either explicitly present, or its
declared fallback counterpart is present. `twitter:card` has no fallback and
remains strictly required.

The validator returns three arrays per platform:

- `requiredPresent: string[]` — explicitly-set fields
- `requiredFallback: { field, via }[]` — satisfied via fallback counterpart
- `requiredMissing: string[]` — neither present nor satisfied by fallback

Platform `status` is `pass` when `requiredMissing` is empty, regardless of how
the others were satisfied. The UI surfaces all three groups in the Twitter card
so users can see which fields are inherited rather than declared.

## Consequences

- Pages with complete OG metadata and a `twitter:card` tag will pass the
  Twitter check even without any other native `twitter:*` tags.
- Users still see *which* fields are explicit vs. inherited, so they can choose
  to add native Twitter tags for finer control (e.g. a different image for
  Twitter vs. Facebook) without being penalized for not doing so.
- The fallback mechanism is generic enough that other platforms could declare
  their own `fallbacks` map in the future, but no other platform needs one
  today — LinkedIn and Facebook both read Open Graph natively, and their
  required fields are already `og:*` tags.
- The return shape changed: any consumer that iterated `requiredPresent` and
  expected it to cover *all* non-missing fields must now also handle
  `requiredFallback`. `popup.js` and the test suite were updated accordingly.

## Alternatives considered

- **Hardcoded twitter-only branch in the validator.** Rejected: the rule would
  live in logic rather than alongside the platform's other requirements,
  making it harder to see when reading the Twitter config.
- **Silently count fallback fields as present.** Rejected: hides useful
  information from the user. We want them to know the page has no native
  Twitter tags so they can decide whether that's intentional.
- **Treat fallback as a soft warning that prevents `pass`.** Rejected: this
  would diverge from real Twitter behavior, where the card renders fine.
- **Objects inside `requiredPresent` instead of a third array.** Rejected: the
  UI naturally groups present/missing into sections; a third bucket maps
  cleanly to a third section without changing item shape.
