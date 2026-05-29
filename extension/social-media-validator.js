/*
 * SEO Meta Inspector — Chrome extension for inspecting page SEO metadata.
 * Copyright (C) 2026 David Campillo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
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
