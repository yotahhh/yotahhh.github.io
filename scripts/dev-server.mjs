/*
 * dev-server.mjs — static preview server for the generated site.
 *
 * The Cargo frontend resolves pages against location.pathname, so the site
 * must be served from the root of an origin: unknown paths fall back to
 * index.html (the same trick dist/404.html plays on GitHub Pages).
 *
 *   node scripts/dev-server.mjs [dir] [--port 5173]
 *
 * With no dir, serves the repo root and maps /images/* to public/images/*.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const port = portArg !== -1 ? Number(args[portArg + 1]) : 5173;
const dirArg = args.find((a) => !a.startsWith("--") && a !== String(port));
const base = dirArg ? resolve(root, dirArg) : root;
const imagesFallback = dirArg ? null : resolve(root, "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

const tryFile = async (path) => {
  try {
    const s = await stat(path);
    return s.isFile() ? path : null;
  } catch {
    return null;
  }
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");

  let file = safe === "/" ? null : await tryFile(join(base, safe));
  if (!file && imagesFallback && safe.startsWith("/images/")) {
    file = await tryFile(join(imagesFallback, safe));
  }
  // Client-side routes (/about, /true-bug, …) boot from index.html.
  if (!file) file = await tryFile(join(base, "index.html"));

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found. Run `npm run build` first.");
    return;
  }

  const body = await readFile(file);
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  res.end(body);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`serving ${base} → http://127.0.0.1:${port}/`);
});
