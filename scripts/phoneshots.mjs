// Headless phone screenshots: plays a few weeks, then shoots PULSE and PULSE CONNECT screens.
// Run: npm run phone [-- <dir> <w> <h>]   Screenshots go to test-results/phone/ by default.
import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";

const [DIR = "test-results/phone", W = 1440, H = 900] = process.argv.slice(2);
fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR, { recursive: true });
const server = await createServer({ server: { port: 5198, strictPort: true, hmr: false, watch: { ignored: ["**/*"] } }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  const fm = (fn, a) => page.evaluate(fn, a);
  const shot = async (n) => { await page.waitForTimeout(350); await page.screenshot({ path: `${DIR}/${n}.png` }); };
  const click = (s) => page.click(s);
  await page.goto("http://localhost:5198/?mute");
  await page.waitForSelector(".boot", { state: "detached" });
  await click('[data-a="play"]'); await click('[data-a="newslot"][data-i="1"]');
  await page.fill("#an", "Phone Test MMA"); await page.fill("#mn", "Sam Tester");
  await click('[data-a="start"]'); await page.waitForSelector(".tour-tip"); await click('[data-a="tourskip"]');
  // Play 10 quiet weeks (no fights), letting the week's activity arrive.
  await fm(() => { const F = window.__fm; F.UI.still = true; F.G.rep = 32; F.G.hist.w = 3; F.G.cash = 400000; });
  for (let w = 0; w < 10; w++) {
    await fm(async () => { const F = window.__fm; F.UI.instant = true; F.G.bk = []; await F.nextWeek(); F.UI.instant = false; F.UI.modal = null; F.G.event = null; for (let i = 0; i < 12; i++) F.PS.tick(); });
  }
  // Force a bit of everything: offers, a booked fight, a controversy, a rivalry.
  await fm(() => {
    const F = window.__fm, G = F.G, m = G.ro.map((i) => G.f[i]);
    F.PS.debugDeal("promoter"); F.PS.debugDeal("camp"); F.PS.debugDeal("media");
    F.PU.worldPost("drama", F.PS.now()); F.PU.worldPost("beef", F.PS.now()); F.PU.worldPost("poll", F.PS.now()); F.PU.worldPost("training", F.PS.now());
    for (let i = 0; i < 6; i++) F.PS.tick();
    F.UI.modal = null; F.go("home");
  });
  await click('[data-a="phone"]'); await page.waitForSelector(".phone"); await shot("01-home");
  await click('[data-a="papp"][data-i="pulse"]'); await shot("02-pulse-feed");
  await fm(() => { document.getElementById("phbody").scrollTop = 700; }); await shot("02b-pulse-feed-scrolled");
  await click('[data-a="ptab"][data-i="news"]'); await shot("03-pulse-news");
  await click('[data-a="ptab"][data-i="for"]');
  await click('article.pp[data-a="ppost"]'); await shot("04-pulse-post");
  if (await page.$('[data-a="prp"]')) { await click('[data-a="prp"]'); await shot("04b-pulse-replied"); }
  await click('[data-a="pback"]');
  await click('.pu-me'); await shot("05-pulse-me");
  await click('[data-a="pback"]');
  await click('[data-a="pcomp"]'); await shot("06-compose");
  await click('[data-a="pck"][data-i="callout"]'); await click('[data-a="ptg"]'); await shot("06b-compose-target"); await click('[data-a="ptg"]'); await shot("06c-compose-drafts");
  await click('[data-a="pcpub"][data-i="2"]'); await shot("06d-posted");
  await fm(() => { for (let i = 0; i < 8; i++) window.__fm.PS.tick(); window.__fm.render(); });
  const fp = await page.$('article.pp [data-a="pprof"][data-i^="f:"]'); if (fp) { await fp.click(); await shot("07-pulse-profile"); }
  await click('[data-a="phome"]'); await click('[data-a="papp"][data-i="connect"]'); await shot("10-connect-chats");
  await click('[data-a="ptab"][data-i="offers"]'); await shot("11-connect-offers");
  await click('[data-a="ptab"][data-i="contacts"]'); await shot("12-connect-contacts");
  await click('[data-a="pdir"]'); await shot("13-connect-add");
  await click('[data-a="pback"]');
  await click('[data-a="ptab"][data-i="chats"]');
  const npc = await page.$('.cn-row[data-i^="n:"]'); if (npc) { await npc.click(); await shot("14-connect-chat-person"); const t = await page.$('[data-a="pask"]'); if (t) { await t.click(); await shot("14b-asked"); if (await page.$('[data-a="paskf"]')) { await click('[data-a="paskf"]'); await shot("14c-asked-fighter"); } } await click('[data-a="pback"]'); }
  const fr = await page.$('.cn-row[data-i^="f:"]'); if (fr) { await fr.click(); await shot("15-connect-chat-fighter"); await click('.cn-who'); await shot("16-connect-contact"); }
  const s = await fm(() => { const p = window.__fm.G.ph; return { now: window.__fm.PS.now(), wk: window.__fm.G.wk, top: p.feed.slice(0, 5).map((x) => [x.id, x.t, x.a]), seen: window.__fm.UI.phone.seen, maxid: p.id, feed: p.feed.length, threads: Object.keys(p.threads).length, contacts: Object.keys(p.cx).length, deals: p.deals.length, q: p.q.length, riv: Object.keys(p.riv).length }; });
  console.log(JSON.stringify(s));
} finally {
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no page errors");
  await browser.close(); await server.close();
}
