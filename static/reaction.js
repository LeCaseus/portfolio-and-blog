const reactions_endpoint = slug => `/api/reactions/${encodeURIComponent(slug)}`;

async function load_reaction_state(slug, checkbox, count_el) {
  try {
    const response = await fetch(reactions_endpoint(slug));
    if (!response.ok) throw new Error('fetch failed');
    const state = await response.json();
    checkbox.checked = state.reacted;
    count_el.textContent = state.count;
  } catch {
    count_el.textContent = '—';
  }
}

async function toggle_reaction(slug, checkbox, count_el) {
  checkbox.disabled = true;
  try {
    const response = await fetch(reactions_endpoint(slug), { method: 'POST' });
    if (!response.ok) throw new Error('toggle failed');
    const state = await response.json();
    checkbox.checked = state.reacted;
    count_el.textContent = state.count;
  } catch {
    checkbox.checked = !checkbox.checked;
  } finally {
    checkbox.disabled = false;
  }
}

function init_post_heart() {
  const widget = document.querySelector('[data-post-heart]');
  if (!widget) return;

  const slug = widget.dataset.slug;
  const checkbox = widget.querySelector('[data-heart-checkbox]');
  const count_el = widget.querySelector('[data-heart-count]');
  if (!slug || !checkbox || !count_el) return;

  load_reaction_state(slug, checkbox, count_el);
  checkbox.addEventListener('change', () => toggle_reaction(slug, checkbox, count_el));
}

init_post_heart();
