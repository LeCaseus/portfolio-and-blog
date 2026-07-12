import { init_theme_toggle, start_clock } from '/shared.js';

init_theme_toggle();
start_clock();

function escape_html(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function format_entry_date(iso_string) {
  const date = new Date(iso_string);
  if (Number.isNaN(date.getTime())) return iso_string;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function render_website_link(website) {
  const trimmed = (website || '').trim();
  if (!/^https?:\/\//i.test(trimmed)) return '';
  const label = escape_html(trimmed.replace(/^https?:\/\//i, ''));
  return `<a href="${escape_html(trimmed)}" target="_blank" rel="nofollow ugc noopener">${label}</a>`;
}

function render_entry(entry) {
  const display_name = entry.name?.trim() ? escape_html(entry.name.trim()) : 'anonymous';
  const website_html = render_website_link(entry.website);
  const reply_html = entry.reply_message ? `
    <div class="gb-reply">
      <span class="gb-reply-label">↳ reply</span>
      <p>${escape_html(entry.reply_message)}</p>
    </div>` : '';

  return `
    <li class="gb-entry">
      <div class="gb-entry-head">
        <span class="gb-entry-name">${display_name}</span>
        ${website_html ? `<span class="gb-entry-site">${website_html}</span>` : ''}
        <span class="gb-entry-date">${format_entry_date(entry.created_at)}</span>
      </div>
      <p class="gb-entry-msg">${escape_html(entry.message)}</p>
      ${reply_html}
    </li>
  `;
}

async function load_entries() {
  const list_el = document.querySelector('[data-gb-entries]');
  const count_el = document.querySelector('[data-gb-entry-count]');
  try {
    const response = await fetch('/api/guestbook');
    const entries = await response.json();
    count_el.textContent = entries.length;
    list_el.innerHTML = entries.length
      ? entries.map(render_entry).join('')
      : '<li class="gb-empty">no entries yet — be the first.</li>';
  } catch {
    count_el.textContent = '—';
    list_el.innerHTML = '<li class="gb-empty">couldn\'t load entries — refresh to try again.</li>';
  }
}

function init_char_counter() {
  const textarea = document.getElementById('gb-message');
  const count_el = document.querySelector('[data-gb-count]');
  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    count_el.textContent = length;
    count_el.classList.toggle('gb-count-warn', length > 900);
  });
}

function set_status(message, kind) {
  const status_el = document.querySelector('[data-gb-status]');
  status_el.textContent = message;
  status_el.classList.remove('gb-status-ok', 'gb-status-err');
  if (kind) status_el.classList.add(kind === 'ok' ? 'gb-status-ok' : 'gb-status-err');
}

function init_form() {
  const form = document.querySelector('[data-gb-form]');
  const submit_button = document.querySelector('[data-gb-submit]');

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const message = form.message.value.trim();
    if (!message) {
      set_status('message can\'t be empty.', 'err');
      return;
    }

    const payload = {
      name: form.name.value.trim() || undefined,
      website: form.website.value.trim() || undefined,
      email: form.email.value.trim() || undefined,
      message
    };

    submit_button.disabled = true;
    set_status('sending…', null);

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        set_status('hourly limit reached — try again later.', 'err');
        return;
      }

      if (!response.ok) {
        const error_body = await response.json().catch(() => null);
        set_status(error_body?.message || 'something didn\'t go through — try again.', 'err');
        return;
      }

      form.reset();
      document.querySelector('[data-gb-count]').textContent = '0';
      set_status('sent — pending approval, thanks for signing.', 'ok');
    } catch {
      set_status('couldn\'t reach the server — try again in a bit.', 'err');
    } finally {
      submit_button.disabled = false;
    }
  });
}

init_char_counter();
init_form();
load_entries();
