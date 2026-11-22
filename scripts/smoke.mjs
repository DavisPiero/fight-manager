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
let moments = 0;
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
    if (first) { await page.waitForTimeout(1900); await page.screenshot({ path: `${SHOTS}/08a-intro-walkout.png` }); await page.waitForTimeout(2300); await page.screenshot({ path: `${SHOTS}/08b-intro-faceoff.png` }); }
    if (await page.$("#intro")) { await click("#intro"); await page.waitForTimeout(400); }
    if (first) await shot("08-tale-of-tape");
    await click('[data-a="fstart"]');
    if (first) {
      await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/09a-round-card.png` });
      await page.waitForTimeout(2500); await shot("09-fight-live");
      const mo = await page.waitForSelector("#mo .moment", { timeout: 20000 }).catch(() => null);
      if (mo) { await page.screenshot({ path: `${SHOTS}/09b-corner-call.png` }); await click('[data-a="mpick"]'); await page.waitForTimeout(700); await page.screenshot({ path: `${SHOTS}/09c-call-result.png` }); moments++; }
    }
    await fm(() => { window.__fm.UI.skip = true; window.__fm.UI.mpick?.(-1); });
    for (let k = 0; k < 8; k++) {
      await page.waitForFunction(() => ["end", "corner"].includes(window.__fm.UI.FS?.ph), null, { timeout: 15000 }).catch(async (e) => { console.log("STUCK", await fm(() => { const F = window.__fm.UI.FS; return F && { ph: F.ph, ex: F.ex, rd: F.rd, fin: F.fin, skip: window.__fm.UI.skip, view: window.__fm.UI.view, rej: window.__rej }; })); throw e; });
      console.log("  ph", await fm(() => window.__fm.UI.FS?.ph));
      if ((await fm(() => window.__fm.UI.FS.ph)) === "end") break;
      if (first && k === 0) await shot("10-corner");
      await click('[data-a="corner"][data-i="water"]');
      await click('[data-a="nextround"]');
      await fm(() => { window.__fm.UI.skip = true; window.__fm.UI.mpick?.(-1); });
    }
    await page.waitForFunction(() => window.__fm.UI.FS?.ph === "end" && document.querySelector('[data-a="fdone"]'), null, { timeout: 15000 });
    await page.waitForTimeout(700);
    if (first) await shot("11-result");
    await click('[data-a="fdone"]');
    await page.waitForTimeout(200);
  };

  await page.addInitScript(() => addEventListener("unhandledrejection", (e) => (window.__rej = String(e.reason && e.reason.stack || e.reason))));
  // Menu faces must not be cut off (by the window edge, the logo or the buttons) at common sizes.
  const facesOk = () => fm(() => {
    const logo = document.querySelector(".menu .logo").getBoundingClientRect(), btm = document.querySelector(".menu .bottom").getBoundingClientRect();
    return [...document.querySelectorAll(".menu .lineup img")].filter((i) => getComputedStyle(i).display !== "none").every((i) => {
      const r = i.getBoundingClientRect(), face = r.top + r.height * 0.45;
      return r.height > 80 && r.top >= logo.bottom - r.height * 0.15 && face <= btm.top;
    });
  });
  await page.goto("http://localhost:5199/?mute");
  await page.waitForSelector(".boot");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/00-loading.png` });
  await page.waitForSelector(".boot", { state: "detached" });
  await page.waitForTimeout(900);
  await shot("01-menu");
  const faces = [await facesOk()];
  for (const [w, h] of [[1280, 720], [390, 844]]) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(200); faces.push(await facesOk()); await shot(`01-menu-${w}`); }
  await page.setViewportSize({ width: 1440, height: 900 });
  await click('[data-a="settings"]');
  await shot("01-menu-settings");
  await click('[data-a="mclose"]');
  await click('[data-a="play"]');
  await page.waitForSelector(".slots");
  await shot("01-slots");
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
  await click('[data-a="seek"]');
  await shot("06-fights");
  await click('[data-a="autobook"]');
  const booked = await fm(() => window.__fm.G.bk.length);
  await shot("06b-auto-booked");

  await click('[data-a="go"][data-i="gym"]');
  await click('[data-a="autotoggle"]');
  await click('[data-a="train"]');
  await shot("07-gym");

  await click('[data-a="go"][data-i="market"]');
  await shot("12-market");
  await click('[data-a="mktab"][data-i="other"]');
  await shot("12b-market-rivals");
  await click('[data-a="mquick"]');
  await page.waitForSelector(".modal .quick");
  await shot("12c-quick-look");
  await click('[data-a="mclose"]');
  await click('.repbar [data-a="rephelp"]');
  await page.waitForSelector(".rep-reach");
  await shot("12d-rep-help");
  await click('[data-a="mclose"]');
  await click('[data-a="mktab"][data-i="free"]');
  await click('[data-a="mquick"]');
  await click('.modal [data-a="neg"]');
  await page.waitForSelector(".modal");
  await shot("13-negotiate");
  await click('[data-a="mclose"]');

  let fought = 0;
  for (let w = 0; w < 14 && fought < 2; w++) {
    await settle();
    if ((await fm(() => window.__fm.UI.view)) !== "fight") {
      await fm((first) => { const p = window.__fm.nextWeek(); return first ? null : p; }, w === 0);
      if (w === 0) { await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/06c-fast-forward.png` }); await page.waitForTimeout(1100); await shot("06d-week-summary"); }
    }
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
  await click('[data-a="more"]');
  await click('.modal [data-a="list"]');
  await page.waitForSelector(".modal");
  await click('[data-a="dolist"]');
  let bids = 0;
  for (let w = 0; w < 12 && !bids; w++) {
    await fm(() => { const fm = window.__fm; fm.UI.FS = null; fm.UI.queue = []; fm.UI.modal = null; fm.G.event = null; fm.UI.view = "home"; fm.UI.instant = true; fm.nextWeek(); fm.UI.instant = false; fm.UI.FS = null; fm.UI.queue = []; });
    bids = await fm(() => window.__fm.G.bids.length);
  }
  await fm(() => { const fm = window.__fm; fm.UI.modal = null; fm.G.event = null; fm.go("market", "desk"); });
  await shot("16-sell-desk");
  if (bids) { await click('[data-a="bidok"]'); await page.waitForTimeout(300); }
  const sold = await fm(() => window.__fm.G.hist.sold);
  const spons = await fm(() => window.__fm.G.fin.spons || 0);

  // Phone: home, an offer in PULSE CONNECT, a chat, the PULSE feed, a post, the composer, contacts, a pop-up banner.
  const mediaId = await fm(() => { const fm = window.__fm; fm.UI.still = true; fm.UI.modal = null; fm.G.event = null; fm.go("home"); const d = fm.PS.debugDeal("media"); fm.PS.debugDeal("gym"); for (let i = 0; i < 10; i++) fm.PS.tick(); return d?.id; });
  await click('[data-a="phone"]'); await page.waitForSelector(".phone"); await shot("30-phone-home");
  await click('[data-a="papp"][data-i="connect"]'); await click('[data-a="ptab"][data-i="offers"]'); await shot("31-phone-offers");
  const cash0 = await fm(() => window.__fm.G.cash);
  await click(mediaId != null ? `[data-a="pdeal"][data-i="${mediaId}"][data-x="yes"]` : '[data-a="pdeal"][data-x="yes"]'); await page.waitForTimeout(200);
  const dealPaid = (await fm(() => window.__fm.G.cash)) !== cash0;
  await click('[data-a="ptab"][data-i="chats"]'); await shot("32-phone-chats");
  if (await page.$('.cn-row[data-a="pthread"]')) { await click('.cn-row[data-a="pthread"]'); await shot("33-phone-chat"); if (await page.$('[data-a="preply"]')) { await click('[data-a="preply"]'); await shot("33b-phone-replied"); } }
  await click('[data-a="phome"]'); await click('[data-a="papp"][data-i="pulse"]'); await shot("34-phone-pulse");
  await click('article.pp[data-a="ppost"]'); await shot("34b-phone-post"); await click('[data-a="pback"]');
  await click('[data-a="pcomp"]'); await click('[data-a="pck"][data-i="hype"]'); await click('[data-a="ptg"]'); await click('[data-a="pcpub"][data-i="0"]'); await shot("34c-phone-posted");
  await click('[data-a="phome"]'); await click('[data-a="papp"][data-i="connect"]'); await click('[data-a="ptab"][data-i="contacts"]'); await shot("34d-phone-contacts");
  const phoneCounts = await fm(() => { const p = window.__fm.G.ph; return { feed: p.feed.length, mine: p.feed.filter((x) => x.a === "me").length, deals: p.deals.length, threads: Object.keys(p.threads).length, contacts: Object.keys(p.cx).length }; });
  await page.keyboard.press("Escape");
  await fm(() => { const fm = window.__fm; fm.UI.noteMark = fm.PS.P().id; fm.PS.notify("crit", "connect", "Offer expires next week", "Marco Vitale: fight offer for your fighter.", "", "offer"); fm.PS.notify("imp", "connect", "A fighter", "Any news on my next fight?", "", "msg"); fm.flushBanners(); });
  await page.waitForTimeout(700); await page.screenshot({ path: `${SHOTS}/35-phone-banners.png` });
  // A fight between two real UFC fighters, to see headshots in the arena.
  await fm(() => { const fm = window.__fm, g = fm.G, rs = g.f.filter((f) => f.real && f.wc === 4), A = rs[1], B = rs[2]; A.st = "mine"; A.ct = { pct: 20, wks: 50, signed: 0 }; fm.UI.queue = []; fm.UI.modal = null; fm.startFight({ fid: A.id, oid: B.id, purse: 50000, bonus: 50000, wk: g.wk, lab: "Even" }); });
  await page.waitForTimeout(4300); await page.screenshot({ path: `${SHOTS}/26a-star-faceoff.png` });
  await click("#intro"); await page.waitForTimeout(400);
  await click('[data-a="fstart"]'); await page.waitForTimeout(1400);
  // Catch a landed shot mid-animation: wait for a hit class, then grab a frame.
  for (let k = 0; k < 3; k++) { await page.waitForSelector(".ftr.hit, .ftr.bighit, .ftr.kd, .moment", { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(90); await page.screenshot({ path: `${SHOTS}/26b-star-live-${k}.png` }); if (await page.$(".moment")) { await click('[data-a="mpick"]'); await page.waitForTimeout(450); await page.screenshot({ path: `${SHOTS}/26b-star-call-${k}.png` }); } await page.waitForTimeout(700); }
  await fm(() => { window.__fm.UI.skip = true; window.__fm.UI.mpick?.(-1); });
  for (let k = 0; k < 8; k++) {
    await page.waitForFunction(() => ["end", "corner"].includes(window.__fm.UI.FS?.ph), null, { timeout: 20000 });
    if ((await fm(() => window.__fm.UI.FS.ph)) === "end") break;
    await click('[data-a="nextround"]'); await fm(() => { window.__fm.UI.skip = true; window.__fm.UI.mpick?.(-1); });
  }
  await page.waitForSelector('[data-a="fdone"]'); await page.waitForTimeout(900); await shot("26c-star-result");
  await click('[data-a="fdone"]'); await settle();
  await fm(() => { window.__fm.UI.rk = 4; window.__fm.go("rankings"); }); await shot("17-rankings");
  await fm(() => { const fm = window.__fm; fm.UI.pid = fm.G.f.find((f) => f.real).id; fm.UI.view = "prof"; fm.render(); }); await shot("18-profile-star");
  await fm(() => window.__fm.go("home"));
  await click('[data-a="settings"]');
  await click('[data-a="analyst"]');
  await shot("19-settings-analyst");
  await click('[data-a="mclose"]');
  await fm(() => { const fm = window.__fm; fm.UI.pid = fm.G.f.find((f) => f.real).id; fm.UI.view = "prof"; fm.render(); }); await shot("20-profile-analyst");
  await fm(() => window.__fm.go("home")); await click('[data-a="settings"]'); await click('[data-a="analyst"]');
  await click('[data-a="mclose"]');
  await fm(() => window.__fm.go("fighters"));
  await click('[data-a="more"]');
  await page.waitForSelector(".more-list");
  await shot("19c-more");
  await click('[data-a="mclose"]');
  await fm(() => { window.__fm.UI.office = "sponsors"; window.__fm.go("office"); });
  const sponsorsTab = await fm(() => !!document.querySelector(".hero-strip") && /pitch a fighter/i.test(document.body.innerText));
  await shot("19d-office-sponsors");
  await click('[data-a="agency"]');
  const agencyTab = await fm(() => window.__fm.UI.view === "office" && !!document.getElementById("ren"));
  await shot("19b-office-agency");

  // Back to menu: slot should show the career.
  await click('[data-a="settings"]');
  await click('.modal [data-a="menu"]');
  await page.waitForSelector('[data-a="loadslot"][data-i="1"]');
  await shot("21-menu-with-save");

  await page.setViewportSize({ width: 390, height: 844 });
  await click('[data-a="loadslot"][data-i="1"]');
  await shot("22-mobile-home");
  const overflow = await fm(() => document.documentElement.scrollWidth > innerWidth + 1);
  await fm(() => window.__fm.go("fighters")); await shot("23-mobile-fighters");

  await fm(() => window.__fm.go("fights")); await shot("24-mobile-fights");
  await fm(() => window.__fm.go("market", "free")); await shot("25-mobile-market");
  await click('[data-a="phone"]'); await shot("36-mobile-phone"); await page.keyboard.press("Escape");
  const overflow2 = await fm(() => document.documentElement.scrollWidth > innerWidth + 1);
  const auto = await fm(() => window.__fm.G.log.filter((l) => l.t.startsWith("Auto-train:")).map((l) => l.t));
  console.log(`fights: ${fought}, booked: ${booked}, bids: ${bids}, sold: ${sold}, sponsor income: ${spons}, events: ${log.length}, mobile overflow: ${overflow}`);
  console.log(`menu faces visible: ${faces.join("/")}, agency click: ${agencyTab}, sponsors tab: ${sponsorsTab}, market overflow: ${overflow2}, auto-train lines: ${auto.length} (latest: ${auto[0]}), corner call seen: ${moments}`);
  console.log(`phone: ${JSON.stringify(phoneCounts)}, deal paid: ${dealPaid}`);
  ok = phoneCounts.feed > 0 && phoneCounts.mine > 0 && phoneCounts.contacts > 0 && dealPaid && errors.length === 0 && fought > 0 && !overflow && booked > 0 && faces.every(Boolean) && agencyTab && auto.length > 0 && sponsorsTab && !overflow2;
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
