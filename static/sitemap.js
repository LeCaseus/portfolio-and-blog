import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, escape_html, fetch_feed_posts } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();

const post_links_el = document.querySelector('[data-post-links]');

fetch_feed_posts()
  .then(posts => {
    if (!posts.length) {
      post_links_el.innerHTML = '<li class="doc-empty">no entries yet.</li>';
      return;
    }
    post_links_el.innerHTML = posts.map(post => `
      <li><a href="${post.link}"><span>${escape_html(post.title)}</span><span class="path">${new URL(post.link).pathname}</span></a></li>
    `).join('');
  })
  .catch(() => {
    post_links_el.innerHTML = '<li class="doc-empty">could not load entries — try the readings log directly.</li>';
  });
