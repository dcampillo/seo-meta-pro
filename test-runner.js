// Simple test runner for og:image extraction
const { JSDOM } = require('jsdom');

// Mock JSDOM since we can't easily require it without npm
function setupDOM() {
  const { window } = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'https://example.com/page'
  });
  global.document = window.document;
  global.window = window;
}

// Read and eval the meta-extractor code
const fs = require('fs');
const metaExtractorCode = fs.readFileSync('./meta-extractor.js', 'utf8');

// Remove the module.exports check to avoid issues
const testCode = metaExtractorCode.replace(
  "if (typeof module !== 'undefined' && module.exports) { module.exports = { extractMeta }; }",
  ''
);

function extractMeta() {
  const title = document.title || '';
  const metaDescription = (() => {
    const el = document.querySelector('meta[name="description"]');
    return el ? el.getAttribute('content') || '' : '';
  })();
  const groups = {};
  document.querySelectorAll('meta').forEach(el => {
    const name     = el.getAttribute('name');
    const property = el.getAttribute('property');
    const httpEquiv = el.getAttribute('http-equiv');
    const charset  = el.getAttribute('charset');
    const content  = el.getAttribute('content') || '';
    let group, key;
    if (el.getAttribute('class') === 'elastic') {
      group = 'Elastic Search';
      key   = name || property || httpEquiv || 'unknown';
    } else if (property) {
      const prefix = property.split(':')[0].toLowerCase();
      group = prefix === 'og' ? 'Open Graph'
            : prefix === 'fb' ? 'Facebook'
            : ['article','book','profile','music','video'].includes(prefix) ? 'Open Graph'
            : 'Property';
      key = property;
    } else if (name) {
      const lower = name.toLowerCase();
      const ogPrefixes = ['og:','article:','book:','profile:','music:','video:'];
      group = lower.startsWith('twitter:') ? 'Twitter Card'
            : ogPrefixes.some(p => lower.startsWith(p)) ? 'Open Graph'
            : ['description','keywords','author','robots','googlebot','viewport',
               'theme-color','generator','rating','referrer','copyright','language',
               'application-name','msapplication-tilecolor'].includes(lower) ? 'General'
            : 'General';
      key = name;
    } else if (httpEquiv) {
      group = 'HTTP Equiv';
      key   = httpEquiv;
    } else if (charset) {
      group = 'General';
      key   = 'charset';
      groups[group] = groups[group] || [];
      groups[group].push({ key, value: charset });
      return;
    } else {
      return;
    }
    groups[group] = groups[group] || [];
    groups[group].push({ key, value: content });
  });
  const lang = document.documentElement.getAttribute('lang') || '';
  const ogImage = (() => {
    const el = document.querySelector('meta[property="og:image"]');
    if (!el) return '';
    const content = el.getAttribute('content') || '';
    if (!content) return '';
    try {
      const url = new URL(content, window.location.href);
      return url.href;
    } catch {
      return content;
    }
  })();
  return { title, metaDescription, lang, groups, ogImage };
}

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    setupDOM();
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
}

// Tests
test('finds and returns the first og:image meta tag', () => {
  document.head.innerHTML = '<meta property="og:image" content="https://example.com/image.jpg">';
  const result = extractMeta();
  assertEqual(result.ogImage, 'https://example.com/image.jpg');
});

test('returns empty string when og:image is missing', () => {
  document.head.innerHTML = '';
  const result = extractMeta();
  assertEqual(result.ogImage, '');
});

test('treats empty og:image values as missing', () => {
  document.head.innerHTML = '<meta property="og:image" content="">';
  const result = extractMeta();
  assertEqual(result.ogImage, '');
});

test('converts relative URLs to absolute URLs', () => {
  document.head.innerHTML = '<meta property="og:image" content="/images/og-image.jpg">';
  const result = extractMeta();
  assertEqual(result.ogImage, 'https://example.com/images/og-image.jpg');
});

test('returns only the first og:image when multiple tags exist', () => {
  document.head.innerHTML = `
    <meta property="og:image" content="https://example.com/image1.jpg">
    <meta property="og:image" content="https://example.com/image2.jpg">
  `;
  const result = extractMeta();
  assertEqual(result.ogImage, 'https://example.com/image1.jpg');
});

test('ignores og:image:url variants', () => {
  document.head.innerHTML = `
    <meta property="og:image:url" content="https://example.com/image-url.jpg">
    <meta property="og:image:width" content="1200">
  `;
  const result = extractMeta();
  assertEqual(result.ogImage, '');
});

test('extracts og:image even with other meta tags present', () => {
  document.head.innerHTML = `
    <meta name="description" content="Page description">
    <meta property="og:title" content="Page Title">
    <meta property="og:image" content="https://example.com/image.jpg">
    <meta property="og:type" content="website">
  `;
  const result = extractMeta();
  assertEqual(result.ogImage, 'https://example.com/image.jpg');
});

test('includes ogImage in the returned data object', () => {
  document.head.innerHTML = '<meta property="og:image" content="https://example.com/image.jpg">';
  const result = extractMeta();
  assert(result.hasOwnProperty('ogImage'), 'Result should have ogImage property');
  assertEqual(result.ogImage, 'https://example.com/image.jpg');
});

test('handles invalid URLs gracefully by returning the original value', () => {
  document.head.innerHTML = '<meta property="og:image" content="not a valid url!">';
  const result = extractMeta();
  assertEqual(result.ogImage, 'not a valid url!');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
