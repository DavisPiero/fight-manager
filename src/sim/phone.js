// The phone's core: in-game clock and the week's activity queue, notifications, chat threads, fighter
// messages (by personality and mood) and rumours. PULSE (feed) lives in pulse.js, PULSE CONNECT
// (contacts and offers) in connect.js. Everything here reads and changes the real game state, no DOM.
import { G, mine, ovr, rank, ranks, rankLabel, spend, value, bumpRanks } from "../state.js";
import { R, ri, pk, cl, round100, last } from "../util.js";
import { AGENCIES, DIVISIONS } from "../data/constants.js";
import * as C from "../data/phone-content.js";
import * as CN from "./connect.js";
import * as PU from "./pulse.js";

export const DAY = 1440, WEEK = 7 * DAY;
export const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
export const moodWord = (m) => (m >= 75 ? "Happy" : m >= 50 ? "Content" : m >= 30 ? "Frustrated" : "Unhappy");

// ---------- State ----------
const fresh = () => ({
  v: 3, clock: 8 * 60, q: [], cx: {}, rel: {}, intro: {}, threads: {}, deals: [], wrapped: {}, feed: [], seenBk: {},
  me: { fol: 150 + (G.rep || 0) * 12, wk: 0, n: 0 }, riv: {}, contro: [], res: {}, flags: {}, rumours: [], notes: [], cd: {},
  prefs: { important: 1, news: 0, social: 0, rumours: 1, sound: 1 }, id: 1,
});
export function P() {
  if (!G.ph || G.ph.v !== 3) migrate();
  return G.ph;
}
// Saves from before PULSE: keep contacts, chats, offers, rumours and recent news as feed posts.
function migrate() {
  const o = G.ph, ph = (G.ph = fresh());
  CN.addContact("n:scout", true);
  if (!o) { PU.week(); for (let i = 0; i < 5; i++) tick(); return; } // a new career opens on a feed that's already moving
  const map = { press: "kate", brand: "b_red" }, nk = (k) => (k.startsWith("npc:") ? "n:" + (map[k.slice(4)] || k.slice(4)) : k);
  Object.assign(ph, { cd: o.cd || {}, id: o.id || 1, rumours: (o.rumours || []).map((r) => ({ ...r, out: r.out ?? null })) });
  ph.prefs = { ...ph.prefs, ...(o.prefs || {}) };
  (o.npcs || []).forEach((id) => CN.addContact("n:" + (map[id] || id), true));
  for (const [k, t] of Object.entries(o.threads || {})) ph.threads[nk(k)] = { msgs: t.msgs.map((m, i) => ({ ...m, id: ph.id++, t: wkStart(m.wk || 1) + 9 * 60 + i * 7 })), unread: t.unread || 0, last: wkStart(t.last || 1) + 9 * 60 };
  ph.deals = (o.deals || []).filter((d) => d.kind !== "buyout").map((d) => ({ ...d, npc: d.npc ? map[d.npc] || d.npc : d.npc }));
  (o.news || []).slice(0, 25).forEach((n) => PU.add({ a: "o:pulse", kind: "news", text: n.h, t: wkStart(n.wk) + ri(480, 1300), about: n.fid != null ? [n.fid] : [], reach: ri(300, 4000) }, true));
  (o.social || []).slice(0, 25).forEach((s) => PU.add({ a: s.fid != null ? "f:" + s.fid : "u:" + (s.handle || "@fan").slice(1), text: s.text, t: wkStart(s.wk) + ri(480, 1300), reach: s.likes || 100 }, true));
}

// ---------- Time ----------
// t = minutes since Monday of week 1. The clock moves through the week as activity arrives.
export const wkStart = (wk = G.wk) => (wk - 1) * WEEK;
export const now = () => wkStart() + P().clock;
export const dayOf = (t) => Math.floor(t / DAY);

// ---------- Text ----------
// Fill {placeholders}. ctx: f, o (fighters), ag, amt, wk, how, rd, n, txt, brand, wks, skill, org, who, pick, rival.
export function fill(t, c = {}) {
  const v = {
    f: c.f?.name, fl: c.f && last(c.f.name), o: c.o?.name, ol: c.o && last(c.o.name), div: c.f && DIVISIONS[c.f.wc], rk: c.f && rankLabel(rank(c.f)),
    me: G.ag.name, home: c.f && (c.f.home || c.f.nat || "home").split(",")[0], ag: c.ag, amt: c.amt, wk: c.wk, how: c.how, rd: c.rd, n: c.n, txt: c.txt,
    brand: c.brand, wks: c.wks, skill: c.skill, org: c.org, who: c.who, pick: c.pick, rival: c.rival,
  };
  return t.replace(/\{(\w+)\}/g, (m, k) => (v[k] ?? m));
}
// Pick a line, avoiding ones used in the last 8 weeks.
export function line(list, key) {
  const ph = P(), ok = list.filter((t, i) => !(ph.cd[key + i] > G.wk - 8));
  const pool = ok.length ? ok : list, t = pk(pool), i = list.indexOf(t);
  ph.cd[key + i] = G.wk;
  return t;
}
// A personality-keyed set: {_: [...], Hotheaded: [...]}. Uses the personality's own lines most of the time.
export const byPers = (set, f) => (f && set[f.pers] && R() < 0.7 ? set[f.pers] : set._);
export const cdOk = (k, wks) => !(P().cd[k] > G.wk - wks);

// ---------- Notifications ----------
// lvl: "crit" (act now), "imp" (worth a look), "ord" (background). sub: news / rumour / social / msg / offer.
export function notify(lvl, app, title, body, key, sub = "") {
  const ph = P();
  ph.notes.unshift({ id: ph.id++, lvl, app, sub, title, body, key, wk: G.wk, t: now(), read: 0 });
  ph.notes.length = Math.min(ph.notes.length, 80);
}
export const unread = (app) => P().notes.filter((n) => !n.read && (!app || n.app === app)).length;
export function markRead(app) { P().notes.forEach((n) => { if (!app || n.app === app) n.read = 1; }); }
export function popups(sinceId) {
  const ph = P(), pr = ph.prefs;
  return ph.notes.filter((n) => n.id >= sinceId && !n.read && (n.lvl === "crit" || (n.lvl === "imp" && pr.important && (n.sub !== "rumour" || pr.rumours)) || (n.lvl === "ord" && n.sub === "news" && pr.news))).slice(0, 3);
}

// ---------- Chats ----------
export function thread(key) { return (P().threads[key] ||= { msgs: [], unread: 0, last: now() }); }
export function msg(key, text, o = {}) {
  const ph = P(), t = thread(key);
  t.msgs.push({ id: ph.id++, me: !!o.me, text, t: o.t ?? now(), kind: o.kind || "", opts: o.opts || null, fid: o.fid, deal: o.deal, x: o.x });
  if (t.msgs.length > 60) t.msgs.shift();
  t.last = o.t ?? now();
  if (!o.me) t.unread++;
  return t;
}
export function delThread(key) { delete P().threads[key]; P().notes.forEach((n) => { if (n.key === key) n.read = 1; }); }

// ---------- The week's activity queue ----------
// Posts, messages and offers are spread through the week and arrive while you play (tick), not all on Monday.
export function schedule(item, d0 = 0, d1 = 6) {
  const ph = P(), day = ri(d0, d1), at = Math.max(now() + 1, wkStart() + day * DAY + ri(7 * 60, 23 * 60));
  ph.q.push({ ...item, at });
  ph.q.sort((a, b) => a.at - b.at);
}
export function soon(item, m0 = 10, m1 = 240) { const ph = P(); ph.q.push({ ...item, at: Math.min(now() + ri(m0, m1), wkStart() + WEEK - 2) }); ph.q.sort((a, b) => a.at - b.at); }
function run(it) {
  const ph = P(), t = it.at;
  if (t >= wkStart()) ph.clock = Math.max(ph.clock, t - wkStart()); // items left over from last week keep their old time
  switch (it.g) {
    case "wp": PU.worldPost(it.w, t, it); break;
    case "ans": PU.answer(it, t); break;
    case "fm": { const f = G.f[it.fid]; if (f?.st === "mine") fighterMsg(f, it.k, it.amt, it.lvl, t); break; }
    case "npc": CN.checkin(it.id, t, it); break;
    case "wrap": CN.wrap(it, t); break;
    case "rum": makeRumour(t); break;
  }
}
// Called every few seconds of real time while you're on a game screen. Returns true if something arrived.
export function tick() {
  const ph = P(), end = wkStart() + WEEK - 1;
  CN.scan(); PU.scan();
  const it = ph.q[0];
  if (!it || it.at > end) { ph.clock = Math.min(WEEK - 60, ph.clock + 7); return false; }
  ph.q.shift(); run(it);
  return true;
}
function flush() { const ph = P(); while (ph.q.length) run(ph.q.shift()); }

// ---------- Fighter messages ----------
export function fighterMsg(f, kind, amt, lvl = "imp", t) {
  const key = "f:" + f.id, set = C.MSG[kind];
  const txt = fill(line(byPers(set, f), "m" + kind + f.pers), { f, amt, ag: amt, o: f.nextOpp != null ? G.f[f.nextOpp] : null });
  msg(key, txt, { kind, opts: C.REPLIES[kind]?.map((r) => r[0]), fid: f.id, t });
  P().cd[kind + f.id] = G.wk;
  notify(lvl, "connect", f.name, txt, key, "msg");
}
const ack = (f, d) => pk(byPers(C.ACK[d > 3 ? "good" : d < 0 ? "bad" : "ok"], f));
// Your reply to the open question in a chat (fighter or person). Returns a result line for a toast.
export function reply(key, i) {
  const t = thread(key), m = [...t.msgs].reverse().find((x) => x.opts && !x.done);
  if (!m) return "";
  m.done = 1; m.pick = i;
  if (key.startsWith("n:")) return CN.replyNpc(key, m, i);
  if (m.kind === "contro") return PU.answerContro(m.x, i, key);
  const r = C.REPLIES[m.kind][i], f = G.f[m.fid];
  msg(key, r[0], { me: true });
  CN.mood(f, r[1]);
  let res = "";
  switch (r[2]) {
    case "physio": if (G.cash >= 3000) { spend(3000); f.inj = Math.max(0, f.inj - 1); res = "Physio booked. One week less out."; } else res = "Not enough cash for the physio."; break;
    case "promise": f.promise = G.wk + 2; res = "He'll hold you to that: book him within 2 weeks."; break;
    case "renew": res = "renew"; break;
    case "party": f.en = Math.max(10, f.en - 15); f.pop = Math.min(100, f.pop + 1); break;
    case "prep": f.prep = Math.min(100, f.prep + 10); break;
    case "cut": f.ct.pct = Math.max(5, f.ct.pct - 5); res = `Your cut of ${last(f.name)}'s purses is now ${f.ct.pct}%.`; break;
    case "bonus": if (G.cash >= 5000) { spend(5000); res = "Bonus paid."; } else { CN.mood(f, -12); res = "You couldn't pay. He's not impressed."; } break;
    case "rest": f.sl = 0; break;
    case "listen": f.listening = G.wk + 4; break;
    case "hype": f.pop = Math.min(100, f.pop + 1); break;
  }
  msg(key, ack(f, r[1]), { t: now() + 1 });
  thread(key).unread = 0;
  return res;
}
// You message one of your fighters about a topic. Once per topic per week.
export function ask(key, topic) {
  const f = G.f[+key.slice(2)], m = CN.mood(f), band = m < 40 ? "low" : m < 70 ? "ok" : "high";
  const q = C.TOPICS.find((x) => x[0] === topic)[1];
  msg(key, q, { me: true });
  if (P().cd["ask" + topic + f.id] === G.wk) { msg(key, pk(byPers(C.ACK.again, f)), { t: now() + 1 }); thread(key).unread = 0; return; }
  P().cd["ask" + topic + f.id] = G.wk;
  const set = C.ASK[topic][band], txt = pk(f.pers && set[f.pers] ? set[f.pers] : set._ || set);
  msg(key, fill(txt, { f, o: f.nextOpp != null ? G.f[f.nextOpp] : null }) + (topic === "money" && band === "low" && f.ct ? ` (He wants your cut below ${f.ct.pct}%.)` : ""), { t: now() + 2 });
  CN.mood(f, 1);
  thread(key).unread = 0;
}
// Fighters reach out during the week (at most two a week), about whatever is going on with them.
function fighterWeek() {
  const ph = P(), m = mine();
  let sent = 0;
  const send = (f, k, amt, lvl, d0 = 0, d1 = 5) => { schedule({ g: "fm", fid: f.id, k, amt, lvl }, d0, d1); ph.cd[k + f.id] = G.wk; sent++; };
  for (const f of m.slice().sort(() => R() - 0.5)) {
    if (sent >= 2) break;
    const idle = G.wk - (f.lastFight ?? f.ct?.signed ?? 0), bk = G.bk.find((b) => b.fid === f.id);
    f.nextOpp = bk ? bk.oid : null;
    if (f.promise && G.wk > f.promise && !bk) { CN.mood(f, -10); f.promise = 0; send(f, "broken", 0, "imp", 0, 1); continue; }
    if (!bk && f.inj <= 0) CN.mood(f, idle > 6 ? -2 : 0);
    if (f.ct && f.ct.wks <= 10 && cdOk("contract" + f.id, 6)) send(f, "contract", f.ct.wks, "crit", 0, 1);
    else if (bk && bk.wk - G.wk <= 1 && cdOk("fightweek" + f.id, 3)) send(f, "fightweek", 0, "ord");
    else if (!bk && f.inj <= 0 && idle >= 6 && cdOk("idle" + f.id, 5)) send(f, "idle");
    else if ((f.streak || 0) >= 2 && ["Demanding", "Ambitious"].includes(f.pers) && cdOk("payrise" + f.id, 12)) send(f, "payrise");
    else if (f.listening > G.wk && R() < 0.3) { G.bids.push({ id: ph.id++, fid: f.id, ag: ri(0, AGENCIES.length - 1), amount: round100(value(f) * 1.05), exp: G.wk + 2, unsolicited: 1 }); f.listening = 0; sent++; }
    else if (CN.mood(f) < 35 && cdOk("recruit" + f.id, 10) && R() < 0.4) send(f, "recruit", pk(AGENCIES).name);
    else if (CN.mood(f) < 45 && f.ct?.wks > 30 && cdOk("unfair" + f.id, 10) && R() < 0.3) send(f, "unfair");
    else if (R() < 0.05 && cdOk("personal" + f.id, 15)) send(f, "personal");
    else if (R() < 0.12 && cdOk("checkin" + f.id, 4)) send(f, "checkin", 0, "ord");
  }
}

// ---------- Rumours ----------
// A rumour is a PULSE post. It resolves 2–3 weeks later and changes the world if it comes true.
function rumour(kind, c, cred, effect, t) {
  const ph = P(), src = pk(C.SOURCES.filter((s) => s[1] === cred)) || C.SOURCES[0];
  const txt = fill(line(C.RUMOURS[kind], "r" + kind), c);
  const truth = R() < [0.3, 0.55, 0.8][cred] ? "true" : R() < 0.35 ? "partly" : "false";
  const r = { id: ph.id++, kind, txt, cred, src: src[0], wk: G.wk, due: G.wk + ri(2, 3), truth, out: null, effect };
  ph.rumours.unshift(r); ph.rumours.length = Math.min(ph.rumours.length, 40);
  PU.rumourPost(r, src, t);
  if (effect?.mine) notify("imp", "pulse", "Rumour", txt, "rumours", "rumour");
}
function makeRumour(t) {
  const r = R(), others = G.f.filter((f) => f.st === "other" && !f.retired && rank(f) >= 0 && rank(f) <= 15), m = mine();
  const unhappy = m.find((f) => CN.mood(f) < 40);
  if (unhappy && r < 0.25) return rumour("unhappy", { f: unhappy }, 1, { kind: "unhappy", fid: unhappy.id, mine: 1 }, t);
  if (m.length && r < 0.45) { const f = pk(m), ag = pk(AGENCIES); return rumour("poach", { f, ag: ag.name }, ri(0, 2), { kind: "poach", fid: f.id, ag: ag.id, mine: 1 }, t); }
  const f = pk(others); if (!f) return;
  if (r < 0.6) return rumour("injury", { f }, ri(0, 2), { kind: "injury", fid: f.id }, t);
  if (r < 0.75) { const o = ranks(f.wc).find((x) => x !== f && Math.abs(rank(x) - rank(f)) <= 3); if (o) return rumour("matchup", { f, o }, ri(0, 2), { kind: "matchup", fid: f.id, oid: o.id }, t); }
  if (r < 0.88 && f.age >= 33) return rumour("retire", { f }, ri(0, 1), { kind: "retire", fid: f.id }, t);
  return rumour("released", { f, ag: AGENCIES[f.agency].name }, ri(0, 2), { kind: "released", fid: f.id }, t);
}
function resolveRumours() {
  for (const r of P().rumours.filter((x) => !x.out && x.due <= G.wk)) {
    const e = r.effect, f = G.f[e.fid];
    r.out = r.truth;
    if (r.truth === "false" || !f) { PU.news("rumourFalse", null, null, { txt: r.txt }); continue; }
    const full = r.truth === "true";
    switch (e.kind) {
      case "poach": if (f.st === "mine") G.bids.push({ id: r.id, fid: f.id, ag: e.ag, amount: round100(value(f) * (full ? 1.15 : 0.95)), exp: G.wk + 2, unsolicited: 1 }); break;
      case "unhappy": if (f.st === "mine") CN.mood(f, full ? -10 : -4); break;
      case "injury": if (f.inj <= 0) f.inj = full ? ri(3, 8) : ri(1, 2); PU.news("injury", f, null, { amt: f.inj }); break;
      case "retire": if (full && f.st !== "mine") { f.retired = true; PU.news("retire", f); bumpRanks(); } break;
      case "released": if (full && f.st === "other") { const ag = AGENCIES[f.agency].name; f.st = "free"; f.agency = null; f.ct = null; PU.news("released", f, null, { ag }); bumpRanks(); } break;
    }
    if (e.kind !== "injury" && e.kind !== "retire" && e.kind !== "released") PU.news("rumourTrue", null, null, { txt: r.txt + (full ? "" : " (partly)") });
  }
}

// ---------- Hooks from the rest of the game ----------
// After any fight involving your fighter.
export function onFight(FS, r) {
  const me = FS.f[0], op = FS.f[1];
  me.lastFight = G.wk; me.promise = 0; me.nextOpp = null;
  P().res[me.id] = { won: r.won, wk: G.wk, oid: op.id };
  CN.mood(me, r.won ? 8 : -6);
  if (r.won && r.how === "KO/TKO") P().flags.ko = 1;
  if (!r.won) P().flags.loss = 1;
  PU.onFight(me, op, r);
  CN.onFight(me, op, r);
  fighterMsg(me, r.wasChamp ? "title" : r.won ? "win" : "loss");
  if (r.wks) fighterMsg(me, "injured", r.wks, "crit");
  // A teammate checks in after a win.
  const mate = mine().find((x) => x !== me && R() < 0.35);
  if (mate && r.won) soon({ g: "fm", fid: mate.id, k: "teammate", amt: last(me.name), lvl: "ord" }, 60, 600);
}
// Every Next week: finish last week's activity, then plan this week's.
export function phoneWeek() {
  const ph = P();
  flush();
  ph.clock = 8 * 60;
  ph.deals.forEach((d) => { if (d.state === "open" && d.exp <= G.wk) d.state = "expired"; else if (d.state === "open" && d.exp === G.wk + 1 && !d.warned) { d.warned = 1; notify("crit", "connect", "Offer expires next week", d.title + ": " + d.text, "deal:" + d.id, "offer"); } });
  resolveRumours();
  CN.week();
  PU.week();
  fighterWeek();
  if (R() < 0.55) schedule({ g: "rum" }, 0, 6);
}
// For tests: force a business offer of a kind.
export const debugDeal = (k) => CN.makeDeal(k);
