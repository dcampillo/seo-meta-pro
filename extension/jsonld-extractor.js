/*
 * SEO Meta Inspector — Chrome extension for inspecting page SEO metadata.
 * Copyright (c) 2026 David Campillo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, subject to the conditions in the MIT
 * License. The Software is provided "AS IS", without warranty of any kind.
 * See the LICENSE file for the full text.
 *
 * SPDX-License-Identifier: MIT
 */

// Runs in page context — keep self-contained.
// Returns the raw, untrimmed contents of every JSON-LD script tag, in document
// order. Parsing happens in the popup so failures can be reported per block.
function extractJsonLd() {
  const blocks = [];

  document.querySelectorAll('script').forEach(el => {
    const type = (el.getAttribute('type') || '').toLowerCase();
    // Tolerate parameters such as `application/ld+json;charset=utf-8`.
    // `application/json` is deliberately excluded: Google ignores it too.
    if (type.split(';')[0].trim() !== 'application/ld+json') return;
    blocks.push(el.textContent || '');
  });

  return blocks;
}

// Flattens one parsed block into the entities it declares. Top level only:
// a `@graph` or a top-level array yields its members, anything else is a
// single entity. Nested entities stay inside their parent.
function flattenJsonLdBlock(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed['@graph'])) {
    return parsed['@graph'];
  }
  return [parsed];
}

// The row header. `@type` may be absent or an array.
function jsonLdTypeLabel(entity) {
  const type = entity && typeof entity === 'object' ? entity['@type'] : undefined;
  if (Array.isArray(type)) {
    const parts = type.filter(t => typeof t === 'string' && t);
    if (parts.length) return parts.join('/');
  }
  if (typeof type === 'string' && type) return type;
  return 'Untyped';
}

// Turns raw script contents into renderable rows. One row per entity, plus an
// error row for each block that fails to parse.
function parseJsonLdBlocks(blocks) {
  const rows = [];

  blocks.forEach((raw, index) => {
    const scriptNumber = index + 1;
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      rows.push({ kind: 'error', scriptNumber, message: err.message, raw });
      return;
    }

    flattenJsonLdBlock(parsed).forEach(entity => {
      rows.push({ kind: 'entity', scriptNumber, label: jsonLdTypeLabel(entity), entity });
    });
  });

  return rows;
}

// Pretty-prints and syntax-highlights a value. Scans the raw JSON and escapes
// each token as it is emitted — escaping after wrapping would let page-supplied
// strings inject markup.
function highlightJson(value) {
  const json = JSON.stringify(value, null, 2);
  if (typeof json !== 'string') return '';

  const esc = str => str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let out = '';
  let i = 0;

  while (i < json.length) {
    const ch = json[i];

    if (ch === '"') {
      let j = i + 1;
      while (j < json.length) {
        if (json[j] === '\\') { j += 2; continue; }
        if (json[j] === '"') { j++; break; }
        j++;
      }
      const literal = json.slice(i, j);

      // A string is a key when the next non-space character is a colon.
      let k = j;
      while (k < json.length && /\s/.test(json[k])) k++;

      out += `<span class="${json[k] === ':' ? 'tok-key' : 'tok-str'}">${esc(literal)}</span>`;
      i = j;
      continue;
    }

    const literal = /^(true|false|null)/.exec(json.slice(i));
    if (literal) {
      out += `<span class="tok-lit">${literal[0]}</span>`;
      i += literal[0].length;
      continue;
    }

    const number = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(json.slice(i));
    if (number) {
      out += `<span class="tok-num">${number[0]}</span>`;
      i += number[0].length;
      continue;
    }

    out += esc(ch);
    i++;
  }

  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractJsonLd,
    flattenJsonLdBlock,
    jsonLdTypeLabel,
    parseJsonLdBlocks,
    highlightJson,
  };
}
