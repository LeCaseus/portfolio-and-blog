import {
  init_shell,
  init_relative_timestamps,
  matches_tags,
  init_tag_chips,
} from "/shared.js";

init_shell();

function init_copy_link() {
  document.querySelectorAll("[data-copy-link]").forEach((button) => {
    button.addEventListener("click", async () => {
      const original_label = button.textContent;
      try {
        await navigator.clipboard.writeText(button.dataset.permalink);
        button.textContent = "copied!";
      } catch {
        button.textContent = "failed";
      } finally {
        setTimeout(() => {
          button.textContent = original_label;
        }, 1500);
      }
    });
  });
}

function init_feed_visibility() {
  const tag_list = document.querySelector("[data-notes-tag-list]");
  const cards = [...document.querySelectorAll(".note_card[data-tags]")];
  if (!cards.length) return;

  const batch_size = 10;
  let revealed_count = batch_size;

  // an active filter searches the whole feed, not just the revealed batch
  const apply_visibility = () => {
    const active_tags = tag_list
      ? new Set(
          [...tag_list.querySelectorAll(".note_tag_chip.is_active")].map(
            (chip) => chip.dataset.tag,
          ),
        )
      : new Set();
    cards.forEach((card, index) => {
      const within_batch = active_tags.size > 0 || index < revealed_count;
      card.hidden = !(within_batch && matches_tags(card, active_tags));
    });
  };

  if (tag_list) init_tag_chips(tag_list, ".note_tag_chip", apply_visibility);

  if (cards.length > batch_size) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        revealed_count += batch_size;
        apply_visibility();
        if (revealed_count >= cards.length) observer.disconnect();
      },
      { rootMargin: "200px" },
    );
    observer.observe(document.querySelector("[data-feed-sentinel]"));
  }

  apply_visibility();
}

init_feed_visibility();
init_copy_link();
init_relative_timestamps();
