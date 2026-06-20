import { init_theme_toggle, start_clock } from './shared.js';

init_theme_toggle();
start_clock();

async function load_posts() {
  const index = await fetch('/api/posts').then(response => response.json());
  return Promise.all(index.map(async post => {
    const body = await fetch(`/api/posts/${post.slug}`).then(response => response.text());
    return { ...post, body };
  }));
}

async function init_reaction_widget(slug) {
  const button = document.querySelector('[data-react-btn]');
  const count_el = document.querySelector('[data-react-count]');
  if (!button || !count_el) return;

  // const already_reacted = localStorage.getItem(`reacted:${slug}`) === 'true';
  // button.classList.toggle('reacted', already_reacted);
  // button.disabled = already_reacted;

  try {
    const response = await fetch(`/api/reactions/${slug}`);
    const data = await response.json();
    count_el.textContent = data.count;
    button.classList.toggle('reacted', data.reacted);
  } catch {
    count_el.textContent = '—';
  }

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      const response = await fetch(`/api/reactions/${slug}`, { method: 'POST' });
      const data = await response.json();
      count_el.textContent = data.count;
      button.classList.toggle('reacted', data.reacted);
      // localStorage.setItem(`reacted:${slug}`, 'true');
    } catch {
      // button.disabled = false;
    } finally {
      button.disabled = false;
    }
  });
}

const posts = await load_posts();
const post_by_slug = Object.fromEntries(posts.map(post => [post.slug, post]));

const list_el = document.querySelector('[data-list]');
const visible_count_el = document.querySelector('[data-visible-count]');
const reader_body_el = document.querySelector('[data-reader-body]');

let current_filter = 'all';
let current_search = '';
let current_slug = null;

function render_list() {
  const query = current_search.trim().toLowerCase();
  const filtered_posts = posts.filter(post => {
    if (current_filter !== 'all' && !post.tags.includes(current_filter)) return false;
    if (query && !(post.title.toLowerCase().includes(query) || post.summary.toLowerCase().includes(query))) return false;
    return true;
  });

  list_el.innerHTML = filtered_posts.map(post => `
    <li>
      <a class="entry ${post.slug === current_slug ? 'active' : ''}" href="#/${post.slug}" data-slug="${post.slug}">
        <div>
          <div class="meta-row"><span>${post.date}</span>${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
          <div class="ttl">${post.title}</div>
        </div>
        <div class="n">${String(posts.indexOf(post) + 1).padStart(2, '0')}</div>
      </a>
    </li>
  `).join('') || '<li class="empty">no entries</li>';

  visible_count_el.textContent = `${filtered_posts.length} / ${posts.length}`;
}

function render_post(slug) {
  const post = post_by_slug[slug] || posts[0];
  current_slug = post.slug;

  const post_index = posts.indexOf(post);
  const previous_post = post_index > 0 ? posts[post_index - 1] : null;
  const next_post = post_index < posts.length - 1 ? posts[post_index + 1] : null;

  reader_body_el.innerHTML = `
    <header class="header">
      <div class="meta">
        <span>${post.date}</span>
        <span class="dot"></span>
        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        <span class="dot"></span>
        <span>${post.readTime} read</span>
        <span class="dot"></span>
        <span>entry ${String(post_index + 1).padStart(2, '0')} / ${String(posts.length).padStart(2, '0')}</span>
      </div>
      <h1 class="post-title">${post.title}</h1>
      <p class="lede">${post.summary}</p>
    </header>
    <div class="prose-body">${marked.parse(post.body)}</div>
    <div class="reactions" data-reactions>
      <button class="react-btn" data-react-btn aria-label="React to this post">
        <span class="heart">♥</span>
        <span class="count" data-react-count>—</span>
      </button>
    </div>
    <div class="post-footer">
      <div class="prev">
        ${previous_post ? `<a href="#/${previous_post.slug}">
          <span class="label">← previous</span>
          <span class="ttl">${previous_post.title}</span>
        </a>` : ''}
      </div>
      <div class="next">
        ${next_post ? `<a href="#/${next_post.slug}">
          <span class="label">next →</span>
          <span class="ttl">${next_post.title}</span>
        </a>` : ''}
      </div>
    </div>
  `;

  render_list();
  document.getElementById('reader').scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  init_reaction_widget(post.slug);
  window.umami?.track(props => ({ ...props, url: `/blog/${post.slug}`, title: post.title }));
}

function slug_from_hash() {
  const hash_slug = location.hash.replace(/^#\/?/, '').trim();
  return post_by_slug[hash_slug] ? hash_slug : posts[0].slug;
}

const filters_el = document.querySelector('[data-filters]');
const unique_tags = [...new Set(posts.flatMap(post => post.tags))].sort();
filters_el.insertAdjacentHTML('beforeend', unique_tags.map(tag =>
  `<button data-filter="${tag}">${tag}</button>`
).join(''));

document.querySelectorAll('[data-filters] button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filters] button').forEach(b => b.classList.remove('on'));
    button.classList.add('on');
    current_filter = button.dataset.filter;
    render_list();
  });
});

document.querySelector('[data-search]').addEventListener('input', event => {
  current_search = event.target.value;
  render_list();
});

window.addEventListener('hashchange', () => render_post(slug_from_hash()));

function init_reader_pulse() {
  const pulse_path = document.getElementById('pulse-path');
  if (!pulse_path) return;

  const width = 600;
  const height = 36;
  const baseline_y = height * 0.55;

  const beat_offsets = intensity_factor => [
    [8, 0], [3, -1 * intensity_factor], [5, 1 * intensity_factor], [3, 0], [6, 0],
    [2, -2 * intensity_factor], [2, 6 * intensity_factor], [2, -16 * intensity_factor], [2, 12 * intensity_factor], [2, -2 * intensity_factor],
    [6, 0], [4, -1 * intensity_factor], [6, 2 * intensity_factor], [Math.max(6, 18 / Math.max(1, intensity_factor)), 0],
  ];

  let points = [];
  let cursor_x = 0;
  let intensity = 1;
  let scroll_energy = 0;
  let last_scroll_y = window.scrollY;
  let last_scroll_time = performance.now();
  let scroll_offset = 0;
  let last_frame_time = performance.now();

  const add_beat = () => {
    let x = cursor_x;
    let y = baseline_y;
    for (const [delta_x, delta_y] of beat_offsets(intensity)) {
      x += delta_x;
      y += delta_y;
      points.push([x, y]);
    }
    cursor_x = x + Math.random() * 6;
  };
  while (cursor_x < width * 1.2) add_beat();

  const animate = time => {
    const delta_seconds = (time - last_frame_time) / 1000;
    last_frame_time = time;

    const target_intensity = 1 + Math.min(1.4, scroll_energy * 0.018);
    intensity += (target_intensity - intensity) * Math.min(1, delta_seconds * 4);
    scroll_energy *= Math.max(0, 1 - delta_seconds * 2.2);

    scroll_offset += 60 * (1 + (intensity - 1) * 0.5) * delta_seconds;

    while (points.length > 4 && points[1][0] - scroll_offset < -20) points.shift();
    while (cursor_x - scroll_offset < width * 1.2) add_beat();

    let d = '';
    for (let i = 0; i < points.length; i++) {
      d += (i ? 'L' : 'M') + (points[i][0] - scroll_offset).toFixed(1) + ' ' + points[i][1].toFixed(1) + ' ';
    }
    pulse_path.setAttribute('d', d);

    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  window.addEventListener('scroll', () => {
    const now = performance.now();
    const distance = Math.abs(window.scrollY - last_scroll_y);
    const elapsed = Math.max(16, now - last_scroll_time);
    scroll_energy = Math.min(120, scroll_energy * 0.6 + (distance / elapsed) * 60);
    last_scroll_y = window.scrollY;
    last_scroll_time = now;
  }, { passive: true });
}

function init_reading_progress() {
  const progress_bar = document.getElementById('read-progress-bar');
  if (!progress_bar) return;

  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrollable_height = doc.scrollHeight - doc.clientHeight;
    const percent = scrollable_height > 0 ? (window.scrollY / scrollable_height) * 100 : 0;
    progress_bar.style.height = percent + '%';
  }, { passive: true });
}

function init_mobile_sidebar() {
  const toggle_button = document.getElementById('idx-toggle');
  const overlay = document.getElementById('idx-overlay');
  const sidebar = document.querySelector('.idx');

  const open_sidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    toggle_button.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const close_sidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    toggle_button.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggle_button.addEventListener('click', () => {
    sidebar.classList.contains('open') ? close_sidebar() : open_sidebar();
  });

  overlay.addEventListener('click', close_sidebar);

  list_el.addEventListener('click', event => {
    if (event.target.closest('[data-slug]')) close_sidebar();
  });
}

init_reader_pulse();
init_reading_progress();
init_mobile_sidebar();

render_list();
render_post(slug_from_hash());
document.querySelector('[data-post-count]').textContent = posts.length;
