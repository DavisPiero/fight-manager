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
  // Each move is shot at its moment of impact (strikes) or once it has settled (positions).
  const shots = [
    ["jab", `a.arenaAct(0,"atk","jab"); a.arenaAct(1,"hit")`, "imp0"],
    ["cross", `a.arenaAct(1,"atk","cross"); a.arenaAct(0,"hit")`, "imp1"],
    ["hook", `a.arenaAct(0,"atk","hook"); a.arenaAct(1,"bighit")`, "imp0"],
    ["uppercut", `a.arenaAct(1,"atk","uppercut"); a.arenaAct(0,"hit")`, "imp1"],
    ["overhand", `a.arenaAct(0,"atk","overhand"); a.arenaAct(1,"bighit")`, "imp0"],
    ["elbow", `a.arenaAct(1,"atk","elbow"); a.arenaAct(0,"hit")`, "imp1"],
    ["legkick", `a.arenaAct(0,"atk","leg kick"); a.arenaAct(1,"hit")`, "imp0"],
    ["bodykick", `a.arenaAct(1,"atk","body kick"); a.arenaAct(0,"hit")`, "imp1"],
    ["headkick", `a.arenaAct(0,"atk","head kick"); a.arenaAct(1,"bighit")`, "imp0"],
    ["knee", `a.arenaAct(1,"atk","knee"); a.arenaAct(0,"hit")`, "imp1"],
    ["miss", `a.arenaAct(0,"atk","cross",{miss:true}); a.arenaAct(1,"dodge")`, "imp0"],
    ["guard", `a.arenaAct(1,"atk","hook"); a.arenaAct(0,"guard")`, "imp1"],
    ["shoot", `a.arenaAct(0,"dash"); a.arenaAct(1,"sprawl")`, 260],
    ["kd", `a.arenaAct(1,"kd")`, 300],
    ["ground", `a.arenaSet(0,46,"top",{}); a.arenaSet(1,54,"bottom",{})`, 1200],
    ["pound", `a.arenaAct(0,"pound"); a.arenaAct(1,"hit")`, "imp0"],
    ["sub", `a.arenaAct(0,"squeeze")`, 450],
    ["ko", `a.arenaSet(0,40,"win",{}); a.arenaSet(1,62,"ko",{cut:1})`, 1200],
  ];
  for (const [n, js, wait] of shots) {
    if (n === "jab" || n === "kd") await page.evaluate(`import("/src/ui/arena.js").then(a=>{a.arenaSet(0,32,"stand",{});a.arenaSet(1,68,"stand",{})})`), await page.waitForTimeout(900);
    // Freeze time, start the move, step exactly to the impact (or settle time), shoot, then let it play out.
    await page.evaluate(`import("/src/ui/arena.js").then(a=>{a.arenaPause(true); ${js}; a.arenaStep(${typeof wait === "string" ? `a.arenaImpactIn(${wait[3]})/1000+0.02` : wait / 1000})})`);
    await page.waitForTimeout(120);
    await arena.screenshot({ path: `${OUT}/p-${n}.png` });
    await page.evaluate(`import("/src/ui/arena.js").then(a=>a.arenaPause(false))`);
    await page.waitForTimeout(typeof wait === "string" ? 800 : 100);
  }
} finally { await browser.close(); await server.close(); console.log(errors.length ? "ERRORS: " + errors.join(" | ") : "no page errors"); }
