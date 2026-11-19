// Downloads free-licensed headshots for the real roster from Wikipedia / Wikimedia Commons,
// crops them square, and writes public/photos/<slug>.jpg plus src/data/photos.json (credits).
// Run: npm run photos        (re-run any time; existing photos are kept unless --force)
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ROSTER } from "../src/data/roster.js";

const UA = "FightManagerGame/0.1 (hobby game; photo credits kept)";
const OUT = "public/photos";
const META = "src/data/photos.json";
const FORCE = process.argv.includes("--force");
const FREE = /^(CC0|CC BY|CC-BY|Public domain|PD|Attribution)/i;

export const slug = (n) =>
  n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(host, params) {
  const u = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 4; i++) {
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    if (r.ok) return r.json();
    await sleep(r.status === 429 ? 30000 * (i + 1) : 2000);
  }
  throw new Error("API failed " + u);
}

// Find the fighter's Wikipedia page: try "(fighter)" disambiguations first, then the plain name.
async function findPage(name) {
  const tries = [`${name} (fighter)`, `${name} (mixed martial artist)`, name];
  const d = await api("en.wikipedia.org", {
    action: "query", redirects: "1", titles: tries.join("|"),
    prop: "pageimages|extracts", piprop: "name", exintro: "1", explaintext: "1", exsentences: "2",
  });
  const pages = d.query?.pages || [];
  const norm = (t) => (d.query.normalized || []).find((x) => x.from === t)?.to || t;
  const redir = (t) => (d.query.redirects || []).find((x) => x.from === t)?.to || t;
  for (const t of tries) {
    const p = pages.find((p) => p.title === redir(norm(t)));
    if (p && !p.missing && /martial art|UFC|fighter|wrestler|kickboxer/i.test(p.extract || "") && p.pageimage) return p;
  }
  return null;
}

async function imageInfo(file) {
  const d = await api("commons.wikimedia.org", {
    action: "query", titles: "File:" + file, prop: "imageinfo",
    iiprop: "url|extmetadata", iiurlwidth: "500",
  });
  const ii = d.query?.pages?.[0]?.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  const strip = (s) => (s || "").replace(/<[^>]+>/g, "").trim();
  return {
    url: ii.thumburl || ii.url,
    page: ii.descriptionurl,
    license: strip(m.LicenseShortName?.value),
    artist: strip(m.Artist?.value).slice(0, 120) || "Unknown",
  };
}

const meta = JSON.parse(await fs.readFile(META, "utf8").catch(() => "{}"));
await fs.mkdir(OUT, { recursive: true });
let got = 0, miss = [];
for (const div of ROSTER) for (const [name] of div) {
  const s = slug(name), file = path.join(OUT, s + ".jpg");
  if (!FORCE && meta[name] && (await fs.stat(file).catch(() => null))) { got++; continue; }
  try {
    const p = await findPage(name);
    const info = p && (await imageInfo(p.pageimage));
    if (!info || !FREE.test(info.license)) { miss.push(name + (info ? ` (${info.license})` : "")); continue; }
    let res;
    for (let i = 0; i < 4; i++) {
      res = await fetch(info.url, { headers: { "User-Agent": UA } });
      if (res.ok) break;
      await sleep(res.status === 429 ? 30000 * (i + 1) : 2000);
    }
    if (!res.ok) throw new Error("image " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    // Portrait shots: keep the top of the frame (face), square crop, guided by sharp's attention.
    const img = sharp(buf).rotate();
    const { width, height } = await img.metadata();
    const side = Math.min(width, height);
    const top = height > width ? Math.round((height - side) * 0.15) : 0;
    const left = width > height ? Math.round((width - side) / 2) : 0;
    await img.extract({ left, top, width: side, height: side }).resize(320, 320).jpeg({ quality: 82 }).toFile(file);
    meta[name] = { file: s + ".jpg", source: info.page, license: info.license, artist: info.artist, wiki: "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.title.replace(/ /g, "_")) };
    got++;
    console.log("✓", name);
  } catch (e) { miss.push(name + " (error: " + e.message.slice(0, 60) + ")"); }
  await sleep(1500);
}
await fs.writeFile(META, JSON.stringify(meta, null, 1));
console.log(`\n${got} photos, ${miss.length} without a free photo:\n  ` + miss.join("\n  "));
