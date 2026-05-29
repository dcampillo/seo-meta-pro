# License under GPL-3.0-or-later

We license SEO Meta Inspector under the **GNU General Public License, version 3
or later (`GPL-3.0-or-later`)**, rather than a permissive license. The intent is
copyleft: anyone who distributes a modified version (a fork or a rebranded
extension) must release their source under the GPL too, keeping derivatives open.

## Considered Options

- **MIT** — maximizes adoption and is the de-facto standard for small browser
  utilities, but permits closed-source forks. Rejected because keeping
  derivatives open was the explicit goal.
- **Apache-2.0** — permissive like MIT, plus a patent grant. Rejected: the
  extra ceremony only pays off with outside contributors and a patent surface,
  neither of which applies to a small standalone tool.
- **GPL-3.0-or-later** — chosen. The "or later" clause follows the FSF's own
  recommendation so the license can evolve; as sole copyright holder, David
  Campillo retains the ability to relicense if that ever becomes necessary.

## Consequences

- Full GPL text lives in `LICENSE`; `package.json` carries the
  `GPL-3.0-or-later` SPDX tag; each shipped source file in `extension/` carries
  the FSF short-form header so the copyleft travels with files copied out of the
  repo. (Test files under `tests/` are intentionally left unheadered.)
- A closed-source fork or commercial repackaging is not permitted. This is hard
  to reverse for code already distributed: existing GPL copies stay GPL even if
  the project relicenses later.
