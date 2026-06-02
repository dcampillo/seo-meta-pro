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

const GROUP_ORDER = ['General', 'Open Graph', 'Twitter Card', 'Facebook', 'Property', 'HTTP Equiv', 'Other'];

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function extractData(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractMeta,
  });
  return result;
}

// extractMeta is defined in meta-extractor.js (loaded before this script)
// and injected into the page via chrome.scripting.executeScript above.

function charFeedback(len, { warnMin, warnMax, errMin, errMax } = {}) {
  let cls = '';
  if (errMin != null && len < errMin) cls = 'error';
  else if (errMax != null && len > errMax) cls = 'error';
  else if (warnMin != null && len < warnMin) cls = 'warn';
  else if (warnMax != null && len > warnMax) cls = 'warn';
  return `<span class="char-count ${cls}">${len} characters</span>`;
}

function heroRow(label, value, charOpts, link = false) {
  const isEmpty = !value;
  const display = isEmpty ? 'Not set' : value;
  const cls = isEmpty ? 'hero-value empty' : 'hero-value';
  const count = charOpts && !isEmpty ? charFeedback(value.length, charOpts) : '';
  const inner = link && !isEmpty
    ? `<a href="${escHtml(value)}" target="_blank" rel="noopener noreferrer">${escHtml(display)}</a>`
    : escHtml(display);
  return `
    <div class="hero-row">
      <span class="hero-label">${label}</span>
      <span class="${cls}">${inner}</span>
      ${count}
    </div>`;
}

async function checkCors(url) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    return { ok: response.ok, corsBlocked: false };
  } catch (err) {
    if (err.name === 'TypeError') {
      return { ok: false, corsBlocked: true };
    }
    return { ok: false, corsBlocked: false };
  }
}

function thumbnailRow(label, ogImageUrl) {
  const isEmpty = !ogImageUrl;

  if (isEmpty) {
    return `
      <div class="hero-row">
        <span class="hero-label">${label}</span>
        <div class="thumbnail-placeholder">No thumbnail found (og:image)</div>
      </div>`;
  }

  return `
    <div class="hero-row">
      <span class="hero-label">${label}</span>
      <div class="thumbnail-container" data-url="${escHtml(ogImageUrl)}">
        <img class="thumbnail-image" src="${escHtml(ogImageUrl)}" alt="og:image thumbnail" loading="lazy" />
      </div>
    </div>`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderValidationCard(validation) {
  const { platform, status, requiredPresent, requiredFallback = [], requiredMissing } = validation;
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  const statusIcon = status === 'pass' ? '✓' : '⚠';
  const statusText = status === 'pass' ? 'Pass' : 'Fail';

  let fieldListHtml = '';

  if (requiredPresent.length > 0) {
    fieldListHtml += '<div class="field-section-title">Required (Present)</div>';
    requiredPresent.forEach(field => {
      fieldListHtml += `<div class="field-item present"><span class="field-item-icon">✓</span>${escHtml(field)}</div>`;
    });
  }

  if (requiredFallback.length > 0) {
    fieldListHtml += '<div class="field-section-title">Required (Fallback)</div>';
    requiredFallback.forEach(({ field, via }) => {
      fieldListHtml += `<div class="field-item fallback"><span class="field-item-icon">↻</span>${escHtml(field)} <span class="field-item-via">← ${escHtml(via)}</span></div>`;
    });
  }

  if (requiredMissing.length > 0) {
    fieldListHtml += '<div class="field-section-title">Required (Missing)</div>';
    requiredMissing.forEach(field => {
      fieldListHtml += `<div class="field-item missing"><span class="field-item-icon">✗</span>${escHtml(field)}</div>`;
    });
  }

  return `
    <div class="validation-card ${status}">
      <div class="card-header">
        <div class="card-title-section">
          <span class="card-status-icon">${statusIcon}</span>
          <span class="card-title">${platformLabel}</span>
        </div>
        <span class="card-status-badge ${status}">${statusText}</span>
      </div>
      <div class="card-body">
        ${fieldListHtml}
      </div>
    </div>`;
}

function renderSocialMediaTab(validations) {
  let html = '<div class="validation-cards">';
  ['linkedin', 'twitter', 'facebook'].forEach(platform => {
    html += renderValidationCard(validations[platform]);
  });
  html += '</div>';
  return html;
}

function isUrl(str) {
  try { const u = new URL(str); return u.protocol === 'https:' || u.protocol === 'http:'; }
  catch { return false; }
}

function renderGroup(name, entries, collapsed = false) {
  const rows = [...entries].sort((a, b) => a.key.localeCompare(b.key)).map(({ key, value }) => {
    const isEmpty = !value;
    const display = isEmpty ? 'empty' : value;
    const inner = !isEmpty && isUrl(value)
      ? `<a href="${escHtml(value)}" target="_blank" rel="noopener noreferrer">${escHtml(value)}</a>`
      : escHtml(display);
    return `
      <div class="meta-row">
        <span class="meta-key">${escHtml(key)}</span>
        <span class="meta-value ${isEmpty ? 'empty' : ''}">${inner}</span>
      </div>`;
  }).join('');

  const collapsedClass = collapsed ? ' collapsed' : '';
  return `
    <div class="group${collapsedClass}">
      <div class="group-header" role="button">
        <span class="group-title">${escHtml(name)}</span>
        <span>
          <span class="group-badge">${entries.length}</span>
          <span class="chevron">▾</span>
        </span>
      </div>
      <div class="group-body">${rows}</div>
    </div>`;
}

function render(data) {
  const main = document.getElementById('content');

  let html = '<div class="hero">';
  html += heroRow('Title', data.title, { warnMin: 30, warnMax: 60, errMax: 80 });
  html += heroRow('Description', data.metaDescription, { warnMin: 70, warnMax: 160, errMax: 320 });
  html += heroRow('URL', data.url, null, true);
  html += heroRow('Lang', data.lang);
  html += thumbnailRow('Thumbnail', data.ogImage);
  html += '</div>';

  const order = ['General','Elastic Search','Open Graph','Twitter Card','Facebook','Property','HTTP Equiv'];
  order.forEach(name => {
    const entries = data.groups[name];
    if (entries && entries.length) {
      html += renderGroup(name, entries, !['General','Elastic Search','Open Graph'].includes(name));
    }
  });

  // Catch any groups not in the predefined order
  Object.keys(data.groups).forEach(name => {
    if (!order.includes(name) && data.groups[name].length) {
      html += renderGroup(name, data.groups[name], true);
    }
  });

  main.innerHTML = html;

  // Collapse toggle
  main.querySelectorAll('.group-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.group').classList.toggle('collapsed');
    });
  });

  // Handle thumbnail image interactions
  main.querySelectorAll('.thumbnail-container').forEach(container => {
    const url = container.getAttribute('data-url');
    const img = container.querySelector('img');

    img.addEventListener('load', () => {
      container.classList.add('loaded');
      container.classList.remove('error');
    });

    img.addEventListener('error', () => {
      container.classList.add('error');
      const placeholder = document.createElement('div');
      placeholder.className = 'thumbnail-placeholder';
      placeholder.textContent = '⚠ Broken image';
      img.replaceWith(placeholder);
    });

    container.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    checkCors(url).then(result => {
      if (result.corsBlocked) {
        const placeholder = document.createElement('div');
        placeholder.className = 'thumbnail-placeholder';
        placeholder.textContent = 'Image blocked by CORS';
        container.classList.add('error');
        img.replaceWith(placeholder);
      }
    });
  });
}

let currentData = null;
let currentValidations = null;

function switchTab(tabName) {
  const main = document.getElementById('content');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'meta-tags') {
    render(currentData);
  } else if (tabName === 'social-media') {
    main.innerHTML = renderSocialMediaTab(currentValidations);
    setupCardToggle();
  }
}

function setSocialMediaCue(validations) {
  const tab = document.querySelector('[data-tab="social-media"]');
  if (!tab || !validations) return;
  const allPass = ['linkedin', 'twitter', 'facebook']
    .every(p => validations[p] && validations[p].status === 'pass');
  tab.title = allPass ? 'All platforms compliant' : 'Some platforms need attention';
  const cue = document.createElement('span');
  cue.className = `tab-cue ${allPass ? 'pass' : 'fail'}`;
  cue.textContent = allPass ? '✓' : '⚠';
  tab.appendChild(cue);
}

function setupCardToggle() {
  document.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      body.classList.toggle('hidden');
    });
  });
}

async function init() {
  const main = document.getElementById('content');
  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error('No active tab found.');

    const data = await extractData(tab.id);
    data.url = tab.url || '';
    currentData = data;

    // Extract and validate social media metadata
    const socialMediaData = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractSocialMediaMetadata,
    });
    const fields = socialMediaData[0].result;
    currentValidations = validateSocialMediaMetadata(fields);

    render(data);
    setSocialMediaCue(currentValidations);

    // Setup tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => switchTab(e.currentTarget.getAttribute('data-tab')));
    });

    document.getElementById('copy-all').addEventListener('click', async (e) => {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      e.target.textContent = 'Copied!';
      e.target.classList.add('copied');
      setTimeout(() => { e.target.textContent = 'Copy JSON'; e.target.classList.remove('copied'); }, 1500);
    });
  } catch (err) {
    main.innerHTML = `<p class="error">Error: ${escHtml(err.message)}</p>`;
  }
}

function renderFooter() {
  const { version } = chrome.runtime.getManifest();
  const footer = document.getElementById('footer');
  footer.innerHTML += `<span>v${escHtml(version)}</span>`;
}

document.addEventListener('DOMContentLoaded', () => { renderFooter(); init(); });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkCors, thumbnailRow };
}
