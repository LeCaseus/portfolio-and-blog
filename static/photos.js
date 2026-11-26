import { init_shell } from "/shared.js";

init_shell();

function init_photo_columns() {
  const grid = document.querySelector("[data-photo-grid]");
  if (!grid) return;

  const column_heights = [0, 0, 0];
  const columns = column_heights.map(() => {
    const column = document.createElement("div");
    column.className = "photo_column";
    return column;
  });

  grid.querySelectorAll(".photo_tile").forEach((tile) => {
    const shortest = column_heights.indexOf(Math.min(...column_heights));
    columns[shortest].append(tile);
    column_heights[shortest] += Number(tile.dataset.ratio);
  });

  grid.append(...columns);
}

function init_photo_viewer() {
  const viewer = document.querySelector("[data-photo-viewer]");
  if (!viewer) return;

  const track = viewer.querySelector("[data-photo-track]");
  const previous_button = viewer.querySelector("[data-photo-prev]");
  const next_button = viewer.querySelector("[data-photo-next]");
  const index_el = viewer.querySelector("[data-photo-index]");
  if (!previous_button || !next_button) return;

  const current_index = () => Math.round(track.scrollLeft / track.clientWidth);
  const go_to = (index) =>
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });

  previous_button.addEventListener("click", () => go_to(current_index() - 1));
  next_button.addEventListener("click", () => go_to(current_index() + 1));
  track.addEventListener(
    "scroll",
    () => {
      index_el.textContent = current_index() + 1;
    },
    { passive: true },
  );
}

init_photo_columns();
init_photo_viewer();
