/*
 * build-site.mjs — generates index.html from the Cargo template shell.
 *
 * Content source of truth:
 *   src/data/projects.js  (music + film entries)
 *   src/data/site.js      (header, hero, about, mixing, footer)
 *
 * Shell source: template.html (a Cargo "Graphic F992" export). The Cargo
 * frontend renders everything client-side from window.__PRELOADED_STATE__,
 * so building the site means rewriting that state object.
 *
 * The release pages — cover beside a numbered track list, a "More" disclosure
 * for extra notes, embedded player — follow the layout of player.html
 * (Cargo "~Template K999").
 *
 * Writes index.html and 404.html to the repo root. GitHub Pages serves that
 * root directly off main, so images/ and CNAME are committed there as-is and
 * a build is published simply by pushing.
 *
 * NOTE: the Cargo router resolves pages against location.pathname, so the
 * generated page only renders when served from the root of a domain.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { musicProjects, filmProjects } from "../src/data/projects.js";
import { siteMeta, hero, links, about, mixing, displayFont } from "../src/data/site.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = resolve(root, "template.html");
const OUT = resolve(root, "index.html");
const NOT_FOUND = resolve(root, "404.html");

/* ------------------------------------------------------------------ utils */

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const nl2br = (s = "") => esc(s).replace(/\n/g, "<br />\n");

/** Deterministic Cargo-style page id: one letter + 10 digits. */
const pageId = (seed) => {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const letter = String.fromCharCode(65 + (h % 26));
  const digits = String(h).padStart(10, "0").slice(0, 10);
  return letter + digits;
};

/** "Released by Nostro Hood System" -> "Nostro Hood System" */
const labelOf = (project) => {
  const m = /Released by ([^\n]+)/.exec(project.credits || "");
  return m ? m[1].split(/ on /)[0].trim() : "";
};

/** Parse "1. Corroded 04:23\n2. Slide 03:40" into rows. */
const parseTracks = (tracks) => {
  if (!tracks) return null;
  const lines = tracks.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const m = /^(\d+)\.\s*(.*?)(?:\s+(\d{1,2}:\d{2}))?$/.exec(line);
    if (!m) return null; // not a numbered track list (e.g. free-form notes)
    rows.push({ num: m[1], title: m[2], duration: m[3] || "" });
  }
  return rows.length ? rows : null;
};

/* -------------------------------------------------------- content builders */

/** player.html-style track list: number · title · duration, hairline rows. */
const trackList = (rows) =>
  `<div class="tracklist">` +
  rows
    .map(
      (t) =>
        `<div class="track"><span class="tnum">${esc(t.num)}</span>` +
        `<span class="tname">${esc(t.title)}</span>` +
        `<span class="tdur">${esc(t.duration)}</span></div>`
    )
    .join("") +
  `</div>`;

/** Recolour a Bandcamp embed to sit on the dark panel background. */
const darkEmbed = (url) =>
  url.replace(/bgcol=[0-9a-fA-F]+/, "bgcol=0d0d0d").replace(/linkcol=[0-9a-fA-F]+/, "linkcol=ffffff");

const embed = (project) => {
  if (project.embedUrl)
    return `<iframe class="embed embed-bandcamp" src="${esc(darkEmbed(project.embedUrl))}" title="${esc(
      project.title
    )} — Bandcamp player" loading="lazy"></iframe>`;
  if (project.soundcloudEmbed)
    return `<iframe class="embed embed-soundcloud" src="${esc(
      project.soundcloudEmbed
    )}" title="${esc(project.title)} — SoundCloud player" allow="autoplay" loading="lazy"></iframe>`;
  return "";
};

/*
 * Panels are regular Cargo pages, not overlay pages: in a static export an
 * overlay that has been closed cannot be reopened (its container stays stuck
 * mid-close-animation — reproducible on the untouched template), which would
 * break every panel link after the first close. Regular pages also give us
 * working deep links for free.
 */
const closeRow = () =>
  `<div class="panel-close"><a class="caption" href="/" rel="history">(Close)</a></div>`;

/* ------------------------------------------------------------- page bodies */

const headerDesktop = () => `<column-set>
<column-unit slot="0"><span class="circled">INDEX</span><a href="/" rel="history">${esc(
  siteMeta.name
)}</a><br />Sound Design · Music · Engineering</column-unit>
<column-unit slot="1"><span class="circled">WORK</span><a class="to-music" href="/" rel="history">Music</a><br /><a href="film" rel="history">Film</a><br /><a href="mixing" rel="history">Mixing &#x26; Mastering</a></column-unit>
<column-unit slot="2"><span class="circled">CONTACT</span><a href="mailto:${esc(
  siteMeta.email
)}">${esc(siteMeta.email)}</a><br /><a href="about" rel="history">About</a></column-unit>
<column-unit slot="3"><span class="circled">FOLLOW</span>${links
  .map((l) => `<a href="${esc(l.href)}" target="_blank">${esc(l.label)}</a>`)
  .join("<br />")}</column-unit>
</column-set>`;

const headerMobile = () => `<column-set gutter="1rem" mobile-stack="false">
<column-unit slot="0"><a href="/" rel="history">${esc(
  siteMeta.name
)}</a><br /><br /><a class="to-music" href="/" rel="history">Music</a><br /><a href="film" rel="history">Film</a><br /><a href="mixing" rel="history">Mixing &#x26; Mastering</a><br /><a href="about" rel="history">About</a></column-unit>
<column-unit slot="1"><span class="circled">CONTACT</span><a href="mailto:${esc(
  siteMeta.email
)}">${esc(siteMeta.email)}</a><br /><br /><span class="circled">FOLLOW</span>${links
  .map((l) => `<a href="${esc(l.href)}" target="_blank">${esc(l.label)}</a>`)
  .join("<br />")}</column-unit>
</column-set>`;

const mainTitle = () => `<h2>${esc(hero.eyebrow)}</h2><br />
<br />
<br />
<column-set gutter="8rem"><column-unit slot="0" span="2"></column-unit><column-unit slot="1" span="8"><h1 uses="fit-text"><a href="#main-scroll" rel="history">${esc(
  hero.title
)}</a></h1></column-unit><column-unit slot="2" span="2"></column-unit></column-set><br />
<br />
<br />
<h2 style="--font-scale: 0.55;"><i>${hero.subtitle}</i></h2>`;

const mainScroll = () =>
  musicProjects
    .map((p) => {
      const label = labelOf(p);
      return `<div class="scroll-item"><a href="${esc(p.id)}" rel="history"><img src="${esc(
        p.image
      )}" alt="${esc(p.title)}" loading="lazy" /></a><span class="caption"><b>${esc(
        p.title
      )}</b>${label ? ` — ${esc(label)}` : ""}</span></div>`;
    })
    .join("\n");

const footer = () => `<column-set gutter="1" mobile-stack="false">
<column-unit slot="0" span="9">${esc(siteMeta.name)} — Sound, Music, Engineering — ${esc(
  siteMeta.year
)}</column-unit>
<column-unit slot="1" span="3"><div style="text-align: right"><span class="circled">${esc(
  siteMeta.place
)}</span></div></column-unit>
</column-set>`;

const releasePanel = (project, prev, next) => {
  const label = labelOf(project);
  const rows = parseTracks(project.tracks);
  const meta = [label, rows ? `${rows.length} track${rows.length > 1 ? "s" : ""}` : ""]
    .filter(Boolean)
    .join(" · ");

  // player.html's "More" info panel, inlined: a second overlay on top of this
  // one cannot be reopened once dismissed, so disclose the notes in place.
  const notes = project.extendedDescription
    ? `<details class="notes"><summary><u><b>More</b></u></summary>${nl2br(
        project.extendedDescription
      )}</details>`
    : "";

  const body = [
    `<h2 style="--font-scale: 0.6;">${esc(project.title)}</h2><br />`,
    meta ? `<span class="caption">${esc(meta)}</span><br />` : "",
    `${nl2br(project.description)}<br />`,
    notes,
    `<br />`,
    // Entries without a numbered track list (e.g. single sound pieces) carry
    // that information in their description already.
    rows ? trackList(rows) : "",
    `<br />`,
    embed(project),
    project.credits ? `<br /><span class="caption">${nl2br(project.credits)}</span>` : "",
    project.bandcampLink
      ? `<br /><a class="button" href="${esc(project.bandcampLink)}" target="_blank">Listen on Bandcamp ↗</a>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `${closeRow()}<column-set gutter="2.5rem" mobile-gutter="2rem" mobile-stack="true">
<column-unit slot="0" span="5"><img class="cover" src="${esc(project.image)}" alt="${esc(
    project.title
  )}" /></column-unit>
<column-unit slot="1" span="7">${body}</column-unit>
</column-set><br />
<hr /><column-set gutter="1" mobile-stack="false">
<column-unit slot="0" span="6"><span class="caption"><a href="${esc(
    prev.id
  )}" rel="history">← ${esc(prev.title)}</a></span></column-unit>
<column-unit slot="1" span="6"><div style="text-align: right"><span class="caption"><a href="${esc(
    next.id
  )}" rel="history">${esc(next.title)} →</a></span></div></column-unit>
</column-set>`;
};

const aboutPanel = () => `${closeRow()}<column-set gutter="2.5rem" mobile-gutter="2rem" mobile-stack="true">
<column-unit slot="0" span="4"><img class="cover" src="${esc(about.image)}" alt="${esc(
  siteMeta.name
)}" /><span class="caption photo-credit">Photo by <a href="${esc(
  about.photoCredit.href
)}" target="_blank">${esc(about.photoCredit.display)}</a></span></column-unit>
<column-unit slot="1" span="8"><h2 style="--font-scale: 0.6;">${esc(about.heading)}</h2><br />
${about.paragraphs.map((p) => nl2br(p)).join("<br />\n<br />\n")}<br />
<br />
<hr /><br />
<column-set gutter="1rem" mobile-stack="false">
<column-unit slot="0" span="6"><span class="circled">EMAIL</span><a href="mailto:${esc(
  siteMeta.email
)}">${esc(siteMeta.email)}</a></column-unit>
<column-unit slot="1" span="6">${links
  .map(
    (l) =>
      `<div class="contact-item"><span class="circled">${esc(
        l.label.toUpperCase()
      )}</span><a href="${esc(l.href)}" target="_blank">${esc(l.display)}</a></div>`
  )
  .join("")}</column-unit>
</column-set></column-unit>
</column-set>`;

const filmPanel = () => {
  const items = filmProjects
    .map((p) => {
      const caption = `<h2 style="--font-scale: 0.5;">${esc(p.title)}</h2>${
        p.status ? `<br /><span class="caption">${esc(p.status)}</span>` : ""
      }<br />
${nl2br(p.description)}`;

      // Trailers get the full width; posters sit beside their text.
      if (p.embedUrl)
        return `<div class="video"><iframe src="${esc(p.embedUrl)}" title="${esc(
          p.title
        )}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><br />
${caption}`;

      return `<column-set gutter="2.5rem" mobile-gutter="2rem" mobile-stack="true">
<column-unit slot="0" span="5"><img class="cover" src="${esc(p.image)}" alt="${esc(
        p.title
      )}" /></column-unit>
<column-unit slot="1" span="7">${caption}</column-unit>
</column-set>`;
    })
    .join("<br />\n<br />\n<hr /><br />\n");

  return `${closeRow()}<h2 style="--font-scale: 0.7;">Film</h2><br />\n<br />\n${items}`;
};

const mixingPanel = () => `${closeRow()}<h2 style="--font-scale: 0.7;">${mixing.heading}</h2><br />
<br />
${nl2br(mixing.lead)}<br />
<br />
<hr /><br />
<span class="circled">${esc(mixing.referenceLabel.toUpperCase())}</span>${mixing.reference}<br />
<br />
${nl2br(mixing.closing)}<br />
<br />
<a class="button" href="mailto:${esc(siteMeta.email)}">${esc(mixing.ctaLabel)}</a>`;

/* ------------------------------------------------------------- page models */

const panelCss = (id, maxWidth = "68rem") => `[id="${id}"].page {
	justify-content: center;
	min-height: var(--viewport-height);
}

[id="${id}"] .page-layout {
	max-width: ${maxWidth};
	align-items: flex-start;
	padding-top: 8rem;
	padding-bottom: 8rem;
	padding-left: 1rem;
	padding-right: 1rem;
}

[id="${id}"] .page-content {
	text-align: left;
	height: auto;
	padding: 2rem;
	background-color: #0d0d0d;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 0.4rem;
	box-shadow: 0rem 0rem 3rem 0rem rgba(0, 0, 0, 0.6);
}`;

const makePage = ({
  purl,
  title,
  content,
  localCss = null,
  pin = false,
  pinOptions = {},
  stacked = false,
}) => ({
  id: pageId(purl),
  title,
  purl,
  page_type: "page",
  content,
  local_css: localCss,
  display: true,
  stack: false,
  pin,
  overlay: false,
  password_enabled: false,
  page_count: 0,
  page_design_options: null,
  backdrops: { activeBackdrop: "none" },
  pin_options: pinOptions,
  overlay_options: {},
  thumb_media_id: null,
  thumbnail: null,
  thumb_meta: [],
  media: [],
  tags: [],
  access_level: "public",
  __stacked: stacked,
});

const buildPages = () => {
  const pages = [];

  pages.push(
    makePage({
      purl: "header-desktop",
      title: "Header (desktop)",
      content: headerDesktop(),
      pin: true,
      pinOptions: {
        screen_visibility: "desktop",
        position: "top",
        fixed: true,
        adjust: false,
      },
      localCss: `[id="${pageId("header-desktop")}"].page {
	min-height: auto;
}

[id="${pageId("header-desktop")}"] .page-layout {
	align-items: flex-start;
}`,
    }),
    makePage({
      purl: "header-mobile",
      title: "Header (mobile)",
      content: headerMobile(),
      pin: true,
      pinOptions: {
        screen_visibility: "mobile",
        position: "top",
        fixed: false,
        adjust: false,
      },
      localCss: `[id="${pageId("header-mobile")}"].page {
	min-height: auto;
}

[id="${pageId("header-mobile")}"] .page-layout {
	align-items: flex-start;
}`,
    }),
    makePage({
      purl: "clock",
      title: "Clock",
      content: `<digital-clock pad-hour="true" twentyfour-hour="true" value="{hour}:{minute}:{second}"></digital-clock>`,
      pin: true,
      pinOptions: {
        screen_visibility: "desktop",
        position: "top",
        fixed: true,
        adjust: false,
      },
      localCss: `[id="${pageId("clock")}"] .page-content {
	text-align: right;
}`,
    }),
    makePage({
      purl: "main-title",
      title: "Main title",
      content: mainTitle(),
      stacked: true,
      localCss: `[id="${pageId("main-title")}"].page {
	min-height: var(--viewport-height);
}

[id="${pageId("main-title")}"] .page-content {
	align-items: center;
	text-align: center;
}

[id="${pageId("main-title")}"] .page-layout {
	align-items: center;
}`,
    }),
    makePage({
      purl: "main-scroll",
      title: "Main scroll",
      content: mainScroll(),
      stacked: true,
      localCss: `[id="${pageId("main-scroll")}"] .page-layout {
	max-width: 100%;
	align-items: flex-start;
	padding-top: 10rem;
	padding-bottom: 10rem;
}

[id="${pageId("main-scroll")}"].page {
	justify-content: flex-start;
	min-height: auto;
}

[id="${pageId("main-scroll")}"] .page-content {
	text-align: center;
	padding: 1rem;
}`,
    }),
    makePage({
      purl: "footer",
      title: "Footer",
      content: footer(),
      pin: true,
      pinOptions: {
        screen_visibility: "all",
        position: "bottom",
        fixed: true,
        adjust: false,
      },
    })
  );

  musicProjects.forEach((project, i) => {
    const prev = musicProjects[(i - 1 + musicProjects.length) % musicProjects.length];
    const next = musicProjects[(i + 1) % musicProjects.length];
    pages.push(
      makePage({
        purl: project.id,
        title: project.title,
        content: releasePanel(project, prev, next),
        localCss: panelCss(pageId(project.id)),
      })
    );
  });

  pages.push(
    makePage({
      purl: "about",
      title: "About",
      content: aboutPanel(),
      localCss: panelCss(pageId("about")),
    }),
    makePage({
      purl: "film",
      title: "Film",
      content: filmPanel(),
      localCss: panelCss(pageId("film"), "56rem"),
    }),
    makePage({
      purl: "mixing",
      title: "Mixing & Mastering",
      content: mixingPanel(),
      localCss: panelCss(pageId("mixing"), "48rem"),
    })
  );

  return pages;
};

/* -------------------------------------------------------------- stylesheet */

/** Styles for the plain-HTML pieces the Cargo template has no components for. */
const EXTRA_CSS = `

/* ---------------- Yves Spiri: site additions ---------------- */

bodycopy a:hover,
.caption a:hover,
.circled a:hover {
	color: rgba(255, 255, 255, 0.95);
}

bodycopy img {
	display: block;
	max-width: 100%;
	height: auto;
}

/* Release covers in the main scroll */
/* One cover per row, centred column — the template's single-scroll layout. */
.scroll-item {
	display: block;
	width: 100%;
	max-width: 40rem;
	margin: 0 auto 6rem auto;
	text-align: left;
}

.scroll-item:last-child {
	margin-bottom: 0;
}

.scroll-item img {
	width: 100%;
	transition: opacity 300ms ease-in-out;
}

.scroll-item a:hover img {
	opacity: 0.75;
}

.scroll-item .caption {
	margin-top: 1em;
}

body.mobile .scroll-item {
	max-width: 100%;
}

/* Panels (release / about / film / mixing) */
.panel-close {
	text-align: right;
	margin-bottom: 1.5rem;
}

.cover {
	width: 100%;
}

.contact-item + .contact-item {
	margin-top: 0.7em;
}

.photo-credit {
	margin-top: 0.75em;
	font-style: italic;
	text-align: right;
}

.video {
	position: relative;
	width: 100%;
	padding-bottom: 56.25%;
}

.video iframe {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border: 0;
}

/* "More" notes disclosure */
.notes summary {
	display: inline-block;
	cursor: pointer;
	list-style: none;
	margin-top: 0.5em;
}

.notes summary::-webkit-details-marker,
.notes summary::marker {
	display: none;
	content: "";
}

.notes[open] summary {
	margin-bottom: 0.5em;
}

/* Track lists — after player.html */
.tracklist {
	font-family: "Diatype Variable";
	font-variation-settings: 'slnt' 0, 'MONO' 0;
	font-size: 1rem;
	margin: 0.5em 0 0 0;
}

.track {
	display: flex;
	align-items: baseline;
	gap: 1em;
	padding: 0.6em 0;
	border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.track:last-child {
	border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.tnum {
	flex: 0 0 1.5em;
	color: rgba(255, 255, 255, 0.35);
}

.tname {
	flex: 1 1 auto;
	color: rgba(255, 255, 255, 0.85);
}

.tdur {
	flex: 0 0 auto;
	color: rgba(255, 255, 255, 0.35);
	font-variant-numeric: tabular-nums;
}

/* Embedded players */
.embed {
	display: block;
	width: 100%;
	border: 0;
	background: #000000;
}

.embed-bandcamp {
	height: 42px;
}

.embed-soundcloud {
	height: 166px;
}

/* Buttons */
.button {
	display: inline-block;
	padding: 0.5em 1.1em;
	border-radius: 10em;
	background: rgba(255, 255, 255, 0.14);
	color: rgba(255, 255, 255, 0.85) !important;
	line-height: normal;
	margin-top: 0.5em;
}

.button:hover {
	background: rgba(255, 255, 255, 0.24);
}

/* Display face for the name on the home page — see displayFont in src/data/site.js */
h1 {
	font-weight: ${displayFont.weight};
	letter-spacing: ${displayFont.letterSpacing};
}

/*
 * The WebGL treatment of that name (scripts/hero-effect.js). The .hero-gl class
 * is only added once a GL context exists, so without WebGL the plain text shows.
 */
h1.hero-gl {
	position: relative;
}

h1.hero-gl a {
	color: transparent;
}

.hero-gl-canvas {
	position: absolute;
	pointer-events: none;
	z-index: 1;
}
`;

/* ------------------------------------------------------------------- build */

const shell = readFileSync(SHELL, "utf8");

const stateMatch = /window\.__PRELOADED_STATE__=(\{[\s\S]*?\});?<\/script>/.exec(shell);
if (!stateMatch) throw new Error("Could not find __PRELOADED_STATE__ in template.html");
const base = JSON.parse(stateMatch[1]);

const pages = buildPages();
const stacked = pages.filter((p) => p.__stacked);

/*
 * The template's h1 face (UnifrakturMaguntia) is a Google font the Cargo runtime
 * loads from site.fonts, so swapping the display face means swapping it in both
 * the stylesheet and that list.
 */
const TEMPLATE_DISPLAY_FONT = "UnifrakturMaguntia";
const baseStylesheet = base.css.stylesheet;
if (!baseStylesheet.includes(TEMPLATE_DISPLAY_FONT)) {
  throw new Error(`Expected ${TEMPLATE_DISPLAY_FONT} in the template stylesheet`);
}
const stylesheet =
  baseStylesheet.replaceAll(TEMPLATE_DISPLAY_FONT, `"${displayFont.family}"`) + EXTRA_CSS;
const fonts = base.site.fonts
  .map((f) =>
    f.family === TEMPLATE_DISPLAY_FONT
      ? { family: displayFont.family, provider: displayFont.provider || "google" }
      : f
  )
  // A Cargo family may already be listed — the runtime must not load it twice.
  .filter((f, i, all) => all.findIndex((o) => o.family === f.family) === i);

const state = {
  ...base,
  structure: {
    byParent: { root: pages.map((p) => p.id) },
    bySort: Object.fromEntries(pages.map((p, i) => [p.id, i])),
    indexById: Object.fromEntries(
      pages.map((p) => [p.id, p.__stacked ? stacked.indexOf(p) : null])
    ),
    liveIndexes: {},
  },
  site: {
    ...base.site,
    fonts,
    website_title: siteMeta.title,
    has_site_description: true,
    site_description: siteMeta.description,
    is_template: false,
    can_duplicate: false,
    can_copy: false,
    screenshot: null,
    site_preview_url: null,
  },
  pages: {
    byId: Object.fromEntries(
      pages.map((p) => {
        const { __stacked, ...page } = p;
        return [page.id, page];
      })
    ),
  },
  sets: {
    byId: {
      ...base.sets.byId,
      root: { ...base.sets.byId.root, page_count: stacked.length },
    },
  },
  media: { data: [] },
  css: { ...base.css, stylesheet },
  frontendState: {
    ...base.frontendState,
    hostname: "yvesspiri.net",
    activePID: "root",
    renderedPages: [],
    fontsLoaded: base.frontendState.fontsLoaded.map((f) =>
      f === TEMPLATE_DISPLAY_FONT ? displayFont.family : f
    ),
  },
};

const stateJson = JSON.stringify(state).replace(/</g, "\\u003c");

let html = shell
  // function form: the state JSON must not be read as $-replacement patterns
  .replace(stateMatch[0], () => `window.__PRELOADED_STATE__=${stateJson}</script>`)
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(siteMeta.title)}</title>`)
  .replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${esc(siteMeta.description)}">`
  )
  .replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${esc(siteMeta.title)}">`
  )
  .replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${esc(siteMeta.description)}">`
  )
  .replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${esc(siteMeta.title)}">`
  )
  .replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${esc(siteMeta.description)}">`
  )
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="https://yvesspiri.net">`)
  // Cargo-hosted preview images for the source template — not this site.
  .replace(/\s*<meta name="twitter:card" content="[^"]*">/, "")
  .replace(/\s*<meta name="twitter:image" content="[^"]*">/, "")
  .replace(/\s*<meta property="og:image" content="[^"]*">/, "")
  // The shell ships a server-rendered copy of the template's own pages;
  // the Cargo frontend renders our state client-side instead.
  .replace(/<div class="content">[\s\S]*<\/div>(?=\s*<script src=)/, '<div class="content"></div>')
  // The body carries a static copy of the site stylesheet, and the frontend
  // keeps using that element rather than re-emitting it from the state.
  .replace(
    /(<customhtml><\/customhtml><style>)[\s\S]*?(<\/style><style id="mobile-offset-styles">)/,
    (_m, open, close) => open + state.css.stylesheet + close
  );

if (!html.includes(".scroll-item")) throw new Error("Site stylesheet was not replaced");

/*
 * Scrolling to the cover scroll, from the hero title (#main-scroll) and from the
 * "Music" nav link (a.to-music). The template's own scroll-to-page link only
 * nudges the page a few pixels in a static export, so take those clicks over.
 * "Music" also has to work from a release page, where that section is not on the
 * page at all: there it navigates home and scrolls once home has rendered.
 */
const BOOT_SCRIPT = `<script>(function(){
	var KEY = "yvs:scroll-to-music";

	function clearPending() {
		try { sessionStorage.removeItem(KEY); } catch (e) {}
	}

	function scrollWhenReady() {
		var tries = 0;
		var timer = setInterval(function() {
			if (scrollToId("main-scroll")) {
				clearInterval(timer);
				clearPending();
			} else if (++tries > 60) {
				clearInterval(timer);
			}
		}, 150);
	}

	function scrollToId(id) {
		var target = document.getElementById(id);
		if (!target) return false;
		var top = target.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({ top: top, behavior: "smooth" });
		// Not every browser honours smooth here; land it either way.
		setTimeout(function() {
			if (Math.abs(window.scrollY - top) > 4) window.scrollTo(0, top);
		}, 700);
		return true;
	}

	document.addEventListener("click", function(event) {
		if (!event.target.closest) return;
		var link = event.target.closest('a[href^="#"], a.to-music');
		if (!link) return;
		var href = link.getAttribute("href");
		var id = href.charAt(0) === "#" ? href.slice(1) : "main-scroll";
		if (document.getElementById(id)) {
			event.preventDefault();
			event.stopPropagation();
			scrollToId(id);
		} else if (link.classList.contains("to-music")) {
			// Not on the home page — let the link navigate home, then scroll once
			// the section renders. The flag covers the case where following the
			// link reloads the document and kills the poll below.
			try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
			scrollWhenReady();
		}
	}, true);

	var pending;
	try { pending = sessionStorage.getItem(KEY); } catch (e) {}
	if (pending) {
		clearPending();
		scrollWhenReady();
	}
})();</script>`;

const heroEffect = readFileSync(resolve(root, "scripts/hero-effect.js"), "utf8");
if (heroEffect.includes("</script")) throw new Error("hero-effect.js cannot contain </script");

html = html.replace(
  "</body>",
  `\t\t${BOOT_SCRIPT}\n\t\t<script>\n${heroEffect}\n\t\t</script>\n\t</body>`
);

if (html.includes("Curzio") || html.includes("Kaputt") || html.includes("cargoworld")) {
  throw new Error("Template placeholder content leaked into the output");
}

writeFileSync(OUT, html);

// GitHub Pages has no history fallback: deep links (/about, /true-bug, …)
// are served 404.html, which boots the same app and resolves the route.
writeFileSync(NOT_FOUND, html);

console.log(
  `built index.html + 404.html — ${pages.length} pages ` +
    `(${stacked.length} stacked, ${musicProjects.length} releases, ${filmProjects.length} film)`
);
