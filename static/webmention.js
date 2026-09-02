import { escape_html } from '/shared.js';

function render_mention(mention) {
  const author_name = mention.author_name?.trim() || 'someone';
  const author_link = mention.author_url
    ? `<a href="${escape_html(mention.author_url)}" target="_blank" rel="nofollow ugc noopener">${escape_html(author_name)}</a>`
    : escape_html(author_name);
  const source_link = `<a href="${escape_html(mention.source)}" target="_blank" rel="nofollow ugc noopener">${escape_html(mention.source)}</a>`;
  const photo_html = mention.author_photo
    ? `<img class="webmention-avatar" src="${escape_html(mention.author_photo)}" alt="" loading="lazy" />`
    : '';

  const verb = { reply: 'replied', repost: 'reposted', like: 'liked', mention: 'mentioned this' }[mention.type] || 'mentioned this';
  const content_html = mention.content
    ? `<p class="webmention-content">${escape_html(mention.content)}</p>`
    : '';

  return `
    <li class="webmention-entry" data-type="${mention.type}">
      <div class="webmention-head">${photo_html}${author_link} ${verb} — ${source_link}</div>
      ${content_html}
    </li>
  `;
}

async function load_webmentions(target) {
  const list_el = document.querySelector('[data-webmention-list]');
  const count_el = document.querySelector('[data-webmention-count]');
  if (!list_el) return;

  try {
    const response = await fetch(`/api/webmentions?target=${encodeURIComponent(target)}`);
    const mentions = await response.json();
    if (count_el) count_el.textContent = mentions.length;
    list_el.innerHTML = mentions.length
      ? mentions.map(render_mention).join('')
      : '<li class="doc-empty">no webmentions yet.</li>';
  } catch {
    list_el.innerHTML = '<li class="doc-empty">couldn\'t load webmentions.</li>';
  }
}

function init_webmentions() {
  const container = document.querySelector('[data-webmention-target]');
  if (!container) return;
  load_webmentions(container.dataset.webmentionTarget);
}

init_webmentions();
