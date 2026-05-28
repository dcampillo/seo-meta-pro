const { extractSocialMediaMetadata, validateSocialMediaMetadata } = require('./social-media-validator');

describe('Social Media Metadata Extractor', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = 'Test Page';
  });

  test('extracts og:title from meta tag', () => {
    document.head.innerHTML = '<meta property="og:title" content="Test Title">';
    const result = extractSocialMediaMetadata();
    expect(result['og:title']).toBe('Test Title');
  });

  test('falls back to document.title when og:title is missing', () => {
    document.title = 'Document Title';
    const result = extractSocialMediaMetadata();
    expect(result['og:title']).toBe('Document Title');
  });

  test('extracts og:description', () => {
    document.head.innerHTML = '<meta property="og:description" content="Test Description">';
    const result = extractSocialMediaMetadata();
    expect(result['og:description']).toBe('Test Description');
  });

  test('extracts og:image and normalizes relative URLs', () => {
    document.head.innerHTML = '<meta property="og:image" content="/images/test.jpg">';
    const result = extractSocialMediaMetadata();
    expect(result['og:image']).toBe(`${window.location.origin}/images/test.jpg`);
  });

  test('returns empty string for missing fields', () => {
    const result = extractSocialMediaMetadata();
    expect(result['twitter:image']).toBe('');
  });

  test('extracts twitter:card', () => {
    document.head.innerHTML = '<meta name="twitter:card" content="summary_large_image">';
    const result = extractSocialMediaMetadata();
    expect(result['twitter:card']).toBe('summary_large_image');
  });
});

describe('Social Media Validation Engine', () => {
  test('returns pass status when all required fields are present', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.status).toBe('pass');
    expect(result.facebook.status).toBe('pass');
  });

  test('returns fail status when required fields are missing', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': '',
      'og:image': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.status).toBe('fail');
    expect(result.linkedin.requiredMissing).toEqual(['og:description', 'og:image']);
  });

  test('returns warning status when optional fields are missing', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'og:url': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.status).toBe('warning');
    expect(result.linkedin.optionalMissing).toEqual(['og:url']);
  });

  test('validates Twitter correctly', () => {
    const fields = {
      'twitter:card': 'summary',
      'twitter:title': 'Title',
      'twitter:description': 'Description',
      'twitter:image': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.twitter.status).toBe('warning');
    expect(result.twitter.optionalMissing).toEqual(['twitter:image']);
  });

  test('identifies present required fields', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'og:url': 'https://example.com',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.requiredPresent).toEqual(['og:title', 'og:description', 'og:image']);
    expect(result.linkedin.optionalPresent).toEqual(['og:url']);
  });

  test('validates all three platforms simultaneously', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'twitter:card': 'summary',
      'twitter:title': 'Title',
      'twitter:description': 'Description',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.status).toBe('pass');
    expect(result.twitter.status).toBe('pass');
    expect(result.facebook.status).toBe('pass');
  });
});
