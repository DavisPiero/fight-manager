// Smoke test: starts the dev server, plays a career headlessly, fails on any page error.
// Run: npm test            Screenshots go to test-results/.
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";

const SHOTS = "test-results";
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: true, hmr: false, watch: { ignored: ["**/*"] } }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ headless: true });
const errors = [];
let ok = false;
const log = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  const shot = async (n) => { await page.waitForTimeout(450); await page.screenshot({ path: `${SHOTS}/${n}.png` }); };
  const click = (sel) => page.click(sel);
  const fm = (fn, arg) => page.evaluate(fn, arg);
  // Clear any modal/event the week threw up.
  const settle = async () => {
    for (let i = 0; i < 4; i++) {
      const k = await fm(() => window.__fm.UI.modal?.kind);
      if (k === "event") { await click('[data-a="evpick"]'); log.push("event"); }
      else if (k === "evres" || k === "week") await click(k === "week" ? '[data-a="weekok"]' : '[data-a="mclose"]');
      else break;
    }
  };
  const fightThrough = async (first) => {
    console.log("FIGHT", await fm(() => JSON.stringify({ v: window.__fm.UI.view, ph: window.__fm.UI.FS?.ph, q: window.__fm.UI.queue.length, wk: window.__fm.G.wk })));
    if (first) await shot("08-tale-of-tape");
    await click('[data-a="fstart"]');
    await page.waitForTimeout(2600);
    if (first) await shot("09-fight-live");
    await fm(() => (window.__fm.UI.skip = true));
    for (let k = 0; k < 8; k++) {
      await page.waitForFunction(() => ["end", "corner"].includes(window.__fm.UI.FS?.ph), null, { timeout: 15000 }).catch(async (e) => { console.log("STUCK", await fm(() => { const F = window.__fm.UI.FS; return F && { ph: F.ph, ex: F.ex, rd: F.rd, fin: F.fin, skip: window.__fm.UI.skip, view: window.__fm.UI.view, rej: window.__rej }; })); throw e; });
      console.log("  ph", await fm(() => window.__fm.UI.FS?.ph));
      if ((await fm(() => window.__fm.UI.FS.ph)) === "end") break;
      if (first && k === 0) await shot("10-corner");
      await click('[data-a="corner"][data-i="water"]');
      await click('[data-a="nextround"]');
      await fm(() => (window.__fm.UI.skip = true));
    }
    await page.waitForTimeout(700);
    if (first) await shot("11-result");
    await click('[data-a="fdone"]');
    await page.waitForTimeout(200);
  };

  await page.addInitScript(() => addEventListener("unhandledrejection", (e) => (window.__rej = String(e.reason && e.reason.stack || e.reason))));
  await page.goto("http://localhost:5199/?mute");
  await page.waitForSelector(".slots");
  await page.waitForTimeout(900);
  await shot("01-menu");
  await click('[data-a="newslot"][data-i="1"]');
  await page.fill("#an", "Smoke Test MMA");
  await page.fill("#mn", "Sam Tester");
  await click('[data-a="scity"][data-i="rio"]');
  await click('[data-a="semb"][data-i="bolt"]');
  await shot("02-setup");
  await click('[data-a="start"]');
  await page.waitForSelector(".tour-tip");
  await shot("03-tour-welcome");
  await click('[data-a="tournext"]');
  await page.waitForTimeout(300);
  await shot("04-tour-step");
  await click('[data-a="tourskip"]');
  await shot("05-home");

  await click('[data-a="go"][data-i="fights"]');
  await click('[data-a="seekall"]');
  await shot("06-fights");
  for (let i = 0; i < 3; i++) { if (!(await page.$('[data-a="acc"]'))) break; await click('[data-a="acc"]'); }

  await click('[data-a="go"][data-i="gym"]');
  await click('[data-a="autotoggle"]');
  await click('[data-a="train"]');
  await shot("07-gym");

  await click('[data-a="go"][data-i="market"]');
  await shot("12-market");
  await click('[data-a="neg"]');
  await page.waitForSelector(".modal");
  await shot("13-negotiate");
  await click('[data-a="mclose"]');

  let fought = 0;
  for (let w = 0; w < 14 && fought < 2; w++) {
    await settle();
    if ((await fm(() => window.__fm.UI.view)) !== "fight") await fm(() => window.__fm.nextWeek());
    while ((await fm(() => window.__fm.UI.view)) === "fight") { await fightThrough(fought === 0); fought++; }
  }
  await settle();

  // Force an event so we can see it.
  await fm(() => { const fm = window.__fm; fm.G.event = { id: "viral", ctx: { fid: fm.G.ro[0] } }; fm.afterWeek(); });
  await shot("14-event");
  await settle();

  // Sponsor + sell flow.
  await fm(() => { const g = window.__fm.G, f = g.f[g.ro[0]]; f.ct.signed = -50; f.pop = 60; g.spons.push({ id: 4242, fid: f.id, brand: "Redline Energy", col: "#ff3b3b", weekly: 2400, weeks: 20, exp: g.wk + 2 }); window.__fm.UI.pid = f.id; window.__fm.UI.view = "prof"; window.__fm.render(); });
  await shot("15-profile-mine");
  await click('[data-a="spok"]');
  await click('[data-a="list"]');
  await page.waitForSelector(".modal");
  await click('[data-a="dolist"]');
  let bids = 0;
  for (let w = 0; w < 12 && !bids; w++) {
    await fm(() => { const fm = window.__fm; fm.UI.FS = null; fm.UI.queue = []; fm.UI.modal = null; fm.G.event = null; fm.UI.view = "home"; fm.nextWeek(); fm.UI.FS = null; fm.UI.queue = []; });
    bids = await fm(() => window.__fm.G.bids.length);
  }
  await fm(() => { const fm = window.__fm; fm.UI.modal = null; fm.G.event = null; fm.go("market", "desk"); });
  await shot("16-sell-desk");
  if (bids) { await click('[data-a="bidok"]'); await page.waitForTimeout(300); }
  const sold = await fm(() => window.__fm.G.hist.sold);
  const spons = await fm(() => window.__fm.G.fin.spons || 0);

  await fm(() => { window.__fm.UI.rk = 4; window.__fm.go("rankings"); }); await shot("17-rankings");
  await fm(() => { const fm = window.__fm; fm.UI.pid = fm.G.f.find((f) => f.real).id; fm.UI.view = "prof"; fm.render(); }); await shot("18-profile-star");
  await fm(() => { window.__fm.UI.office = "set"; window.__fm.go("office"); });
  await click('[data-a="analyst"]');
  await shot("19-settings-analyst");
  await fm(() => { const fm = window.__fm; fm.UI.pid = fm.G.f.find((f) => f.real).id; fm.UI.view = "prof"; fm.render(); }); await shot("20-profile-analyst");
  await fm(() => { const fm = window.__fm; fm.UI.view = "fight"; }).catch(() => {});
  await fm(() => { window.__fm.UI.office = "set"; window.__fm.go("office"); }); await click('[data-a="analyst"]');

  // Back to menu: slot should show the career.
  await click('[data-a="menu"]');
  await page.waitForSelector('[data-a="loadslot"][data-i="1"]');
  await shot("21-menu-with-save");

  await page.setViewportSize({ width: 390, height: 844 });
  await click('[data-a="loadslot"][data-i="1"]');
  await shot("22-mobile-home");
  const overflow = await fm(() => document.documentElement.scrollWidth > innerWidth + 1);
  await fm(() => window.__fm.go("fighters")); await shot("23-mobile-fighters");

  console.log(`fights: ${fought}, bids: ${bids}, sold: ${sold}, sponsor income: ${spons}, events: ${log.length}, mobile overflow: ${overflow}`);
  ok = errors.length === 0 && fought > 0 && !overflow;
} catch (e) {
  try { const pg = browser.contexts()[0].pages()[0]; await pg.screenshot({ path: SHOTS + "/zz-fail.png" }); console.log("STATE", await pg.evaluate(() => JSON.stringify({ v: window.__fm.UI.view, m: window.__fm.UI.modal, ev: window.__fm.G?.event }))); } catch (x) {}
  errors.push("TEST: " + e.message.split("\n").slice(0, 6).join(" | "));
} finally {
  await browser.close();
  await server.close();
}
if (errors.length) console.log("ERRORS:\n  " + [...new Set(errors)].join("\n  "));
console.log(ok ? "SMOKE PASS" : "SMOKE FAIL");
process.exit(ok ? 0 : 1);
