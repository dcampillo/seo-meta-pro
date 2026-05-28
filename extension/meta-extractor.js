// Runs in page context — keep self-contained
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
    // A valid URL has no raw whitespace; if it does, leave the author's value untouched
    // rather than letting new URL() percent-encode it into a bogus absolute URL.
    if (/\s/.test(content)) return content;
    try {
      const url = new URL(content, window.location.href);
      return url.href;
    } catch {
      return content;
    }
  })();

  return { title, metaDescription, lang, groups, ogImage };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractMeta };
}
