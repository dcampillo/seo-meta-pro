# Relicense to MIT

**Status: Accepted (v2.0.0). Supersedes [ADR 0001](0001-gpl-3-0-license.md).**

We relicense SEO Meta Inspector from `GPL-3.0-or-later` to the **MIT License**.
The original copyleft goal (keeping derivatives open) has been deprioritized in
favour of maximizing adoption and removing friction for anyone who wants to
embed, fork, or repackage the extension — including in closed-source and
commercial works.

## Considered Options

- **Stay on GPL-3.0-or-later** — preserves copyleft, but the closed-source-fork
  restriction discourages reuse of what is a small, standalone utility. Rejected.
- **Apache-2.0** — permissive with an explicit patent grant, but the added
  ceremony pays off mainly with outside contributors and a patent surface,
  neither of which applies here. Rejected.
- **MIT** — chosen. Short, universally understood, and the de-facto standard for
  small browser utilities. As sole copyright holder, David Campillo can make this
  change unilaterally.

## Consequences

- The MIT text lives in `LICENSE`; `package.json` carries the `MIT` SPDX tag;
  each shipped source file in `extension/` carries the MIT short-form header.
  (Test files under `tests/` remain intentionally unheadered.)
- Closed-source and commercial reuse is now permitted, provided the copyright
  and permission notice are preserved.
- This applies going forward from v2.0.0. Copies previously distributed under
  GPL-3.0-or-later remain available under that license to whoever received them;
  the relicensing cannot retroactively withdraw those grants.
