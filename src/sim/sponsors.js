// Sponsorship deals: brands pay popular fighters weekly; you take your management cut.
import { G, mine, say, earn, spend } from "../state.js";
import { R, ri, pk, round100 } from "../util.js";
import { BRANDS } from "../data/constants.js";

export const dealsOf = (f) => (f.deals ||= []);
export const offersFor = (f) => G.spons.filter((o) => o.fid === f.id);
const weeklyFor = (f) => round100(Math.max(300, Math.pow(f.pop, 1.6) * 6 * (1 + Math.max(0, f.streak || 0) * 0.08)));

function makeOffer(f) {
  const taken = new Set([...dealsOf(f).map((d) => d.brand), ...offersFor(f).map((o) => o.brand)]);
  const b = pk(BRANDS.filter((x) => !taken.has(x.name)));
  if (!b) return null;
  const o = { id: G.wk * 1000 + ri(0, 999), fid: f.id, brand: b.name, col: b.col, weekly: weeklyFor(f), weeks: pk([12, 20, 26, 40]), exp: G.wk + 2, perf: R() < 0.4 };
  G.spons.push(o);
  say(`${b.name} wants to sponsor ${f.name}: ${"$" + o.weekly.toLocaleString("en-US")}/week for ${o.weeks} weeks.`, "money");
  return o;
}

export function sponsorWeek() {
  G.spons = G.spons.filter((o) => o.exp > G.wk && G.ro.includes(o.fid));
  for (const f of mine()) {
    // Pay running deals.
    for (const d of dealsOf(f)) {
      const cut = Math.round(d.weekly * f.ct.pct / 100);
      earn(cut, "spons"); f.earn += d.weekly - cut;
      d.left--;
    }
    const ended = dealsOf(f).filter((d) => d.left <= 0 || (d.perf && (f.streak || 0) <= -2));
    ended.forEach((d) => say(`${d.brand} ${d.left <= 0 ? "deal with" : "dropped"} ${f.name}${d.left <= 0 ? " has ended" : " after back-to-back losses"}.`, d.left <= 0 ? "info" : "bad"));
    f.deals = dealsOf(f).filter((d) => !ended.includes(d));
    // New offers for popular fighters.
    if (f.pop >= 25 && dealsOf(f).length < 3 && !offersFor(f).length && R() < 0.05 + f.pop / 700) makeOffer(f);
  }
}

export function acceptSponsor(o) {
  const f = G.f[o.fid];
  dealsOf(f).push({ brand: o.brand, col: o.col, weekly: o.weekly, left: o.weeks, perf: o.perf });
  G.spons = G.spons.filter((x) => x !== o);
  f.pop = Math.min(100, f.pop + 2);
  f.tl.push({ w: G.wk, t: `Signed with ${o.brand}` });
  say(`${f.name} signed a sponsorship with ${o.brand}.`, "good");
}
export function declineSponsor(o) { G.spons = G.spons.filter((x) => x !== o); }

// Pay a PR agent to pitch a fighter to brands.
export const PITCH_COST = 2500;
export function pitch(f) {
  if (G.cash < PITCH_COST) return { ok: false, msg: "Not enough cash." };
  if (f.pitched === G.wk) return { ok: false, msg: "Already pitched this week." };
  spend(PITCH_COST); f.pitched = G.wk;
  if (R() < 0.25 + f.pop / 140 && dealsOf(f).length < 3) { const o = makeOffer(f); return { ok: true, offer: o, msg: o ? `${o.brand} is interested!` : "No brands left." }; }
  return { ok: true, msg: "No bites this time." };
}
