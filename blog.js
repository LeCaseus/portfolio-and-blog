import { init_theme_toggle, start_clock, format_post_date } from './shared.js';

init_theme_toggle();
start_clock();

async function load_posts() {
  const index = await fetch('/api/posts').then(response => response.json());
  return Promise.all(index.map(async post => {
    const body = await fetch(`/api/posts/${post.slug}`).then(response => response.text());
    return { ...post, body };
  }));
}

async function refresh_reaction_count(slug) {
  const button = document.querySelector('[data-react-btn]');
  const count_el = document.querySelector('[data-react-count]');
  if (!button || !count_el) return;
  try {
    const response = await fetch(`/api/reactions/${slug}`);
    const data = await response.json();
    if (slug !== current_slug) return;
    count_el.textContent = data.count;
    button.classList.toggle('reacted', Boolean(data.reacted));
  } catch {
    if (slug === current_slug) count_el.textContent = '—';
  }
}

const posts = (await load_posts()).sort((a, b) => new Date(b.date) - new Date(a.date));
const post_by_slug = Object.fromEntries(posts.map(post => [post.slug, post]));
const display_order = [...posts].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
const unique_tags = [...new Set(posts.flatMap(post => post.tags))].sort();

const blog_grid_el = document.getElementById('blog-grid');
const channel_list_el = document.querySelector('[data-channel-list]');
const channel_label_el = document.querySelector('[data-channel-label]');
const list_el = document.querySelector('[data-list]');
const visible_count_el = document.querySelector('[data-visible-count]');
const reader_el = document.getElementById('reader');
const reader_body_el = document.querySelector('[data-reader-body]');

const wikilink_pattern = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;

marked.use({
  hooks: {
    preprocess(markdown_text) {
      return markdown_text.replace(wikilink_pattern, (_, slug, __, display_text) =>
        `[${display_text || slug}](/blog/${slug})`
      );
    }
  }
});

let current_channel = 'all';
let current_search = '';
let current_slug = null;

function render_channels() {
  const counts_by_tag = {};
  for (const post of posts) {
    for (const tag of post.tags) counts_by_tag[tag] = (counts_by_tag[tag] || 0) + 1;
  }

  const all_channel_html = `
    <li><a class="folder-item ${current_channel === 'all' ? 'active' : ''}" data-channel="all">
      <span class="code">CH-B0</span>
      <span class="label">all entries</span>
      <span class="count">${posts.length}</span>
    </a></li>
  `;

  const tag_channels_html = unique_tags.map((tag, index) => `
    <li><a class="folder-item ${current_channel === tag ? 'active' : ''}" data-channel="${tag}">
      <span class="code">CH-B${index + 1}</span>
      <span class="label">${tag}</span>
      <span class="count">${counts_by_tag[tag] || 0}</span>
    </a></li>
  `).join('');

  channel_list_el.innerHTML = all_channel_html + tag_channels_html;

  channel_list_el.querySelectorAll('[data-channel]').forEach(channel_el => {
    channel_el.addEventListener('click', () => {
      current_channel = channel_el.dataset.channel;
      channel_label_el.textContent = current_channel === 'all' ? 'ALL ENTRIES' : current_channel.toUpperCase();
      render_channels();
      render_list();
      blog_grid_el.dataset.level = 'posts';
    });
  });
}

function render_list() {
  const query = current_search.trim().toLowerCase();
  const filtered_posts = display_order.filter(post => {
    if (current_channel !== 'all' && !post.tags.includes(current_channel)) return false;
    if (query && !(post.title.toLowerCase().includes(query) || post.summary.toLowerCase().includes(query))) return false;
    return true;
  });

  list_el.innerHTML = filtered_posts.map(post => `
    <li>
      <a class="entry ${post.slug === current_slug ? 'active' : ''}" href="/blog/${post.slug}" data-slug="${post.slug}" data-pinned="${Boolean(post.pinned)}">
        <div class="ttl">${post.title}</div>
        <div class="sub"><span class="date">${format_post_date(post.date)}</span> — ${post.summary}</div>
      </a>
    </li>
  `).join('') || '<li class="empty">no entries</li>';

  visible_count_el.textContent = `${filtered_posts.length} / ${posts.length}`;
}

function render_idle() {
  current_slug = null;
  reader_el.classList.add('is-idle');
  reader_body_el.innerHTML = `
    <div class="idle-state">
      <h2>no entry selected</h2>
      <p>pick a channel, then an entry, or search from the index.</p>
    </div>
  `;
  render_list();
  init_reader_pulse();
}

function render_post(slug) {
  const post = post_by_slug[slug] || posts[0];
  current_slug = post.slug;
  reader_el.classList.remove('is-idle');
  const post_index = posts.indexOf(post);

  reader_body_el.innerHTML = `
    <header class="header">
      <div class="meta">
        <span>${format_post_date(post.date, true)}</span>
        <span class="dot"></span>
        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        <span class="dot"></span>
        <span>${post.readTime} read</span>
        <span class="dot"></span>
        <span>entry ${String(posts.length - post_index).padStart(2, '0')} / ${String(posts.length).padStart(2, '0')}</span>
      </div>
      <h1 class="post-title">${post.title}</h1>
      <p class="lede">${post.summary}</p>
    </header>
    <div class="reader-pulse" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 36" preserveAspectRatio="none" aria-hidden="true">
        <path d="" id="pulse-path" />
      </svg>
    </div>
    <div class="prose-body">${marked.parse(post.body)}</div>
    <div class="post-actions">
      <button class="pulse-react" data-react-btn aria-label="React to this post">
        <i data-lucide="heart"></i>
        <span class="count" data-react-count>-</span>
      </button>
      <button class="pulse-react" data-comment-btn type="button" disabled>
        <i data-lucide="message-circle"></i>
        <span>Comment</span>
      </button>
      <button class="pulse-react" data-share-btn type="button" disabled>
        <i data-lucide="share-2"></i>
        <span>Share</span>
      </button>
    </div>
  `;

  lucide.createIcons();

  render_list();
  reader_el.scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  refresh_reaction_count(post.slug);
  window.umami?.track(props => ({ ...props, url: `/blog/${post.slug}`, title: post.title }));
  init_reader_pulse();
}

function slug_from_path() {
  const match = location.pathname.match(/^\/blog\/(.+)$/);
  const path_slug = match ? match[1].replace(/\/$/, '') : '';
  return post_by_slug[path_slug] ? path_slug : null;
}

function open_from_navigation(slug) {
  if (slug) {
    render_post(slug);
    blog_grid_el.dataset.level = 'reader';
  } else {
    render_idle();
    blog_grid_el.dataset.level = 'channels';
  }
}

document.querySelector('[data-search]').addEventListener('input', event => {
  current_search = event.target.value;
  render_list();
});

window.addEventListener('popstate', () => open_from_navigation(slug_from_path()));

document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="/blog/"]');
  if (!link) return;
  event.preventDefault();
  const slug = link.getAttribute('href').replace('/blog/', '');
  history.pushState({}, '', link.getAttribute('href'));
  render_post(slug);
  blog_grid_el.dataset.level = 'reader';
});

document.querySelector('[data-back-to-channels]').addEventListener('click', () => {
  blog_grid_el.dataset.level = 'channels';
});

document.querySelector('[data-back-to-posts]').addEventListener('click', () => {
  blog_grid_el.dataset.level = 'posts';
});

let pulse_scroll_energy = 0;
let pulse_last_scroll_y = window.scrollY;
let pulse_last_scroll_time = performance.now();
let pulse_animation_frame_id = null;

window.addEventListener('scroll', () => {
  const now = performance.now();
  const distance = Math.abs(window.scrollY - pulse_last_scroll_y);
  const elapsed = Math.max(16, now - pulse_last_scroll_time);
  pulse_scroll_energy = Math.min(120, pulse_scroll_energy * 0.6 + (distance / elapsed) * 60);
  pulse_last_scroll_y = window.scrollY;
  pulse_last_scroll_time = now;
}, { passive: true });

function init_reader_pulse() {
  if (pulse_animation_frame_id) cancelAnimationFrame(pulse_animation_frame_id);

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

    const target_intensity = 1 + Math.min(1.4, pulse_scroll_energy * 0.018);
    intensity += (target_intensity - intensity) * Math.min(1, delta_seconds * 4);
    pulse_scroll_energy *= Math.max(0, 1 - delta_seconds * 2.2);

    scroll_offset += 60 * (1 + (intensity - 1) * 0.5) * delta_seconds;

    while (points.length > 4 && points[1][0] - scroll_offset < -20) points.shift();
    while (cursor_x - scroll_offset < width * 1.2) add_beat();

    let d = '';
    for (let i = 0; i < points.length; i++) {
      d += (i ? 'L' : 'M') + (points[i][0] - scroll_offset).toFixed(1) + ' ' + points[i][1].toFixed(1) + ' ';
    }
    pulse_path.setAttribute('d', d);

    pulse_animation_frame_id = requestAnimationFrame(animate);
  };
  pulse_animation_frame_id = requestAnimationFrame(animate);
}

function init_reaction_widget() {
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-react-btn]');
    if (!button || button.disabled) return;
    button.disabled = true;
    try {
      const response = await fetch(`/api/reactions/${current_slug}`, { method: 'POST' });
      const data = await response.json();
      document.querySelector('[data-react-count]').textContent = data.count;
      button.classList.toggle('reacted', Boolean(data.reacted));
      window.umami?.track('reaction', { slug: current_slug, reacted: Boolean(data.reacted) });
    } finally {
      button.disabled = false;
    }
  });
}

function init_reading_progress() {
  const progress_bar = document.getElementById('read-progress-bar');
  if (!progress_bar || !reader_el) return;

  const update_progress = () => {
    const reader_is_scroll_container = reader_el.scrollHeight > reader_el.clientHeight;
    const scroll_top = reader_is_scroll_container ? reader_el.scrollTop : window.scrollY;
    const scrollable_height = reader_is_scroll_container
      ? reader_el.scrollHeight - reader_el.clientHeight
      : document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = scrollable_height > 0 ? (scroll_top / scrollable_height) * 100 : 0;
    progress_bar.style.height = percent + '%';
  };

  reader_el.addEventListener('scroll', update_progress, {passive: true});
  window.addEventListener('scroll', update_progress, {passive: true});
  window.addEventListener('resize', update_progress, {passive: true});
}

init_reaction_widget();
init_reading_progress();

render_channels();
open_from_navigation(slug_from_path());
document.querySelector('[data-post-count]').textContent = posts.length;
