/*
 * fetch-bandcamp.mjs: looks up the Bandcamp track ids of every album
 * (an entry whose bandcampLink is an /album/ page) and writes them to
 * src/data/bandcamp-tracks.json, so a click on a track row can load that
 * track into the album's embed. Run it again after adding an album.
 *
 *   npm run fetch:bandcamp
 */

import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { musicProjects } from "../src/data/projects.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src/data/bandcamp-tracks.json");

const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const albums = {};
for (const r of musicProjects.filter((r) => /\/album\//.test(r.bandcampLink || ""))) {
  const res = await fetch(r.bandcampLink, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${r.bandcampLink}: ${res.status}`);
  const m = (await res.text()).match(/data-tralbum="([^"]+)"/);
  if (!m) throw new Error(`${r.bandcampLink}: no album data`);
  const data = JSON.parse(unescape(m[1]));
  albums[r.id] = { album: data.id, tracks: data.trackinfo.map((t) => ({ n: t.track_num, title: t.title, id: t.track_id })) };
  console.log(`${r.id}: ${data.trackinfo.length} tracks`);
}
writeFileSync(out, JSON.stringify(albums, null, 2) + "\n");
