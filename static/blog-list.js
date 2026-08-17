import { init_theme_toggle, start_clock, init_hero_ecg } from '/shared.js';

init_theme_toggle();
start_clock();
init_hero_ecg();

function init_tag_filter() {
  const tag_list = document.querySelector('[data-blog-tag-list]');
  const post_list = document.querySelector('[data-blog-post-list]');
  if (!tag_list || !post_list) return;

  const chips = tag_list.querySelectorAll('.blog-tag-chip');
  const post_items = post_list.querySelectorAll('li[data-tags]');

  tag_list.addEventListener('click', event => {
    const chip = event.target.closest('.blog-tag-chip');
    if (!chip) return;

    chips.forEach(c => c.classList.toggle('active', c === chip));

    const selected_tag = chip.dataset.tag;
    post_items.forEach(item => {
      const item_tags = item.dataset.tags ? item.dataset.tags.split('||') : [];
      const matches = selected_tag === 'all' || item_tags.includes(selected_tag);
      item.hidden = !matches;
    });
  });
}

init_tag_filter();
