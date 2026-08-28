import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, escape_html } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();

function format_relative_time(ts) {
  const then = new Date(ts);
  if (Number.isNaN(then.getTime())) return ts;

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function count_words(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function render_note(note) {
  const message_html = typeof marked !== 'undefined' ? marked.parseInline(note.msg) : escape_html(note.msg);
  const tags_html = note.tags?.length
    ? `<div class="feed-card-tags">${note.tags.map(tag => `<span>${escape_html(tag)}</span>`).join('')}</div>`
    : '';

  return `
    <li class="feed-card">
      <div class="feed-card-head">
        <span class="feed-card-author">@chezter</span>
        <span class="feed-card-meta">
          <span class="lvl" data-lvl="${note.lvl}">${note.lvl}</span>
          <span class="feed-card-dot" aria-hidden="true">·</span>
          <span class="feed-card-time">${format_relative_time(note.ts)}</span>
          <span class="feed-card-dot" aria-hidden="true">·</span>
          <span class="feed-card-wc">${count_words(note.msg)} words</span>
        </span>
      </div>
      <div class="feed-card-body">${message_html}</div>
      ${tags_html}
    </li>
  `;
}

async function load_feed() {
  const list_el = document.querySelector('[data-feed-list]');
  const count_el = document.querySelector('[data-feed-count]');

  try {
    const notes = await fetch('/api/notes').then(response => response.json());
    count_el.textContent = notes.length;
    list_el.innerHTML = notes.length
      ? notes.map(render_note).join('')
      : '<li class="doc-empty">no transmissions yet.</li>';
  } catch {
    count_el.textContent = '—';
    list_el.innerHTML = '<li class="doc-empty">couldn\'t load the feed — refresh to try again.</li>';
  }
}

load_feed();
