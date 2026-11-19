// Game state, creation, save/load and derived numbers (overall, rank, market value).
import { R, rnd, ri, cl, pk, round100 } from "./util.js";
import { ATTR_KEYS, STYLES, NAMES, PERSONALITIES, AGENCIES, DIFFICULTY, SAVE_KEY } from "./data/constants.js";
import { ROSTER, HAND_TUNED } from "./data/roster.js";

export let G = null;
export const setG = (g) => (G = g);

export const ovr = (f) => Math.round(ATTR_KEYS.reduce((s, k) => s + f.at[k], 0) / 9);
export const rec = (f) => `${f.w}-${f.l}`;
export const mine = () => G.ro.map((i) => G.f[i]);
const score = (f) => (f.b || 0) + (f.w - f.w0 - (f.l - f.l0)) * 4 + (f.streak || 0) * 1.5;

const rankCache = { wk: -1, v: 0, lists: {} };
export function bumpRanks() { rankCache.v++; }
export function ranks(div) {
  const key = G.wk + ":" + rankCache.v;
  if (rankCache.key !== key) { rankCache.key = key; rankCache.lists = {}; }
  return (rankCache.lists[div] ||= G.f.filter((f) => f.wc === div && !f.retired).sort((a, b) => score(b) - score(a)));
}
export const rank = (f) => ranks(f.wc).indexOf(f);
export const rankLabel = (i) => (i === 0 ? "Champion" : i > 0 && i <= 15 ? "#" + i : "Unranked");
export const rankShort = (i) => (i === 0 ? "C" : i > 0 && i <= 15 ? "#" + i : "NR");

export const age = (f) => f.age;
export const agencyOf = (f) => (f.st === "other" ? AGENCIES[f.agency] : null);

// --- Market value -----------------------------------------------------------
// What a rival agency would pay to take over this fighter's contract.
export function value(f) {
  const o = ovr(f), r = rank(f);
  let v = Math.pow(Math.max(0, o - 40), 2.3) * 25 + Math.pow(f.pop, 2) * 25;
  v += r === 0 ? 600000 : r > 0 && r <= 5 ? 250000 : r > 0 && r <= 15 ? 80000 : 0;
  v *= f.age < 24 ? 1.3 : f.age < 28 ? 1.15 : f.age < 32 ? 1 : f.age < 35 ? 0.75 : 0.5;
  v *= 1 + cl(f.streak || 0, -3, 5) * 0.06;
  if (f.ct) v *= cl(0.45 + f.ct.wks / 150, 0.5, 1.2);
  if (f.inj > 0) v *= 0.8;
  return round100(Math.max(2000, v));
}
// Signing bonus a free agent asks for (no transfer fee, so cheaper than value).
export function askOf(f) {
  const p = f.pers === "Demanding" ? 1.35 : f.pers === "Easygoing" ? 0.85 : 1;
  return round100(Math.max(1500, value(f) * 0.6 * p));
}
export const repNeeded = (f) => Math.round(Math.max(0, (ovr(f) - 48) * 1.1) + (f.real ? 15 : 0));

// Fighter acceptance chance for a deal with this cut, bonus and contract length.
export function acceptChance(f, cut, bonus, years, ask = askOf(f)) {
  let p = 0.5 + (G.rep - repNeeded(f)) / 50 + (bonus / Math.max(1, ask) - 1) * 0.35 + (22 - cut) / 40;
  if (f.pers === "Ambitious") p += (2 - years) * 0.07;
  if (f.pers === "Loyal") p += (years - 2) * 0.07;
  if (G.diff === "Hard") p -= 0.06;
  if (G.diff === "Easy") p += 0.06;
  return cl(p, 0.02, 0.97);
}

// --- Creation ---------------------------------------------------------------
function makeAttrs(base, style, spread) {
  const at = {};
  ATTR_KEYS.forEach((k, i) => (at[k] = cl(Math.round(base + STYLES[style][i] + (R() - 0.5) * spread), 20, 96)));
  return at;
}
function looks() {
  return { sk: ri(0, 5), hr: ri(0, 6), hc: ri(0, 4), bd: R() < 0.35 ? ri(1, 3) : 0, sh: ri(0, 359), br: ri(0, 2) };
}
export function makeProspect(id, own) {
  const nat = pk(Object.keys(NAMES)), [fn, ln] = NAMES[nat], style = pk(Object.keys(STYLES));
  const a = ri(19, 30), base = (own ? 42 : 38) + R() * (own ? 14 : 30) + Math.min(a - 19, 8);
  const w = ri(0, Math.max(1, a - 18));
  const f = {
    id, real: 0, name: pk(fn.split(" ")) + " " + pk(ln.split(" ")), nat, wc: ri(0, 7), age: a,
    w, l: ri(0, Math.min(4, w / 2 + 2)), style, pers: pk(Object.keys(PERSONALITIES)),
    at: makeAttrs(base, style, 14), pop: ri(8, 35), ...looks(),
    st: own ? "mine" : "free", agency: null, earn: 0, en: 100, prep: 0, inj: 0, sl: 2, lock: 0, ct: null,
    streak: 0, pot: ri(70, 92), tl: [], hist: [],
  };
  f.w0 = f.w; f.l0 = f.l;
  return f;
}

export function newGame({ name, col, diff }) {
  const f = [];
  ROSTER.forEach((div, d) =>
    div.forEach(([nm, w, l], r) => {
      const T = cl(92 - r * 1.4 + (w / (w + l) - 0.75) * 12, 60, 93), style = pk(Object.keys(STYLES)), H = HAND_TUNED[nm];
      let at;
      if (H) { const sh = T - H.reduce((x, y) => x + y) / 9; at = {}; ATTR_KEYS.forEach((k, i) => (at[k] = cl(Math.round(H[i] + sh), 30, 97))); }
      else at = makeAttrs(T, style, 10);
      f.push({
        id: f.length, real: 1, name: nm, nat: "", wc: d, age: ri(25, 36), w, l, w0: w, l0: l, b: 100 - r * 3,
        style: H ? "Elite" : style, pers: pk(Object.keys(PERSONALITIES)), at, pop: Math.round(T - 8 + ri(0, 12)), ...looks(),
        st: "other", agency: ri(0, AGENCIES.length - 1), earn: ri(5e5, 2e7), en: 100, prep: 0, inj: 0, sl: 2, lock: 0,
        ct: { pct: 20, wks: ri(20, 156) }, streak: 0, pot: 0, tl: [], hist: [],
      });
    })
  );
  for (let i = 0; i < 48; i++) {
    const p = makeProspect(f.length, false);
    if (R() < 0.3) { p.st = "other"; p.agency = ri(0, AGENCIES.length - 1); p.ct = { pct: 20, wks: ri(20, 120) }; }
    f.push(p);
  }
  const ro = [];
  for (let i = 0; i < 3; i++) {
    const p = makeProspect(f.length, true);
    p.ct = { pct: 20, wks: ri(80, 130), signed: -20 };
    p.hist = [];
    ro.push(p.id);
    f.push(p);
  }
  f.forEach((p) => { if (!p.real) p.b = ovr(p) * 0.6 + p.pop * 0.15 + (p.w - p.l) * 1.2 - 6; });
  const cash = DIFFICULTY[diff].cash;
  return {
    v: 1, ag: { name: name.trim(), col }, diff, cash, rep: 10, wk: 1, f, ro,
    offers: [], bk: [], listings: [], bids: [], queue: [],
    log: [{ wk: 1, t: "Your agency opens its doors.", k: "info" }], unread: 0,
    fin: { inc: 0, exp: 0, sales: 0, buys: 0 }, ch: [cash], res: [], hist: { w: 0, l: 0, titles: 0, sold: 0 },
    red: 0, over: false, tutorial: 0,
  };
}

// --- Log / save -------------------------------------------------------------
export function say(t, k = "info") {
  G.log.unshift({ wk: G.wk, t, k });
  G.log.length = Math.min(G.log.length, 60);
  G.unread++;
}
export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* storage full or blocked */ }
}
export function load() {
  try { const g = JSON.parse(localStorage.getItem(SAVE_KEY)); return g && g.v === 1 ? g : null; } catch (e) { return null; }
}
export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

export const weeklyCost = () => 1200 + 350 * G.ro.length;
export const spend = (n) => { G.cash -= n; G.fin.exp += n; };
export const earn = (n, kind = "inc") => { G.cash += n; G.fin[kind] += n; };
export { rnd };
