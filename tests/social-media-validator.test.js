const { extractSocialMediaMetadata, validateSocialMediaMetadata } = require('../extension/social-media-validator');

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

  test('extracts og:type from property meta tag', () => {
    document.head.innerHTML = '<meta property="og:type" content="article">';
    const result = extractSocialMediaMetadata();
    expect(result['og:type']).toBe('article');
  });

  test('does not extract og:type from name meta tag', () => {
    document.head.innerHTML = '<meta name="og:type" content="article">';
    const result = extractSocialMediaMetadata();
    expect(result['og:type']).toBe('');
  });
});

describe('Social Media Validation Engine', () => {
  test('returns pass status when all required fields are present', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'og:url': 'https://example.com',
      'og:type': 'article',
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
    expect(result.linkedin.requiredMissing).toEqual(['og:description', 'og:image', 'og:url', 'og:type']);
  });

  test('fails when og:type is missing for LinkedIn and Facebook', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'og:url': 'https://example.com',
      'og:type': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.status).toBe('fail');
    expect(result.linkedin.requiredMissing).toEqual(['og:type']);
    expect(result.facebook.status).toBe('fail');
    expect(result.facebook.requiredMissing).toEqual(['og:type']);
  });

  test('does not require og:type for Twitter', () => {
    const fields = {
      'twitter:card': 'summary',
      'twitter:title': 'Title',
      'twitter:description': 'Description',
      'twitter:image': 'https://example.com/image.jpg',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.twitter.status).toBe('pass');
    expect(result.twitter.requiredMissing).toEqual([]);
    expect(result.twitter.requiredFallback).toEqual([]);
  });

  test('fails Twitter when twitter:image is missing and og:image is also absent', () => {
    const fields = {
      'twitter:card': 'summary',
      'twitter:title': 'Title',
      'twitter:description': 'Description',
      'twitter:image': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.twitter.status).toBe('fail');
    expect(result.twitter.requiredMissing).toEqual(['twitter:image']);
  });

  test('Twitter passes when twitter:title/description/image fall back to og:* counterparts', () => {
    const fields = {
      'og:title': 'OG Title',
      'og:description': 'OG Description',
      'og:image': 'https://example.com/og-image.jpg',
      'twitter:card': 'summary',
      'twitter:title': '',
      'twitter:description': '',
      'twitter:image': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.twitter.status).toBe('pass');
    expect(result.twitter.requiredMissing).toEqual([]);
    expect(result.twitter.requiredPresent).toEqual(['twitter:card']);
    expect(result.twitter.requiredFallback).toEqual([
      { field: 'twitter:title', via: 'og:title' },
      { field: 'twitter:description', via: 'og:description' },
      { field: 'twitter:image', via: 'og:image' },
    ]);
  });

  test('Twitter fails when twitter:card is missing even if all og:* counterparts exist', () => {
    const fields = {
      'og:title': 'OG Title',
      'og:description': 'OG Description',
      'og:image': 'https://example.com/og-image.jpg',
      'twitter:card': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.twitter.status).toBe('fail');
    expect(result.twitter.requiredMissing).toEqual(['twitter:card']);
  });

  test('Twitter mixes explicit and fallback fields correctly', () => {
    const fields = {
      'og:title': 'OG Title',
      'og:image': 'https://example.com/og-image.jpg',
      'twitter:card': 'summary',
      'twitter:title': 'Twitter Title',
      'twitter:description': '',
      'twitter:image': '',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.twitter.status).toBe('fail');
    expect(result.twitter.requiredPresent).toEqual(['twitter:card', 'twitter:title']);
    expect(result.twitter.requiredFallback).toEqual([
      { field: 'twitter:image', via: 'og:image' },
    ]);
    expect(result.twitter.requiredMissing).toEqual(['twitter:description']);
  });

  test('identifies present required fields', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'og:url': 'https://example.com',
      'og:type': 'website',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.requiredPresent).toEqual(['og:title', 'og:description', 'og:image', 'og:url', 'og:type']);
    expect(result.linkedin.requiredFallback).toEqual([]);
  });

  test('validates all three platforms simultaneously', () => {
    const fields = {
      'og:title': 'Title',
      'og:description': 'Description',
      'og:image': 'https://example.com/image.jpg',
      'og:url': 'https://example.com',
      'og:type': 'article',
      'twitter:card': 'summary',
      'twitter:title': 'Title',
      'twitter:description': 'Description',
      'twitter:image': 'https://example.com/image.jpg',
    };
    const result = validateSocialMediaMetadata(fields);
    expect(result.linkedin.status).toBe('pass');
    expect(result.twitter.status).toBe('pass');
    expect(result.facebook.status).toBe('pass');
  });
});

describe('Twitter card type validation', () => {
  const allowed = ['summary', 'summary_large_image', 'app', 'player'];
  const fieldsWithCard = (card) => ({
    'twitter:card': card,
    'twitter:title': 'Title',
    'twitter:description': 'Description',
    'twitter:image': 'https://example.com/image.jpg',
  });

  test.each(allowed)('accepts the card type "%s"', (card) => {
    const { twitter } = validateSocialMediaMetadata(fieldsWithCard(card));
    expect(twitter.status).toBe('pass');
    expect(twitter.requiredPresent).toContain('twitter:card');
    expect(twitter.requiredInvalid).toEqual([]);
  });

  test('ignores surrounding whitespace around a card type', () => {
    const { twitter } = validateSocialMediaMetadata(fieldsWithCard(' summary\n'));
    expect(twitter.status).toBe('pass');
    expect(twitter.requiredPresent).toContain('twitter:card');
  });

  test.each(['banana', 'Summary', 'SUMMARY_LARGE_IMAGE', 'summary large image', 'summary,app'])(
    'fails and reports "%s" as invalid',
    (card) => {
      const { twitter } = validateSocialMediaMetadata(fieldsWithCard(card));
      expect(twitter.status).toBe('fail');
      expect(twitter.requiredInvalid).toEqual([{ field: 'twitter:card', value: card, allowed }]);
      expect(twitter.requiredPresent).not.toContain('twitter:card');
      expect(twitter.requiredMissing).toEqual([]);
    }
  );

  test('reports an invalid value without its surrounding whitespace', () => {
    const { twitter } = validateSocialMediaMetadata(fieldsWithCard('  banana  '));
    expect(twitter.requiredInvalid[0].value).toBe('banana');
  });

  test('treats a blank card type as missing, not invalid', () => {
    const { twitter } = validateSocialMediaMetadata(fieldsWithCard('   '));
    expect(twitter.status).toBe('fail');
    expect(twitter.requiredMissing).toEqual(['twitter:card']);
    expect(twitter.requiredInvalid).toEqual([]);
  });

  test('returns an empty requiredInvalid list for platforms without value rules', () => {
    const result = validateSocialMediaMetadata(fieldsWithCard('banana'));
    expect(result.linkedin.requiredInvalid).toEqual([]);
    expect(result.facebook.requiredInvalid).toEqual([]);
  });
});
