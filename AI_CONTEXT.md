# AI Context & Development Guide

Quick orientation for AI coding assistants and developers working on Yves Spiri's
portfolio site, https://yvesspiri.net/.

## Overview
- **Design:** direction H2 "backroom, broken": a slightly broken retro-futurist file
  browser. Striped window title bars, a directory listing as navigation, damp
  institutional colours, scanlines, a fluorescent wash that drops out once every 18s
  and a few small glitches. Type is the Mac OS 9 pairing: Geneva for all text
  (system font on macOS, Verdana elsewhere, nothing hosted) and ChicagoFLF, a
  public-domain Chicago revival self-hosted from `src/assets/fonts/`, only for window
  titles. Chicago everywhere read as too bold.
- **Stack:** plain static HTML/CSS. A Node ESM script (`scripts/build-site.mjs`, no
  dependencies) renders every page from the content in `src/data/`.
- **Deployment:** GitHub Pages serves the repo root of `main`. The push is the deploy.

## Project structure
- `src/data/site.js`: meta, home readme, featured release, links, about, mixing & mastering.
- `src/data/projects.js`: `musicProjects`, `filmProjects` and `gameProjects`.
- `src/assets/site.css`: the shared stylesheet. Tokens are the custom properties in
  `:root`. The first part is the reference implementation; inner page additions are
  near the end, before the responsive and reduced-motion blocks.
- `src/assets/site.js`: the only script: landing track player and dock, embeds, page swaps.
- `scripts/build-site.mjs`: the components (window, directory listing, readme, inset,
  embed) and every page.
- `scripts/dev-server.mjs`: static server that behaves like GitHub Pages.
- `images/`: cover art and photos (served as is).

**Generated, do not hand-edit:** `index.html`, `404.html`, `about/`, `music/`,
`film/`, `games/`, `mixing/`, `contact/`, `assets/`. The build deletes and rewrites those folders.

## Pages
- `/` home: directory of the site, readme, the landing track player.
- `/about/`, `/music/`, `/film/`, `/games/`, `/mixing/`: folder pages, one listing each, `../` first.
- `/music/<id>/`, `/film/<id>/`, `/games/<id>/`: entry pages (tracks, cover or stills, readme, embed).
- `/contact/`: contact.txt shown in a window (old `/contact.txt` links forward there).
- `/404.html`: "not found". It also forwards the old single-page site's `/<id>` release
  links to `/music/<id>/`.

## Themes
- Four colour themes, switched by the swatches in every page header: `dumbo`
  (default), `backroom` (the original design), `glare` and `glitter`. All but backroom
  are drawn from reference images in `palettes/` (git-ignored, local only: never
  commit it).
- Themes live in `src/data/themes.js`, each with its full token set; `defaultTheme`
  picks the default. The build appends them to `assets/site.css`: the default as the
  base `:root`, the others as `:root[data-theme="…"]` overrides. The `:root` block in
  `src/assets/site.css` is only the fallback for tokens a theme leaves out. Derived
  colours (shadow, wallpaper stripes, scanlines, glitched rows) use
  `color-mix()` or `var()`, so they follow the theme.
- The choice is stored in `localStorage` (`ys-theme`); an inline script in `<head>`
  applies it before first paint.
- The build fails if any text colour is below 4.5:1 on a surface it is used on (the
  `USED` table in `build-site.mjs`). Embeds keep a fixed paper background; Bandcamp
  cannot be recoloured without reloading the player.

## Content rules (from the client brief)
- Text is always dark on a light surface.
- No all caps, no bold: every font is weight 400. Labels lowercase except proper names.
- Dates as `DD.MM.YY`, times 24h. The build throws on an em dash in copy.
- Glitches stay subtle. On every page view `site.js` gives one random listing row a
  glitch (`jitter`, `flicker`, `slip`, `chroma`, `stutter`, in rotation; CSS in
  `site.css`). The home and music listings also have one cut-off date. No
  "unreadable" note in the status bar.
- Respect `prefers-reduced-motion`.

## Dates and sizes
The "modified" column is the last git commit touching the file behind a row (its
image, or the data file), in Europe/Zurich time, falling back to the file's mtime.
Sizes are real byte sizes.

## Workflows
- **Add a release:** put the cover in `images/`, add an entry to `musicProjects`
  (`id`, `title`, `description`, `image`, optional `extendedDescription`, `tracks` as
  `1. Name 04:23` lines, `credits`, `bandcampLink`, `embedUrl` or `soundcloudEmbed`).
- **Add a game:** stills go in `images/` (from a trailer: `ffmpeg -ss <seconds> -i
  <trailer> -frames:v 1 -vf scale=1600:-2 -q:v 4 images/<name>.jpg`), then an entry in
  `gameProjects` (`id`, `title`, `description`, `credits`, `stills`, `link`). Trailers
  live in `gametrailer/`, which is git-ignored and never published.
- **Preview:** `npm run dev` (builds, then serves http://127.0.0.1:5173).
- **Publish:** `npm run build`, commit the regenerated files, push `main`.

## Playback
- **Home page player:** plays one unreleased track. The WAV lives in `landing_music/`,
  which is git-ignored and must never be committed. `npm run encode:landing --
  landing_music/<file>.wav` encodes it to AAC 128k in an .m4a (plays everywhere,
  ~4.5 MB), XOR-scrambles it with a random key into `media/<hash>.bin`, and writes
  `src/data/landing-track.json` (file, key, duration, waveform). Then `npm run build`.
  `site.js` fetches the file on first hover/focus/click of play, unscrambles it and
  plays a blob URL. This only stops casual downloading; the key is in the page.
  Title, artist and note are `landingTrack` in `src/data/site.js`.
- **Dock and background play:** every page carries a hidden `.dock` (the track's data
  plus a play/pause button), pinned bottom-right once the track starts. From then on,
  `site.js` swaps `main.page` in place for internal links ending in `/` (fetch +
  pushState, popstate on Back), so the one audio element keeps playing; other files
  (images) open in a new tab. Before the track starts, links navigate normally. Media
  Session handlers give lock-screen and media-key control. Anything bound to page
  content goes in `bindPage()`, which runs after every swap.
- **Embeds and the landing track never play together.** Bandcamp has no player API,
  so a click into an embed (window blur with an iframe focused) counts as it starting:
  the landing track pauses and its dock hides. Starting the landing track stops the
  embed by reloading its iframe. A started embed survives page swaps: its page is kept
  as `main.ghost` (fixed, clipped, invisible) and only its `.inset` shows, pinned to the
  corner as `.docked` with a close button. An iframe cannot be moved without reloading,
  which is why the whole old page stays.
- **Everything else:** the existing Bandcamp/SoundCloud embeds (recoloured in
  `bandcamp()` / `soundcloud()`) and one Vimeo embed.
- **Committing:** stage files by name, never `git add -A`, so nothing unreleased in the
  working tree gets published by accident.
