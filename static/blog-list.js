import { init_shell, matches_tags, init_tag_chips } from "/shared.js";

init_shell();

const search_storage_key = "cv.blogSearch";
const tags_storage_key = "cv.blogActiveTags";
const nav_scroll_storage_key = "cv.blogNavScroll";
const panel = document.querySelector(".side_panel_blog");

function post_matches(item, search_term, active_tags) {
  return (
    matches_tags(item, active_tags) &&
    item.dataset.title.toLowerCase().includes(search_term)
  );
}

function init_search_and_filters() {
  const tag_list = document.querySelector("[data-blog-tag-list]");
  const search_input = document.querySelector("[data-blog-search]");
  const clear_button = document.querySelector("[data-blog-clear-filters]");
  const active_count_el = document.querySelector(
    "[data-blog-tag-active-count]",
  );
  const groups = document.querySelectorAll("[data-blog-year-group]");

  const stored_tags = JSON.parse(
    sessionStorage.getItem(tags_storage_key) || "[]",
  );
  search_input.value = sessionStorage.getItem(search_storage_key) || "";
  tag_list.querySelectorAll(".blog_tag_chip").forEach((chip) => {
    chip.classList.toggle("is_active", stored_tags.includes(chip.dataset.tag));
  });

  const persist_and_apply = () => {
    const active_tags = new Set(
      [...tag_list.querySelectorAll(".blog_tag_chip.is_active")].map(
        (chip) => chip.dataset.tag,
      ),
    );
    const search_term = search_input.value.trim().toLowerCase();

    sessionStorage.setItem(search_storage_key, search_input.value);
    sessionStorage.setItem(tags_storage_key, JSON.stringify([...active_tags]));
    clear_button.hidden = active_tags.size === 0 && !search_input.value;
    active_count_el.textContent = `(${active_tags.size})`;
    active_count_el.hidden = active_tags.size === 0;

    groups.forEach((group) => {
      const items = [...group.querySelectorAll("li[data-tags]")];
      items.forEach((item) => {
        item.hidden = !post_matches(item, search_term, active_tags);
      });
      group.classList.toggle(
        "has_no_match",
        items.every((item) => item.hidden),
      );
    });
  };

  search_input.addEventListener("input", persist_and_apply);
  init_tag_chips(tag_list, ".blog_tag_chip", persist_and_apply);

  clear_button.addEventListener("click", () => {
    search_input.value = "";
    tag_list
      .querySelectorAll(".blog_tag_chip.is_active")
      .forEach((chip) => chip.classList.remove("is_active"));
    persist_and_apply();
  });

  persist_and_apply();
}

function init_scroll_memory() {
  panel.scrollTop = Number(sessionStorage.getItem(nav_scroll_storage_key));

  let ticking = false;
  panel.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(nav_scroll_storage_key, panel.scrollTop);
        ticking = false;
      });
    },
    { passive: true },
  );
}

function init_blog_nav_drawer() {
  const backdrop = document.querySelector("[data-blog-nav-backdrop]");
  const trigger_button = document.querySelector("[data-blog-nav-trigger]");
  const nav_toggle = document.getElementById("mobile-nav-check");

  const set_drawer_open = (is_open) => {
    if (is_open) nav_toggle.checked = false;
    panel.classList.toggle("is_open", is_open);
    backdrop.classList.toggle("is_open", is_open);
    trigger_button.setAttribute("aria-expanded", String(is_open));
  };

  nav_toggle.addEventListener("change", () => {
    if (nav_toggle.checked) set_drawer_open(false);
  });

  trigger_button.addEventListener("click", () =>
    set_drawer_open(!panel.classList.contains("is_open")),
  );
  backdrop.addEventListener("click", () => set_drawer_open(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") set_drawer_open(false);
  });
  document.querySelectorAll(".blog_post_item").forEach((link) => {
    link.addEventListener("click", () => set_drawer_open(false));
  });
}

init_search_and_filters();
init_scroll_memory();
init_blog_nav_drawer();
