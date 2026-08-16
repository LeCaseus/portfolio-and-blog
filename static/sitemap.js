import { init_hero_ecg, init_theme_toggle, start_clock } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();

const post_links_el = document.querySelector('[data-post-links]');

fetch('/api/posts')
  .then(response => response.json())
  .then(posts => {
    if (!posts.length) {
      post_links_el.innerHTML = '<li class="doc-empty">no entries yet.</li>';
      return;
    }
    const sorted_posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    post_links_el.innerHTML = sorted_posts.map(post => `
      <li><a href="/blog/${post.slug}"><span>${post.title}</span><span class="path">/blog/${post.slug}</span></a></li>
    `).join('');
  })
  .catch(() => {
    post_links_el.innerHTML = '<li class="doc-empty">could not load entries — try the readings log directly.</li>';
  });
