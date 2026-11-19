const widget = document.querySelector("[data-post-heart]");
const checkbox = widget.querySelector("[data-heart-checkbox]");
const count_el = widget.querySelector("[data-heart-count]");
const endpoint = `/api/reactions/${encodeURIComponent(widget.dataset.slug)}`;

async function sync_reaction(method) {
  const response = await fetch(endpoint, { method });
  if (!response.ok) throw new Error(`${method} failed`);
  const state = await response.json();
  checkbox.checked = state.reacted;
  count_el.textContent = state.count;
}

sync_reaction("GET").catch(() => {
  count_el.textContent = "—";
});

checkbox.addEventListener("change", async () => {
  checkbox.disabled = true;
  try {
    await sync_reaction("POST");
  } catch {
    checkbox.checked = !checkbox.checked;
  } finally {
    checkbox.disabled = false;
  }
});
