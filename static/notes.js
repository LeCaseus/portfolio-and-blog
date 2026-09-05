import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, format_relative_time } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();

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

function init_feed_visibility() {
  const tag_list = document.querySelector('[data-notes-tag-list]');
  const cards = [...document.querySelectorAll('.feed-card[data-tags]')];
  const sentinel = document.querySelector('[data-feed-sentinel]');
  if (!cards.length) return;

  const batch_size = 10;
  let revealed_count = Math.min(batch_size, cards.length);

  const get_active_tags = () =>
    tag_list ? new Set([...tag_list.querySelectorAll('.tag-pill.active')].map(chip => chip.dataset.tag)) : new Set();

  const card_matches_tags = (card, active_tags) => {
    if (active_tags.size === 0) return true;
    const card_tags = card.dataset.tags ? card.dataset.tags.split('||') : [];
    return [...active_tags].some(tag => card_tags.includes(tag));
  };

  // A card shows when it matches the active tags AND is either within the
  // currently-revealed scroll batch, or a filter is active -- filtering
  // searches the whole feed, not just what's been scrolled into view yet.
  const apply_visibility = () => {
    const active_tags = get_active_tags();
    const filtering = active_tags.size > 0;
    cards.forEach((card, index) => {
      const within_batch = filtering || index < revealed_count;
      card.hidden = !(card_matches_tags(card, active_tags) && within_batch);
    });
  };

  if (tag_list) {
    tag_list.addEventListener('click', event => {
      const chip = event.target.closest('.tag-pill');
      if (!chip) return;
      chip.classList.toggle('active');
      apply_visibility();
    });
  }

  if (sentinel && cards.length > batch_size) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      revealed_count += batch_size;
      apply_visibility();
      if (revealed_count >= cards.length) observer.disconnect();
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
  }

  apply_visibility();
}

init_feed_visibility();
init_copy_link();
init_relative_timestamps();
