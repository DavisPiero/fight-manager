// Reads hair and beard from each UFC.com headshot for the drawn fighters in the octagon:
// bald or not, how much hair (buzz / short / tall; long, curly and bun are hand fixes), its colour, and the beard (none / stubble / short / full).
// Writes src/data/hair.json and a contact sheet (headshot + what was read) to test-results/hair.png.
// Run: npm run hair (after npm run skin, which it uses). Fix a wrong one by hand in hair.json and add "fix": 1 so it is kept.
import { chromium } from "playwright";
import fs from "node:fs";

const DIR = "public/fighters", OUT = "src/data/hair.json";
const SKIN = JSON.parse(fs.readFileSync("src/data/skintones.json", "utf8"));
const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".webp"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const res = {};
for (const file of files) {
  if (old[file]?.fix) { res[file] = old[file]; continue; }
  const skin = String(SKIN[file] || "#c08060").replace("!", "");
  const url = "data:image/webp;base64," + fs.readFileSync(`${DIR}/${file}`).toString("base64");
  res[file] = await page.evaluate(async ([url, skin]) => {
    const img = new Image(); img.src = url; await img.decode();
    const W = img.width, H = img.height, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const sk = [1, 3, 5].map((i) => parseInt(skin.slice(i, i + 2), 16)), lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b, sl = lum(...sk);
    const at = (i, y) => { const k = (Math.round(y) * W + Math.round(i)) * 4; return d[k + 3] > 220 ? [d[k], d[k + 1], d[k + 2]] : null; };
    // Skin: close to the sampled tone, or red-leaning at a similar brightness (scalp highlights and shadows count).
    const isSkin = ([r, g, b]) => { const L = lum(r, g, b), dist = Math.hypot(r - sk[0], g - sk[1], b - sk[2]); return dist < 48 || (r > g && g >= b * 0.85 && r - b > 18 && L > sl * 0.62 && L < sl * 1.5); };
    // Top of the figure and the head's span on each row.
    let top = H; for (let y = 0; y < H && top === H; y++) for (let i = 0; i < W; i++) if (d[(y * W + i) * 4 + 3] > 200) { top = y; break; }
    const span = (y) => { let a = -1, b = -1; for (let i = 0; i < W; i++) if (d[(Math.round(y) * W + i) * 4 + 3] > 200) { if (a < 0) a = i; b = i; } return [a, b]; };
    const sample = (y0, y1, f0, f1) => { const px = []; for (let y = y0; y < y1; y += 1) { const [a, b] = span(y); if (a < 0) continue; for (let i = a + (b - a) * f0; i < a + (b - a) * f1; i += 1) { const p = at(i, y); if (p) px.push(p); } } return px; };
    const hairOf = (px) => px.filter((p) => !isSkin(p));
    // Crown: the first few rows of the head.
    const crown = sample(top + 1, top + H * 0.05, 0.2, 0.8), crownHair = hairOf(crown);
    const bald = crown.length < 20 || crownHair.length / crown.length < 0.35;
    // Hair depth: walk down the middle of the head until the forehead shows.
    let depth = 0; const mid = (y) => { const [a, b] = span(y); return a < 0 ? [] : sample(y, y + 1, 0.4, 0.6); };
    for (let y = top; y < top + H * 0.3; y += 1) { const px = mid(y); if (px.length && hairOf(px).length / px.length < 0.4) break; depth = (y - top) / H; }
    // Colour: the middle of the hair pixels by brightness.
    const pool = (crownHair.length > 15 ? crownHair : hairOf(sample(top + H * 0.2, top + H * 0.5, 0.35, 0.65)));
    let col = null;
    if (pool.length > 10) { pool.sort((a, b) => lum(...a) - lum(...b)); const m = pool.slice(Math.floor(pool.length * 0.2), Math.ceil(pool.length * 0.7)); col = "#" + [0, 1, 2].map((j) => Math.round(m.reduce((s, p) => s + p[j], 0) / m.length).toString(16).padStart(2, "0")).join(""); }
    // Beard: chin and jaw, below the mouth.
    const chin = sample(top + H * 0.44, top + H * 0.54, 0.3, 0.7), cheek = sample(top + H * 0.36, top + H * 0.44, 0.22, 0.4);
    const dark = (px) => (px.length ? px.filter((p) => !isSkin(p) && lum(...p) < sl * 0.82).length / px.length : 0);
    const bc = dark(chin), bk = dark(cheek);
    const beard = bc > 0.6 && bk > 0.35 ? "full" : bc > 0.45 ? "short" : bc > 0.18 ? "stubble" : "none";
    const hair = bald ? (crownHair.length / Math.max(1, crown.length) > 0.15 ? "shaved" : "bald") : depth < 0.035 ? "buzz" : depth < 0.075 ? "short" : "tall";
    return { hair, col, beard, top, depth: +depth.toFixed(3), cr: +(crownHair.length / Math.max(1, crown.length)).toFixed(2), bc: +bc.toFixed(2) };
  }, [url, skin]);
  delete res[file].top;
}
fs.writeFileSync(OUT, "{\n" + Object.entries(res).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n") + "\n}\n");
// Contact sheet
fs.mkdirSync("test-results", { recursive: true });
const cells = files.map((f) => { const r = res[f] || {}; return `<div><img src="data:image/webp;base64,${fs.readFileSync(`${DIR}/${f}`).toString("base64")}"><i style="background:${r.col || "#777"}"></i><small>${f.replace(".webp", "")}</small><b>${r.hair} · ${r.beard}</b></div>`; }).join("");
await page.setViewportSize({ width: 1600, height: 900 });
await page.setContent(`<style>body{margin:0;background:#666;font:10px sans-serif;color:#eee;display:grid;grid-template-columns:repeat(14,1fr);gap:4px;padding:6px}div{position:relative;text-align:center}img{width:100%;height:100px;object-fit:cover;object-position:top}i{display:block;height:18px;margin-top:-18px;width:30%;margin-left:70%;position:relative;border:2px solid #000}small,b{display:block;overflow:hidden;white-space:nowrap}</style>${cells}`);
await page.waitForTimeout(300);
await page.screenshot({ path: "test-results/hair.png", fullPage: true });
await browser.close();
const count = (k) => Object.values(res).filter((r) => r.hair === k).length;
console.log(`${files.length} read → ${OUT}; sheet → test-results/hair.png · bald ${count("bald")}, shaved ${count("shaved")}, buzz ${count("buzz")}, short ${count("short")}, tall ${count("tall")}, hand-fixed ${Object.values(res).filter((r) => r.fix).length}`);
