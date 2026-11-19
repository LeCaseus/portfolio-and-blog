import { escape_html, render_link } from "/shared.js";

const messages_endpoint = "/api/messages";

export function parse_server_timestamp(server_timestamp) {
  return new Date(`${server_timestamp.replace(" ", "T")}Z`);
}

export function format_message_date(server_timestamp) {
  const date = parse_server_timestamp(server_timestamp);
  if (Number.isNaN(date.getTime())) return server_timestamp;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function render_message(entry) {
  const display_name = entry.name?.trim()
    ? escape_html(entry.name.trim())
    : "anonymous";
  const website_html = render_link(entry.website);
  const reply_html = entry.reply_message
    ? `
    <div class="gb-reply">
      <span class="gb-reply-label">↳ reply</span>
      <p>${escape_html(entry.reply_message)}</p>
    </div>`
    : "";

  return `
    <li class="gb-entry">
      <div class="gb-entry-head">
        <span class="gb-entry-name">${display_name}</span>
        ${website_html ? `<span class="gb-entry-site">${website_html}</span>` : ""}
        <span class="gb-entry-date">${format_messages_date(entry.created_at)}</span>
      </div>
      <p class="gb-entry-msg">${escape_html(entry.message)}</p>
      ${reply_html}
    </li>
  `;
}

export async function fetch_messages(page) {
  const response = await fetch(
    `${messages_endpoint}?page=${encodeURIComponent(page)}`,
  );
  if (!response.ok) throw new Error("messages request failed");
  return response.json();
}

export function init_message_form({ page, form, success_text }) {
  const message_input = form.elements.message;
  const submit_button = form.querySelector('[type="submit"]');
  const status_element = form.querySelector('[role="status"]');
  const count_box = form.querySelector(".gb-count");
  const count_element = count_box.querySelector("span");

  const field_value = (field_name) => form.elements[field_name].value.trim();

  const update_count = () => {
    const length = message_input.value.length;
    count_element.textContent = length;
    count_box.classList.toggle("gb-count-warn", length > 900);
  };

  const set_status = (text, kind) => {
    status_element.textContent = text;
    status_element.classList.toggle("gb-status-ok", kind === "ok");
    status_element.classList.toggle("gb-status-err", kind === "err");
  };

  message_input.addEventListener("input", update_count);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = field_value("message");
    if (!message) {
      set_status("message can't be empty.", "err");
      return;
    }

    const payload = {
      name: field_value("name") || undefined,
      website: field_value("website") || undefined,
      message,
      page,
    };

    submit_button.disabled = true;
    set_status("sending…");

    try {
      const response = await fetch(messages_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        set_status("hourly limit reached — try again later.", "err");
        return;
      }

      if (!response.ok) {
        const error_body = await response.json().catch(() => null);
        set_status(
          error_body?.message || "something didn't go through — try again.",
          "err",
        );
        return;
      }

      form.reset();
      update_count();
      set_status(success_text, "ok");
    } catch {
      set_status("couldn't reach the server — try again in a bit.", "err");
    } finally {
      submit_button.disabled = false;
    }
  });
}
