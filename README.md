# AbleHearts Content

The single source for AbleHearts blog posts. The website (able-hearts.org) and the mobile app both read from here, so a post is written once and appears everywhere.

Everything here is free: GitHub hosts the files, jsDelivr serves them through a global CDN, and Sveltia CMS gives a browser editor.

```
posts/<slug>.md          ← you edit these (frontmatter + markdown)
images/                  ← images uploaded from the editor
dist/index.json          ← generated: list of posts (newest first)
dist/posts/<slug>.json   ← generated: one full post
admin/                   ← the browser editor
```

## Public URLs

| What | URL |
| --- | --- |
| Post list | `https://cdn.jsdelivr.net/gh/ablehearts/content@main/dist/index.json` |
| One post | `https://cdn.jsdelivr.net/gh/ablehearts/content@main/dist/posts/<slug>.json` |
| Editor | `https://ablehearts.github.io/content/admin/` |

## One-time setup

1. Create a **public** repo named `content` under the `ablehearts` GitHub org, then push this folder to it:
   ```bash
   git init && git add . && git commit -m "Initial content"
   git branch -M main
   git remote add origin git@github.com:ablehearts/content.git
   git push -u origin main
   ```
2. **Enable the editor.** Go to Settings → Pages, set Source to "Deploy from a branch", choose `main` and `/ (root)`.
3. **Let the website rebuild on edits** (optional). In Vercel, open Project → Settings → Git → Deploy Hooks and create a hook for `main`. Then, in this repo, go to Settings → Secrets → Actions and add the hook URL as `VERCEL_DEPLOY_HOOK`.
4. **Create an editor token.** Go to GitHub → Settings → Developer settings → Fine-grained tokens and create a token with **Contents: read & write** on `ablehearts/content` only. Use it to sign in to the editor.

## Writing a post

**In the editor:** open `/admin/`, sign in with the token, click **New Blog post**, fill in the fields and press Save. The commit triggers the build.

**By hand:** add `posts/my-new-post.md`:

```markdown
---
id: 46
slug: "my-new-post"
title: "My New Post"
excerpt: "One or two sentences shown on cards."
category: "Updates"
author: "AbleHearts Team"
date: "October 2026"
image: "/images/blog/cover.jpg"
tags: ["Mary & Lydia", "Kenya"]
featured: false
---

Markdown content here…
```

Rules:

- `id` is the post number. Higher numbers are newer, and it controls the order.
- Never change a published `slug`, because links and SEO depend on it.
- `draft: true` hides a post.
- Images that start with `/` resolve against `https://able-hearts.org`.

Run `npm install && npm run build` to check a post locally. CI runs the same build on every push, commits `dist/`, purges the CDN cache, and pings Vercel.

## Copying a post written in the website code

If a post was added as `lib/blog/postN.ts` in the website, copy it here:

```bash
cd ../ablehearts.github.io && yarn content:export ../ablehearts-content
cd ../ablehearts-content && git add posts && git commit -m "Add post: <title>" && git pull --rebase && git push
```

Like `cloudinary:sync`, changes are detected by MD5 hash. `.sync/website-hashes.json` records the hash of what was last copied for each post, so the export can tell which side changed:

| Situation | Result |
| --- | --- |
| New post in the code | added |
| Changed in the code, untouched in the editor | updated |
| Unchanged in the code | skipped, so editor changes are kept |
| Changed in both places | conflict: skipped and listed, merge by hand |

`--force` takes the code version for every post, discarding editor changes. Nothing is ever deleted, because posts created in the editor have no code counterpart.

After the website switches to reading from this repo, edit posts here only.
