// Fetches each roster fighter's UFC.com athlete page: official headshot + bio + career stats.
// Writes public/fighters/<slug>.webp and src/data/ufc.json. Fighters without a headshot are left out
// (the game drops them). Waits 15 s between requests, as UFC.com's robots.txt asks.
// Run: npm run ufc            (re-run safely; already-fetched fighters are skipped unless --force)
import fs from "node:fs/promises";
import sharp from "sharp";
import { ROSTER } from "../src/data/roster.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const OUT = "public/fighters", META = "src/data/ufc.json", DELAY = 15000;
const FORCE = process.argv.includes("--force");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const SPECIAL = { Sumudaerji: ["su-mudaerji"], "Lone'er Kavanagh": ["loneer-kavanagh", "lone-er-kavanagh"] };

const slug = (n) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’.]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastReq = 0;
async function get(url) {
  const wait = lastReq + DELAY - Date.now();
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
  return fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
}
const pick = (html, re) => (html.match(re) || [])[1]?.trim() || null;
const num = (s) => (s == null || s === "" ? null : parseFloat(s));

function parse(html) {
  const og = pick(html, /og:image" content="([^"]+)"/);
  if (!og || !/\/images\/\d{4}-\d{2}\//.test(og) || /silhouette|no-profile|default/i.test(og)) return null;
  const bio = {};
  for (const m of html.matchAll(/c-bio__label">([^<]*)<\/div>\s*<div class="c-bio__text">([^<]*)/g)) bio[m[1].trim()] = m[2].trim();
  const cmp = {};
  for (const m of html.matchAll(/c-stat-compare__number">\s*([^<]*?)\s*(?:<[^>]*>[^<]*)*?<\/div>\s*<div class="c-stat-compare__label">([^<]*)/g)) cmp[m[2].trim()] = m[1].trim();
  return {
    img: og.replace(/^https:\/\/ufc\.com/, "https://www.ufc.com"),
    nickname: (pick(html, /hero-profile__nickname">([^<]*)</) || "").replace(/&quot;|"/g, "").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").trim() || null,
    tags: [...html.matchAll(/hero-profile__tag">\s*([^<]*)/g)].map((m) => m[1].trim()),
    hometown: bio.Hometown || null, camp: bio["Trains at"] || null, style: bio["Fighting style"] || null,
    age: num(pick(html, /field--name-age[^>]*>(\d+)/)), height: num(bio.Height), reach: num(bio.Reach),
    stats: {
      slpm: num(cmp["Sig. Str. Landed"]), sapm: num(cmp["Sig. Str. Absorbed"]), td: num(cmp["Takedown avg"]), sub: num(cmp["Submission avg"]),
      strdef: num(cmp["Sig. Str. Defense"]), tddef: num(cmp["Takedown Defense"]), kd: num(cmp["Knockdown Avg"]),
      stracc: num(pick(html, /<title>Striking accuracy (\d+)%/)), tdacc: num(pick(html, /<title>Takedown Accuracy (\d+)%/)),
    },
  };
}

const meta = JSON.parse(await fs.readFile(META, "utf8").catch(() => "{}"));
await fs.mkdir(OUT, { recursive: true });
const miss = [];
for (const div of ROSTER) for (const [name] of div) {
  if (ONLY && name !== ONLY) continue;
  if (!FORCE && meta[name] && (await fs.stat(`${OUT}/${meta[name].file}`).catch(() => null))) continue;
  let done = false;
  for (const s of SPECIAL[name] || [slug(name), slug(name.replace(/ Jr\.?$/, ""))]) {
    try {
      const r = await get("https://www.ufc.com/athlete/" + s);
      if (!r.ok) continue;
      const d = parse(await r.text());
      if (!d) { miss.push(name + " (no headshot)"); done = true; break; }
      const ir = await get(d.img);
      if (!ir.ok) throw new Error("image " + ir.status);
      const buf = Buffer.from(await ir.arrayBuffer());
      const file = s + ".webp";
      await sharp(buf).trim({ threshold: 1 }).resize({ width: 440, height: 440, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(`${OUT}/${file}`);
      const { img, ...rest } = d;
      meta[name] = { slug: s, file, source: "https://www.ufc.com/athlete/" + s, ...rest };
      await fs.writeFile(META, JSON.stringify(meta, null, 1));
      console.log("✓", name);
      done = true;
      break;
    } catch (e) { console.log("! ", name, e.message); }
  }
  if (!done) miss.push(name + " (page not found)");
}
await fs.writeFile(META, JSON.stringify(meta, null, 1));
console.log(`\nDONE ${Object.keys(meta).length} fighters with headshots. Missing ${miss.length}:\n  ` + miss.join("\n  "));
