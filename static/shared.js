const theme_storage_key = 'cv.theme';

export function init_typewriter() {
  const typewriter_el = document.querySelector('[data-typewriter]');
  if (!typewriter_el) return;

  const lines = JSON.parse(typewriter_el.getAttribute('data-typewriter'));

  const text_node = document.createTextNode('');
  const cursor = document.createElement('span');

  cursor.className = 'cursor';

  typewriter_el.innerHTML = '';
  typewriter_el.appendChild(text_node);
  typewriter_el.appendChild(cursor);

  let line_index = 0;
  let char_index = 0;
  let mode = 'typing';
  let hold_ticks = 0;

  const tick = () => {
    const current_line = lines[line_index];

    if (mode === 'typing') {
      char_index++;

      if (char_index > current_line.length) {
        mode = 'holding';
        hold_ticks = 38;
      }
    } else if (mode === 'holding') {
      hold_ticks--;

      if (hold_ticks <= 0) {
        mode = 'erasing';
      }
    } else if (mode === 'erasing') {
      char_index--;

      if (char_index <= 0) {
        mode = 'typing';
        line_index = (line_index + 1) % lines.length;
      }
    }

    text_node.nodeValue = current_line.slice(0, char_index);

    const delay =
      mode === 'typing' ? 32 + Math.random() * 30 :
      mode === 'erasing' ? 14 :
      60;

    setTimeout(tick, delay);
  };

  tick();
}

export function init_scroll_reveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

export function init_hero_ecg() {
  const ecg_svg = document.querySelector('.ecg svg');
  const ecg_wrap = document.querySelector('.ecg');
  const bpm_el = document.querySelector('[data-bpm]');
  if (!ecg_svg) return;

  const width = 1200;
  const height = 96;
  const baseline_y = height * 0.55;
  const base_speed = 80;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ecg_svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  ecg_svg.setAttribute('preserveAspectRatio', 'none');
  ecg_svg.appendChild(path);

  const scroll_container = document.querySelector('.app-main') || window;
  const get_scroll_position = () =>
    scroll_container === window ? window.scrollY : scroll_container.scrollTop;

  let intensity = 1;
  let pointer_inside = false;
  let stress_until = 0;
  let scroll_energy = 0;
  let last_scroll_y = get_scroll_position();
  let last_scroll_time = performance.now();
  let points = [];
  let cursor_x = 0;
  let scroll_offset = 0;
  let last_frame_time = performance.now();

  let ecg_samples = null;
  let ecg_cursor_index = 0;

  const add_ecg_sample = () => {
    if (!ecg_samples) return;
    const pixels_per_sample = 2.2 / Math.min(1.6, intensity);
    const y = baseline_y - ecg_samples[ecg_cursor_index] * 30 * Math.min(1.6, intensity);
    points.push([cursor_x, y]);
    cursor_x += pixels_per_sample;
    ecg_cursor_index = (ecg_cursor_index + 1) % ecg_samples.length;
  };

  fetch('/assets/ecg_waveform/ecg_loop.json')
    .then(response => response.json())
    .then(data => {
      ecg_samples = data.samples;
      while (cursor_x < width * 1.2) add_ecg_sample();
    })
    .catch(() => {});

  const draw_path = () => {
    let d = '';
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      d += (i === 0 ? 'M' : 'L') + (x - scroll_offset).toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    path.setAttribute('d', d);
  };

  const animate = time => {
    const delta_seconds = (time - last_frame_time) / 1000;
    last_frame_time = time;

    const target_intensity =
      performance.now() < stress_until ? 2.4 :
      pointer_inside ? 1.6 :
      1 + Math.min(1.2, scroll_energy * 0.012);
    intensity += (target_intensity - intensity) * Math.min(1, delta_seconds * 4);
    scroll_energy *= Math.max(0, 1 - delta_seconds * 2.2);

    const speed_multiplier = 1 + (intensity - 1) * 0.6;
    scroll_offset += base_speed * speed_multiplier * delta_seconds;

    while (points.length > 4 && points[1][0] - scroll_offset < -20) points.shift();
    while (ecg_samples && cursor_x - scroll_offset < width * 1.2) add_ecg_sample();

    draw_path();
    requestAnimationFrame(animate);
  };

  scroll_container.addEventListener('scroll', () => {
    const now = performance.now();
    const current_scroll_y = get_scroll_position();
    const distance = Math.abs(current_scroll_y - last_scroll_y);
    const elapsed = Math.max(16, now - last_scroll_time);
    scroll_energy = Math.min(120, scroll_energy * 0.6 + (distance / elapsed) * 60);
    last_scroll_y = current_scroll_y;
    last_scroll_time = now;
  }, { passive: true });

  if (ecg_wrap) {
    ecg_wrap.addEventListener('pointerenter', () => { pointer_inside = true; });
    ecg_wrap.addEventListener('pointerleave', () => { pointer_inside = false; });
    ecg_wrap.addEventListener('pointerdown', () => { stress_until = performance.now() + 900; });
    ecg_wrap.addEventListener('touchstart', () => {
      pointer_inside = true;
      stress_until = performance.now() + 900;
    }, { passive: true });
    ecg_wrap.addEventListener('touchend', () => { pointer_inside = false; });
  }

  requestAnimationFrame(animate);

  if (bpm_el) {
    const update_bpm = () => {
      const base_bpm = 64 + (intensity - 1) * 42;
      const wobble = Math.sin(Date.now() / 4200) * 3 + Math.random() * 2;
      bpm_el.textContent = Math.max(58, Math.min(168, Math.round(base_bpm + wobble)));
    };
    update_bpm();
    setInterval(update_bpm, 700);
  }
}

export function get_preferred_theme() {
  const stored_theme = localStorage.getItem(theme_storage_key);
  if (stored_theme) return stored_theme;
  const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefers_dark ? 'dark' : 'light';
}

export function apply_theme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(theme_storage_key, theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(checkbox => {
    checkbox.checked = theme === 'dark';
  });
}

export function init_theme_toggle() {
  const initial_theme = get_preferred_theme();
  document.documentElement.setAttribute('data-theme', initial_theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(checkbox => {
    checkbox.checked = initial_theme === 'dark';
    checkbox.addEventListener('change', () => {
      apply_theme(checkbox.checked ? 'dark' : 'light');
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

export function init_mobile_nav() {
  const toggle = document.getElementById('mobile-nav-check');
  if (!toggle) return;
  document.querySelectorAll('.nav-col .nav-chip').forEach(link => {
    link.addEventListener('click', () => { toggle.checked = false; });
  });
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

export function format_relative_time(iso_string) {
  const then = new Date(iso_string).getTime();
  const diff_seconds = Math.floor((Date.now() - then) / 1000);

  if (diff_seconds < 60) return 'just now';
  const diff_minutes = Math.floor(diff_seconds / 60);
  if (diff_minutes < 60) return `${diff_minutes}m ago`;
  const diff_hours = Math.floor(diff_minutes / 60);
  if (diff_hours < 24) return `${diff_hours}h ago`;
  const diff_days = Math.floor(diff_hours / 24);
  if (diff_days < 7) return `${diff_days}d ago`;

  return new Date(iso_string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function escape_html(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

export async function fetch_feed_posts(feed_url = '/feed.xml') {
  const response = await fetch(feed_url);
  const xml_text = await response.text();
  const doc = new DOMParser().parseFromString(xml_text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('feed parse failed');

  return [...doc.querySelectorAll('item')].map(item => ({
    title: item.querySelector('title')?.textContent ?? '',
    link: item.querySelector('link')?.textContent ?? '',
    date: item.querySelector('pubDate')?.textContent ?? '',
    summary: item.querySelector('description')?.textContent ?? '',
    tags: [...item.querySelectorAll('category')].map(node => node.textContent),
  }));
}
