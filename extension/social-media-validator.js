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

  // Normalize og:image URL to absolute. A valid URL has no raw whitespace; if it does,
  // leave the author's value untouched rather than percent-encoding it into a bogus URL.
  if (fields['og:image'] && !/\s/.test(fields['og:image'])) {
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
