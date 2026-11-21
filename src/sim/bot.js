// Balance bot: plays whole careers with a simple, sensible manager and reports numbers.
// No DOM. Run with `npm run bot` (scripts/bot.mjs), which compares against scripts/bot-baseline.json.
import { G, setG, newGame, mine, ovr, value, askOf, repNeeded, rank, ranks } from "../state.js";
import { seed } from "../util.js";
import { ROSTER_MAX } from "../data/constants.js";
import { advance, autoBook } from "./world.js";
import { trySign, sell, transferFee } from "./market.js";
import { acceptSponsor } from "./sponsors.js";
import { resolveEvent } from "./events.js";
import * as F from "./fight.js";

// One fight, no screen. The manager keeps a balanced plan and calls for water between rounds.
export function autoFight(b, how) {
  const FS = F.newFight(b);
  F.startRound(FS);
  for (;;) {
    while (!FS.fin && !F.roundOver(FS)) {
      if (FS.ex && FS.ex % 4 === 0) FS.plan[1] = F.aiPlan(FS);
      F.step(FS);
      if (F.pendingMoment) { const m = F.pendingMoment(FS); if (m) F.resolveMoment(FS, m, F.autoChoice(FS, m)); }
    }
    if (FS.fin || FS.rd >= 3) { if (!FS.fin) F.endRound(FS); break; }
    F.endRound(FS); F.startRound(FS, "water");
  }
  const r = F.finish(FS);
  how[r.how === "KO/TKO" ? "ko" : r.how === "Submission" ? "sub" : "dec"]++;
  if (FS.moments) how.moments += FS.moments;
  return r;
}

export function career(s, weeks = 52) {
  seed(s);
  setG(newGame({ name: "Bot MMA", manager: "Bot", col: 0, diff: "Normal", city: "vegas", focus: "strike", emblem: "fist", slot: 9 }));
  G.autotrain = true; G.tour = -1;
  const how = { ko: 0, sub: 0, dec: 0, moments: 0 };
  let signed = 0, sold = 0, fights = 0, wins = 0;
  for (let w = 0; w < weeks && !G.over; w++) {
    // Sign the best free agent who'll talk and that we can afford twice over.
    if (G.ro.length < 6) {
      const c = G.f.filter((f) => f.st === "free" && !f.retired && f.lock <= G.wk && G.rep >= repNeeded(f) && askOf(f) * 2 < G.cash).sort((a, b) => ovr(b) - ovr(a))[0];
      if (c && trySign(c, 20, askOf(c), 2).ok) signed++;
    }
    autoBook();
    for (const o of G.spons.slice()) acceptSponsor(o);
    for (const b of G.bids.slice()) if (b.amount >= value(G.f[b.fid]) * 1.1) { sell(b); sold++; }
    const due = advance();
    for (const b of due) { const r = autoFight(b, how); fights++; if (r.won) wins++; }
    if (G.event) resolveEvent(0);
    G.event = null;
  }
  const real = G.f.filter((f) => f.real), free = G.f.filter((f) => f.st === "free" && !f.real);
  const champs = [...new Set(G.f.map((f) => f.wc))].map((d) => ranks(d)[0]).filter(Boolean);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  return {
    cash: G.cash, rep: G.rep, folded: G.over ? 1 : 0, fights, wins, titles: G.hist.titles, signed, sold,
    roster: G.ro.length, rosterOvr: avg(mine().map(ovr)), rosterValue: avg(mine().map(value)),
    freeOvr: avg(free.map(ovr)), freeMax: Math.max(0, ...free.map(ovr)), freeAsk: avg(free.map(askOf)),
    realOvr: avg(real.map(ovr)), champOvr: avg(champs.map(ovr)), realMax: Math.max(...real.map(ovr)), at92: real.filter((f) => ovr(f) >= 92).length,
    starPrice: avg(champs.filter((f) => f.st === "other").map((f) => transferFee(f) + askOf(f) * 0.5)),
    ko: how.ko, sub: how.sub, dec: how.dec, moments: how.moments,
  };
}

export function run(n = 20, weeks = 52) {
  const rows = Array.from({ length: n }, (_, i) => career(1000 + i, weeks));
  const out = {};
  for (const k of Object.keys(rows[0])) out[k] = +(rows.reduce((s, r) => s + r[k], 0) / n).toFixed(2);
  const f = out.ko + out.sub + out.dec || 1;
  out.koPct = Math.round((out.ko / f) * 100); out.subPct = Math.round((out.sub / f) * 100); out.decPct = Math.round((out.dec / f) * 100);
  out.winPct = Math.round((out.wins / (out.fights || 1)) * 100);
  return out;
}
