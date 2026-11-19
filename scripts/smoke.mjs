// Smoke test: starts the dev server, plays a few weeks headlessly, fails on any page error.
// Run: npm test            Screenshots go to test-results/.
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";

const SHOTS = "test-results";
fs.mkdirSync(SHOTS, { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ headless: true });
const errors = [];
let ok = false;
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  const shot = async (n) => { await page.waitForTimeout(450); return page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: false }); };
  const click = (sel) => page.click(sel);

  await page.goto("http://localhost:5199/?mute");
  await page.waitForSelector(".title");
  await shot("01-menu");
  await click('[data-a="new"]');
  await page.fill("#an", "Smoke Test MMA");
  await click('[data-a="start"]');
  await page.waitForSelector(".tiles");
  await shot("02-dashboard");

  // Book fights for everyone.
  await click('[data-a="go"][data-i="fights"]');
  await click('[data-a="seekall"]');
  await shot("03-fights");
  for (let i = 0; i < 3; i++) { if (!(await page.$('[data-a="acc"]'))) break; await click('[data-a="acc"]'); }

  // Train.
  await click('[data-a="go"][data-i="gym"]');
  await shot("04-gym");
  await click('[data-a="autotrain"]');

  // Market + negotiation modal.
  await click('[data-a="go"][data-i="market"]');
  await shot("05-market");
  await click('[data-a="neg"]');
  await page.waitForSelector(".modal");
  await shot("06-negotiate");
  await click('[data-a="mclose"]');

  // Play weeks until a fight happens; skip through it.
  let fought = 0;
  for (let w = 0; w < 12 && fought < 2; w++) {
    if (await page.$(".modal")) await page.keyboard.press("Escape");
    const v = await page.evaluate(() => window.__fm.UI.view);
    if (v !== "fight") await page.evaluate(() => window.__fm.nextWeek());
    if (await page.evaluate(() => window.__fm.UI.view) === "fight") {
      if (!fought) await shot("07-tale-of-tape");
      await click('[data-a="fstart"]');
      await page.waitForTimeout(2500);
      if (!fought) await shot("08-fight-live");
      for (let k = 0; k < 6; k++) {
        const ph = await page.evaluate(() => window.__fm.UI.FS?.ph);
        if (ph === "end") break;
        if (ph === "corner") { if (!fought) await shot("09-corner"); await click('[data-a="corner"][data-i="water"]'); await click('[data-a="nextround"]'); }
        await page.evaluate(() => (window.__fm.UI.skip = true));
        await page.waitForTimeout(400);
      }
      await page.waitForFunction(() => window.__fm.UI.FS?.ph === "end", null, { timeout: 15000 });
      await page.waitForTimeout(800);
      if (!fought) await shot("10-fight-result");
      fought++;
      while (await page.$('[data-a="fdone"]')) { await click('[data-a="fdone"]'); await page.waitForTimeout(300);
        if (await page.evaluate(() => window.__fm.UI.view) === "fight") { await click('[data-a="fstart"]'); await page.evaluate(() => (window.__fm.UI.skip = true)); await page.waitForFunction(() => ["end", "corner"].includes(window.__fm.UI.FS?.ph), null, { timeout: 15000 });
          while ((await page.evaluate(() => window.__fm.UI.FS?.ph)) === "corner") { await click('[data-a="nextround"]'); await page.evaluate(() => (window.__fm.UI.skip = true)); await page.waitForFunction(() => ["end", "corner"].includes(window.__fm.UI.FS?.ph)); } } }
    }
  }

  // Sell: make a fighter sellable, list him, advance until bids arrive.
  await page.evaluate(() => { const G = window.__fm.G; G.f[G.ro[0]].ct.signed = -50; window.__fm.go("fighters"); });
  await shot("11-roster");
  await click('[data-a="list"]');
  await page.waitForSelector(".modal");
  await shot("12-list");
  await click('[data-a="dolist"]');
  let bids = 0;
  for (let w = 0; w < 10 && !bids; w++) {
    await page.evaluate(() => { const fm = window.__fm; if (fm.UI.view === "fight") { fm.UI.FS = null; fm.UI.queue = []; fm.go("home"); } fm.UI.modal = null; fm.nextWeek(); });
    bids = await page.evaluate(() => window.__fm.G.bids.length);
  }
  await page.evaluate(() => { const fm = window.__fm; fm.UI.FS = null; fm.UI.queue = []; fm.UI.modal = null; fm.go("market", "desk"); });
  await shot("13-transfer-desk");
  if (bids) { await click('[data-a="bidok"]'); await page.waitForTimeout(400); }
  const sold = await page.evaluate(() => window.__fm.G.hist.sold);

  await page.evaluate(() => window.__fm.go("rankings")); await shot("14-rankings");
  await page.evaluate(() => { const fm = window.__fm; fm.UI.pid = fm.G.f.find((f) => f.real && f.name === "Islam Makhachev").id; fm.UI.view = "prof"; fm.render(); });
  await shot("15-profile");
  await page.evaluate(() => { window.__fm.UI.office = "fin"; window.__fm.go("office"); }); await shot("16-office");

  // Phone width.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__fm.go("home")); await shot("17-mobile-home");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

  console.log(`fights played: ${fought}, bids seen: ${bids}, fighters sold: ${sold}, mobile overflow: ${overflow}`);
  ok = errors.length === 0 && fought > 0 && !overflow;
} catch (e) {
  errors.push("TEST: " + e.message);
} finally {
  await browser.close();
  await server.close();
}
if (errors.length) console.log("ERRORS:\n  " + [...new Set(errors)].join("\n  "));
console.log(ok ? "SMOKE PASS" : "SMOKE FAIL");
process.exit(ok ? 0 : 1);
