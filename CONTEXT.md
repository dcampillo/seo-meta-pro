# Context

Glossary of domain terms used in this codebase. Implementation details belong in code, not here.

## Social media validation

**Platform** — a downstream consumer of a page's social metadata (LinkedIn, Twitter/X, Facebook). Each platform has its own set of fields it cares about.

**Required field** — a metadata field a platform needs to render a rich preview. A required field that is **missing** or **invalid** causes the platform's validation to **fail**.

**Missing** — a field that is absent or empty, and has no fallback to supply it. A card type that is only whitespace is also missing.

**Invalid** — a field that has a value the platform does not accept. It is distinct from a missing field: the page declares it, but wrongly.

**Card type** — the value of `twitter:card`, which selects how Twitter/X presents the preview. The only card types are `summary`, `summary_large_image`, `app`, and `player`, written in lowercase. Any other value is invalid.

**Fallback** — a field is considered satisfied via *fallback* when the field itself is absent, but a counterpart in another tag family supplies the value. Specifically: Twitter/X reads `og:title`, `og:description`, and `og:image` when the matching `twitter:*` tag is absent. A fallback-satisfied field is not a failure, but it is distinct from a field that is explicitly declared — the UI surfaces which counterpart supplied the value.
