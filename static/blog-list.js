import { init_theme_toggle, start_clock, init_hero_ecg, init_mobile_nav } from '/shared.js';

init_theme_toggle();
start_clock();
init_hero_ecg();
init_mobile_nav();

const search_storage_key = 'cv.blogSearch';
const tags_storage_key = 'cv.blogActiveTags';

function get_active_tags(tag_list) {
  return new Set([...tag_list.querySelectorAll('.blog-tag-chip.active')].map(chip => chip.dataset.tag));
}

function post_matches(item, search_term, active_tags) {
  const item_tags = item.dataset.tags ? item.dataset.tags.split('||') : [];
  const tags_match = active_tags.size === 0 || [...active_tags].some(tag => item_tags.includes(tag));
  if (!tags_match) return false;
  if (!search_term) return true;
  return (item.dataset.title || '').toLowerCase().includes(search_term);
}

function apply_filters(tag_list, search_input, groups) {
  const active_tags = get_active_tags(tag_list);
  const search_term = search_input.value.trim().toLowerCase();

  groups.forEach(group => {
    const items = group.querySelectorAll('li[data-tags]');
    let visible_count = 0;
    items.forEach(item => {
      const matches = post_matches(item, search_term, active_tags);
      item.hidden = !matches;
      if (matches) visible_count++;
    });
    group.classList.toggle('no-match', visible_count === 0);
  });
}

function init_search_and_filters() {
  const tag_list = document.querySelector('[data-blog-tag-list]');
  const search_input = document.querySelector('[data-blog-search]');
  const clear_button = document.querySelector('[data-blog-clear-filters]');
  const groups = document.querySelectorAll('[data-blog-year-group]');
  if (!tag_list || !search_input) return;

  const stored_search = sessionStorage.getItem(search_storage_key) || '';
  const stored_tags = JSON.parse(sessionStorage.getItem(tags_storage_key) || '[]');

  search_input.value = stored_search;
  tag_list.querySelectorAll('.blog-tag-chip').forEach(chip => {
    chip.classList.toggle('active', stored_tags.includes(chip.dataset.tag));
  });

  const persist_and_apply = () => {
    sessionStorage.setItem(search_storage_key, search_input.value);
    const active_tags = [...get_active_tags(tag_list)];
    sessionStorage.setItem(tags_storage_key, JSON.stringify(active_tags));
    clear_button.hidden = active_tags.length === 0 && !search_input.value;
    apply_filters(tag_list, search_input, groups);
  };

  search_input.addEventListener('input', persist_and_apply);

  tag_list.addEventListener('click', event => {
    const chip = event.target.closest('.blog-tag-chip');
    if (!chip) return;
    chip.classList.toggle('active');
    persist_and_apply();
  });

  clear_button.addEventListener('click', () => {
    search_input.value = '';
    tag_list.querySelectorAll('.blog-tag-chip.active').forEach(chip => chip.classList.remove('active'));
    persist_and_apply();
  });

  persist_and_apply();
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

init_search_and_filters();
init_scroll_memory('.spec-col', 'cv.blogNavScroll');
