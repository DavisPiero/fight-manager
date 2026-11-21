// The weekly cycle: costs, recovery, AI fights, contracts, bids, fight offers and training.
import { G, ovr, mine, rank, ranks, say, spend, weeklyCost, makeProspect, bumpRanks, city } from "../state.js";
import { R, rnd, ri, cl, pk, round100 } from "../util.js";
import { INTENSITY, ATTR_NAMES, ATTR_KEYS, WEEKS_IN_RED_LIMIT, FOCUS } from "../data/constants.js";
import { contractTick, weeklyBids } from "./market.js";
import { sponsorWeek } from "./sponsors.js";
import { rollEvent } from "./events.js";
import { phoneWeek } from "./phone.js";

function aiWeek() {
  G.wkAI = [];
  const by = {};
  G.f.forEach((f) => { if (f.st !== "mine" && f.inj <= 0) (by[f.wc] ||= []).push(f); });
  for (let i = 0; i < 8; i++) {
    const l = by[ri(0, 7)];
    if (!l || l.length < 2) continue;
    const a = pk(l), b = pk(l);
    if (a === b) continue;
    const w = ovr(a) + rnd(-14, 14) > ovr(b) ? a : b, x = w === a ? b : a;
    G.wkAI.push({ w: w.id, l: x.id, ko: R() < 0.3, title: rank(x) === 0 });
    w.w++; x.l++; w.pop = Math.min(100, w.pop + 1);
    w.streak = Math.max(1, (w.streak || 0) + 1); x.streak = Math.min(-1, (x.streak || 0) - 1);
    if (R() < 0.25) x.inj = ri(1, 6);
  }
  // Rival fighters slowly develop or decline with age.
  G.f.forEach((f) => {
    if (f.st === "mine" || R() > 0.08) return;
    const k = pk(ATTR_KEYS);
    f.at[k] = cl(f.at[k] + (f.age < 28 ? 1 : f.age > 33 ? -1 : 0), 20, 96);
  });
  bumpRanks();
}

// Returns a list of bookings due this week (the UI plays them in order).
export function advance() {
  G.wk++;
  const c = weeklyCost();
  spend(c);
  mine().forEach((f) => {
    f.hist.push(ovr(f)); if (f.hist.length > 60) f.hist.shift();
    f.en = Math.min(100, f.en + 30); f.sl = 2;
    if (f.inj > 0) f.inj--;
    f.prep = Math.max(0, f.prep - 3);
  });
  G.f.forEach((f) => { if (f.st !== "mine" && f.inj > 0) f.inj--; });
  if (G.wk % 52 === 0) G.f.forEach((f) => { f.age++; if (f.age > 30 && f.st === "mine") ATTR_KEYS.forEach((k) => (f.at[k] = Math.max(20, f.at[k] - ri(0, f.age > 34 ? 3 : 1)))); });
  // New prospects appear on the market now and then.
  if (R() < 0.35) { const p = makeProspect(G.f.length, false); G.f.push(p); say(`New prospect on the market: ${p.name}.`); }
  aiWeek();
  contractTick();
  weeklyBids();
  sponsorWeek();
  G.auto = G.autotrain ? autoReport(autoTrain()) : null;
  phoneWeek();
  G.offers = G.offers.filter((o) => o.exp > G.wk);
  G.ch.push(G.cash); if (G.ch.length > 200) G.ch.shift();
  G.red = G.cash < 0 ? G.red + 1 : 0;
  if (G.red === 1) say(`You're in the red. Get back above $0 within ${WEEKS_IN_RED_LIMIT} weeks or the agency folds.`, "bad");
  if (G.red >= WEEKS_IN_RED_LIMIT) G.over = true;
  G.event = G.over ? null : rollEvent();
  const due = [];
  for (const b of G.bk.filter((b) => b.wk <= G.wk)) {
    const f = G.f[b.fid], o = G.f[b.oid];
    if (f.inj > 0 || o.inj > 0) {
      G.bk = G.bk.filter((x) => x !== b);
      if (f.inj > 0) G.rep = Math.max(0, G.rep - 2);
      say(`${f.name} vs ${o.name} was cancelled (${f.inj > 0 ? f.name : o.name} is injured).`, "warn");
    } else due.push(b);
  }
  return due;
}

export const purseFor = (o) => round100(2000 + Math.pow(Math.max(0, ovr(o) - 38), 2) * 45 + o.pop * 300);

export function offersFor(f) {
  const busy = new Set(G.bk.flatMap((b) => [b.oid, b.fid]));
  const cand = G.f.filter((o) => o.wc === f.wc && o.st !== "mine" && o.id !== f.id && o.inj <= 0 && !busy.has(o.id) && !o.retired);
  const mv = ovr(f), out = [];
  const r = rank(f);
  const tiers = [[-8, "Favourable"], [0, "Even"], [8, "Dangerous"]];
  for (const [d, lab] of tiers) {
    const t = mv + d;
    const o = cand.sort((a, b) => Math.abs(ovr(a) - t) - Math.abs(ovr(b) - t)).find((x) => !out.some((y) => y.oid === x.id));
    if (!o) continue;
    const p = purseFor(o);
    out.push({ fid: f.id, oid: o.id, lab, purse: p, bonus: p, wk: G.wk + 2, exp: G.wk + 2, push: 0 });
  }
  // A title shot if you're top 3.
  if (r > 0 && r <= 3) {
    const champ = ranks(f.wc)[0];
    if (champ && champ.st !== "mine" && champ.inj <= 0 && !busy.has(champ.id) && !out.some((o) => o.oid === champ.id)) {
      const p = round100(purseFor(champ) * 1.6);
      out.push({ fid: f.id, oid: champ.id, lab: "Title shot", purse: p, bonus: p, wk: G.wk + 3, exp: G.wk + 2, push: 0, title: 1 });
    }
  }
  return out;
}

// Auto book: every fit, unbooked fighter takes the "Even" match (closest offer if there is no even one).
export function autoBook() {
  const done = [];
  for (const f of mine()) {
    if (f.inj > 0 || G.bk.some((b) => b.fid === f.id)) continue;
    const list = offersFor(f);
    const o = list.find((x) => x.lab === "Even") || list.filter((x) => !x.title).sort((a, b) => Math.abs(ovr(G.f[a.oid]) - ovr(f)) - Math.abs(ovr(G.f[b.oid]) - ovr(f)))[0];
    if (!o) continue;
    G.bk.push(o);
    G.offers = G.offers.filter((x) => x.fid !== f.id);
    say(`${f.name} booked vs ${G.f[o.oid].name} for week ${o.wk}.`, "good");
    done.push(o);
  }
  return done;
}

// Train one fighter. Returns {ok, msg, gain, injured}.
export function train(f, key, int) {
  const I = INTENSITY[int];
  if (f.inj > 0) return { ok: false, msg: `${f.name} is injured.` };
  if (f.sl < 1) return { ok: false, msg: "No sessions left this week." };
  if (f.en < I.energy) return { ok: false, msg: "Too tired. Rest until next week." };
  if (G.cash < I.cost) return { ok: false, msg: "Not enough cash." };
  spend(I.cost);
  f.sl--; f.en -= I.energy; f.prep = Math.min(100, f.prep + I.prep);
  const bonus = (city().bonus.includes(key) ? 1.25 : 1) * (FOCUS[G.ag.focus]?.keys.includes(key) ? 1.15 : 1);
  const ageMul = f.age < 26 ? 1.2 : f.age < 32 ? 1 : 0.6;
  const cap = Math.min(96, (f.pot || 90) + 4);
  const room = Math.max(0, (cap - f.at[key]) / cap);
  const gain = Math.max(0, Math.round(I.gain * (0.4 + R()) * (0.35 + room * 1.4) * ageMul * (f.pers === "Professional" ? 1.15 : 1) * bonus));
  f.at[key] = Math.min(cap, f.at[key] + gain);
  const risk = (f.en < 35 ? [0.05, 0.12, 0.3] : [0, 0.01, 0.05])[int] * (f.pers === "Professional" ? 0.5 : 1);
  if (R() < risk) {
    f.inj = ri(1, 4);
    say(`${f.name} picked up a training injury (${f.inj} weeks).`, "bad");
    return { ok: true, gain, injured: true, msg: "Injured in training!" };
  }
  return { ok: true, gain, msg: gain ? `+${gain} ${ATTR_NAMES[ATTR_KEYS.indexOf(key)]}` : "No gain this time" };
}

// Each fresh fighter trains his weakest skill at Normal intensity, keeping a cash cushion.
export const weakest = (f) => ATTR_KEYS.slice().sort((a, b) => f.at[a] - f.at[b])[0];
export const AUTO_MIN_ENERGY = 55, AUTO_MIN_CASH = 5000;
export function autoTrain() {
  let n = 0, gain = 0;
  const hurt = [], tired = [], broke = G.cash < AUTO_MIN_CASH;
  for (const f of mine()) {
    if (f.inj > 0) continue;
    if (f.en < AUTO_MIN_ENERGY) { tired.push(f.name); continue; }
    while (f.sl > 0 && !f.inj && f.en >= AUTO_MIN_ENERGY && G.cash >= AUTO_MIN_CASH) {
      const r = train(f, weakest(f), 1);
      if (!r.ok) break;
      n++; gain += r.gain || 0;
      if (r.injured) hurt.push(f.name);
    }
  }
  return { n, gain, hurt, tired, broke };
}
// One news line per week, so the player can see auto-train ran.
function autoReport(r) {
  const parts = [];
  if (r.n) parts.push(`${r.n} session${r.n > 1 ? "s" : ""}, +${r.gain} skill`);
  if (r.tired.length) parts.push(`${r.tired.length} skipped (tired)`);
  if (r.broke) parts.push(`paused (under $${AUTO_MIN_CASH / 1000}k cash)`);
  if (r.hurt.length) parts.push(`${r.hurt.join(", ")} hurt in training`);
  say(`Auto-train: ${parts.join(" · ") || "nobody fit to train"}.`, r.hurt.length ? "bad" : r.n ? "good" : "warn");
  return r;
}
