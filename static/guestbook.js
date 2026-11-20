import { init_shell } from "/shared.js";
import {
  fetch_messages,
  init_message_form,
  render_message,
} from "/messages.js";

init_shell();

const page = "guestbook";
const entries_element = document.querySelector("[data-gb-entries]");
const entry_count_element = document.querySelector("[data-gb-entry-count]");

init_message_form({
  page,
  form: document.querySelector("[data-gb-form]"),
  success_text: "sent — pending approval, thanks for signing.",
});

fetch_messages(page)
  .then((entries) => {
    entry_count_element.textContent = entries.length;
    entries_element.innerHTML = entries.length
      ? entries.map(render_message).join("")
      : '<li class="empty_message">no entries yet — be the first.</li>';
  })
  .catch(() => {
    entry_count_element.textContent = "—";
    entries_element.innerHTML =
      '<li class="empty_message">couldn\'t load entries — refresh to try again.</li>';
  });
