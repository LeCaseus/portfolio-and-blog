const theme_storage_key = 'cv.theme';

export function get_preferred_theme() {
  const stored_theme = localStorage.getItem(theme_storage_key);
  if (stored_theme) return stored_theme;
  const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefers_dark ? 'dark' : 'light';
}

export function apply_theme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(theme_storage_key, theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.textContent = theme === 'dark' ? '☼ LIGHT' : '☾ DARK';
  });
}

export function init_theme_toggle() {
  const initial_theme = get_preferred_theme();
  document.documentElement.setAttribute('data-theme', initial_theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.textContent = initial_theme === 'dark' ? '☼ LIGHT' : '☾ DARK';
    button.addEventListener('click', () => {
      const current_theme = document.documentElement.getAttribute('data-theme');
      apply_theme(current_theme === 'dark' ? 'light' : 'dark');
    });
  });
}

export function start_clock() {
  const pad = number => String(number).padStart(2, '0');
  const tick = () => {
    const now = new Date();
    const formatted = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
    document.querySelectorAll('[data-clock]').forEach(el => el.textContent = formatted);
  };
  tick();
  setInterval(tick, 1000);
}

export function format_post_date(iso_string, include_time = false) {
  const date = new Date(iso_string);
  const date_part = date
    .toLocaleDateString('en-GB', {
      timeZone: 'Pacific/Auckland'
    })
    .replace(/\//g, '-');

  if (!include_time) return date_part;

  const time_part = date.toLocaleTimeString('en-GB', {
    timeZone: 'Pacific/Auckland',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${date_part} ${time_part}`;
}

export function escape_html(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}
