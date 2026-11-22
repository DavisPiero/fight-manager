// Game state, creation, save slots and derived numbers (overall, rank, market value).
import { R, rnd, ri, cl, pk, round100, last } from "./util.js";
import { ATTR_KEYS, STYLES, NAMES, PERSONALITIES, AGENCIES, DIFFICULTY, SAVE_PREFIX, SLOTS, CITIES } from "./data/constants.js";
import { ROSTER, HAND_TUNED } from "./data/roster.js";
import UFC from "./data/ufc.json";

export let G = null;
export const setG = (g) => (G = g);
export const UFC_DATA = UFC;

export const ovr = (f) => Math.round(ATTR_KEYS.reduce((s, k) => s + f.at[k], 0) / 9);
export const rec = (f) => `${f.w}-${f.l}`;
export const mine = () => G.ro.map((i) => G.f[i]);
export const city = () => CITIES.find((c) => c.id === G.ag.city) || CITIES[0];
const score = (f) => (f.b || 0) + (f.w - f.w0 - (f.l - f.l0)) * 4 + (f.streak || 0) * 1.5;

const rankCache = { v: 0, lists: {} };
export function bumpRanks() { rankCache.v++; }
export function ranks(div) {
  const key = G.wk + ":" + rankCache.v + ":" + G.f.length;
  if (rankCache.key !== key) { rankCache.key = key; rankCache.lists = {}; }
  return (rankCache.lists[div] ||= G.f.filter((f) => f.wc === div && !f.retired).sort((a, b) => score(b) - score(a)));
}
export const rank = (f) => ranks(f.wc).indexOf(f);
export const rankLabel = (i) => (i === 0 ? "Champion" : i > 0 && i <= 15 ? "#" + i : "Unranked");
export const rankShort = (i) => (i === 0 ? "C" : i > 0 && i <= 15 ? "#" + i : "NR");
export const agencyOf = (f) => (f.st === "other" ? AGENCIES[f.agency] : null);

// --- Market value -----------------------------------------------------------
export function value(f) {
  const o = ovr(f), r = rank(f);
  let v = Math.pow(Math.max(0, o - 40), 2.3) * 25 + Math.pow(f.pop, 2) * 25;
  v += r === 0 ? 600000 : r > 0 && r <= 5 ? 250000 : r > 0 && r <= 15 ? 80000 : 0;
  v *= f.age < 24 ? 1.3 : f.age < 28 ? 1.15 : f.age < 32 ? 1 : f.age < 35 ? 0.75 : 0.5;
  // Young prospects are priced on what they could become, not only what they are.
  if (!f.real && f.age < 27 && f.pot > o) v += Math.pow(f.pot - o, 1.8) * 40 * (27 - f.age) / 8;
  v *= 1 + cl(f.streak || 0, -3, 5) * 0.06;
  if (f.ct) v *= cl(0.45 + f.ct.wks / 150, 0.5, 1.2);
  if (f.inj > 0) v *= 0.8;
  return round100(Math.max(2000, v));
}
export function askOf(f) {
  const p = f.pers === "Demanding" ? 1.35 : f.pers === "Easygoing" ? 0.85 : 1;
  return round100(Math.max(1500, value(f) * 0.6 * p));
}
export const repNeeded = (f) => Math.round(Math.max(0, (ovr(f) - 48) * 1.1) + (f.real ? 15 : 0));
export function acceptChance(f, cut, bonus, years, ask = askOf(f)) {
  let p = 0.5 + (G.rep - repNeeded(f)) / 50 + (bonus / Math.max(1, ask) - 1) * 0.35 + (22 - cut) / 40;
  if (f.pers === "Ambitious") p += (2 - years) * 0.07;
  if (f.pers === "Loyal") p += (years - 2) * 0.07;
  if (f.nat && f.nat === city().nat) p += 0.06; // locals like a hometown agency
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
// Nudge skills using the fighter's real UFC career stats.
function fromStats(at, s) {
  if (!s) return at;
  const n = (v, d) => (v == null ? d : v);
  const adj = {
    box: (n(s.slpm, 4) - 4) * 3 + (n(s.stracc, 48) - 48) * 0.35 + n(s.kd, 0.3) * 4 - 1.2,
    kick: (n(s.slpm, 4) - 4) * 2 + (n(s.stracc, 48) - 48) * 0.25,
    thai: (n(s.slpm, 4) - 4) * 1.5 + (n(s.stracc, 48) - 48) * 0.2,
    wres: (n(s.td, 1.5) - 1.5) * 4.5 + (n(s.tdacc, 40) - 40) * 0.12,
    bjj: (n(s.sub, 0.5) - 0.5) * 7,
    tdd: (n(s.tddef, 65) - 65) * 0.3,
    iq: (n(s.strdef, 55) - 55) * 0.35,
    dur: (4 - n(s.sapm, 4)) * 2.5,
    cardio: (n(s.slpm, 4) - 4) * 1.2,
  };
  // Centre the adjustments so stats shape strengths and weaknesses without inflating the overall.
  const c = {}; ATTR_KEYS.forEach((k) => (c[k] = cl(adj[k], -12, 12)));
  const mean = ATTR_KEYS.reduce((t, k) => t + c[k], 0) / ATTR_KEYS.length;
  ATTR_KEYS.forEach((k) => (at[k] = cl(Math.round(at[k] + (c[k] - mean) * 1.3), 30, 97)));
  return at;
}
const cleanNick = (n) => (n || "").replace(/&quot;|&#0?34;|"/g, "").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").trim();
const STYLE_MAP = [[/wrest|sambo/i, "Wrestler"], [/jiu|grappl|judo/i, "Grappler"], [/muay/i, "Muay Thai"], [/kick|karate|taekwon/i, "Kickboxer"], [/box/i, "Boxer"]];
const styleFrom = (s) => (s && STYLE_MAP.find(([re]) => re.test(s))?.[1]) || null;

// Surnames already in use, so two made-up fighters never share one (it reads badly on the phone and in lists).
const taken = new Set();
function freshName(fn, ln) {
  for (const f of G?.f || []) taken.add(last(f.name));
  let n;
  for (let i = 0; i < 10; i++) { n = pk(fn.split(" ")) + " " + pk(ln.split(" ")); if (!taken.has(last(n))) break; }
  taken.add(last(n));
  return n;
}
export function makeProspect(id, own, nat) {
  nat ||= R() < 0.5 && G ? city().nat : pk(Object.keys(NAMES));
  if (!NAMES[nat]) nat = pk(Object.keys(NAMES));
  const [fn, ln] = NAMES[nat], style = pk(Object.keys(STYLES));
  // Prospects land ~40–60 overall: well below UFC regulars (72+). Their upside is potential, not current skill.
  const a = ri(19, 30), base = (own ? 42 : 39) + R() * (own ? 10 : 13) + Math.min(a - 19, 8) * 0.7;
  const w = ri(0, Math.max(1, a - 18));
  const f = {
    id, real: 0, name: freshName(fn, ln), nat, wc: ri(0, 7), age: a,
    w, l: ri(0, Math.min(4, w / 2 + 2)), style, pers: pk(Object.keys(PERSONALITIES)),
    at: makeAttrs(base, style, 14), pop: ri(8, 35), sh: ri(0, 359),
    st: own ? "mine" : "free", agency: null, earn: 0, en: 100, prep: 0, inj: 0, sl: 2, lock: 0, ct: null,
    streak: 0, pot: ri(70, 92), tl: [], hist: [], deals: [],
  };
  f.w0 = f.w; f.l0 = f.l;
  f.b = ovr(f) * 0.6 + f.pop * 0.15 + (f.w - f.l) * 1.2 - 6;
  return f;
}

export function newGame({ name, manager, col, diff, city: cityId, focus, emblem, slot }) {
  const c = CITIES.find((x) => x.id === cityId) || CITIES[0];
  const f = [];
  ROSTER.forEach((div, d) => {
    div.filter(([nm]) => UFC[nm]).forEach(([nm, w, l], r) => {
      const U = UFC[nm];
      // Overall target from real data: ranking (champion ~88, #15 ~73), win rate, and UFC.com strike/takedown numbers.
      const S = U.stats || {}, edge = cl(((S.slpm ?? 4) - (S.sapm ?? 4)) * 0.9 + ((S.tddef ?? 65) - 65) / 15 + ((S.stracc ?? 48) - 48) / 12, -2.5, 2.5);
      const T = cl(87.5 - r * 1.0 + (w / (w + l) - 0.75) * 10 + edge, 70, 91), H = HAND_TUNED[nm];
      const style = styleFrom(U.style) || pk(Object.keys(STYLES));
      let at;
      if (H) { const sh = T - H.reduce((x, y) => x + y) / 9; at = {}; ATTR_KEYS.forEach((k, i) => (at[k] = cl(Math.round(H[i] + sh), 30, 97))); }
      else at = fromStats(makeAttrs(T, style, 6), U.stats);
      const champ = (U.tags || []).some((t) => /title holder/i.test(t));
      f.push({
        id: f.length, real: 1, name: nm, nick: cleanNick(U.nickname), nat: (U.hometown || "").split(",").pop().trim(), home: U.hometown || "",
        camp: U.camp || "", ht: U.height, reach: U.reach, wc: d, age: U.age || ri(25, 36), w, l, w0: w, l0: l,
        b: 100 - r * 3 + (champ ? 10 : 0), style: H ? "Elite" : style, pers: pk(Object.keys(PERSONALITIES)), at, pop: Math.round(T - 8 + ri(0, 12)),
        sh: ri(0, 359), st: "other", agency: ri(0, AGENCIES.length - 1), earn: ri(5e5, 2e7), en: 100, prep: 0, inj: 0, sl: 2, lock: 0,
        ct: { pct: 20, wks: ri(20, 156) }, streak: 0, pot: 0, tl: [], hist: [], deals: [],
      });
    });
  });
  G = { ag: { city: c.id } }; // so makeProspect can see the city
  taken.clear(); f.forEach((x) => taken.add(last(x.name)));
  for (let i = 0; i < 48; i++) {
    const p = makeProspect(f.length, false);
    if (R() < 0.3) { p.st = "other"; p.agency = ri(0, AGENCIES.length - 1); p.ct = { pct: 20, wks: ri(20, 120) }; }
    f.push(p);
  }
  const ro = [];
  for (let i = 0; i < 3; i++) {
    const p = makeProspect(f.length, true, i === 0 ? c.nat : undefined);
    p.ct = { pct: 20, wks: ri(80, 130), signed: -20 };
    ro.push(p.id); f.push(p);
  }
  const cash = DIFFICULTY[diff].cash;
  return {
    v: 2, slot, ag: { name: name.trim(), manager: (manager || "").trim(), col, city: c.id, focus, emblem }, diff, cash, rep: 10 + c.rep, wk: 1, f, ro,
    offers: [], bk: [], listings: [], bids: [], spons: [], event: null, autotrain: false,
    log: [{ wk: 1, t: `${name.trim()} opens its doors in ${c.name}.`, k: "info" }], unread: 0,
    fin: { inc: 0, exp: 0, sales: 0, buys: 0, spons: 0 }, ch: [cash], res: [], hist: { w: 0, l: 0, titles: 0, sold: 0 },
    red: 0, over: false, tour: 0, created: Date.now(),
  };
}

// --- Log / save slots -------------------------------------------------------
export function say(t, k = "info") {
  G.log.unshift({ wk: G.wk, t, k });
  G.log.length = Math.min(G.log.length, 60);
  G.unread++;
}
const key = (s) => SAVE_PREFIX + s;
export function save() {
  if (!G || !G.slot) return;
  try { localStorage.setItem(key(G.slot), JSON.stringify(G)); } catch (e) { /* storage full or blocked */ }
}
export function load(slot) {
  try { const g = JSON.parse(localStorage.getItem(key(slot))); return g && g.v === 2 ? g : null; } catch (e) { return null; }
}
export function wipe(slot) { try { localStorage.removeItem(key(slot)); } catch (e) {} }
export function slots() {
  return Array.from({ length: SLOTS }, (_, i) => {
    const g = load(i + 1);
    return g ? { slot: i + 1, name: g.ag.name, city: g.ag.city, col: g.ag.col, emblem: g.ag.emblem, wk: g.wk, cash: g.cash, w: g.hist.w, l: g.hist.l, titles: g.hist.titles, over: g.over } : { slot: i + 1 };
  });
}

// Settings shared by all careers (not saved with a slot).
const SKEY = "fightmanager_settings";
export const SETTINGS = (() => { let s = { analyst: false }; try { s = { ...s, ...JSON.parse(localStorage.getItem(SKEY)) }; } catch (e) {} return s; })();
export const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify(SETTINGS)); } catch (e) {} };

export const weeklyCost = () => Math.round((1200 + 350 * G.ro.length) * city().cost);
export const spend = (n) => { G.cash -= n; G.fin.exp += n; };
export const earn = (n, kind = "inc") => { G.cash += n; G.fin[kind] = (G.fin[kind] || 0) + n; };
export { rnd };
