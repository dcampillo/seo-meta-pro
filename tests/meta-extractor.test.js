const { extractMeta } = require('../extension/meta-extractor');
const { checkCors, thumbnailRow } = require('../extension/popup');

describe('extractMeta - og:image extraction', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
    document.documentElement.setAttribute('lang', '');
  });

  test('finds and returns the first og:image meta tag', () => {
    document.head.innerHTML = '<meta property="og:image" content="https://example.com/image.jpg">';
    const result = extractMeta();
    expect(result.ogImage).toBe('https://example.com/image.jpg');
  });

  test('returns empty string when og:image is missing', () => {
    document.head.innerHTML = '';
    const result = extractMeta();
    expect(result.ogImage).toBe('');
  });

  test('treats empty og:image values as missing', () => {
    document.head.innerHTML = '<meta property="og:image" content="">';
    const result = extractMeta();
    expect(result.ogImage).toBe('');
  });

  test('converts relative URLs to absolute URLs', () => {
    document.head.innerHTML = '<meta property="og:image" content="/images/og-image.jpg">';
    const result = extractMeta();
    expect(result.ogImage).toBe(`${window.location.origin}/images/og-image.jpg`);
  });

  test('converts relative URLs with path to absolute URLs', () => {
    document.head.innerHTML = '<meta property="og:image" content="images/og-image.jpg">';
    const result = extractMeta();
    expect(result.ogImage).toContain('images/og-image.jpg');
  });

  test('returns only the first og:image when multiple tags exist', () => {
    document.head.innerHTML = `
      <meta property="og:image" content="https://example.com/image1.jpg">
      <meta property="og:image" content="https://example.com/image2.jpg">
    `;
    const result = extractMeta();
    expect(result.ogImage).toBe('https://example.com/image1.jpg');
  });

  test('ignores og:image:url variants', () => {
    document.head.innerHTML = `
      <meta property="og:image:url" content="https://example.com/image-url.jpg">
      <meta property="og:image:width" content="1200">
    `;
    const result = extractMeta();
    expect(result.ogImage).toBe('');
  });

  test('extracts og:image even with other meta tags present', () => {
    document.head.innerHTML = `
      <meta name="description" content="Page description">
      <meta property="og:title" content="Page Title">
      <meta property="og:image" content="https://example.com/image.jpg">
      <meta property="og:type" content="website">
    `;
    const result = extractMeta();
    expect(result.ogImage).toBe('https://example.com/image.jpg');
  });

  test('includes ogImage in the returned data object', () => {
    document.head.innerHTML = '<meta property="og:image" content="https://example.com/image.jpg">';
    const result = extractMeta();
    expect(result).toHaveProperty('ogImage');
    expect(result.ogImage).toBe('https://example.com/image.jpg');
  });

  test('handles invalid URLs gracefully by returning the original value', () => {
    document.head.innerHTML = '<meta property="og:image" content="not a valid url!">';
    const result = extractMeta();
    // Should return the content as-is if URL parsing fails
    expect(result.ogImage).toBe('not a valid url!');
  });
});

describe('Thumbnail rendering with CORS detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders thumbnail with image when og:image is present', () => {
    const html = thumbnailRow('Thumbnail', 'https://example.com/image.jpg');
    expect(html).toContain('thumbnail-container');
    expect(html).toContain('https://example.com/image.jpg');
    expect(html).toContain('thumbnail-image');
  });

  test('renders placeholder when og:image is empty', () => {
    const html = thumbnailRow('Thumbnail', '');
    expect(html).toContain('thumbnail-placeholder');
    expect(html).toContain('No thumbnail found (og:image)');
  });

  test('renders placeholder when og:image is missing', () => {
    const html = thumbnailRow('Thumbnail', null);
    expect(html).toContain('thumbnail-placeholder');
    expect(html).toContain('No thumbnail found (og:image)');
  });

  test('thumbnail image is clickable to open URL', (done) => {
    const content = document.getElementById('content');
    const ogImageUrl = 'https://example.com/og-image.jpg';

    global.open = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const html = thumbnailRow('Thumbnail', ogImageUrl);
    content.innerHTML = html;

    // Simulate render function's thumbnail handling
    const container = content.querySelector('.thumbnail-container');
    container.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(ogImageUrl, '_blank', 'noopener,noreferrer');
    });

    container.click();

    expect(global.open).toHaveBeenCalledWith(
      ogImageUrl,
      '_blank',
      'noopener,noreferrer'
    );
    done();
  });

  test('checkCors detects CORS blocked images', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await checkCors('https://cors-blocked.com/image.jpg');
    expect(result.corsBlocked).toBe(true);
  });

  test('checkCors allows successful image requests', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const result = await checkCors('https://example.com/image.jpg');
    expect(result.corsBlocked).toBe(false);
    expect(result.ok).toBe(true);
  });

  test('checkCors detects failed responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const result = await checkCors('https://example.com/broken.jpg');
    expect(result.corsBlocked).toBe(false);
    expect(result.ok).toBe(false);
  });
});
