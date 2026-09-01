import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, format_relative_time } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();

function init_tag_filters() {
  const tag_list = document.querySelector('[data-notes-tag-list]');
  const cards = document.querySelectorAll('.feed-card[data-tags]');
  if (!tag_list || !cards.length) return;

  const get_active_tags = () =>
    new Set([...tag_list.querySelectorAll('.tag-pill.active')].map(chip => chip.dataset.tag));

  const apply_filters = () => {
    const active_tags = get_active_tags();
    cards.forEach(card => {
      const card_tags = card.dataset.tags ? card.dataset.tags.split('||') : [];
      const matches = active_tags.size === 0 || [...active_tags].some(tag => card_tags.includes(tag));
      card.hidden = !matches;
    });
  };

  tag_list.addEventListener('click', event => {
    const chip = event.target.closest('.tag-pill');
    if (!chip) return;
    chip.classList.toggle('active');
    apply_filters();
  });
}

function init_copy_link() {
  document.querySelectorAll('[data-copy-link]').forEach(button => {
    button.addEventListener('click', async () => {
      const original_label = button.textContent;
      try {
        await navigator.clipboard.writeText(button.dataset.permalink);
        button.textContent = 'copied!';
      } catch {
        button.textContent = 'failed';
      } finally {
        setTimeout(() => { button.textContent = original_label; }, 1500);
      }
    });
  });
}

function init_relative_timestamps() {
  document.querySelectorAll('[data-iso]').forEach(el => {
    el.textContent = format_relative_time(el.dataset.iso);
  });
}

function init_infinite_scroll() {
  const batch_size = 10;
  const cards = [...document.querySelectorAll('.feed-card[data-tags]')];
  const sentinel = document.querySelector('[data-feed-sentinel]');
  const tag_list = document.querySelector('[data-notes-tag-list]');
  if (!sentinel || cards.length <= batch_size) return;

  let revealed_count = batch_size;
  cards.forEach((card, index) => { card.dataset.batchHidden = index >= revealed_count ? 'true' : 'false'; });
  apply_batch_visibility();

  function apply_batch_visibility() {
    cards.forEach((card, index) => {
      if (card.dataset.batchHidden === 'true' && index >= revealed_count) card.hidden = true;
    });
  }

  function reveal_next_batch() {
    revealed_count += batch_size;
    cards.forEach((card, index) => {
      if (index < revealed_count) { card.dataset.batchHidden = 'false'; card.hidden = false; }
    });
    if (revealed_count >= cards.length) observer.disconnect();
  }

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) reveal_next_batch();
  }, { rootMargin: '200px' });
  observer.observe(sentinel);

  if (tag_list) {
    tag_list.addEventListener('click', () => {
      const has_active_filter = tag_list.querySelector('.tag-pill.active');
      cards.forEach(card => { if (card.dataset.batchHidden === 'true') card.hidden = !!has_active_filter ? false : true; });
    });
  }
}

init_tag_filters();
init_copy_link();
init_relative_timestamps();
init_infinite_scroll();
