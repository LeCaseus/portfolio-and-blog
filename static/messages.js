import { escape_html } from '/shared.js';

const messagesEndpoint = '/api/messages';

export function parseServerTimestamp(serverTimestamp) {
  return new Date(`${serverTimestamp.replace(' ', 'T')}Z`);
}

export function formatEntryDate(serverTimestamp) {
  const date = parseServerTimestamp(serverTimestamp);
  if (Number.isNaN(date.getTime())) return serverTimestamp;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderWebsiteLink(website) {
  const trimmedWebsite = (website || '').trim();
  if (!/^https?:\/\//i.test(trimmedWebsite)) return '';
  const label = escape_html(trimmedWebsite.replace(/^https?:\/\//i, ''));
  return `<a href="${escape_html(trimmedWebsite)}" target="_blank" rel="nofollow ugc noopener">${label}</a>`;
}

export function renderEntry(entry) {
  const displayName = entry.name?.trim() ? escape_html(entry.name.trim()) : 'anonymous';
  const websiteHtml = renderWebsiteLink(entry.website);
  const replyHtml = entry.reply_message ? `
    <div class="gb-reply">
      <span class="gb-reply-label">↳ reply</span>
      <p>${escape_html(entry.reply_message)}</p>
    </div>` : '';

  return `
    <li class="gb-entry">
      <div class="gb-entry-head">
        <span class="gb-entry-name">${displayName}</span>
        ${websiteHtml ? `<span class="gb-entry-site">${websiteHtml}</span>` : ''}
        <span class="gb-entry-date">${formatEntryDate(entry.created_at)}</span>
      </div>
      <p class="gb-entry-msg">${escape_html(entry.message)}</p>
      ${replyHtml}
    </li>
  `;
}

export async function fetchMessages(page) {
  const response = await fetch(`${messagesEndpoint}?page=${encodeURIComponent(page)}`);
  if (!response.ok) throw new Error('messages request failed');
  return response.json();
}

export async function loadMessages({ page, listElement, entryCountElement, emptyText }) {
  try {
    const entries = await fetchMessages(page);

    if (entryCountElement) entryCountElement.textContent = entries.length;
    listElement.innerHTML = entries.length
      ? entries.map(renderEntry).join('')
      : `<li class="doc-empty">${emptyText}</li>`;
  } catch {
    if (entryCountElement) entryCountElement.textContent = '—';
    listElement.innerHTML = '<li class="doc-empty">couldn\'t load entries — refresh to try again.</li>';
  }
}

export function initCharCounter(textarea, charCountElement) {
  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    charCountElement.textContent = length;
    charCountElement.classList.toggle('gb-count-warn', length > 900);
  });
}

export function initMessageForm({ page, form, submitButton, statusElement, charCountElement, successText }) {
  const fieldValue = fieldName => form.elements[fieldName].value.trim();

  const setStatus = (text, kind) => {
    statusElement.textContent = text;
    statusElement.classList.remove('gb-status-ok', 'gb-status-err');
    if (kind) statusElement.classList.add(kind === 'ok' ? 'gb-status-ok' : 'gb-status-err');
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const message = fieldValue('message');
    if (!message) {
      setStatus('message can\'t be empty.', 'err');
      return;
    }

    const payload = {
      name: fieldValue('name') || undefined,
      website: fieldValue('website') || undefined,
      email: fieldValue('email') || undefined,
      message,
      page
    };

    submitButton.disabled = true;
    setStatus('sending…', null);

    try {
      const response = await fetch(messagesEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        setStatus('hourly limit reached — try again later.', 'err');
        return;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        setStatus(errorBody?.message || 'something didn\'t go through — try again.', 'err');
        return;
      }

      form.reset();
      charCountElement.textContent = '0';
      setStatus(successText, 'ok');
    } catch {
      setStatus('couldn\'t reach the server — try again in a bit.', 'err');
    } finally {
      submitButton.disabled = false;
    }
  });
}
