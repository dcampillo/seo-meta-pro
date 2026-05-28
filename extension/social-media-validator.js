function extractSocialMediaMetadata() {
  const extractField = (property, name) => {
    const el = document.querySelector(`meta[property="${property}"], meta[name="${name}"]`);
    return el ? el.getAttribute('content') || '' : '';
  };

  const extractByProperty = (property) => {
    const el = document.querySelector(`meta[property="${property}"]`);
    return el ? el.getAttribute('content') || '' : '';
  };

  const fields = {
    'og:title': extractField('og:title', 'og:title') || document.title || '',
    'og:description': extractField('og:description', 'og:description'),
    'og:image': extractField('og:image', 'og:image'),
    'og:url': extractField('og:url', 'og:url'),
    'og:type': extractByProperty('og:type'),
    'twitter:card': extractField('twitter:card', 'twitter:card'),
    'twitter:title': extractField('twitter:title', 'twitter:title'),
    'twitter:description': extractField('twitter:description', 'twitter:description'),
    'twitter:image': extractField('twitter:image', 'twitter:image'),
  };

  // Normalize og:image URL to absolute
  if (fields['og:image']) {
    try {
      const url = new URL(fields['og:image'], window.location.href);
      fields['og:image'] = url.href;
    } catch {
      // Keep original if URL construction fails
    }
  }

  return fields;
}

function validateSocialMediaMetadata(fields) {
  const platformRequirements = {
    linkedin: {
      required: ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'],
    },
    twitter: {
      required: ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'],
    },
    facebook: {
      required: ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'],
    },
  };

  const results = {};

  Object.entries(platformRequirements).forEach(([platform, requirements]) => {
    const requiredMissing = requirements.required.filter(field => !fields[field]);

    results[platform] = {
      platform,
      status: requiredMissing.length > 0 ? 'fail' : 'pass',
      requiredMissing,
      requiredPresent: requirements.required.filter(field => fields[field]),
    };
  });

  return results;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractSocialMediaMetadata, validateSocialMediaMetadata };
}
