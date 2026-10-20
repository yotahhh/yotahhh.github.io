/*
 * build-site.mjs: generates the static site from src/data/.
 *
 * Every page is built from the same handful of components (window, directory
 * listing, readme, inset) defined below, styled by src/assets/site.css. The
 * output is plain HTML written to the repo root, which GitHub Pages serves
 * as is:
 *
 *   index.html                 home: directory of the site + readme + player
 *   about/ mixing/             folder pages, one listing each
 *   music/<id>/ film/<id>/ games/<id>/  entry pages, the section listed as a tree
 *   music/ film/ games/        the section's first entry page
 *   contact/                   contact.txt, shown in a window
 *   404.html                   "file not found", forwards the old /<id> links
 *   assets/                    site.css, site.js
 *
 * Dates in the "modified" column are real: the last git commit touching the
 * file behind each row (its image, or the data file), falling back to the
 * file's mtime. Sizes are real byte sizes.
 *
 *   node scripts/build-site.mjs
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { about, landingTrack, links, mixing, readme, siteMeta } from "../src/data/site.js";
import { filmProjects, gameProjects, musicProjects } from "../src/data/projects.js";
import { defaultTheme, themes } from "../src/data/themes.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const landingAudio = JSON.parse(readFileSync(join(root, "src/data/landing-track.json"), "utf8"));
const bandcampTracks = JSON.parse(readFileSync(join(root, "src/data/bandcamp-tracks.json"), "utf8"));
const OWNED_DIRS = ["about", "music", "film", "games", "mixing", "contact", "assets"];

// ---------- facts about files ----------

const fileTime = (rel) => {
  const abs = join(root, rel);
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", rel], { cwd: root }).toString().trim();
    if (out) return Number(out) * 1000;
  } catch {}
  return existsSync(abs) ? statSync(abs).mtimeMs : Date.now();
};
const imgPath = (src) => src.replace(/^\//, "");
const latest = (...times) => Math.max(...times);

const DATE = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich",
  day: "2-digit", month: "2-digit", year: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
// DD.MM.YY HH:MM, 24h
const fmtDate = (ms) => {
  const p = Object.fromEntries(DATE.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
};
const fmtSize = (bytes) => {
  if (bytes < 1024 * 100) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}K`;
  return `${(bytes / 1048576).toFixed(1)}M`;
};
const sizeOf = (rel) => fmtSize(statSync(join(root, rel)).size);

// ---------- helpers ----------

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Copy in the data files may contain HTML (links) and entities, so it is
// passed through, but stray "&" and em dashes are not allowed to slip in.
const copy = (s) => {
  if (/[—]/.test(s)) throw new Error(`em dash in copy: ${s}`);
  return String(s).replace(/&(?![#a-z0-9]+;)/gi, "&amp;");
};

// Bandcamp embeds, recoloured to sit on the paper panel.
const bandcamp = (url) =>
  url.replace(/bgcol=[0-9a-f]+/i, "bgcol=dcd6c1").replace(/linkcol=[0-9a-f]+/i, "linkcol=7a3b26").replace(/transparent=true\/?/, "");
const soundcloud = (url) => url.replace(/color=%23[0-9a-f]+/i, "color=%237a3b26") + "&visual=false";

// "1. Corroded 04:23" lines become tracks; anything else is a note.
const parseTracks = (text = "") => {
  const tracks = [];
  const notes = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/^(\d+)\.\s+(.*?)(?:\s+(\d{1,2}:\d{2}))?$/);
    if (m) tracks.push({ n: m[1].padStart(2, "0"), title: m[2], length: m[3] || "" });
    else notes.push(line);
  }
  return { tracks, notes };
};

// ---------- icons (decorative) ----------

const TINT = { about: "var(--f-about)", music: "var(--f-music)", film: "var(--f-film)", mixing: "var(--f-live)", games: "var(--f-sound)" };

const icon = {
  folder: (tint) => `<svg width="20" height="15" viewBox="0 0 20 15" aria-hidden="true"><path d="M1 2h7l2 2h9v10H1z" fill="${tint}" stroke="var(--ink)" stroke-width="1.5"/></svg>`,
  up: () => `<svg width="20" height="15" viewBox="0 0 20 15" aria-hidden="true"><path d="M1 2h7l2 2h9v10H1z" fill="none" stroke="var(--ink)" stroke-width="1.5"/></svg>`,
  file: () => `<svg width="20" height="15" viewBox="0 0 20 15" aria-hidden="true"><path d="M5 1h7l3 3v10H5z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/></svg>`,
  image: () => `<svg width="20" height="15" viewBox="0 0 20 15" aria-hidden="true"><path d="M3 2h14v11H3z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/><path d="M5 11l3.5-4 2.5 3 1.5-1.5L15 11z" fill="var(--ink-3)"/></svg>`,
  wave: () => `<svg width="20" height="15" viewBox="0 0 20 15" fill="none" stroke="var(--rust)" stroke-width="2" aria-hidden="true"><path d="M2 7.5v0M5 4v7M8 2v11M11 5v5M14 3v9M17 6v3"/></svg>`,
  link: () => `<svg width="20" height="15" viewBox="0 0 20 15" aria-hidden="true"><path d="M5 1h7l3 3v10H5z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/><path d="M8 10l4-4M9 6h3v3" fill="none" stroke="var(--rust)" stroke-width="1.5"/></svg>`,
};

// ---------- components ----------

const titlebar = (title, { small = false, boxes = true } = {}) => `
      <div class="titlebar${small ? " small" : ""}">${boxes ? `
        <span class="box" aria-hidden="true"></span>` : ""}
        <span class="stripes" aria-hidden="true"></span>
        <span class="title">${esc(title)}</span>
        <span class="stripes" aria-hidden="true"></span>${boxes ? `
        <span class="box" aria-hidden="true"></span>` : ""}
      </div>`;

const win = (title, body, { cls = "", label = title, id = "" } = {}) => `
    <section class="window${cls ? " " + cls : ""}"${id ? ` id="${id}"` : ""} aria-label="${esc(label)}">${titlebar(title)}${body}
    </section>`;

// One listing row. href makes it a link; external links open in a new tab.
const row = ({ href, icon: ic, name, modified = "", size = "", current = false, corrupt = false, child = false, track = "" }) => {
  const tag = href ? "a" : "div";
  const ext = href && /^https?:/.test(href);
  const attrs = [
    `class="row${child ? " child" : ""}"`,
    href ? `href="${esc(href)}"` : "",
    ext ? `target="_blank" rel="noopener"` : "",
    current ? `aria-current="page"` : "",
    track ? `data-track="${esc(track)}"` : "",
  ].filter(Boolean).join(" ");
  // the one unreadable date: its last digit is gone
  const mod = corrupt && modified ? modified.slice(0, -1) + "▒" : modified;
  return `
        <${tag} ${attrs}>
          <span class="name-cell">${ic}<span class="label">${esc(name)}${ext ? `<span class="visually-hidden"> (opens in a new tab)</span>` : ""}</span></span>
          <span class="meta">${esc(mod)}</span><span class="meta hide-sm">${esc(size)}</span>
        </${tag}>`;
};

const directory = ({ title, rows, head = ["name", "modified", "size"] }) => {
  const body = rows.map(row).join("");
  const count = rows.filter((r) => r.name !== "../" && !r.child).length;
  const status = `${count} ${count === 1 ? "item" : "items"}`;
  return `
    <section class="window directory" aria-label="Directory ${esc(title)}">${titlebar(title)}

      <div class="row head" aria-hidden="true"><span>${head[0]}</span><span>${head[1]}</span><span class="hide-sm">${head[2]}</span></div>

      <nav class="rows" aria-label="Files">${body}
      </nav>

      <div class="statusbar">
        <span>${status}</span>
        <span class="leds" aria-hidden="true"><span class="led"></span><span class="led"></span><span class="led alarm"></span></span>
      </div>
    </section>`;
};

const readmeWin = (title, inner) => win(title, `
      <div class="readme-body">${inner}
      </div>`);

const p = (html, cls) => `\n        <p${cls ? ` class="${cls}"` : ""}>${copy(html)}</p>`;
const mailLine = () => p(`› <a href="mailto:${siteMeta.email}" style="text-decoration:none">${siteMeta.email}</a>`, "mail");

// Windows that a row of the listing jumps to: #win-cover for cover.jpg …
const winId = (name) => `win-${name.replace(/\.\w+$/, "")}`;

const imageWin = (title, src, alt, caption = "") => {
  const [w, h] = imageSize(src);
  return win(title, `
      <div class="inset">
        <img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async">${caption ? `
        <p class="caption">${caption}</p>` : ""}
      </div>`, { id: winId(title) });
};

// A looping clip with sound: plays muted while on screen, like a GIF; the
// sound button unmutes it (and silences everything else). site.js drives it.
const SPEAKER = `<svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true"><path d="M1 4h3l4-3v10L4 8H1z" fill="var(--ink)"/><path class="waves" d="M10 3.5c1 1.4 1 3.6 0 5M12 2c1.8 2.3 1.8 5.7 0 8" fill="none" stroke="var(--ink)" stroke-width="1.3"/></svg>`;
const clipWin = (c) => {
  const id = `clip-${c.name.replace(/\.\w+$/, "")}`;
  return `
    <section class="window clip" id="${id}" aria-label="${esc(c.name)}">${titlebar(c.name)}
      <div class="inset">
        <video src="/clips/${c.file}.mp4" poster="/clips/${c.file}.jpg" width="960" height="540" muted loop playsinline preload="none" aria-label="${esc(c.alt)}"></video>
        <p class="caption clip-bar">
          <button type="button" class="bevel sound" aria-pressed="false">${SPEAKER}<span>sound off</span></button>
          <span>${c.from} to ${c.to}</span>
        </p>
      </div>
    </section>`;
};

const embedWin = (title, { bandcampUrl, soundcloudUrl, vimeoUrl, label, href }) => {
  let frame = "";
  if (bandcampUrl) frame = `<iframe src="${esc(bandcamp(bandcampUrl))}" height="42" title="${esc(label)} on Bandcamp" loading="lazy" seamless></iframe>`;
  else if (soundcloudUrl) frame = `<iframe src="${esc(soundcloud(soundcloudUrl))}" height="166" title="${esc(label)} on SoundCloud" loading="lazy" allow="autoplay"></iframe>`;
  else if (vimeoUrl) frame = `<iframe src="${esc(vimeoUrl)}" title="${esc(label)} on Vimeo" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  return win(title, `${href ? `
      <p class="player-label"><a href="${href}">${esc(label)}</a></p>` : ""}
      <div class="inset${vimeoUrl ? " video" : ""}">
        ${frame}
      </div>`, { label: `${title}: ${label}`, id: winId(title) });
};

// intrinsic size of a JPEG, so images reserve their space (no layout shift)
function imageSize(src) {
  const buf = readFileSync(join(root, imgPath(src)));
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    // SOF0..SOF15, except DHT (C4), JPG (C8) and DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    }
    i += 2 + len;
  }
  throw new Error(`no JPEG size in ${src}`);
}

// The home page player: the reference player, wired up by site.js. The audio
// is scrambled (see scripts/encode-landing.mjs); the key is on the dock.
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const landingPlayer = () => {
  const { title, note } = landingTrack;
  const { duration, peaks } = landingAudio;
  const bars = peaks
    .map((v, i) => {
      const h = Math.max(1, Math.round(v * 26));
      return `<path d="M${2 + i * 4} ${15 - h / 2}v${h}"/>`;
    })
    .join("");
  return `
    <section class="window player" aria-label="${esc(title)}, ${esc(note)}" data-player>
      <button type="button" class="play" aria-label="Play ${esc(title)}" aria-pressed="false">
        <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1l7 4-7 4z" fill="var(--ink)"/></svg>
      </button>
      <div class="track">
        <span class="label">${esc(title)} · <span class="status">${esc(note)}</span></span>
        <svg class="wave" viewBox="0 0 ${peaks.length * 4} 30" preserveAspectRatio="none" fill="none" stroke-width="2.5" aria-hidden="true">${bars}</svg>
      </div>
      <span class="time">${fmtTime(duration)}</span>
    </section>`;
};

// The dock: a small play/pause window pinned to the corner of every page.
// It stays hidden until the track is started, then follows you around, since
// site.js swaps pages in place while music is playing. It carries the
// track's data, so the player works from any page.
const PLAY_ICON = `<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1l7 4-7 4z" fill="var(--ink)"/></svg>`;
const dock = () => {
  const { title, artist } = landingTrack;
  const { file, key, duration } = landingAudio;
  return `
<div class="dock window" hidden data-src="${file}" data-key="${key}" data-title="${esc(title)}" data-artist="${esc(artist)}">
  <button type="button" class="play" aria-label="Play ${esc(title)}" aria-pressed="false">${PLAY_ICON}</button>
  <span class="dock-label">${esc(title)}</span>
  <span class="dock-time">${fmtTime(duration)}</span>
  <span class="dock-bar" aria-hidden="true"><span></span></span>
</div>`;
};

// ---------- themes ----------

// WCAG contrast ratio between two #RRGGBB colours
const luminance = (hex) => {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Tokens a theme does not set fall back to the :root block of the stylesheet.
const rootTokens = Object.fromEntries(
  [...readFileSync(join(root, "src/assets/site.css"), "utf8").matchAll(/^\s*--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/gm)].map((m) => [m[1], m[2]]),
);
if (!themes.some((t) => t.id === defaultTheme)) throw new Error(`defaultTheme "${defaultTheme}" is not in themes`);

// Every text colour on every surface it actually appears on must reach 4.5:1.
const USED = {
  ink: ["window", "paper", "button", "row-hover", "row-current", "ground"],
  "ink-2": ["window", "row-hover", "row-current", "ground"], // hovered/current dates, theme label
  "ink-3": ["window", "paper", "button"], // list header, credits, mail, dock time
  "ink-4": ["window"], // dates, sizes, status bar
};
for (const t of themes) {
  const tok = { ...rootTokens, ...t.tokens };
  for (const [fg, bgs] of Object.entries(USED)) {
    for (const bg of bgs) {
      const ratio = contrast(tok[fg], tok[bg]);
      if (ratio < 4.5) throw new Error(`theme ${t.id}: --${fg} on --${bg} is ${ratio.toFixed(2)}:1, needs 4.5:1`);
    }
  }
}

// The default theme becomes the base :root; the others are switchable overrides.
const tokenBlock = (t) => Object.entries(t.tokens).map(([k, v]) => `  --${k}: ${v};`).join("\n");
const themeCss = `
/* ---------- themes (generated from src/data/themes.js) ---------- */

:root {
${tokenBlock(themes.find((t) => t.id === defaultTheme))}
}
${themes
  .filter((t) => t.id !== defaultTheme)
  .map((t) => `\n:root[data-theme="${t.id}"] {\n${tokenBlock(t)}\n}`)
  .join("\n")}
`;

// Runs before first paint, so a chosen theme never flashes the default.
const THEME_BOOT = `<script>try{var t=localStorage.getItem("ys-theme");if(t&&t!=="${defaultTheme}")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>`;

const themeSwitcher = () => `
    <div class="themes" role="group" aria-label="Appearance" data-default="${defaultTheme}">
      <span aria-hidden="true">appearance</span>
      <span class="swatches">${themes
        .map(
          (t) =>
            `<button type="button" class="swatch" data-theme-id="${t.id}" aria-pressed="false" aria-label="${esc(t.label)}" title="${esc(t.label)}" style="--a:${t.swatch[0]};--b:${t.swatch[1]}"></button>`,
        )
        .join("")}</span>
    </div>`;

// ---------- page shell ----------

const FAVICON_FILL = themes.find((t) => t.id === defaultTheme).swatch[1];
const FAVICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 16"><path d="M1 2h7l2 2h9v11H1z" fill="${FAVICON_FILL}" stroke="#1E211C" stroke-width="1.5"/></svg>`)}`;

// path: the site path of the page ("/", "/music/", …).
// spot: the page whose window arrangement this one shares (site.js), by
// default its canonical path.
const page = ({ path, title, description = siteMeta.description, desk, canonical = path, spot = canonical }) => {
  const home = path === "/";
  const name = home ? siteMeta.name : `<a href="/">${siteMeta.name}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://${siteMeta.domain}${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="https://${siteMeta.domain}${canonical}">
<link rel="icon" href="${FAVICON}">
<link rel="preload" href="/assets/fonts/ChicagoFLF.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
${THEME_BOOT}
</head>
<body>

<main class="page" data-path="${spot}">

  <header class="site-header">
    <div class="lead">
    <div class="name">
      <h1>${name}</h1>
    </div>
    </div>${themeSwitcher()}
  </header>
${desk}
</main>
${dock()}
<div class="crt" aria-hidden="true"></div>
<script src="/assets/site.js"></script>
</body>
</html>
`;
};

// main: the directory window, plus anything stacked under it.
const deskHtml = (dir, side = [], under = []) => `
  <div class="desk${side.length ? "" : " solo"}">
${under.length ? `
    <div class="main-col">
${dir}
${under.join("\n")}
    </div>` : dir}
${side.length ? `
    <div class="side">
${side.join("\n")}
    </div>` : ""}
  </div>
`;

const UP = (href) => ({ href, icon: icon.up(), name: "../", modified: "", size: "" });

// A section listing as a tree: every entry of the section, the open one
// expanded with its files indented under it. Section pages (/music/ …) open
// on their first entry, so content is one click from home and every other
// entry stays one click away.
const tree = (section, entries, openId, folderRow, filesOf) => [
  UP("/"),
  ...entries.flatMap((e, i) => [
    { ...folderRow(e, i), href: `/${section}/${e.id}/`, name: `${e.id}/`, size: "dir", current: e.id === openId },
    ...(e.id === openId ? filesOf(e).map((r) => ({ ...r, child: true })) : []),
  ]),
];

// Writes an entry page, and the section page as a copy of its first entry.
const entryPages = (section, entries, render, sectionMeta) => {
  for (const [i, e] of entries.entries()) {
    const html = render(e);
    pages[`${section}/${e.id}/index.html`] = page({ path: `/${section}/${e.id}/`, ...html });
    if (i === 0) pages[`${section}/index.html`] = page({ ...html, path: `/${section}/`, canonical: `/${section}/${e.id}/`, ...sectionMeta });
  }
};

// ---------- dates ----------

const T = {
  site: fileTime("src/data/site.js"),
  projects: fileTime("src/data/projects.js"),
};
const releaseTime = (r) => fileTime(imgPath(r.image));
const filmTime = (f) => (f.image ? fileTime(imgPath(f.image)) : T.projects);
T.music = latest(...musicProjects.map(releaseTime));
T.film = latest(...filmProjects.map(filmTime));
const gameTime = (g) => latest(...g.stills.map((st) => fileTime(imgPath(st.image))), ...(g.clips || []).map((c) => fileTime(`clips/${c.file}.mp4`)));
T.games = latest(...gameProjects.map(gameTime));
T.mixing = latest(T.site, ...mixing.references.map((r) => fileTime(imgPath(r.image))));
T.about = latest(T.site, fileTime(imgPath(about.image)));

// ---------- contact.txt ----------

const pad = (s, n) => s + " ".repeat(Math.max(1, n - s.length));
const contactTxt = [
  "Yves Spiri",
  "Zürich",
  "",
  `${pad("email", 12)}${siteMeta.email}`,
  ...links.map((l) => `${pad(l.label, 12)}${l.href}`),
  "",
  "available for film and game scoring, mixing and mastering,",
  "and music production tutoring, online or in person.",
  "",
].join("\n");

// ---------- pages ----------

const pages = {};

// home: the root folder. Its two files, readme.txt and contact.txt, open in
// the same spot: the same listing with the file selected, its text beside it.
{
  const entries = [
    ["email", `<a href="mailto:${siteMeta.email}">${siteMeta.email}</a>`],
    ...links.map((l) => [l.label, `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.href.replace(/^https:\/\//, ""))}</a>`]),
  ];
  const contactBody =
    p("Yves Spiri<br>Zürich") +
    `\n        <dl class="contact-list">${entries.map(([k, v]) => `\n          <dt>${k}</dt><dd>${v}</dd>`).join("")}\n        </dl>` +
    p("Available for film and game scoring, mixing and mastering, and music production tutoring, online or in person.");
  const rows = (open) => [
    { href: "/about/", icon: icon.folder(TINT.about), name: "about/", modified: fmtDate(T.about), size: "dir" },
    { href: "/music/", icon: icon.folder(TINT.music), name: "music/", modified: fmtDate(T.music), size: "dir" },
    { href: "/film/", icon: icon.folder(TINT.film), name: "film/", modified: fmtDate(T.film), size: "dir" },
    { href: "/games/", icon: icon.folder(TINT.games), name: "games/", modified: fmtDate(T.games), size: "dir" },
    { href: "/mixing/", icon: icon.folder(TINT.mixing), name: "mixing/", modified: fmtDate(T.mixing), size: "dir", corrupt: true },
    { href: "/contact/", icon: icon.file(), name: "contact.txt", modified: fmtDate(T.site), size: fmtSize(Buffer.byteLength(contactTxt)), current: open === "contact" },
    { href: "/", icon: icon.file(), name: "readme.txt", modified: fmtDate(T.site), size: fmtSize(Buffer.byteLength(readme.join(" "))), current: open === "readme" },
  ];
  pages["index.html"] = page({
    path: "/",
    title: siteMeta.name,
    desk: deskHtml(directory({ title: `${siteMeta.domain}/`, rows: rows("readme") }), [
      readmeWin("readme.txt", readme.map((t) => p(t)).join("") + mailLine()),
      landingPlayer(),
    ]),
  });
  pages["contact/index.html"] = page({
    path: "/contact/",
    spot: "/",
    title: `contact · ${siteMeta.name}`,
    description: `Contact Yves Spiri: ${siteMeta.email}`,
    desk: deskHtml(directory({ title: `${siteMeta.domain}/`, rows: rows("contact") }), [
      readmeWin("contact.txt", contactBody),
      landingPlayer(),
    ]),
  });
}

// about/
{
  const rows = [
    UP("/"),
    { href: "#win-portrait", icon: icon.image(), name: "portrait.jpg", modified: fmtDate(fileTime(imgPath(about.image))), size: sizeOf(imgPath(about.image)) },
    ...links.map((l) => ({ href: l.href, icon: icon.link(), name: `${l.label}.url`, modified: fmtDate(T.site), size: "url" })),
    { href: "/contact/", icon: icon.file(), name: "contact.txt", modified: fmtDate(T.site), size: fmtSize(Buffer.byteLength(contactTxt)) },
  ];
  const credit = `photo <a href="${about.photoCredit.href}" target="_blank" rel="noopener">${esc(about.photoCredit.display)}</a>`;
  const side = [
    readmeWin("bio.txt", about.paragraphs.map((t) => p(t)).join("") + mailLine()),
    imageWin("portrait.jpg", about.image, "Portrait of Yves Spiri", credit),
  ];
  pages["about/index.html"] = page({
    path: "/about/",
    title: `about · ${siteMeta.name}`,
    desk: deskHtml(directory({ title: `${siteMeta.domain}/about/`, rows }), side),
  });
}

// music/
{
  const musicLinks = links.filter((l) => l.label !== "instagram");
  const yotah = readmeWin("yotah.txt",
    p("Yotah is my experimental club music project.") +
    `\n        <ul>${musicLinks.map((l) => `\n          <li>› <a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join("")}\n        </ul>`);
  const files = (r) => {
    const t = fmtDate(releaseTime(r));
    return [
      ...parseTracks(r.tracks).tracks.map((tr, i) => {
        const id = bandcampTracks[r.id]?.tracks[i]?.id;
        const track = id && r.embedUrl ? bandcamp(r.embedUrl).replace(/\/?$/, `/track=${id}/`) : "";
        return { href: r.embedUrl || r.soundcloudEmbed ? "#win-player" : "", icon: icon.wave(), name: `${tr.n} ${tr.title}`, modified: tr.length, size: "", track };
      }),
      { href: "#win-cover", icon: icon.image(), name: "cover.jpg", modified: t, size: sizeOf(imgPath(r.image)) },
      r.bandcampLink && { href: r.bandcampLink, icon: icon.link(), name: "bandcamp.url", modified: t, size: "url" },
    ].filter(Boolean);
  };
  const folder = (r, i) => ({ icon: icon.folder(TINT.music), modified: fmtDate(releaseTime(r)), corrupt: i === musicProjects.length - 1 });

  entryPages("music", musicProjects, (r) => {
    const { notes } = parseTracks(r.tracks);
    const text =
      p(esc(r.title), "entry-title") +
      p(r.description) +
      (r.extendedDescription ? `\n        <details>\n          <summary>more</summary>\n          <p>${copy(r.extendedDescription)}</p>\n        </details>` : "") +
      (notes.length ? p(esc(notes.join(" · ").toLowerCase()), "note") : "") +
      (r.credits ? p(esc(r.credits), "credits") : "");
    const side = [
      imageWin("cover.jpg", r.image, `Cover art for ${r.title}`),
      embedWin("player", { bandcampUrl: r.embedUrl, soundcloudUrl: r.soundcloudEmbed, label: r.title }),
      readmeWin("readme.txt", text),
    ];
    return {
      title: `${r.title} · ${siteMeta.name}`,
      description: r.description.replace(/<[^>]+>/g, ""),
      desk: deskHtml(directory({ title: `${siteMeta.domain}/music/`, rows: tree("music", musicProjects, r.id, folder, files) }), side, [yotah]),
    };
  }, { title: `music · ${siteMeta.name}`, description: "Releases, remixes and compilation tracks by Yotah." });
}

// film/
{
  const files = (f) => [
    ...(f.clips || []).map((c) => ({ href: `#clip-${c.name.replace(/\.\w+$/, "")}`, icon: icon.wave(), name: c.name, modified: fmtDate(fileTime(`clips/${c.file}.mp4`)), size: sizeOf(`clips/${c.file}.mp4`) })),
    f.image && { href: "#win-poster", icon: icon.image(), name: "poster.jpg", modified: fmtDate(filmTime(f)), size: sizeOf(imgPath(f.image)) },
    f.embedUrl && { href: f.embedUrl.split("?")[0].replace("player.vimeo.com/video", "vimeo.com"), icon: icon.link(), name: "vimeo.url", modified: fmtDate(filmTime(f)), size: "url" },
  ].filter(Boolean);
  const folder = (f) => ({ icon: icon.folder(TINT.film), modified: fmtDate(filmTime(f)) });

  entryPages("film", filmProjects, (f) => {
    // clips split between the columns: the first half under the readme, the rest beside
    const clips = f.clips || [];
    const half = Math.ceil(clips.length / 2);
    const side = [
      f.image && imageWin("poster.jpg", f.image, `Poster for ${f.title}`),
      f.embedUrl && embedWin("video", { vimeoUrl: f.embedUrl, label: f.title }),
      ...clips.slice(half).map(clipWin),
    ].filter(Boolean);
    return {
      title: `${f.title} · ${siteMeta.name}`,
      description: f.description,
      desk: deskHtml(directory({ title: `${siteMeta.domain}/film/`, rows: tree("film", filmProjects, f.id, folder, files) }), side, [
        readmeWin("readme.txt", p(esc(f.title), "entry-title") + p(f.description) + (f.status ? p(esc(`status: ${f.status.toLowerCase()}`), "note") : "")),
        ...clips.slice(0, half).map(clipWin),
      ]),
    };
  }, { title: `film · ${siteMeta.name}`, description: "Sound design for film and animation by Yves Spiri." });
}

// games/
{
  const files = (g) => [
    ...(g.clips || []).map((c) => ({ href: `#clip-${c.name.replace(/\.\w+$/, "")}`, icon: icon.wave(), name: c.name, modified: fmtDate(fileTime(`clips/${c.file}.mp4`)), size: sizeOf(`clips/${c.file}.mp4`) })),
    ...g.stills.map((st) => ({ href: `#${winId(st.name)}`, icon: icon.image(), name: st.name, modified: fmtDate(fileTime(imgPath(st.image))), size: sizeOf(imgPath(st.image)) })),
    g.link && { href: g.link.href, icon: icon.link(), name: g.link.name, modified: fmtDate(T.projects), size: "url" },
  ].filter(Boolean);
  const folder = (g) => ({ icon: icon.folder(TINT.games), modified: fmtDate(gameTime(g)) });

  entryPages("games", gameProjects, (g) => ({
    title: `${g.title} · ${siteMeta.name}`,
    description: g.description,
    desk: deskHtml(
      directory({ title: `${siteMeta.domain}/games/`, rows: tree("games", gameProjects, g.id, folder, files) }),
      [...(g.clips || []).map(clipWin), ...g.stills.map((st) => imageWin(st.name, st.image, st.alt))],
      [readmeWin("readme.txt", p(esc(g.title), "entry-title") + p(g.description) + (g.credits ? p(esc(g.credits), "credits") : ""))],
    ),
  }), { title: `games · ${siteMeta.name}`, description: "Sound for games by Yves Spiri." });
}

// mixing/
{
  const rows = [
    UP("/"),
    ...mixing.references.map((r) => ({
      href: r.href,
      icon: icon.link(),
      name: `${r.id}.url`,
      modified: fmtDate(fileTime(imgPath(r.image))),
      size: "url",
    })),
    { href: "/contact/", icon: icon.file(), name: "contact.txt", modified: fmtDate(T.site), size: fmtSize(Buffer.byteLength(contactTxt)) },
  ];
  const side = [
    readmeWin("readme.txt", p(mixing.lead) + p(mixing.closing) + mailLine()),
    ...mixing.references.flatMap((r) => [
      win(`${r.id}.jpg`, `
      <div class="inset">
        <img src="${r.image}" alt="Cover art for ${esc(r.title)} by ${esc(r.artist)}" width="${imageSize(r.image)[0]}" height="${imageSize(r.image)[1]}" loading="lazy" decoding="async">
        <p class="caption">${esc(r.artist)} · ${esc(r.title)}. ${copy(r.text)}</p>
      </div>
      <div class="inset">
        <iframe src="${esc(bandcamp(r.embedUrl))}" height="42" title="${esc(r.title)} on Bandcamp" loading="lazy" seamless></iframe>
      </div>`, { label: `${r.artist}, ${r.title}` }),
    ]),
  ];
  pages["mixing/index.html"] = page({
    path: "/mixing/",
    title: `mixing & mastering · ${siteMeta.name}`,
    description: mixing.lead,
    desk: deskHtml(directory({ title: `${siteMeta.domain}/mixing/`, rows }), side),
  });
}

// 404: the old single-page site had /<id> routes for releases, and
// contact.txt used to be a raw file; forward them.
{
  const rows = [
    UP("/"),
    { href: "/music/", icon: icon.folder(TINT.music), name: "music/", modified: "", size: "dir" },
    { href: "/contact/", icon: icon.file(), name: "contact.txt", modified: "", size: "" },
  ];
  const side = [readmeWin("error.log", p("file not found. it may have moved, or never existed.", "note"))];
  const ids = JSON.stringify(musicProjects.map((r) => r.id));
  pages["404.html"] = page({
    path: "/404.html",
    title: `not found · ${siteMeta.name}`,
    desk: deskHtml(directory({ title: "not found", rows }), side) +
      `<script>(function(){var ids=${ids};var m=location.pathname.match(/^\\/([^/]+)\\/?$/);if(m&&ids.indexOf(m[1])!==-1)location.replace('/music/'+m[1]+'/');else if(m&&m[1]==='contact.txt')location.replace('/contact/');})();</script>\n`,
  });
}

// ---------- write ----------

for (const d of OWNED_DIRS) rmSync(join(root, d), { recursive: true, force: true });
for (const [rel, html] of Object.entries(pages)) {
  const out = join(root, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}
mkdirSync(join(root, "assets"), { recursive: true });
writeFileSync(join(root, "assets/site.css"), readFileSync(join(root, "src/assets/site.css"), "utf8") + themeCss);
copyFileSync(join(root, "src/assets/site.js"), join(root, "assets/site.js"));
mkdirSync(join(root, "assets/fonts"), { recursive: true });
copyFileSync(join(root, "src/assets/fonts/ChicagoFLF.woff2"), join(root, "assets/fonts/ChicagoFLF.woff2"));

console.log(`built ${Object.keys(pages).length} pages`);
