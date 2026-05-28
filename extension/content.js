(() => {
  const title = document.title || '';

  const metaDescription = (() => {
    const el = document.querySelector('meta[name="description"]');
    return el ? el.getAttribute('content') || '' : '';
  })();

  const groups = {};

  document.querySelectorAll('meta').forEach(el => {
    const name = el.getAttribute('name');
    const property = el.getAttribute('property');
    const httpEquiv = el.getAttribute('http-equiv');
    const charset = el.getAttribute('charset');
    const content = el.getAttribute('content') || '';

    let group, key;

    if (property) {
      const prefix = property.split(':')[0].toLowerCase();
      group = prefix === 'og' ? 'Open Graph'
            : prefix === 'fb' ? 'Facebook'
            : prefix === 'article' || prefix === 'book' || prefix === 'profile' ? 'Open Graph'
            : 'Property';
      key = property;
    } else if (name) {
      const lower = name.toLowerCase();
      if (lower.startsWith('twitter:')) {
        group = 'Twitter Card';
      } else if (['description', 'keywords', 'author', 'robots', 'googlebot',
                  'viewport', 'theme-color', 'generator', 'rating',
                  'referrer', 'copyright', 'language'].includes(lower)) {
        group = 'General';
      } else {
        group = 'Other';
      }
      key = name;
    } else if (httpEquiv) {
      group = 'HTTP Equiv';
      key = httpEquiv;
    } else if (charset) {
      group = 'General';
      key = 'charset';
      groups[group] = groups[group] || [];
      groups[group].push({ key, value: charset });
      return;
    } else {
      return;
    }

    groups[group] = groups[group] || [];
    groups[group].push({ key, value: content });
  });

  return { title, metaDescription, groups };
})();
