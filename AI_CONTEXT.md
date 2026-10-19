# AI Context & Development Guide

Quick orientation for AI coding assistants and developers working on Yves Spiri's
portfolio site, https://yvesspiri.net/.

## Overview
- **Design:** direction H2 "backroom, broken": a slightly broken retro-futurist file
  browser. Striped window title bars, a directory listing as navigation, damp
  institutional colours, scanlines, a flickering fluorescent wash and a few small
  glitches.
- **Stack:** plain static HTML/CSS. A Node ESM script (`scripts/build-site.mjs`, no
  dependencies) renders every page from the content in `src/data/`.
- **Deployment:** GitHub Pages serves the repo root of `main`. The push is the deploy.

## Project structure
- `src/data/site.js`: meta, home readme, featured release, links, about, mixing & mastering.
- `src/data/projects.js`: `musicProjects` and `filmProjects`.
- `src/assets/site.css`: the shared stylesheet. Tokens are the custom properties in
  `:root`. The first part is the reference implementation; inner page additions are
  near the end, before the responsive and reduced-motion blocks.
- `src/assets/site.js`: the only script, for the atmospheric error dialog.
- `scripts/build-site.mjs`: the components (window, directory listing, readme, inset,
  embed) and every page.
- `scripts/dev-server.mjs`: static server that behaves like GitHub Pages.
- `images/`: cover art and photos (served as is).

**Generated, do not hand-edit:** `index.html`, `404.html`, `about/`, `music/`,
`film/`, `mixing/`, `contact/`, `assets/`. The build deletes and rewrites those folders.

## Pages
- `/` home: directory of the site, readme, a player with the featured release, error dialog.
- `/about/`, `/music/`, `/film/`, `/mixing/`: folder pages, one listing each, `../` first.
- `/music/<id>/`, `/film/<id>/`: entry pages (tracks, cover, readme, embed).
- `/contact/`: contact.txt shown in a window (old `/contact.txt` links forward there).
- `/404.html`: "not found". It also forwards the old single-page site's `/<id>` release
  links to `/music/<id>/`.

## Content rules (from the client brief)
- Text is always dark on a light surface.
- No all caps, no bold: every font is weight 400. Labels lowercase except proper names.
- Dates as `DD.MM.YY`, times 24h. The build throws on an em dash in copy.
- One corrupted detail per page at most (a cut-off date, a twitching row).
- Respect `prefers-reduced-motion`.

## Dates and sizes
The "modified" column is the last git commit touching the file behind a row (its
image, or the data file), in Europe/Zurich time, falling back to the file's mtime.
Sizes are real byte sizes.

## Workflows
- **Add a release:** put the cover in `images/`, add an entry to `musicProjects`
  (`id`, `title`, `description`, `image`, optional `extendedDescription`, `tracks` as
  `1. Name 04:23` lines, `credits`, `bandcampLink`, `embedUrl` or `soundcloudEmbed`).
- **Preview:** `npm run dev` (builds, then serves http://127.0.0.1:5173).
- **Publish:** `npm run build`, commit the regenerated files, push `main`.

## Playback
The repo has no audio files, so all players are the existing Bandcamp/SoundCloud
embeds (recoloured in `bandcamp()` / `soundcloud()`) and one Vimeo embed.
