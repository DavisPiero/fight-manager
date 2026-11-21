// The phone: contacts, fighter messages with moods, business offers, news, social, rumours and notifications.
// Everything here reads and changes the real game state. Content lives in src/data/phone-content.js.
import { G, mine, ovr, rank, ranks, rankLabel, say, spend, earn, value, askOf, bumpRanks } from "../state.js";
import { R, ri, pk, cl, round100, last } from "../util.js";
import { AGENCIES, DIVISIONS, ROSTER_MAX } from "../data/constants.js";
import * as C from "../data/phone-content.js";

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

// ---------- State ----------
export function P() {
  if (!G.ph) G.ph = { npcs: [], threads: {}, news: [], social: [], rumours: [], deals: [], notes: [], cd: {}, prefs: { important: 1, news: 0, social: 0, rumours: 1, sound: 1 }, id: 1, chain: null };
  return G.ph;
}
export const mood = (f) => (f.mood ??= 60);
export const moodWord = (m) => (m >= 75 ? "Happy" : m >= 50 ? "Content" : m >= 30 ? "Frustrated" : "Unhappy");
export const setMood = (f, d) => (f.mood = cl(mood(f) + d, 0, 100));

// Fill {placeholders}. ctx keys: f, o (fighters), ag, amt, wk, how, rd, n, txt.
export function fill(t, c = {}) {
  const v = { f: c.f?.name, fl: c.f && last(c.f.name), o: c.o?.name, ol: c.o && last(c.o.name), div: c.f && DIVISIONS[c.f.wc], rk: c.f && rankLabel(rank(c.f)), me: G.ag.name, ag: c.ag, amt: c.amt, wk: c.wk, how: c.how, rd: c.rd, n: c.n, txt: c.txt, brand: c.brand };
  return t.replace(/\{(\w+)\}/g, (m, k) => (v[k] ?? m));
}
// Pick a line, avoiding ones used in the last 8 weeks.
function line(list, key) {
  const ph = P(), fresh = list.filter((t, i) => !(ph.cd[key + i] > G.wk - 8));
  const pool = fresh.length ? fresh : list, t = pk(pool), i = list.indexOf(t);
  ph.cd[key + i] = G.wk;
  return t;
}
const byPers = (set, f) => set[f.pers] && R() < 0.7 ? set[f.pers] : set._;

// ---------- Notifications ----------
// lvl: "crit" (act now), "imp" (worth a look), "ord" (background). Only crit/imp can pop up.
export function notify(lvl, app, title, body, key) {
  const ph = P();
  ph.notes.unshift({ id: ph.id++, lvl, app, title, body, key, wk: G.wk, read: 0 });
  ph.notes.length = Math.min(ph.notes.length, 80);
}
export const unread = (app) => P().notes.filter((n) => !n.read && (!app || n.app === app)).length;
export function markRead(app) { P().notes.forEach((n) => { if (!app || n.app === app) n.read = 1; }); }
// What should pop up this week: critical always; important if allowed; never more than 3.
export function popups(sinceId) {
  const ph = P(), pr = ph.prefs;
  return ph.notes.filter((n) => n.id >= sinceId && !n.read && (n.lvl === "crit" || (n.lvl === "imp" && pr.important && (n.app !== "rumours" || pr.rumours)) || (n.lvl === "ord" && n.app === "news" && pr.news))).slice(0, 3);
}

// ---------- Contacts ----------
export function unlock(id) {
  const ph = P();
  if (ph.npcs.includes(id) || !C.NPCS[id]) return;
  ph.npcs.push(id);
  notify("ord", "contacts", "New contact", `${C.NPCS[id].name} · ${C.NPCS[id].role}`, "npc:" + id);
}
export function contacts() {
  const ph = P(), out = mine().map((f) => ({ key: "f:" + f.id, name: f.name, sub: `${moodWord(mood(f))} · ${DIVISIONS[f.wc]}`, f }));
  ph.npcs.forEach((id) => out.push({ key: "npc:" + id, name: C.NPCS[id].name, sub: C.NPCS[id].role, npc: C.NPCS[id] }));
  // Former fighters you still have a thread with.
  Object.keys(ph.threads).filter((k) => k.startsWith("f:") && !out.some((o) => o.key === k)).forEach((k) => { const f = G.f[+k.slice(2)]; out.push({ key: k, name: f.name, sub: "Former fighter", f, former: 1 }); });
  return out;
}
export function thread(key) { const ph = P(); return (ph.threads[key] ||= { msgs: [], unread: 0, last: 0 }); }
function post(key, text, { me = false, kind = "", opts = null, fid } = {}) {
  const t = thread(key);
  t.msgs.push({ me, text, wk: G.wk, kind, opts, fid });
  if (t.msgs.length > 40) t.msgs.shift();
  t.last = G.wk;
  if (!me) t.unread++;
  return t;
}

// ---------- Fighter messages ----------
const cdOk = (k, wks) => !(P().cd[k] > G.wk - wks);
function fighterMsg(f, kind, amt, lvl = "imp") {
  const key = "f:" + f.id, txt = fill(line(byPers(C.MSG[kind], f), "m" + kind + f.pers), { f, amt, ag: amt });
  post(key, txt, { kind, opts: C.REPLIES[kind]?.map((r) => r[0]), fid: f.id });
  P().cd[kind + f.id] = G.wk;
  notify(lvl, "messages", f.name, txt, key);
}
// Your reply to a fighter's message. Returns a short result line.
export function reply(key, i) {
  const t = thread(key), m = [...t.msgs].reverse().find((x) => x.opts && !x.done);
  if (!m) return "";
  const r = C.REPLIES[m.kind][i], f = G.f[m.fid];
  m.done = 1; m.pick = i;
  post(key, r[0], { me: true });
  setMood(f, r[1]);
  let res = "";
  switch (r[2]) {
    case "physio": if (G.cash >= 3000) { spend(3000); f.inj = Math.max(0, f.inj - 1); res = "Physio booked. One week less out."; } else res = "Not enough cash for the physio."; break;
    case "promise": f.promise = G.wk + 2; res = "He'll hold you to that: book him within 2 weeks."; break;
    case "renew": res = "renew"; break;
    case "party": f.en = Math.max(10, f.en - 15); f.pop = Math.min(100, f.pop + 1); break;
    case "prep": f.prep = Math.min(100, f.prep + 10); break;
    case "cut": f.ct.pct = Math.max(5, f.ct.pct - 5); res = `Your cut of ${last(f.name)}'s purses is now ${f.ct.pct}%.`; break;
    case "bonus": if (G.cash >= 5000) { spend(5000); res = "Bonus paid."; } else { setMood(f, -12); res = "You couldn't pay. He's not impressed."; } break;
    case "rest": f.sl = 0; break;
    case "listen": f.listening = G.wk + 4; break;
  }

  post(key, pk(r[1] > 3 ? ["🙏", "Appreciate it boss.", "Thanks. Means a lot.", "👍"] : r[1] < 0 ? ["...", "OK.", "Right.", "If you say so."] : ["Got it.", "OK boss.", "Understood."]));
  thread(key).unread = 0;
  return res;
}
// You message a fighter about a topic. Once per topic per week.
export function ask(key, topic) {
  const f = G.f[+key.slice(2)], m = mood(f), band = m < 40 ? "low" : m < 70 ? "ok" : "high";
  const q = C.TOPICS.find((x) => x[0] === topic)[1];
  post(key, q, { me: true });
  if (P().cd["ask" + topic + f.id] === G.wk) { post(key, "We just talked about this 😅"); thread(key).unread = 0; return; }
  P().cd["ask" + topic + f.id] = G.wk;
  if (topic === "money" && f.ct) post(key, pk(C.ASK.money[band]) + (band === "low" ? ` (He wants your cut below ${f.ct.pct}%.)` : ""));
  else post(key, pk(C.ASK[topic][band]));
  setMood(f, 1); // being asked feels good
  thread(key).unread = 0;
}

// ---------- Business offers ----------
function deal(kind, c, extra) {
  const ph = P(), B = C.BUSINESS[kind];
  if (B.npc) unlock(B.npc);
  const d = { id: ph.id++, kind, npc: B.npc, title: B.title, text: fill(line(B.text, "b" + kind), c), exp: G.wk + 2, state: "open", ...extra };
  ph.deals.unshift(d); ph.deals.length = Math.min(ph.deals.length, 30);
  notify(kind === "promoter" || kind === "buyout" ? "crit" : "imp", "deals", d.title, d.text, "deal:" + d.id);
  if (B.npc) post("npc:" + B.npc, d.text, { kind: "deal" });
  return d;
}
function makeDeal(force) {
  const m = mine().filter((f) => !f.inj), f = pk(m);
  const kinds = ["media", "gym", "request"];
  if (f && f.pop >= 30) kinds.push("commercial");
  if (f && G.rep >= 20) kinds.push("promoter");
  if (f && ovr(f) >= 60 && G.wk > 8) kinds.push("buyout");
  const k = force || pk(kinds);
  if (k === "media" && f) return deal("media", { f, amt: money(round100(1500 + f.pop * 80)) }, { fid: f.id, pay: round100(1500 + f.pop * 80) });
  if (k === "commercial" && f) return deal("commercial", { f, amt: money(round100(4000 + f.pop * 200)) }, { fid: f.id, pay: round100(4000 + f.pop * 200) });
  if (k === "gym") { const cost = round100(8000 + G.ro.length * 2500); return deal("gym", { amt: money(cost) }, { cost }); }
  if (k === "request") {
    const p = G.f.filter((x) => x.st === "free" && !x.retired && !x.real).sort((a, b) => (b.pot || 0) - (a.pot || 0))[ri(0, 5)];
    if (!p) return null;
    const cost = round100(askOf(p) * 0.55);
    return deal("request", { f: p, amt: money(cost) }, { fid: p.id, cost });
  }
  if (k === "promoter" && f && !G.bk.some((b) => b.fid === f.id)) {
    const ops = ranks(f.wc).filter((o) => o.st !== "mine" && o.inj <= 0 && !G.bk.some((b) => b.oid === o.id) && Math.abs(ovr(o) - ovr(f)) < 9);
    const o = pk(ops); if (!o) return null;
    const purse = round100((2000 + Math.pow(Math.max(0, ovr(o) - 38), 2) * 45 + o.pop * 300) * 1.3);
    return deal("promoter", { f, o, amt: money(purse), wk: G.wk + 2 }, { fid: f.id, oid: o.id, purse, fwk: G.wk + 2 });
  }
  if (k === "buyout" && f) { const ag = pk(AGENCIES), amt = round100(value(f) * (1.05 + R() * 0.3)); return deal("buyout", { f, ag: ag.name, amt: money(amt) }, { fid: f.id, ag: ag.id, pay: amt }); }
  return null;
}
// Accept / decline / counter. Returns a result line.
export function dealAct(id, act) {
  const d = P().deals.find((x) => x.id === id);
  if (!d || d.state !== "open") return "That offer is gone.";
  const f = G.f[d.fid];
  if (act === "no") { d.state = "declined"; return "Declined."; }
  if (act === "counter") {
    if (d.countered) return "They already gave their best offer.";
    d.countered = 1;
    const r = R();
    if (r < 0.2) { d.state = "walked"; return "They walked away."; }
    if (r < 0.65) { if (d.pay) d.pay = round100(d.pay * 1.15); if (d.purse) d.purse = round100(d.purse * 1.15); if (d.cost) d.cost = round100(d.cost * 0.88); return "They improved the offer by 15%."; }
    return "They won't move. Take it or leave it.";
  }
  // accept
  if ((d.cost || 0) > G.cash) return "Not enough cash.";
  d.state = "done";
  switch (d.kind) {
    case "media": earn(d.pay, "inc"); f.pop = Math.min(100, f.pop + 3); f.en = Math.max(10, f.en - 15); news("signing", null, `${f.name} talks on Fight Talk`); return `Paid ${money(d.pay)}. ${last(f.name)} gains fans.`;
    case "commercial": earn(d.pay, "spons"); f.pop = Math.min(100, f.pop + 2); f.en = Math.max(10, f.en - 10); return `Paid ${money(d.pay)}.`;
    case "gym": spend(d.cost); mine().forEach((x) => { const k = pk(Object.keys(x.at)); x.at[k] = Math.min(96, x.at[k] + 1); x.prep = Math.min(100, x.prep + 10); }); return "Your fighters train at Northside: +1 skill each.";
    case "request": {
      if (G.ro.length >= ROSTER_MAX) { d.state = "open"; return "Roster full."; }
      spend(d.cost); f.st = "mine"; f.agency = null; f.ct = { pct: 20, wks: 104, signed: G.wk }; G.ro.push(f.id); G.rep = cl(G.rep + 1, 0, 100);
      f.tl.push({ w: G.wk, t: `Signed with ${G.ag.name}` }); say(`${f.name} signed with you.`, "good"); news("signing", f); bumpRanks();
      return `${f.name} signed.`;
    }
    case "promoter": {
      if (G.bk.some((b) => b.fid === f.id) || f.inj > 0) { d.state = "open"; return `${last(f.name)} isn't free.`; }
      G.bk.push({ fid: f.id, oid: d.oid, purse: d.purse, bonus: d.purse, wk: d.fwk, exp: d.fwk, lab: "Promoter" });
      say(`${f.name} booked vs ${G.f[d.oid].name} for week ${d.fwk}.`, "good"); news("booking", f, null, { o: G.f[d.oid], amt: d.fwk });
      return "Fight booked.";
    }
    case "buyout": {
      const ag = AGENCIES[d.ag]; G.bids.push({ id: d.id, fid: f.id, ag: d.ag, amount: d.pay, exp: G.wk + 1, unsolicited: 1 });
      return `${ag.name}'s offer is on your Sell desk to accept.`;
    }
  }
  return "Done.";
}

// ---------- News / social / rumours ----------
export function news(kind, f, headline, c = {}) {
  const ph = P(), h = headline || fill(line(C.NEWS[kind], "n" + kind), { f, ...c });
  ph.news.unshift({ h, wk: G.wk, kind, fid: f?.id, mine: f?.st === "mine" });
  ph.news.length = Math.min(ph.news.length, 60);
  notify(f?.st === "mine" || kind === "title" ? "imp" : "ord", "news", "News", h, "news");
}
export function social(who, text, opts = {}) {
  const ph = P();
  ph.social.unshift({ who: who.name || who, handle: who.handle || "@" + (who.name || who).toLowerCase().replace(/[^a-z]/g, ""), fid: who.id, text, wk: G.wk, likes: opts.likes || ri(40, 4000), tag: opts.tag || "" });
  ph.social.length = Math.min(ph.social.length, 80);
  notify("ord", "social", who.name || who, text, "social");
}
const fan = () => ({ name: pk(C.FANS).slice(1), handle: pk(C.FANS) });
const journo = () => { const j = pk(C.JOURNALISTS); return { name: j[0], handle: j[1] }; };

function rumour(kind, c, cred, effect) {
  const ph = P(), src = pk(C.SOURCES.filter((s) => s[1] === cred)) || C.SOURCES[0];
  const txt = fill(line(C.RUMOURS[kind], "r" + kind), c);
  const truth = R() < [0.3, 0.55, 0.8][cred] ? "true" : R() < 0.35 ? "partly" : "false";
  ph.rumours.unshift({ id: ph.id++, kind, txt, cred, src: src[0], wk: G.wk, due: G.wk + ri(2, 3), truth, out: null, effect });
  ph.rumours.length = Math.min(ph.rumours.length, 40);
  notify(effect?.mine ? "imp" : "ord", "rumours", "Rumour", txt, "rumours");
}
function makeRumour() {
  const r = R(), others = G.f.filter((f) => f.st === "other" && !f.retired && rank(f) >= 0 && rank(f) <= 15), m = mine();
  const unhappy = m.find((f) => mood(f) < 40);
  if (unhappy && r < 0.25) return rumour("unhappy", { f: unhappy }, 1, { kind: "unhappy", fid: unhappy.id, mine: 1 });
  if (m.length && r < 0.45) { const f = pk(m), ag = pk(AGENCIES); return rumour("poach", { f, ag: ag.name }, ri(0, 2), { kind: "poach", fid: f.id, ag: ag.id, mine: 1 }); }
  const f = pk(others); if (!f) return;
  if (r < 0.6) return rumour("injury", { f }, ri(0, 2), { kind: "injury", fid: f.id });
  if (r < 0.75) { const o = ranks(f.wc).find((x) => x !== f && Math.abs(rank(x) - rank(f)) <= 3); if (o) return rumour("matchup", { f, o }, ri(0, 2), { kind: "matchup", fid: f.id, oid: o.id }); }
  if (r < 0.88 && f.age >= 33) return rumour("retire", { f }, ri(0, 1), { kind: "retire", fid: f.id });
  return rumour("released", { f, ag: AGENCIES[f.agency].name }, ri(0, 2), { kind: "released", fid: f.id });
}
// Rumours resolve 2–3 weeks later and change the world if they come true.
function resolveRumours() {
  for (const r of P().rumours.filter((x) => !x.out && x.due <= G.wk)) {
    const e = r.effect, f = G.f[e.fid];
    r.out = r.truth;
    if (r.truth === "false" || !f) { news("rumourFalse", null, null, { txt: r.txt }); continue; }
    const full = r.truth === "true";
    switch (e.kind) {
      case "poach": if (f.st === "mine") { G.bids.push({ id: r.id, fid: f.id, ag: e.ag, amount: round100(value(f) * (full ? 1.15 : 0.95)), exp: G.wk + 2, unsolicited: 1 }); notify("crit", "deals", "Offer for " + f.name, `${AGENCIES[e.ag].name} made an offer. See the Sell desk.`, "sell"); } break;
      case "unhappy": if (f.st === "mine") setMood(f, full ? -10 : -4); break;
      case "injury": if (f.inj <= 0) f.inj = full ? ri(3, 8) : ri(1, 2); news("injury", f, null, { amt: f.inj }); break;
      case "retire": if (full && f.st !== "mine") { f.retired = true; news("retire", f); bumpRanks(); } break;
      case "released": if (full && f.st === "other") { const ag = AGENCIES[f.agency].name; f.st = "free"; f.agency = null; f.ct = null; news("released", f, null, { ag }); bumpRanks(); } break;
    }
    if (e.kind !== "injury" && e.kind !== "retire" && e.kind !== "released") news("rumourTrue", null, null, { txt: r.txt + (full ? "" : " (partly)") });
  }
}

// ---------- Hooks from the rest of the game ----------
// After any fight involving your fighter.
export function onFight(FS, r) {
  const me = FS.f[0], op = FS.f[1], c = { f: me, o: op, how: r.how.toLowerCase(), rd: r.rdEnd };
  me.lastFight = G.wk; me.promise = 0;
  if (r.wasChamp) news("title", me, null, { o: op });
  else news(r.won ? (r.how === "KO/TKO" ? "myKO" : r.how === "Submission" ? "mySub" : "myWin") : "myLoss", me, null, { o: op, how: c.how, rd: c.rd });
  const W = r.won ? me : op, L = r.won ? op : me;
  social(W, fill(line(C.SOCIAL.winSelf, "sw"), { o: L }));
  social(fan(), fill(line(r.won ? (r.how === "KO/TKO" ? C.SOCIAL.fanKO : C.SOCIAL.fanWin) : C.SOCIAL.fanLoss, "sf"), { f: me, o: op }));
  if (R() < 0.5) social(journo(), fill(line(C.SOCIAL.journalist, "sj"), { f: me, o: op }));
  setMood(me, r.won ? 8 : -6);
  fighterMsg(me, r.wasChamp ? "title" : r.won ? "win" : "loss");
  if (r.wks) fighterMsg(me, "injured", r.wks, "crit");
  // Rivalry chain: a win draws a callout from someone ranked nearby; it builds to an offer.
  if (r.won && !P().chain) {
    const riv = ranks(me.wc).find((x) => x.st !== "mine" && x !== op && !x.retired && Math.abs(ovr(x) - ovr(me)) < 8);
    if (riv) { social(riv, fill(line(C.SOCIAL.callout, "sc"), { f: me })); P().chain = { fid: me.id, oid: riv.id, step: 1, wk: G.wk }; }
  }
}
// Every Next week.
export function phoneWeek() {
  const ph = P(), m = mine();
  // Contacts you meet along the way.
  if (G.wk >= 2) unlock("promo");
  if (G.rep >= 20 || G.hist.w >= 2) unlock("press");
  // Expire offers; warn the week before.
  ph.deals.forEach((d) => { if (d.state === "open" && d.exp <= G.wk) d.state = "expired"; else if (d.state === "open" && d.exp === G.wk + 1 && !d.warned) { d.warned = 1; notify("crit", "deals", "Offer expires next week", d.title + ": " + d.text, "deal:" + d.id); } });
  resolveRumours();
  // The wider world: one or two notable results from other fights this week.
  for (const x of (G.wkAI || []).filter((x) => x.title || x.ko).slice(0, 2)) {
    news(x.title ? "aiTitle" : x.ko ? "aiKO" : "aiWin", G.f[x.w], null, { o: G.f[x.l] });
    if (R() < 0.6) social(G.f[x.w], fill(line(C.SOCIAL.winSelf, "sw"), { o: G.f[x.l] }));
  }
  // Rivalry chain: callout → reply → rumour → promoter offer.
  const ch = ph.chain;
  if (ch && G.wk > ch.wk) {
    const f = G.f[ch.fid], o = G.f[ch.oid];
    if (f.st !== "mine" || o.retired) ph.chain = null;
    else if (ch.step === 1) { social(f, fill(line(C.SOCIAL.reply, "sr"), { o })); ch.step = 2; ch.wk = G.wk; }
    else if (ch.step === 2) { rumour("matchup", { f, o }, 2, { kind: "matchup", fid: f.id, oid: o.id, mine: 1 }); ch.step = 3; ch.wk = G.wk; }
    else if (ch.step === 3) {
      if (!G.bk.some((b) => b.fid === f.id || b.oid === o.id) && f.inj <= 0 && o.inj <= 0) { const purse = round100((2000 + Math.pow(Math.max(0, ovr(o) - 38), 2) * 45 + o.pop * 300) * 1.5); deal("promoter", { f, o, amt: money(purse), wk: G.wk + 2 }, { fid: f.id, oid: o.id, purse, fwk: G.wk + 2 }); }
      ph.chain = null;
    }
  }
  // Fighters reach out (at most two a week).
  let sent = 0;
  for (const f of m.slice().sort(() => R() - 0.5)) {
    if (sent >= 2) break;
    const idle = G.wk - (f.lastFight ?? f.ct?.signed ?? 0), booked = G.bk.some((b) => b.fid === f.id);
    if (f.promise && G.wk > f.promise && !booked) { setMood(f, -10); f.promise = 0; post("f:" + f.id, "You said you'd book me. Nothing. 👎"); notify("imp", "messages", f.name, "You said you'd book me...", "f:" + f.id); sent++; continue; }
    if (!booked && f.inj <= 0) setMood(f, idle > 6 ? -2 : 0);
    if (f.ct && f.ct.wks <= 10 && cdOk("contract" + f.id, 6)) { fighterMsg(f, "contract", f.ct.wks, "crit"); sent++; }
    else if (!booked && f.inj <= 0 && idle >= 6 && cdOk("idle" + f.id, 5)) { fighterMsg(f, "idle"); sent++; }
    else if ((f.streak || 0) >= 2 && ["Demanding", "Ambitious"].includes(f.pers) && cdOk("payrise" + f.id, 12)) { fighterMsg(f, "payrise"); sent++; }
    else if (f.listening > G.wk && R() < 0.3) { G.bids.push({ id: ph.id++, fid: f.id, ag: ri(0, AGENCIES.length - 1), amount: round100(value(f) * 1.05), exp: G.wk + 2, unsolicited: 1 }); notify("crit", "deals", "Offer for " + f.name, "A rival agency wants him. See the Sell desk.", "sell"); f.listening = 0; sent++; }
    else if (mood(f) < 35 && cdOk("recruit" + f.id, 10) && R() < 0.4) { fighterMsg(f, "recruit", pk(AGENCIES).name); sent++; }
    else if (R() < 0.04 && cdOk("personal" + f.id, 15)) { fighterMsg(f, "personal"); sent++; }
    if (mood(f) < 30 && R() < 0.2) social(f, line(C.SOCIAL.unhappy, "su"));
  }
  // Rumours, business, background chatter.
  if (R() < 0.45) makeRumour();
  if (ph.deals.filter((d) => d.state === "open").length < 2 && R() < 0.35) makeDeal();
  if (R() < 0.7) { const f = pk(G.f.filter((x) => x.real && !x.retired && rank(x) <= 10)); if (f) social(f, line(C.SOCIAL.training, "st")); }
  if (R() < 0.25) { const f = pk(G.f.filter((x) => x.st === "other" && x.real)); if (f) social({ name: AGENCIES[f.agency].name, handle: "@" + AGENCIES[f.agency].short.toLowerCase() + "mgmt" }, fill(line(C.SOCIAL.agency, "sa"), { f, ag: AGENCIES[f.agency].name })); }
}
// For tests: force a business offer of a kind.
export const debugDeal = (k) => makeDeal(k);
