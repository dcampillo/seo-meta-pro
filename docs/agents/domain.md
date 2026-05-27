# Domain Documentation

This repository uses a **single-context** domain documentation layout.

## File structure

```
/
├── CONTEXT.md                    ← Domain language glossary
├── docs/
│   ├── adr/                      ← Architectural decision records
│   │   ├── 0001-...md
│   │   └── 0002-...md
│   └── agents/                   ← Agent skill configuration (this folder)
└── src/                          ← Implementation code
```

## What skills read from these files

Skills like `improve-codebase-architecture`, `diagnose`, and `tdd` read:

- **`CONTEXT.md`** — to understand the project's domain language and key concepts. Used to:
  - Frame decisions in domain terms instead of implementation terms
  - Catch inconsistencies ("your code does X but CONTEXT.md says Y")
  - Sharpen fuzzy language in requirements

- **`docs/adr/`** — to understand past architectural decisions and trade-offs. Used to:
  - Avoid reopening settled decisions
  - Understand constraints and their reasons
  - Propose changes that fit the established patterns

## Creating CONTEXT.md

When the first domain term needs clarification, create `CONTEXT.md` at the repo root. Format:

```markdown
# Domain Language

## [Term]

Definition and why it matters.

## [Term]

Definition and why it matters.
```

Example for a Chrome extension:

```markdown
# Domain Language

## Meta Tag

An HTML `<meta>` element that provides structured metadata about a webpage.

## og:image

The Open Graph meta tag that specifies an image URL for social sharing previews.
```

## Creating ADRs

When you make a significant architectural decision (hard to reverse, surprising without context, result of a trade-off), document it in `docs/adr/0001-your-decision.md`. Format:

```markdown
# ADR 0001: [Title]

## Status

Accepted

## Context

Why we faced this decision.

## Decision

What we decided.

## Consequences

What changes as a result.
```

## Consumer rules

When skills read CONTEXT.md or ADRs:

- **Challenge fuzzy language:** If you use a term that conflicts with CONTEXT.md, the skill will call it out immediately.
- **Stress-test with scenarios:** When exploring domain relationships, expect concrete examples to probe edge cases.
- **Cross-reference with code:** If your code contradicts CONTEXT.md, the skill will surface it.
- **Update inline:** When a term is resolved, update CONTEXT.md right away — don't batch these up.

CONTEXT.md should be purely a glossary — no implementation details, no specs, no architectural decisions (those belong in ADRs).
