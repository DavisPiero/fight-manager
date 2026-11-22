// Fight-night screenshots for review: intro stages, tale of the tape, and each corner-call type.
// Run: node scripts/fightshots.mjs [outDir] [width] [height]
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = process.argv[2] || "test-results/fight", W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
fs.mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: 5198, strictPort: true, hmr: false, watch: { ignored: ["**/*"] } }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => errors.push(e.message));
  const fm = (fn, arg) => page.evaluate(fn, arg);
  const snap = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  await page.goto("http://localhost:5198/?mute");
  await page.waitForSelector(".boot", { state: "detached" });
  await page.click('[data-a="play"]'); await page.waitForSelector(".slots");
  await page.click('[data-a="newslot"][data-i="1"]'); await page.fill("#an", "Shots MMA");
  await page.click('[data-a="start"]'); await page.waitForSelector(".tour-tip"); await page.click('[data-a="tourskip"]');
  await fm(() => { const fm = window.__fm, g = fm.G, rs = g.f.filter((f) => f.real && f.wc === 4), A = rs[3], B = rs[1]; A.st = "mine"; A.ct = { pct: 20, wks: 50, signed: 0 }; fm.UI.queue = []; fm.UI.modal = null; fm.startFight({ fid: A.id, oid: B.id, purse: 50000, bonus: 50000, wk: g.wk, lab: "Even" }); });
  for (const [t, n] of [[1100, "a-title"], [2700, "b-left"], [4300, "c-right"], [5900, "d-vs"]]) { await page.waitForTimeout(t - (globalThis.__t || 0)); globalThis.__t = t; await snap("intro-" + n); }
  await page.click("#intro"); await page.waitForTimeout(500); await snap("tape");
  await page.locator('[data-a="fstart"]').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.click('[data-a="fstart"]'); await page.waitForTimeout(1500);
  const cues = [{ id: "incoming" }, { id: "back" }, { id: "hurtOpp" }, { id: "open", v: 1 }, { id: "open", v: 0 }];
  for (const c of cues) {
    await fm((c) => { window.__fm.UI.FS.cue = c; window.__fm.UI.FS.moc = 0; window.__fm.UI.FS.pos = "stand"; }, c);
    await page.waitForSelector(".moment .mo-c", { timeout: 15000 });
    await page.waitForTimeout(500); await snap("moment-" + c.id + (c.v ?? ""));
    await page.keyboard.press("1"); await page.waitForTimeout(1700);
    if (await fm(() => window.__fm.UI.FS.fin || window.__fm.UI.FS.ph !== "run")) break;
  }
  await snap("after");
} finally {
  await browser.close(); await server.close();
  console.log(errors.length ? "ERRORS: " + errors.join(" | ") : "no page errors");
}
