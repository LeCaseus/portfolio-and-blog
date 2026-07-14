import { init_theme_toggle, start_clock, format_post_date } from './shared.js';

init_theme_toggle();
start_clock();

function init_hero_ecg() {
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

  let intensity = 1;
  let pointer_inside = false;
  let stress_until = 0;
  let scroll_energy = 0;
  let last_scroll_y = window.scrollY;
  let last_scroll_time = performance.now();
  let points = [];
  let cursor_x = 0;
  let scroll_offset = 0;
  let last_frame_time = performance.now();

  const heartbeat_offsets = intensity_factor => [
    [10, 0], [4, -2 * intensity_factor], [6, 2 * intensity_factor], [4, 0],
    [10, 0],
    [3, -4 * intensity_factor], [3, 14 * intensity_factor], [3, -42 * intensity_factor], [3, 32 * intensity_factor], [3, -4 * intensity_factor],
    [10, 0],
    [6, -2 * intensity_factor], [10, 6 * intensity_factor], [6, -4 * intensity_factor],
    [Math.max(8, 40 / Math.max(1, intensity_factor)), 0],
  ];

  const add_heartbeat = () => {
    let x = cursor_x;
    let y = baseline_y;
    for (const [delta_x, delta_y] of heartbeat_offsets(intensity)) {
      x += delta_x;
      y += delta_y;
      points.push([x, y]);
    }
    cursor_x = x + Math.random() * 14 / Math.max(1, intensity);
  };
  while (cursor_x < width * 1.2) add_heartbeat();

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
    while (cursor_x - scroll_offset < width * 1.2) add_heartbeat();

    draw_path();
    requestAnimationFrame(animate);
  };

  window.addEventListener('scroll', () => {
    const now = performance.now();
    const distance = Math.abs(window.scrollY - last_scroll_y);
    const elapsed = Math.max(16, now - last_scroll_time);
    scroll_energy = Math.min(120, scroll_energy * 0.6 + (distance / elapsed) * 60);
    last_scroll_y = window.scrollY;
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

function init_typewriter() {
  const typewriter_el = document.querySelector('[data-typewriter]');
  if (!typewriter_el) return;

  const lines = JSON.parse(typewriter_el.getAttribute('data-typewriter'));
  const cursor_html = '<span class="cursor"></span>';
  let line_index = 0;
  let char_index = 0;
  let mode = 'typing';
  let hold_ticks = 0;

  const tick = () => {
    const current_line = lines[line_index];

    if (mode === 'typing') {
      char_index++;
      if (char_index > current_line.length) { mode = 'holding'; hold_ticks = 38; }
    } else if (mode === 'holding') {
      hold_ticks--;
      if (hold_ticks <= 0) mode = 'erasing';
    } else if (mode === 'erasing') {
      char_index--;
      if (char_index <= 0) { mode = 'typing'; line_index = (line_index + 1) % lines.length; }
    }

    typewriter_el.innerHTML = current_line.slice(0, char_index) + cursor_html;

    const delay = mode === 'typing' ? 32 + Math.random() * 30
      : mode === 'erasing' ? 14
      : 60;
    setTimeout(tick, delay);
  };

  tick();
}

function init_scroll_reveal() {
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

function init_rail_highlight() {
  const rail_links = document.querySelectorAll('.rail a');
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length) return;

  const set_active_link = active_id => {
    rail_links.forEach(link => link.classList.toggle('on', link.getAttribute('href') === '#' + active_id));
  };

  const currently_crossing_line = new Set();

  const highlight_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) currently_crossing_line.add(entry.target.id);
      else currently_crossing_line.delete(entry.target.id);
    });

    const active_section = [...sections].find(section => currently_crossing_line.has(section.id));
    if (active_section) set_active_link(active_section.id);
  }, { rootMargin: '-35% 0px -65% 0px', threshold: 0 });

  sections.forEach(section => highlight_observer.observe(section));
  set_active_link(sections[0].id);
}

async function load_readings() {
  const strip_el = document.querySelector('.readings .strip');
  if (!strip_el) return;

  try {
    const posts = await fetch('/api/posts').then(response => response.json());
    const sorted_posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent_posts = sorted_posts.slice(0,5);
    strip_el.innerHTML = recent_posts.map(post => `
      <a class="read" href="/blog/${post.slug}">
        <span class="date">${format_post_date(post.date)}</span>
        <span class="tag">${post.tags}</span>
        <span class="ttl">${post.title}</span>
        <span class="arrow">↗</span>
      </a>
    `).join('');
  } catch {
    strip_el.innerHTML = '<div class="note">// no readings found.</div>';
  }
}

async function load_notes() {
  const log_el = document.querySelector('.notes .log');
  if (!log_el) return;

  const page_size = 5;
  let notes = [];
  let page = 0;

  try {
    notes = await fetch('/api/notes').then(response => response.json());
  } catch (error) {
    console.error('[notes] load failed:', error);
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
      ? `<div class="tags">${note.tags.map(tag => `<span>${tag}</span>`).join('')}</div>`
      : '';
    const message_html = typeof marked !== 'undefined' ? marked.parseInline(note.msg) : note.msg;
    return `
      <div class="entry-row">
        <div class="ts">${note.ts}</div>
        <div class="lvl" data-lvl="${note.lvl}">${note.label}</div>
        <div class="msg">${message_html}${tags_html}</div>
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

init_hero_ecg();
init_typewriter();
init_scroll_reveal();
init_rail_highlight();
load_readings();
load_notes();
