# AI Context & Development Guide

This file is intended to help AI coding assistants and developers quickly understand the project structure, tech stack, and conventions for Yves Spiri's portfolio website.

## Project Overview
- **Name:** Yves Spiri Portfolio
- **Purpose:** Personal portfolio showcasing Sound Design, Music, and Engineering work.
- **Tech Stack:**
  - **Site:** a single generated `index.html` built on a Cargo site template (`template.html`), rendered client-side by the Cargo frontend (`build.cargo.site`).
  - **Generator:** plain Node ESM script, no bundler (`scripts/build-site.mjs`).
  - **Content:** JS data modules in `src/data/`.
  - **Deployment:** GitHub Pages, serving the repo root of `main` directly.

## How the site works
`template.html` is an export of the Cargo template "Graphic F992". Cargo sites render
entirely client-side from a `window.__PRELOADED_STATE__` object: pages, their HTML
content, and the site stylesheet all live in that JSON. The build script therefore
"fills in the template" by rewriting that state with content from `src/data/`, and
writes the result to `index.html`.

Layout of the release pages (cover + numbered track list + a "More" notes disclosure
+ embedded player) is taken from `player.html`, the Cargo template "~Template K999".

Two constraints follow from this:

1. **The site must be served from the root of a domain.** Cargo's router resolves
   pages against `location.pathname`, so serving it from a subdirectory renders
   "Page not found". `yvesspiri.net` is a root domain, so this is fine.
2. **It needs Cargo's CDN** (`build.cargo.site` for the frontend, `type.cargo.site`
   for the fonts). The page does not render offline.

The release/about/film/mixing views are **regular Cargo pages**, styled as a card, not
overlay pages. Cargo's overlays cannot be reopened after being closed in a static
export — the container stays stuck mid-close-animation, which is reproducible on the
untouched `template.html` — so every panel link would die after the first close.
Regular pages also give real URLs (`/true-bug`, `/about`) for free.

`dist/404.html` is a copy of `index.html` so GitHub Pages serves those deep links
instead of its own 404.

The generator appends one small script to the page: the template's "scroll to the
next stacked page" link only nudges the viewport a few pixels in a static export, so
that script takes over clicks on `#main-scroll` (hero title) and `a.to-music` (the
"Music" nav link, which also has to navigate home first when you are on a release
page) and scrolls to the cover scroll itself.

## Project Structure
- **`template.html`**: the Cargo template shell — build input, do not hand-edit.
- **`player.html`**: reference only — the Cargo audio/album template the release panels are modelled on.
- **`index.html`**: **generated** by `npm run build`. Never edit by hand; edits are overwritten.
- **`scripts/`**
  - `build-site.mjs`: generates `index.html` and assembles `dist/`.
  - `dev-server.mjs`: static preview server with a root-path fallback.
  - `hero-effect.js`: the WebGL treatment of the name on the home page, inlined
    into the built page. Raw WebGL, no dependencies.
- **`src/data/`**: **content lives here.**
  - `projects.js`: `musicProjects` and `filmProjects` arrays.
  - `site.js`: header/nav, hero, about, mixing & mastering, footer.
- **`public/images/`**: cover art and photos, copied to `dist/images/`.
- **`public/CNAME`**: custom domain, copied to `dist/`.
- **`dist/`**: build output (git-ignored).
- **`src/pages`, `src/components`, `src/App.jsx`, …**: the previous React/Vite site.
  Retired — kept for reference, no longer built or deployed. `vite.config.js`,
  `tailwind.config.js` and the React dependencies are likewise unused.

## Key Workflows

### 1. Adding or editing a project
1. **Add assets:** place images in `public/images/`.
2. **Update data:** edit `src/data/projects.js`.
3. **Rebuild:** `npm run build`.
   - **Structure:**
     ```javascript
     {
       id: "unique-id",           // also the URL path and panel purl
       title: "Project Title",
       description: "Description text...",
       image: "/images/filename.jpg",
       // optional:
       extendedDescription: "...", // adds a "More" notes panel
       tracks: "1. Track Name 04:23\n2. …", // numbered lines become the track list
       credits: "…\nReleased by Label",     // "Released by X" also becomes the subtitle
       embedUrl: "…",              // Bandcamp embed (recoloured for the dark panel)
       soundcloudEmbed: "…",
       bandcampLink: "…",
       status: "Work in Progress (2026)",   // film entries
     }
     ```

### 2. Development commands
- **Preview:** `npm run dev` (builds, then serves `http://127.0.0.1:5173`)
- **Build:** `npm run build` (writes `index.html` and `404.html`)
- **Preview the built output:** `npm run preview`
- **Deploy:** none — commit the build and push `main`.

## Design System & Styling
- All styling comes from the Cargo template's stylesheet, which the generator
  extends with an "additions" block (`EXTRA_CSS` in `scripts/build-site.mjs`) for the
  pieces the template has no components for: cover scroll, track lists, panels,
  embeds, buttons.
- **One row, one measure.** Every view is built from `coverRow()` — a cover in a
  5/7 `column-set` beside its text, stacking on mobile — separated by
  `ROW_SEPARATOR`. The home scroll, the release panels, the film entries, the
  mixing references and the about photo all go through it, and all sit in the
  same `MEASURE` (56rem) column. Change either constant and every view moves
  together; that is the point. Entry headings are `--font-scale: 0.5`, page
  headings `0.7`.
- The home scroll's rows are a way *into* a release, not the release itself: the
  track list and the audio embed stay on the release page.
- Typography: Gaisyr (`h1`, `h2`), Repro Variable (body), Diatype Variable (track
  lists) — all Cargo fonts embedded in the shell, no external font request. The
  face for the big name is `displayFont` in `src/data/site.js` (the template's own
  was UnifrakturMaguntia). A Google Fonts family also works: set
  `provider: "google"`, and the generator swaps the name in the stylesheet and in
  `site.fonts`, which makes the Cargo runtime inject the `fonts.googleapis.com`
  link at load time.
- The name's character comes from `scripts/hero-effect.js` rather than the
  typeface: the h1's glyphs are drawn to a 2D canvas in that same font, uploaded
  as a texture, and sampled through a drifting flow field, a lens that wanders on
  its own, and a second lens that follows the pointer, with a little chromatic
  split. The first two need no cursor: the name is never still. The same
  distortion also ramps up as the title scrolls off the top — 0 at rest, 7× once
  it has cleared the viewport. Tuning knobs are in the shader and in `frame()`:
  `uAmp` (ambient warp, ~0.4% of the width), the flow field's `uTime` factors
  (~0.02, i.e. one drift every few minutes), the self-driven lens (`0.11`/`0.083`
  Lissajous rates, `1.5` amplitude, `9.0` falloff — broader and weaker than the
  pointer's `2.6`/`16.0`), `uSplit`, and the `exit` curve (`1.6` exponent, `* 6`
  amplitude and `* 4` split factors). It only takes over once a GL context exists,
  pauses off-screen, caps device pixel ratio at 2, and freezes entirely under
  `prefers-reduced-motion` — that is the one thing that stops the drift.
- Sizes are in `rem`, and Cargo scales the root font size per viewport — prefer `rem`
  over `px` so mobile scaling keeps working.
- The stylesheet exists twice in the output (in the state JSON *and* as a `<style>`
  in the body); the generator writes both, and asserts it did.

## Deployment
Hosted on GitHub Pages, serving the repo root of `main` directly — there is no
build step on the server and no separate deploy branch.
- **URL:** [https://yvesspiri.net/](https://yvesspiri.net/)
- **Publishing a change:** `npm run build`, commit the regenerated `index.html`
  and `404.html`, then push `main`. The push *is* the deploy.
- The served files are committed at the root: `index.html`, `404.html`,
  `images/`, `CNAME`, and `.nojekyll`. Everything else in the repo (`src/`,
  `scripts/`, `template.html`) is build input that happens to sit alongside them.
- `404.html` is a byte-for-byte copy of `index.html`: Pages has no history
  fallback, so deep links (`/about`, `/true-bug`, …) are served the 404, which
  boots the same app and resolves the route client-side.

## Recent Updates (as of July 2026)
- Rebuilt the site on the Cargo "Graphic F992" template, with release panels modelled
  on the "~Template K999" player template. Playback uses the existing Bandcamp and
  SoundCloud embeds (the repo has no audio files).
- The React/Vite app was retired in favour of the generated single-page site.
