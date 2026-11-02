 import { escape_html } from '/shared.js';
import {
  fetchMessages,
  formatEntryDate,
  initCharCounter,
  initMessageForm,
  parseServerTimestamp,
  renderEntry
} from '/messages.js';

const mentionVerbs = {
  reply: 'replied',
  like: 'liked this',
  repost: 'reposted',
  mention: 'mentioned this'
};

async function fetchWebmentions(targetUrl) {
  const response = await fetch(`/api/webmentions?target=${encodeURIComponent(targetUrl)}`);
  if (!response.ok) throw new Error('webmentions request failed');
  return response.json();
}

function asHttpUrl(candidateUrl) {
  return /^https?:\/\//i.test(candidateUrl || '') ? candidateUrl : null;
}

function displayHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function renderMention(mention) {
  const authorName = escape_html(mention.author_name?.trim() || 'someone');
  const authorUrl = asHttpUrl(mention.author_url);
  const sourceUrl = asHttpUrl(mention.source);

  const authorHtml = authorUrl
    ? `<a href="${escape_html(authorUrl)}" target="_blank" rel="nofollow ugc noopener">${authorName}</a>`
    : authorName;
  const sourceHtml = sourceUrl
    ? `<span class="gb-entry-site"><a href="${escape_html(sourceUrl)}" target="_blank" rel="nofollow ugc noopener">${escape_html(displayHost(sourceUrl))}</a></span>`
    : '';
  const contentHtml = mention.content
    ? `<p class="gb-entry-msg">${escape_html(mention.content)}</p>`
    : '';
  const verb = mentionVerbs[mention.type] || mentionVerbs.mention;

  return `
    <li class="gb-entry">
      <div class="gb-entry-head">
        <span class="gb-entry-name">${authorHtml}</span>
        <span class="gb-entry-kind">↗ ${verb}</span>
        ${sourceHtml}
        <span class="gb-entry-date">${formatEntryDate(mention.created_at)}</span>
      </div>
      ${contentHtml}
    </li>
  `;
}

async function loadDiscussion({ page, targetUrl, listElement, entryCountElement }) {
  const [messagesResult, mentionsResult] = await Promise.allSettled([
    fetchMessages(page),
    fetchWebmentions(targetUrl)
  ]);

  if (messagesResult.status === 'rejected' && mentionsResult.status === 'rejected') {
    entryCountElement.textContent = '—';
    listElement.innerHTML = '<li class="doc-empty">couldn\'t load comments, refresh to try again.</li>';
    return;
  }

  const messages = messagesResult.status === 'fulfilled' ? messagesResult.value : [];
  const mentions = mentionsResult.status === 'fulfilled' ? mentionsResult.value : [];

  const items = [
    ...messages.map(message => ({ createdAt: parseServerTimestamp(message.created_at), html: renderEntry(message) })),
    ...mentions.map(mention => ({ createdAt: parseServerTimestamp(mention.created_at), html: renderMention(mention) }))
  ].sort((first, second) => second.createdAt - first.createdAt);

  entryCountElement.textContent = items.length;
  listElement.innerHTML = items.length
    ? items.map(item => item.html).join('')
    : '<li class="doc-empty">no comments yet.</li>';
}

function initComments() {
  const commentsSection = document.querySelector('[data-comments]');
  if (!commentsSection) return;

  const page = commentsSection.dataset.page;
  const form = commentsSection.querySelector('[data-comments-form]');
  const charCountElement = commentsSection.querySelector('[data-comments-char-count]');

  initCharCounter(form.elements.message, charCountElement);

  initMessageForm({
    page,
    form,
    submitButton: commentsSection.querySelector('[data-comments-submit]'),
    statusElement: commentsSection.querySelector('[data-comments-status]'),
    charCountElement,
    successText: 'sent, pending approval. thanks for reading.'
  });

  loadDiscussion({
    page,
    targetUrl: commentsSection.dataset.targetUrl,
    listElement: commentsSection.querySelector('[data-comments-list]'),
    entryCountElement: commentsSection.querySelector('[data-comments-entry-count]')
  });
}

initComments();
