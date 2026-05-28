function extractSocialMediaMetadata() {
  const extractField = (property, name) => {
    const el = document.querySelector(`meta[property="${property}"], meta[name="${name}"]`);
    return el ? el.getAttribute('content') || '' : '';
  };

  const fields = {
    'og:title': extractField('og:title', 'og:title') || document.title || '',
    'og:description': extractField('og:description', 'og:description'),
    'og:image': extractField('og:image', 'og:image'),
    'og:url': extractField('og:url', 'og:url'),
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
      required: ['og:title', 'og:description', 'og:image'],
      optional: ['og:url'],
    },
    twitter: {
      required: ['twitter:card', 'twitter:title', 'twitter:description'],
      optional: ['twitter:image'],
    },
    facebook: {
      required: ['og:title', 'og:description', 'og:image'],
      optional: ['og:url'],
    },
  };

  const results = {};

  Object.entries(platformRequirements).forEach(([platform, requirements]) => {
    const requiredMissing = requirements.required.filter(field => !fields[field]);
    const optionalMissing = requirements.optional.filter(field => !fields[field]);

    let status;
    if (requiredMissing.length > 0) {
      status = 'fail';
    } else if (optionalMissing.length > 0) {
      status = 'warning';
    } else {
      status = 'pass';
    }

    results[platform] = {
      platform,
      status,
      requiredMissing,
      optionalMissing,
      requiredPresent: requirements.required.filter(field => fields[field]),
      optionalPresent: requirements.optional.filter(field => fields[field]),
    };
  });

  return results;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractSocialMediaMetadata, validateSocialMediaMetadata };
}
