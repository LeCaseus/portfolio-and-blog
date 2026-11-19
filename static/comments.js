import { escape_html, render_link } from "/shared.js";
import {
  fetch_messages,
  format_message_date,
  init_message_form,
  parse_server_timestamp,
  render_message,
} from "/messages.js";

const mention_verbs = {
  reply: "replied",
  like: "liked this",
  repost: "reposted",
  mention: "mentioned this",
};

const section = document.querySelector("[data-comments]");
const page = section.dataset.page;
const list_element = section.querySelector("[data-comments-list]");
const entry_count_element = section.querySelector(
  "[data-comments-entry-count]",
);

async function fetch_webmentions(target_url) {
  const response = await fetch(
    `/api/webmentions?target=${encodeURIComponent(target_url)}`,
  );
  if (!response.ok) throw new Error("webmentions request failed");
  return response.json();
}

function display_host(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function render_mention(mention) {
  const author_name = mention.author_name?.trim() || "someone";
  const author_html =
    render_link(mention.author_url, author_name) || escape_html(author_name);
  const source_html = render_link(mention.source, display_host(mention.source));
  const verb = mention_verbs[mention.type] || mention_verbs.mention;

  return `
    <li class="gb-entry">
      <div class="gb-entry-head">
        <span class="gb-entry-name">${author_html}</span>
        <span class="gb-entry-kind">↗ ${verb}</span>
        ${source_html ? `<span class="gb-entry-site">${source_html}</span>` : ""}
        <span class="gb-entry-date">${format_message_date(mention.created_at)}</span>
      </div>
      ${mention.content ? `<p class="gb-entry-msg">${escape_html(mention.content)}</p>` : ""}
    </li>
  `;
}

async function load_discussion() {
  const [messages_result, mentions_result] = await Promise.allSettled([
    fetch_messages(page),
    fetch_webmentions(section.dataset.targetUrl),
  ]);

  if (
    messages_result.status === "rejected" &&
    mentions_result.status === "rejected"
  ) {
    entry_count_element.textContent = "—";
    list_element.innerHTML =
      '<li class="doc-empty">couldn\'t load comments, refresh to try again.</li>';
    return;
  }

  const items = [
    ...(messages_result.value ?? []).map((message) => ({
      created_at: parse_server_timestamp(message.created_at),
      html: render_message(message),
    })),
    ...(mentions_result.value ?? []).map((mention) => ({
      created_at: parse_server_timestamp(mention.created_at),
      html: render_mention(mention),
    })),
  ].sort((first, second) => second.created_at - first.created_at);

  entry_count_element.textContent = items.length;
  list_element.innerHTML = items.length
    ? items.map((item) => item.html).join("")
    : '<li class="doc-empty">no comments yet.</li>';
}

init_message_form({
  page,
  form: section.querySelector("[data-comments-form]"),
  success_text: "sent, pending approval. thanks for reading.",
});

load_discussion();
