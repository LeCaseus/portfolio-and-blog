import { init_theme_toggle, start_clock, init_hero_ecg, init_mobile_nav } from '/shared.js';

init_theme_toggle();
start_clock();
init_hero_ecg();
init_mobile_nav();

const tag_storage_key = 'cv.blogActiveTag';

function apply_tag_filter(tag_list, post_list, selected_tag) {
  const chips = tag_list.querySelectorAll('.blog-tag-chip');
  const post_items = post_list.querySelectorAll('li[data-tags]');

  chips.forEach(chip => chip.classList.toggle('active', chip.dataset.tag === selected_tag));

  post_items.forEach(item => {
    const item_tags = item.dataset.tags ? item.dataset.tags.split('||') : [];
    const matches = selected_tag === 'all' || item_tags.includes(selected_tag);
    item.hidden = !matches;
  });
}

function init_tag_filter() {
  const tag_list = document.querySelector('[data-blog-tag-list]');
  const post_list = document.querySelector('[data-blog-post-list]');
  if (!tag_list || !post_list) return;

  const stored_tag = sessionStorage.getItem(tag_storage_key);
  const available_tags = [...tag_list.querySelectorAll('.blog-tag-chip')].map(chip => chip.dataset.tag);
  const initial_tag = stored_tag && available_tags.includes(stored_tag) ? stored_tag : 'all';

  apply_tag_filter(tag_list, post_list, initial_tag);

  tag_list.addEventListener('click', event => {
    const chip = event.target.closest('.blog-tag-chip');
    if (!chip) return;

    const selected_tag = chip.dataset.tag;
    sessionStorage.setItem(tag_storage_key, selected_tag);
    apply_tag_filter(tag_list, post_list, selected_tag);
  });
}

function init_scroll_memory(selector, storage_key) {
  const el = document.querySelector(selector);
  if (!el) return;

  const stored_scroll = sessionStorage.getItem(storage_key);
  if (stored_scroll !== null) el.scrollTop = parseInt(stored_scroll, 10);

  let ticking = false;
  el.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      sessionStorage.setItem(storage_key, el.scrollTop);
      ticking = false;
    });
  }, { passive: true });
}

init_tag_filter();
init_scroll_memory('.spec-col', 'cv.blogNavScroll');
