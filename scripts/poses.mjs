// Arena pose sheet: starts a fight headlessly, forces each pose and move, and screenshots the arena.
// Run: npm run poses [-- <dir> <width> <height>]. Use it after changing poses or parts in src/ui/arena.js.
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";
const OUT = process.argv[2] || "test-results/arena", W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
fs.mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: true, hmr: false, watch: { ignored: ["**/*"] } }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:5199/?mute");
  await page.waitForSelector(".boot", { state: "detached" });
  await page.click('[data-a="play"]'); await page.waitForSelector(".slots");
  await page.click('[data-a="newslot"][data-i="1"]'); await page.fill("#an", "Shots MMA");
  await page.click('[data-a="start"]'); await page.waitForSelector(".tour-tip"); await page.click('[data-a="tourskip"]');
  await page.evaluate(() => { const fm = window.__fm, g = fm.G, rs = g.f.filter((f) => f.real && f.wc === 4), A = rs[3], B = rs[1]; A.st = "mine"; A.ct = { pct: 20, wks: 50, signed: 0 }; fm.UI.queue = []; fm.UI.modal = null; fm.startFight({ fid: A.id, oid: B.id, purse: 50000, bonus: 50000, wk: g.wk, lab: "Even" }); });
  await page.waitForTimeout(1200); await page.click("#intro"); await page.waitForTimeout(400);
  await page.click('[data-a="fstart"]'); await page.waitForTimeout(600);
  await page.evaluate(() => { window.__fm.UI.FS.cue = null; window.__fm.UI.speed = 0.0001; });
  const arena = page.locator("#arena");
  await arena.screenshot({ path: `${OUT}/p-stand.png` });
  for (const [n, js] of [
    ["jab", `a.arenaAct(0,"atk","jab"); a.arenaAct(1,"atk","head kick")`, 140],
    ["kick", `a.arenaAct(0,"atk","leg kick"); a.arenaAct(1,"atk","knee")`, 200],
    ["hit", `a.arenaAct(0,"atk","overhand"); a.arenaAct(1,"bighit")`, 150],
    ["shoot", `a.arenaAct(0,"dash"); a.arenaAct(1,"sprawl")`, 180],
    ["ground", `a.arenaSet(0,46,"top",{}); a.arenaSet(1,54,"bottom",{})`, 900],
    ["ko", `a.arenaSet(0,40,"win",{}); a.arenaSet(1,62,"ko",{cut:1})`, 900],
  ]) {
    await page.evaluate(`import("/src/ui/arena.js").then(a=>{${js}})`);
    await page.waitForTimeout(n === "ground" || n === "ko" ? 900 : n === "kick" ? 200 : 140);
    await arena.screenshot({ path: `${OUT}/p-${n}.png` });
  }
} finally { await browser.close(); await server.close(); console.log(errors.length ? "ERRORS: " + errors.join(" | ") : "no page errors"); }
