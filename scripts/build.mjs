// Build dist/ JSON from posts/*.md — run by CI on every push to main.
//   node scripts/build.mjs

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const postsDir = path.join(root, 'posts');
const distDir = path.join(root, 'dist');
const SITE_URL = 'https://able-hearts.org';
const CDN_URL = 'https://cdn.jsdelivr.net/gh/ablehearts/content@main';
const REQUIRED = ['id', 'slug', 'title', 'excerpt', 'category', 'date'];

const readMinutes = markdown =>
  Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 200));

// The editor stores uploads as /images/<file>. Serve files that exist in this
// repo from the CDN; any other root path belongs to the website.
const resolveUrl = url =>
  !url.startsWith('/')
    ? url
    : fs.existsSync(path.join(root, url))
      ? `${CDN_URL}${url}`
      : `${SITE_URL}${url}`;

const parsePost = file => {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta = parse(match[1]);
  const missing = REQUIRED.filter(key => meta[key] === undefined);
  if (missing.length) throw new Error(`${file}: missing ${missing.join(', ')}`);
  const content = match[2]
    .trim()
    .replace(/(!\[[^\]]*\]\()(\/[^)\s]+)/g, (_, pre, url) => pre + resolveUrl(url));
  return {
    id: Number(meta.id),
    slug: String(meta.slug),
    title: String(meta.title),
    excerpt: String(meta.excerpt),
    category: String(meta.category),
    author: String(meta.author ?? 'AbleHearts Team'),
    date: String(meta.date),
    image: resolveUrl(String(meta.image ?? '')),
    tags: (meta.tags ?? []).map(String),
    featured: Boolean(meta.featured),
    draft: Boolean(meta.draft),
    readMinutes: readMinutes(content),
    content,
  };
};

const posts = fs
  .readdirSync(postsDir)
  .filter(file => file.endsWith('.md'))
  .map(parsePost)
  .filter(post => !post.draft)
  .sort((a, b) => b.id - a.id);

const slugs = new Set();
posts.forEach(({ slug }) => {
  if (slugs.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
  slugs.add(slug);
});

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(path.join(distDir, 'posts'), { recursive: true });

posts.forEach(({ draft: _draft, ...post }) =>
  fs.writeFileSync(
    path.join(distDir, 'posts', `${post.slug}.json`),
    JSON.stringify(post)
  )
);

const index = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  siteUrl: SITE_URL,
  posts: posts.map(({ content: _c, draft: _d, ...summary }) => summary),
};
fs.writeFileSync(
  path.join(distDir, 'index.json'),
  JSON.stringify(index, null, 2)
);

console.log(`Built ${posts.length} posts`);
