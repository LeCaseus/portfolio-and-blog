// build.js — pre-renders blog posts into static h-entry HTML files.
// Run manually after publishing: `node build.js`
// Requires: npm install marked

import { marked } from 'marked';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const index_json_path = '/home/lecaseus/Notes/website/posts/index.json';
const markdown_source_dir = '/home/lecaseus/Notes/website/posts/';
const static_output_dir = '/home/lecaseus/selfhosted/www/build/h-entries';
// ----------------------------------------------------------------------

const site_root = 'https://cheztervargas.xyz';
const author_name = 'Chezter Vargas';
const author_url = `${site_root}/`;

function render_h_entry_page(post, content_html) {
  const permalink = `${site_root}/blog/${post.slug}`;
  const tags_html = post.tags.map(tag => `<span class="p-category">${tag}</span>`).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${post.title} — Chezter Vargas</title>
  <meta name="description" content="${post.summary}" />
  <link rel="canonical" href="${permalink}" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/blog.css" />
  <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
</head>
<body>
  <main class="blog-shell">
    <article class="h-entry reader">
      <header class="header">
        <div class="meta">
          <time class="dt-published" datetime="${post.date}">${post.date}</time>
          <span class="dot"></span>
          ${tags_html}
          <span class="dot"></span>
          <span>${post.readTime} read</span>
        </div>
        <h1 class="p-name post-title">${post.title}</h1>
        <p class="p-summary lede">${post.summary}</p>
      </header>
      <div class="e-content prose-body">${content_html}</div>
      <footer>
        <a class="u-url" href="${permalink}">${permalink}</a>
        <a class="p-author h-card" href="${author_url}">${author_name}</a>
      </footer>
    </article>
    <p><a href="/blog.html">← back to the reading index</a> (interactive version, best for humans)</p>
  </main>
</body>
</html>
`;
}

async function build_all_posts() {
  const index_raw = await readFile(index_json_path, 'utf8');
  const posts = JSON.parse(index_raw);

  await mkdir(static_output_dir, { recursive: true });

  for (const post of posts) {
    const markdown_path = path.join(markdown_source_dir, `${post.slug}.md`);
    const markdown_body = await readFile(markdown_path, 'utf8');
    const content_html = marked.parse(markdown_body);
    const page_html = render_h_entry_page(post, content_html);

    const output_path = path.join(static_output_dir, `${post.slug}.html`);
    await writeFile(output_path, page_html, 'utf8');
    console.log(`tagged: ${post.slug}`);
  }

  console.log(`done — ${posts.length} post(s) written to ${static_output_dir}`);
}

build_all_posts().catch(error => {
  console.error('build failed:', error.message);
  process.exit(1);
});
