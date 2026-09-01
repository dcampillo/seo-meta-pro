const {
  extractJsonLd,
  flattenJsonLdBlock,
  jsonLdTypeLabel,
  parseJsonLdBlocks,
  highlightJson,
} = require('../extension/jsonld-extractor');

const script = (type, body) => `<script type="${type}">${body}</script>`;

describe('extractJsonLd', () => {
  beforeEach(() => { document.head.innerHTML = ''; document.body.innerHTML = ''; });

  test('returns the raw contents of a JSON-LD script tag', () => {
    document.head.innerHTML = script('application/ld+json', '{"@type":"Article"}');
    expect(extractJsonLd()).toEqual(['{"@type":"Article"}']);
  });

  test('returns blocks in document order', () => {
    document.head.innerHTML = script('application/ld+json', '{"@type":"A"}');
    document.body.innerHTML = script('application/ld+json', '{"@type":"B"}');
    expect(extractJsonLd()).toEqual(['{"@type":"A"}', '{"@type":"B"}']);
  });

  test('matches the type case-insensitively', () => {
    document.head.innerHTML = script('Application/LD+JSON', '{}');
    expect(extractJsonLd()).toEqual(['{}']);
  });

  test('tolerates trailing parameters on the type', () => {
    document.head.innerHTML = script('application/ld+json;charset=utf-8', '{}');
    expect(extractJsonLd()).toEqual(['{}']);
  });

  test('ignores application/json', () => {
    document.head.innerHTML = script('application/json', '{"@type":"Article"}');
    expect(extractJsonLd()).toEqual([]);
  });

  test('ignores scripts with no type and ordinary scripts', () => {
    document.head.innerHTML = '<script>var x = 1;</script>'
      + script('text/javascript', 'var y = 2;');
    expect(extractJsonLd()).toEqual([]);
  });

  test('preserves surrounding whitespace verbatim', () => {
    document.head.innerHTML = script('application/ld+json', '\n  {"a":1}\n');
    expect(extractJsonLd()).toEqual(['\n  {"a":1}\n']);
  });

  test('returns an empty array when the page has no JSON-LD', () => {
    expect(extractJsonLd()).toEqual([]);
  });
});

describe('flattenJsonLdBlock', () => {
  test('unwraps @graph', () => {
    const a = { '@type': 'Article' };
    const b = { '@type': 'WebPage' };
    expect(flattenJsonLdBlock({ '@context': 'x', '@graph': [a, b] })).toEqual([a, b]);
  });

  test('unwraps a top-level array', () => {
    const a = { '@type': 'Article' };
    expect(flattenJsonLdBlock([a])).toEqual([a]);
  });

  test('treats a plain object as a single entity', () => {
    const a = { '@type': 'Article' };
    expect(flattenJsonLdBlock(a)).toEqual([a]);
  });

  test('does not recurse into nested entities', () => {
    const entity = { '@type': 'Article', author: { '@type': 'Person' } };
    expect(flattenJsonLdBlock(entity)).toEqual([entity]);
  });

  test('ignores a non-array @graph', () => {
    const entity = { '@graph': 'not-an-array' };
    expect(flattenJsonLdBlock(entity)).toEqual([entity]);
  });
});

describe('jsonLdTypeLabel', () => {
  test('reads a string @type', () => {
    expect(jsonLdTypeLabel({ '@type': 'Article' })).toBe('Article');
  });

  test('joins an array @type with a slash', () => {
    expect(jsonLdTypeLabel({ '@type': ['Person', 'Organization'] })).toBe('Person/Organization');
  });

  test('falls back to Untyped when @type is missing', () => {
    expect(jsonLdTypeLabel({ name: 'x' })).toBe('Untyped');
  });

  test('falls back to Untyped for a non-object entity', () => {
    expect(jsonLdTypeLabel('a string')).toBe('Untyped');
    expect(jsonLdTypeLabel(null)).toBe('Untyped');
  });

  test('falls back to Untyped for an empty array @type', () => {
    expect(jsonLdTypeLabel({ '@type': [] })).toBe('Untyped');
  });
});

describe('parseJsonLdBlocks', () => {
  test('produces one row per entity in a @graph', () => {
    const raw = JSON.stringify({ '@graph': [{ '@type': 'Article' }, { '@type': 'WebPage' }] });
    const rows = parseJsonLdBlocks([raw]);
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.label)).toEqual(['Article', 'WebPage']);
    expect(rows.every(r => r.kind === 'entity')).toBe(true);
  });

  test('numbers scripts from one', () => {
    const rows = parseJsonLdBlocks(['{"@type":"A"}', '{"@type":"B"}']);
    expect(rows.map(r => r.scriptNumber)).toEqual([1, 2]);
  });

  test('reports an error row for malformed JSON', () => {
    const rows = parseJsonLdBlocks(['{"@type":"Article",}']);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('error');
    expect(rows[0].scriptNumber).toBe(1);
    expect(rows[0].raw).toBe('{"@type":"Article",}');
    expect(typeof rows[0].message).toBe('string');
  });

  test('keeps parsing later blocks after a malformed one', () => {
    const rows = parseJsonLdBlocks(['not json', '{"@type":"Article"}']);
    expect(rows.map(r => r.kind)).toEqual(['error', 'entity']);
    expect(rows[1].scriptNumber).toBe(2);
  });

  test('carries the parsed entity on the row', () => {
    const rows = parseJsonLdBlocks(['{"@type":"Article","headline":"Hi"}']);
    expect(rows[0].entity).toEqual({ '@type': 'Article', headline: 'Hi' });
  });

  test('returns no rows for no blocks', () => {
    expect(parseJsonLdBlocks([])).toEqual([]);
  });
});

describe('highlightJson', () => {
  test('wraps keys and string values in distinct classes', () => {
    const html = highlightJson({ name: 'Jane' });
    expect(html).toContain('<span class="tok-key">&quot;name&quot;</span>');
    expect(html).toContain('<span class="tok-str">&quot;Jane&quot;</span>');
  });

  test('wraps numbers and literals', () => {
    const html = highlightJson({ n: 42, ok: true, none: null });
    expect(html).toContain('<span class="tok-num">42</span>');
    expect(html).toContain('<span class="tok-lit">true</span>');
    expect(html).toContain('<span class="tok-lit">null</span>');
  });

  test('handles negative and exponent numbers', () => {
    expect(highlightJson({ n: -1.5e10 })).toContain('<span class="tok-num">-15000000000</span>');
  });

  test('escapes markup inside string values', () => {
    const html = highlightJson({ x: '<img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  test('escapes ampersands so escaping cannot be smuggled', () => {
    expect(highlightJson({ x: '&lt;script&gt;' })).toContain('&amp;lt;script&amp;gt;');
  });

  test('does not treat true/false/null inside a string as literals', () => {
    const html = highlightJson({ x: 'true' });
    expect(html).toContain('<span class="tok-str">&quot;true&quot;</span>');
    expect(html).not.toContain('<span class="tok-lit">');
  });

  test('does not treat a colon inside a string as a key marker', () => {
    const html = highlightJson({ url: 'https://example.com' });
    expect(html).toContain('<span class="tok-str">&quot;https://example.com&quot;</span>');
  });

  test('handles escaped quotes inside strings', () => {
    const html = highlightJson({ x: 'a "quoted" word' });
    expect(html).toContain('<span class="tok-str">&quot;a \\&quot;quoted\\&quot; word&quot;</span>');
    // The escaped quotes must not end the string early and turn the tail into new tokens.
    expect(html.match(/tok-str/g)).toHaveLength(1);
  });

  test('pretty-prints with two-space indentation', () => {
    expect(highlightJson({ a: { b: 1 } })).toContain('\n  <span class="tok-key">&quot;a&quot;</span>');
  });

  test('returns an empty string for undefined', () => {
    expect(highlightJson(undefined)).toBe('');
  });
});
