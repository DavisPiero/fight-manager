// Samples a skin tone from each UFC.com headshot for the drawn fighters in the octagon.
// Writes src/data/skintones.json and a contact sheet (headshot + swatch) to test-results/skintones.png.
// Run: npm run skin. Fix a wrong one by hand in skintones.json; the script keeps hand edits marked with "!".
import { chromium } from "playwright";
import fs from "node:fs";

const DIR = "public/fighters", OUT = "src/data/skintones.json";
const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".webp"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const res = {};
for (const file of files) {
  if (String(old[file] || "").startsWith("!")) { res[file] = old[file]; continue; }
  const url = "data:image/webp;base64," + fs.readFileSync(`${DIR}/${file}`).toString("base64");
  res[file] = await page.evaluate(async (url) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    // Find the head: rows with opaque pixels. The face is the middle of the top part of the figure.
    let top = c.height;
    for (let y = 0; y < c.height && top === c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 200) { top = y; break; }
    const px = [];
    const y0 = top + c.height * 0.15, y1 = top + c.height * 0.27;
    for (let y = Math.floor(y0); y < y1; y += 2) for (let i = Math.floor(c.width * 0.39); i < c.width * 0.61; i += 2) {
      const k = (y * c.width + i) * 4; if (d[k + 3] < 230) continue;
      const r = d[k], g = d[k + 1], b = d[k + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const s = mx ? (mx - mn) / mx : 0, v = mx / 255;
      if (r < g || g < b * 0.92 || r - g < 12 || s < 0.12 || s > 0.75 || v < 0.16 || v > 0.97) continue; // skin is red-leaning
      px.push([r, g, b, 0.3 * r + 0.59 * g + 0.11 * b]);
    }
    if (px.length < 30) return null;
    px.sort((a, b) => a[3] - b[3]);
    const mid = px.slice(Math.floor(px.length * 0.35), Math.ceil(px.length * 0.75)); // skip shadows and highlights
    const avg = [0, 1, 2].map((j) => Math.round(mid.reduce((s, p) => s + p[j], 0) / mid.length));
    return "#" + avg.map((v) => v.toString(16).padStart(2, "0")).join("");
  }, url);
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + "\n");
// Contact sheet
fs.mkdirSync("test-results", { recursive: true });
const cells = files.map((f) => { const t = String(res[f] || "#777").replace("!", ""); return `<div><img src="data:image/webp;base64,${fs.readFileSync(`${DIR}/${f}`).toString("base64")}"><i style="background:${t}"></i><small>${f.replace(".webp", "")}</small></div>`; }).join("");
await page.setViewportSize({ width: 1600, height: 900 });
await page.setContent(`<style>body{margin:0;background:#222;font:10px sans-serif;color:#ccc;display:grid;grid-template-columns:repeat(14,1fr);gap:4px;padding:6px}div{position:relative;text-align:center}img{width:100%;height:110px;object-fit:cover;object-position:top}i{display:block;height:22px;margin-top:-22px;width:40%;margin-left:60%;position:relative;border:2px solid #000}small{display:block;overflow:hidden;white-space:nowrap}</style>${cells}`);
await page.waitForTimeout(300);
await page.screenshot({ path: "test-results/skintones.png", fullPage: true });
await browser.close();
const miss = files.filter((f) => !res[f]);
console.log(`${files.length - miss.length}/${files.length} sampled → ${OUT}; sheet → test-results/skintones.png${miss.length ? "; no sample: " + miss.join(", ") : ""}`);
