import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, init_typewriter, init_scroll_reveal, init_specimen_viewers, format_relative_time, escape_html } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();
init_typewriter();
init_scroll_reveal();

async function load_guestbook_teaser() {
  const rows_el = document.querySelector('[data-gb-tui-rows]');
  const count_el = document.querySelector('[data-gb-count]');
  const gauge_fill_el = document.querySelector('[data-gb-gauge-fill]');
  if (!rows_el) return;

  try {
    const entries = await fetch('/api/guestbook').then(response => response.json());
    const recent_entries = entries.slice(0, 6);

    count_el.textContent = String(entries.length).padStart(2, '0');
    gauge_fill_el.style.width = `${Math.min(100, (entries.length / 10) * 100)}%`;

    rows_el.innerHTML = recent_entries.length
      ? recent_entries.map((entry, index) => `
          <li class="gb-tui-row">
            <span class="gb-tui-idx">${String(index + 1).padStart(2, '0')}</span>
            <span class="gb-tui-name">${entry.name?.trim() ? escape_html(entry.name.trim()) : 'anonymous'}</span>
            <span class="gb-tui-msg">${escape_html(entry.message)}</span>
          </li>
        `).join('')
      : '<li class="gb-tui-empty">// no entries yet — be the first.</li>';
  } catch {
    count_el.textContent = '—';
    rows_el.innerHTML = '<li class="gb-tui-empty">// couldn\'t load entries.</li>';
  }
}

async function load_notes() {
  const log_el = document.querySelector('.notes .log');
  if (!log_el) return;

  const page_size = 5;
  let page = 0;

  const data_el = document.querySelector('[data-notes-json]');
  let notes = [];
  try {
    notes = data_el ? JSON.parse(data_el.textContent) : [];
  } catch (error) {
    console.error('[notes] parse failed:', error);
    return;
  }

  const count_el = log_el.querySelector('[data-note-count]');
  if (count_el) count_el.textContent = String(notes.length).padStart(3, '0');

  const entries_wrap = document.createElement('div');
  entries_wrap.className = 'log-entries';
  log_el.querySelector('.log-bar').insertAdjacentElement('afterend', entries_wrap);

  const range_el = log_el.querySelector('[data-page-range]');
  const total_el = log_el.querySelector('[data-page-total]');
  const prev_button = log_el.querySelector('[data-log-prev]');
  const next_button = log_el.querySelector('[data-log-next]');
  const total_pages = Math.max(1, Math.ceil(notes.length / page_size));

  const render_entry = note => {
    const tags_html = note.tags?.length
      ? `<div class="tags">${note.tags.map(tag => `<span>${escape_html(tag)}</span>`).join('')}</div>`
      : '';
    return `
      <div class="entry-row">
        <div class="ts" title="${escape_html(note.ts)}">${format_relative_time(note.iso)}</div>
        <div class="lvl" data-lvl="${escape_html(note.lvl)}">${escape_html(note.lvl)}</div>
        <div class="msg">
          <p class="msg-text">${escape_html(note.msg)}</p>
          ${tags_html}
        </div>
      </div>
    `;
  };

  const render_page = () => {
    const start = page * page_size;
    const page_notes = notes.slice(start, start + page_size);

    entries_wrap.innerHTML = page_notes.map(render_entry).join('');

    range_el.textContent = notes.length ? `${start + 1}–${Math.min(start + page_size, notes.length)}` : '0';
    total_el.textContent = notes.length;
    prev_button.disabled = page === 0;
    next_button.disabled = page >= total_pages - 1;
  };

  prev_button.addEventListener('click', () => { if (page > 0) { page--; render_page(); } });
  next_button.addEventListener('click', () => { if (page < total_pages - 1) { page++; render_page(); } });

  render_page();
}

init_specimen_viewers('/assets/exploded-skull.glb', true);

load_guestbook_teaser();
load_notes();
