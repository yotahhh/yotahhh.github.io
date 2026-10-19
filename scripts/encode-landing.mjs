/*
 * encode-landing.mjs: prepares the home page player's track.
 *
 *   node scripts/encode-landing.mjs landing_music/<track>.wav
 *
 * Encodes the source to AAC in an .m4a (plays in every browser, streams
 * from the first byte thanks to +faststart), then scrambles it with a
 * repeating XOR key and writes it to media/<hash>.bin. The file on the
 * server is noise; site.js fetches it on first play, undoes the XOR and
 * plays a blob URL. That stops casual "save as", not a determined person.
 *
 * Also writes src/data/landing-track.json (file, key, duration, waveform
 * levels) for the build. Run it again whenever the track changes; the
 * source folder itself is git-ignored and never published.
 */

import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/encode-landing.mjs <file.wav>");

const BITRATE = "128k";
const PEAKS = 64;

const tmp = mkdtempSync(join(tmpdir(), "landing-"));
const m4a = join(tmp, "track.m4a");
const ffmpeg = (...args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { maxBuffer: 1 << 28 });

// aac_at is Apple's encoder (macOS); the built-in aac works everywhere else
const encoders = execFileSync("ffmpeg", ["-hide_banner", "-encoders"]).toString();
const codec = /\baac_at\b/.test(encoders) ? "aac_at" : "aac";
ffmpeg("-i", src, "-vn", "-map_metadata", "-1", "-c:a", codec, "-b:a", BITRATE, "-movflags", "+faststart", m4a);

const duration = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", m4a]).toString().trim(),
);

// waveform: RMS per bucket (peaks are flat on a mastered track), mono 8 kHz
const pcm = ffmpeg("-i", src, "-ac", "1", "-ar", "8000", "-f", "s16le", "-");
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
const size = Math.ceil(samples.length / PEAKS);
const raw = Array.from({ length: PEAKS }, (_, i) => {
  let sum = 0;
  const end = Math.min(samples.length, (i + 1) * size);
  for (let j = i * size; j < end; j++) sum += samples[j] * samples[j];
  return Math.sqrt(sum / Math.max(1, end - i * size));
});
const top = Math.max(...raw) || 1;
const peaks = raw.map((v) => Math.round((v / top) * 100) / 100);

// scramble
const key = randomBytes(16);
const bytes = readFileSync(m4a);
for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length];
const name = createHash("sha256").update(bytes).digest("hex").slice(0, 12) + ".bin";

rmSync(join(root, "media"), { recursive: true, force: true });
mkdirSync(join(root, "media"));
writeFileSync(join(root, "media", name), bytes);
rmSync(tmp, { recursive: true, force: true });

writeFileSync(
  join(root, "src/data/landing-track.json"),
  JSON.stringify({ source: basename(src), file: `/media/${name}`, key: key.toString("hex"), duration, peaks }, null, 2) + "\n",
);
console.log(`media/${name}: ${(bytes.length / 1048576).toFixed(1)} MB, ${duration.toFixed(1)} s, ${codec} ${BITRATE}`);
