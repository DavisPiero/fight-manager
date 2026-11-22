// PULSE: the MMA world's social network and news feed (owned by Cageside Media). Fighters, journalists,
// brands, agencies and fans post through the week; you post as your agency. Posts have engagement that
// grows over time, reply threads and media. What you post has consequences: rivalries, moods, relationships.
import { G, mine, ovr, rank, ranks } from "../state.js";
import { R, ri, pk, cl, last, hash } from "../util.js";
import { AGENCIES, AGENCY_COLOURS, BRANDS, DIVISIONS } from "../data/constants.js";
import { PEOPLE, AGENT_OF, VOICE } from "../data/people.js";
import * as C from "../data/pulse-content.js";
import { NEWS } from "../data/phone-content.js";
import { P, fill, line, byPers, notify, msg, thread, now, wkStart, schedule, soon, cdOk, DAY } from "./phone.js";
import { rel, mood, isContact, meet } from "./connect.js";

const squash = (s) => s.replace(/[^A-Za-z0-9]/g, "");
const notable = () => G.f.filter((f) => !f.retired && f.st !== "free" && (f.st === "mine" || (f.real && rank(f) >= 0 && rank(f) <= 15)));
const isMine = (f) => f?.st === "mine";
const journalists = ["kate", "ben", "mia", "raj"];

// ---------- Authors ----------
// a: "me" | "f:<id>" fighter | "n:<id>" person | "o:<outlet>" | "br:<brand>" | "ag:<id>" agency | "u:<handle>" fan
export function author(a) {
  const ph = P();
  if (a === "me") return { name: G.ag.name, handle: "@" + squash(G.ag.name), kind: "me", col: AGENCY_COLOURS[G.ag.col], ini: G.ag.name.split(" ").map((w) => w[0]).join("").slice(0, 2), ver: ph.me.fol >= 5000, fol: ph.me.fol, bio: `MMA management. ${G.ag.manager ? "Run by " + G.ag.manager + ". " : ""}Signing hungry fighters.` };
  const [k, v] = [a.slice(0, a.indexOf(":")), a.slice(a.indexOf(":") + 1)];
  if (k === "f") { const f = G.f[+v]; return { name: f.name, handle: "@" + squash(f.name), kind: "fighter", f, ver: f.real || (rank(f) >= 0 && rank(f) <= 15), fol: Math.round(800 + f.pop * f.pop * 90 * (f.real ? 3 : 1)), bio: `${DIVISIONS[f.wc]} fighter${f.nick ? ` "${f.nick}"` : ""}. ${f.w}-${f.l}. ${f.st === "mine" ? "Managed by " + G.ag.name + "." : f.st === "other" ? AGENCIES[f.agency].name + "." : "Free agent."}` }; }
  if (k === "n") { const p = PEOPLE[v]; return { name: p.name, handle: p.handle || "@" + squash(p.name), kind: p.kind, p, id: v, col: p.col, ini: p.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join(""), ver: p.kind === "journalist" || p.kind === "media", fol: 2000 + (Math.abs(hash(v)) % 90) * 1300, bio: `${p.role}, ${p.org}. ${p.bio}` }; }
  if (k === "o") { const o = C.OUTLETS[v]; return { name: o.name, handle: o.handle, kind: "outlet", col: o.col, ini: o.ini, ver: "gold", fol: 2400000 + (Math.abs(hash(v)) % 9) * 310000, bio: o.bio }; }
  if (k === "br") { const b = BRANDS.find((x) => x.name === v) || { col: "#888" }; return { name: v, handle: "@" + squash(v), kind: "brand", col: b.col, ini: v.split(" ").map((w) => w[0]).join(""), ver: "gold", fol: 90000 + (Math.abs(hash(v)) % 40) * 9000, bio: "Official partner of fighters who mean it." }; }
  if (k === "ag") { const g = AGENCIES[+v]; return { name: g.name, handle: "@" + g.short.toLowerCase() + "mgmt", kind: "agency", col: g.col, ini: g.short, ver: 1, fol: 20000 + g.id * 7000, bio: `Fighter management. ${g.style[0].toUpperCase() + g.style.slice(1)}.` }; }
  const h = Math.abs(hash(v));
  return { name: v.replace(/_/g, " "), handle: "@" + v, kind: "fan", col: `hsl(${h % 360} 45% 45%)`, ini: v[0].toUpperCase(), fol: 40 + (h % 4000), bio: "Fight fan. Opinions my own." };
}
function reachOf(a) {
  if (a === "me") return Math.round(P().me.fol * (0.04 + R() * 0.1));
  if (a.startsWith("f:")) { const f = G.f[+a.slice(2)]; return Math.round((40 + f.pop * f.pop * 1.6 * (f.real ? 1.4 : 1)) * (0.5 + R())); }
  if (a.startsWith("o:")) return ri(900, 7000);
  if (a.startsWith("br:") || a.startsWith("ag:")) return ri(120, 1600);
  if (a.startsWith("n:")) return ri(150, 2600);
  return R() < 0.05 ? ri(1500, 9000) : ri(3, 320);
}
const fan = () => "u:" + pk(C.FANS);

// ---------- Posts ----------
// Engagement grows over the hours after a post goes up.
export const likes = (p) => (p.t > now() ? 0 : Math.round(p.reach * (1 - Math.exp(-(now() - p.t) / 300))) + (p.lk ? 1 : 0));
export const reposts = (p) => Math.round(likes(p) * p.rp) + (p.rt ? 1 : 0);
export const replies = (p) => (p.rs || []).filter((r) => r.t <= now());
export const replyCount = (p) => replies(p).length + Math.round(likes(p) * 0.015);
export function add(p, quiet) {
  const ph = P();
  const post = { id: ph.id++, kind: "post", about: [], rs: [], rp: 0.04 + R() * 0.14, ...p };
  post.t ??= now(); post.media ??= null;
  post.reach ??= reachOf(post.a);
  ph.feed.push(post);
  ph.feed.sort((a, b) => b.t - a.t);
  if (ph.feed.length > 160) ph.feed.length = 160;
  if (!quiet && post.about.some((id) => isMine(G.f[id])) && post.a !== "me") notify(post.kind === "news" ? "imp" : "ord", "pulse", author(post.a).name, post.text, "post:" + post.id, post.kind === "news" ? "news" : "social");
  return post;
}
const fans = (p, n, set = C.FANP.reply, c = {}) => { for (let i = 0; i < n; i++) p.rs.push({ id: P().id++, a: fan(), text: fill(pk(set), c), t: p.t + ri(2, 500), reach: ri(0, 90) }); p.rs.sort((a, b) => a.t - b.t); return p; };
export const post = (id) => P().feed.find((p) => p.id === id);
export function news(kind, f, headline, c = {}, t) {
  const h = headline || fill(line(NEWS[kind], "n" + kind), { f, ...c });
  const p = add({ a: R() < 0.7 ? "o:pulse" : "o:report", kind: "news", text: h, t, about: [f?.id, c.o?.id].filter((x) => x != null) });
  fans(p, ri(0, 3), C.FANP.reply);
  if (isMine(f)) p.reach *= 1.3;
  return p;
}

// A rumour, posted by whoever started it. Its status (confirmed / denied) shows on the post later.
export function rumourPost(r, src, t) {
  const id = Object.keys(PEOPLE).find((k) => PEOPLE[k].handle === src[0]);
  const a = id ? "n:" + id : "u:" + pk({ 0: ["mma_leaks", "anon_insider", "cage_whispers"], 1: ["gymrat_intel", "fightweek_fred", "octagon_oracle"] }[r.cred] || ["mma_leaks"]);
  const e = r.effect || {};
  return fans(add({ a, kind: "rumour", rid: r.id, text: r.txt, t, about: [e.fid, e.oid].filter((x) => x != null), reach: ri(300, 3000) * (r.cred + 1) }), ri(1, 4));
}
export const rumourOf = (p) => P().rumours.find((r) => r.id === p.rid);

// ---------- Rivalries ----------
const rk = (a, b) => [a, b].sort((x, y) => x - y).join("-");
export const heatOf = (a, b) => P().riv[rk(a, b)]?.h || 0;
export function heat(a, b, d) {
  const ph = P(), k = rk(a, b), r = (ph.riv[k] ||= { h: 0, wk: G.wk });
  r.h = cl(r.h + d, 0, 100); r.wk = G.wk;
  const mineF = [G.f[a], G.f[b]].find(isMine), other = [G.f[a], G.f[b]].find((x) => x !== mineF);
  if (mineF && other && r.h >= 55 && cdOk("rivoffer" + k, 4)) { ph.cd["rivoffer" + k] = G.wk; soon({ g: "npc", id: isContact("n:dana") ? "dana" : "promo", k: "rivalry", fid: mineF.id, oid: other.id, heat: r.h }, 60, 1500); }
  return r.h;
}
export const rivalries = () => Object.entries(P().riv).filter(([, r]) => r.h >= 20).map(([k, r]) => { const [a, b] = k.split("-").map(Number); return { a: G.f[a], b: G.f[b], h: r.h }; }).filter((x) => isMine(x.a) || isMine(x.b));

// ---------- The world posting ----------
const W = [["training", 4], ["personal", 2], ["beef", 1.4], ["hot", 1.5], ["scoop", 0.9], ["preview", 1.2], ["poll", 1.4], ["fanhype", 2], ["agency", 0.8], ["brand", 0.6], ["odds", 0.6], ["drama", 0.45]];
const wpick = () => { const tot = W.reduce((s, x) => s + x[1], 0); let r = R() * tot; for (const [k, w] of W) if ((r -= w) < 0) return k; return "training"; };
export function worldPost(w, t, it = {}) {
  const m = mine(), nb = notable(), myBk = G.bk.filter((b) => isMine(G.f[b.fid]));
  const someone = () => (m.length && R() < 0.3 ? pk(m) : pk(nb));
  switch (w) {
    case "training": { const f = someone(); if (!f) return; const txt = R() < 0.35 ? line(C.FPOST.styleLine[f.style] || C.FPOST.styleLine._, "ps" + f.style) : line(byPers(C.FPOST.training, f), "pt" + f.pers); return fans(add({ a: "f:" + f.id, text: txt, t, about: [f.id], media: R() < 0.6 ? { k: "clip", fid: f.id, d: ri(8, 59) } : null }), ri(0, 3), C.FANP.reply); }
    case "personal": { const f = someone(); if (!f) return; return fans(add({ a: "f:" + f.id, text: fill(line(byPers(C.FPOST.personal, f), "pp" + f.pers), { f }), t, about: [f.id] }), ri(0, 2)); }
    case "beef": {
      const a = pk(nb.filter((f) => !isMine(f))); if (!a) return;
      const pool = ranks(a.wc).filter((o) => o !== a && !o.retired && Math.abs(ovr(o) - ovr(a)) < 9);
      const b = (m.some((f) => f.wc === a.wc) && R() < 0.35 ? pk(pool.filter(isMine)) : null) || pk(pool.filter((o) => !isMine(o))); if (!b) return;
      const p = fans(add({ a: "f:" + a.id, text: fill(line(byPers(C.BEEF.callout, a), "bc" + a.pers), { o: b }), t, about: [a.id, b.id] }), ri(1, 4), C.FANP.reply);
      heat(a.id, b.id, 10);
      if (isMine(b)) notify("imp", "pulse", a.name + " called out " + b.name, p.text, "post:" + p.id, "social");
      else schedule({ g: "ans", pid: p.id, from: b.id, to: a.id, k: "beef" }, Math.min(6, Math.floor((t - wkStart()) / DAY) + 1), 6);
      return p;
    }
    case "hot": { const f = someone(); if (!f) return; return fans(add({ a: "n:" + pk(journalists), text: fill(line(C.NEWSP.hot, "nh"), { f }), t, about: [f.id] }), ri(2, 5)); }
    case "scoop": { const f = pk(nb.filter((x) => !isMine(x))), o = f && ranks(f.wc).find((x) => x !== f && !x.retired && Math.abs(rank(x) - rank(f)) <= 3); if (!o) return; return fans(add({ a: "n:" + pk(["raj", "ben"]), text: fill(line(C.NEWSP.scoop, "ns"), { f, o, ag: AGENCIES[f.agency]?.name || "his agency" }), t, about: [f.id, o.id] }), ri(1, 4)); }
    case "preview": { const b = pk(myBk); if (!b) return worldPost("fanhype", t); const f = G.f[b.fid], o = G.f[b.oid]; return fans(add({ a: "n:" + pk(journalists), text: fill(line(C.NEWSP.preview, "np"), { f, o, pick: last((ovr(f) + ri(-6, 6) >= ovr(o) ? f : o).name) }), t, about: [f.id, o.id], media: { k: "vs", a: f.id, b: o.id, wk: b.wk } }), ri(1, 4), C.FANP.hype, { f, o }); }
    case "poll": {
      const b = pk(myBk), f = b ? G.f[b.fid] : pk(nb), o = b ? G.f[b.oid] : f && ranks(f.wc).find((x) => x !== f && !x.retired && Math.abs(rank(x) - rank(f)) <= 2); if (!f || !o) return;
      const pa = cl(Math.round(50 + (ovr(f) - ovr(o)) * 3 + (f.pop - o.pop) * 0.4 + ri(-10, 10)), 8, 92);
      return fans(add({ a: fan(), text: fill(line(C.FANP.poll, "fp"), { f, o }), t, about: [f.id, o.id], media: { k: "poll", a: f.id, b: o.id, pa }, reach: ri(200, 3000) }), ri(2, 5), C.FANP.hype, { f, o });
    }
    case "fanhype": { const f = someone(); if (!f) return; const o = G.f[G.bk.find((x) => x.fid === f.id)?.oid ?? -1] || ranks(f.wc).find((x) => x !== f && !x.retired); return fans(add({ a: fan(), text: fill(line(C.FANP.hype, "fh"), { f, o }), t, about: [f.id] }), ri(0, 3)); }
    case "agency": { const f = pk(G.f.filter((x) => x.st === "other" && x.real && !x.retired)); if (!f) return; const g = AGENCIES[f.agency]; return add({ a: "ag:" + g.id, text: fill(pk(["Proud to represent {f}. Big things coming.", `${g.name} welcomes {f} to the family.`, "Our roster is stacked this year.", "{fl} is ready for anyone at {div}. Anyone."]), { f }), t, about: [f.id] }); }
    case "brand": { const f = pk(nb.filter((x) => !isMine(x))); if (!f) return; return sponsorPost(f, pk(BRANDS).name, t); }
    case "odds": { const b = pk(myBk); if (!b) return; const f = G.f[b.fid], o = G.f[b.oid], d = ovr(f) - ovr(o), ln = Math.round(100 + Math.abs(d) * 22); return add({ a: "o:odds", text: `${f.name} opens ${d >= 0 ? "-" + ln + " favourite" : "+" + ln + " underdog"} against ${o.name}. Line moving ${pk(["fast", "slowly", "his way", "against him"])}.`, t, about: [f.id, o.id], media: { k: "vs", a: f.id, b: o.id, wk: b.wk } }); }
    case "drama": return drama(t);
    case "unhappy": { const f = G.f[it.fid]; if (!isMine(f)) return; const p = fans(add({ a: "f:" + f.id, text: line(C.FPOST.unhappy._, "pu"), t, about: [f.id] }), ri(2, 4)); notify("imp", "pulse", f.name + " is venting", p.text, "post:" + p.id, "social"); return p; }
  }
}
// An answer that arrives later: a fighter fires back at whoever called him out.
export function answer(it, t) {
  const p = post(it.pid), from = G.f[it.from], to = G.f[it.to];
  if (!p || !from || from.retired) return;
  let txt;
  if (it.k === "beef") { txt = fill(line(byPers(C.BEEF.answer, from), "ba" + from.pers), { o: to }); heat(from.id, to.id, 8); }
  else { txt = fill(pk(byPers(C.ANSWER, from)), { f: to }); heat(from.id, to.id, from.pers === "Hotheaded" ? 12 : 5); if (it.me) { addMeet(from); } }
  p.rs.push({ id: P().id++, a: "f:" + from.id, text: txt, t, reach: reachOf("f:" + from.id) });
  const q = fans(add({ a: "f:" + from.id, text: txt, t, about: [from.id, to.id], q: p.id }), ri(1, 4));
  if (isMine(to) || it.me) notify("imp", "pulse", from.name + " answered", txt, "post:" + q.id, "social");
}
// A fighter who answered you on PULSE now knows who you are: you can message him.
function addMeet(f) { P().rel["f:" + f.id] ??= 30; }

// ---------- Controversy ----------
function drama(t) {
  const ph = P(), m = mine(), k = pk(Object.keys(C.DRAMA)), d = C.DRAMA[k];
  const f = m.length && R() < 0.35 && !ph.contro.some((c) => !c.done) ? pk(m) : pk(notable().filter((x) => !isMine(x)));
  if (!f) return;
  const o = ranks(f.wc).find((x) => x !== f && !x.retired && !isMine(x));
  const p = fans(add({ a: "o:pulse", kind: "news", text: fill(line(d.h, "dh" + k), { f, o }), t, about: [f.id], reach: ri(3000, 12000) }), ri(3, 6), isMine(f) ? C.FANP.loss : C.FANP.reply, { f });
  if (!isMine(f)) return p;
  const c = { id: ph.id++, fid: f.id, kind: k, wk: G.wk, done: 0, pid: p.id };
  ph.contro.push(c);
  f.pop = Math.min(100, f.pop + 1); // any publicity...
  notify("crit", "pulse", "Controversy: " + f.name, p.text, "post:" + p.id, "news");
  const j = journalists.filter((x) => isContact("n:" + x))[0];
  if (j) { const jp = PEOPLE[j]; msg("n:" + j, fill(line(VOICE.contro[jp.voice], "vc" + jp.voice), { f, txt: d.txt, n: jp.name.split(" ")[0] }), { t: t + ri(20, 200), kind: "contro", opts: C.CONTRO_REPLY.map((r) => r[0]), x: c.id }); notify("imp", "connect", jp.name, "Wants a statement about " + last(f.name), "n:" + j, "msg"); }
  return p;
}
export const openContro = () => P().contro.filter((c) => !c.done && G.f[c.fid]?.st === "mine");
export function answerContro(cid, i, key) {
  const ph = P(), c = ph.contro.find((x) => x.id === cid);
  if (!c || c.done) { if (key) msg(key, "Already handled, thanks.", { t: now() + 1 }); return "Already answered."; }
  const f = G.f[c.fid], r = C.CONTRO_REPLY[i], txt = fill(r[1], { f });
  c.done = 1;
  f.pop = cl(f.pop + r[2], 0, 100); mood(f, r[3]);
  let res = `${r[0]}: ${last(f.name)} ${r[3] >= 0 ? "appreciates it" : "isn't thrilled"}.`;
  const drop = r[4] && (f.deals || []).length && R() < r[4] * 0.15;
  if (drop) { const dd = f.deals.pop(); res += ` ${dd.brand} dropped him.`; }
  if (key) { msg(key, txt, { me: true }); msg(key, "Thanks. That's going in the piece.", { t: now() + 3 }); rel(key, 3); thread(key).unread = 0; const j = key.slice(2); fans(add({ a: key, text: `${G.ag.name} on ${f.name}: "${txt}"`, about: [f.id], q: c.pid }), ri(2, 5), C.FANP.replyMine); return res; }
  const p = add({ a: "me", text: txt, about: [f.id], q: c.pid }); fans(p, ri(2, 6), C.FANP.replyMine, { f });
  P().me.fol += Math.round(p.reach * 0.05);
  return res;
}

// ---------- Hooks ----------
export function onFight(me, op, r) {
  const W_ = r.won ? me : op, L = r.won ? op : me, how = r.how === "KO/TKO" ? "KO" : r.how === "Submission" ? "SUB" : "DEC";
  const h = heatOf(me.id, op.id);
  const res = news(r.wasChamp ? "title" : r.won ? (r.how === "KO/TKO" ? "myKO" : r.how === "Submission" ? "mySub" : "myWin") : "myLoss", me, null, { o: op, how: r.how.toLowerCase(), rd: r.rdEnd });
  res.media = { k: "res", w: W_.id, l: L.id, how, rd: r.rdEnd }; res.reach = Math.round(res.reach * (1 + h / 60));
  fans(res, ri(2, 5), r.won ? (how === "KO" ? C.FANP.ko : C.FANP.win) : C.FANP.loss, { f: me, o: op });
  fans(add({ a: "f:" + W_.id, text: fill(line(byPers(C.FPOST.win, W_), "pw" + W_.pers), { o: L }), t: now() + ri(30, 180), about: [W_.id] }), ri(1, 4));
  if (R() < 0.7) add({ a: "f:" + L.id, text: fill(line(byPers(C.FPOST.loss, L), "pl" + L.pers), { o: W_ }), t: now() + ri(200, 900), about: [L.id] });
  if (R() < 0.5) fans(add({ a: "n:" + pk(journalists), text: fill(line(C.NEWSP.agency, "na"), { f: me }), t: now() + ri(300, 1200), about: [me.id] }), ri(1, 3));
  if (h >= 25) { me.pop = Math.min(100, me.pop + Math.round(h / 12)); op.pop = Math.min(100, op.pop + Math.round(h / 20)); news(null, me, `Rivalry settled: ${W_.name} gets the last word over ${L.name}`, { o: op }); }
  delete P().riv[rk(me.id, op.id)];
  if (r.won) P().me.fol += ri(10, 60) + Math.round(me.pop);
}
// Fights you book show up as announcements.
export function scan() {
  const ph = P();
  for (const b of G.bk) {
    const k = b.fid + "-" + b.oid + "-" + b.wk;
    if (ph.seenBk[k]) continue;
    ph.seenBk[k] = 1;
    const f = G.f[b.fid], o = G.f[b.oid], h = heatOf(f.id, o.id);
    fans(add({ a: "o:pulse", kind: "news", text: h >= 30 ? `It's happening: ${f.name} vs ${o.name}, week ${b.wk}. The rivalry gets settled in the cage.` : fill(line(NEWS.booking, "nbk"), { f, o, amt: b.wk }), about: [f.id, o.id], media: { k: "vs", a: f.id, b: o.id, wk: b.wk }, reach: ri(1500, 6000) * (1 + h / 50) }), ri(2, 5), C.FANP.hype, { f, o });
  }
}
export function mediaPost(id, f) {
  const p = PEOPLE[id];
  fans(add({ a: "n:" + id, text: fill(pk(p.kind === "media" ? ["New episode with {f} is out now 🎙️ He did NOT hold back.", "{fl} on Fight Talk this week. Wild stories. Link in bio."] : ["Sat down with {f} this week. Full interview tonight.", "{fl} opened up about his journey and what's next. Great conversation."]), { f }), about: [f.id], media: { k: "clip", fid: f.id, d: ri(40, 59), long: 1 } }), ri(2, 5), C.FANP.hype, { f });
}
export function sponsorPost(f, brand, t) {
  return fans(add({ a: "br:" + brand, text: fill(pk(["Welcome to the team, {f}! 🤝", "{f} joins the {brand} family.", "Built for fighters like {fl}. Welcome aboard."]), { f, brand }), t, about: [f.id], media: { k: "brand", brand, fid: f.id } }), ri(0, 3), C.FANP.reply);
}

// ---------- The week ----------
export function week() {
  const ph = P();
  for (const [k, r] of Object.entries(ph.riv)) { r.h -= 4; if (r.h <= 0) delete ph.riv[k]; else if (r.h >= 55) { const [a, b] = k.split("-").map(Number); heat(a, b, 0); } }
  for (const c of ph.contro.filter((x) => !x.done && G.wk - x.wk >= 2)) {
    const f = G.f[c.fid]; c.done = 1;
    if (f.st !== "mine") continue;
    f.pop = Math.max(0, f.pop - 3); mood(f, -4);
    if ((f.deals || []).length && R() < 0.25) f.deals.pop();
    news(null, f, `${G.ag.name} stays silent on ${f.name}'s ${C.DRAMA[c.kind].txt}. Fans want answers.`);
  }
  // Other results from last week, then the week's chatter spread across the days.
  for (const x of (G.wkAI || []).filter((x) => x.title || x.ko).slice(0, 3)) {
    const w = G.f[x.w], l = G.f[x.l];
    const p = news(x.title ? "aiTitle" : x.ko ? "aiKO" : "aiWin", w, null, { o: l }, wkStart() + ri(7 * 60, 11 * 60));
    p.media = { k: "res", w: w.id, l: l.id, how: x.ko ? "KO" : "DEC", rd: x.ko ? ri(1, 3) : 3 };
    if (R() < 0.6) fans(add({ a: "f:" + w.id, text: fill(line(byPers(C.FPOST.win, w), "pw" + w.pers), { o: l }), t: wkStart() + ri(9 * 60, 22 * 60), about: [w.id] }), ri(1, 3));
  }
  const n = 13 + ri(0, 6);
  let dramaDone = 0, beefs = 0;
  for (let i = 0; i < n; i++) {
    let w = wpick();
    if (w === "drama" && dramaDone++) w = "training";
    if (w === "beef" && beefs++ > 1) w = "fanhype";
    schedule({ g: "wp", w }, 0, 6);
  }
  for (const f of mine()) if (f.mood < 30 && R() < 0.2) schedule({ g: "wp", w: "unhappy", fid: f.id }, 1, 5);
}

// ---------- You on PULSE ----------
export const POSTS_A_WEEK = 3;
export function postsLeft() { const m = P().me; if (m.wk !== G.wk) { m.wk = G.wk; m.n = 0; } return POSTS_A_WEEK - m.n; }
const lostRecently = (f) => { const r = P().res[f.id]; return r && !r.won && G.wk - r.wk <= 3; };
const wonRecently = (f) => { const r = P().res[f.id]; return r && r.won && G.wk - r.wk <= 2; };
// What you can post now, and why not if you can't.
export function composeKinds() {
  const m = mine(), bk = G.bk.filter((b) => isMine(G.f[b.fid])), cs = openContro();
  const k = (key, ok, why) => ({ k: key, t: key === "contro" && cs[0] ? fill(C.COMPOSE.contro.t, {}) : C.COMPOSE[key].t, s: key === "contro" && cs[0] ? fill(C.COMPOSE.contro.s, { f: G.f[cs[0].fid], txt: C.DRAMA[cs[0].kind].txt }) : C.COMPOSE[key].s, ok, why });
  return [
    ...(cs.length ? [k("contro", true)] : []),
    k("promote", bk.length > 0, "Book a fight first"),
    k("callout", m.length > 0, "Sign a fighter first"),
    k("hype", m.length > 0, "Sign a fighter first"),
    k("defend", m.some(lostRecently), "Nobody lost lately"),
    k("thanks", m.some(wonRecently), "No recent wins"),
    k("agency", true),
  ];
}
// Things to pick for a post kind. step 2 of a call-out picks the opponent.
export function targets(k, sel = {}) {
  const m = mine();
  const fl = (list) => list.map((f) => ({ v: f.id, label: last(f.name), sub: DIVISIONS[f.wc] }));
  switch (k) {
    case "promote": return G.bk.map((b, i) => [b, i]).filter(([b]) => isMine(G.f[b.fid])).map(([b, i]) => ({ v: i, label: `${last(G.f[b.fid].name)} vs ${last(G.f[b.oid].name)}`, sub: "Week " + b.wk }));
    case "callout": if (sel.fid == null) return fl(m); { const f = G.f[sel.fid]; return ranks(f.wc).filter((o) => !isMine(o) && !o.retired && o.st !== "free").sort((a, b) => Math.abs(ovr(a) - ovr(f) - 3) - Math.abs(ovr(b) - ovr(f) - 3)).slice(0, 4).map((o) => ({ v: o.id, label: last(o.name), sub: (rank(o) === 0 ? "Champion" : rank(o) > 0 && rank(o) <= 15 ? "#" + rank(o) : "Unranked") + (heatOf(f.id, o.id) ? " · 🔥" + heatOf(f.id, o.id) : "") })); }
    case "hype": return fl(m);
    case "defend": return fl(m.filter(lostRecently));
    case "thanks": return fl(m.filter(wonRecently));
    case "contro": return openContro().map((c) => ({ v: c.id, label: last(G.f[c.fid].name), sub: C.DRAMA[c.kind].txt }));
    case "agency": return AGENCIES.map((a) => ({ v: a.id, label: a.short, sub: a.name }));
  }
  return [];
}
export const needs = (k) => (k === "callout" ? ["fid", "oid"] : k === "promote" ? ["b"] : k === "agency" ? ["ag"] : k === "contro" ? ["cid"] : ["fid"]);
const ctxOf = (k, sel) => {
  if (k === "promote") { const b = G.bk[sel.b]; return b && { f: G.f[b.fid], o: G.f[b.oid], wk: b.wk }; }
  if (k === "agency") return { ag: AGENCIES[sel.ag].name };
  if (k === "contro") { const c = P().contro.find((x) => x.id === sel.cid); return c && { f: G.f[c.fid] }; }
  return { f: G.f[sel.fid], o: sel.oid != null ? G.f[sel.oid] : null };
};
// The three drafts you can pick from. Stable for the week so they don't change under your cursor.
export function drafts(k, sel) {
  const c = ctxOf(k, sel); if (!c) return [];
  if (k === "contro") return C.CONTRO_REPLY.map((r) => ({ tone: r[0], text: fill(r[1], c) }));
  return C.COMPOSE[k].tones.map(([tone, ls], i) => ({ tone, text: fill(ls[(G.wk + (sel.fid ?? sel.b ?? sel.ag ?? 0) + i) % ls.length], c) }));
}
// Publish. Returns a result line.
export function publish(k, sel, tone) {
  if (postsLeft() <= 0) return "No posts left this week. Your followers need a breather.";
  const ph = P(), c = ctxOf(k, sel); if (!c) return "That's no longer possible.";
  if (k === "contro") return (ph.me.n++, answerContro(sel.cid, tone));
  const text = drafts(k, sel)[tone].text, f = c.f, o = c.o;
  const p = add({ a: "me", text, about: [f?.id, o?.id].filter((x) => x != null), media: k === "promote" ? { k: "vs", a: f.id, b: o.id, wk: c.wk } : k === "hype" && R() < 0.5 ? { k: "clip", fid: f.id, d: ri(10, 40) } : null });
  p.reach = Math.round(p.reach * [0.8, 1.1, 1.6][tone] * (f ? 1 + f.pop / 150 : 1));
  ph.me.n++;
  const fol = Math.round(p.reach * [0.03, 0.05, 0.08][tone]);
  ph.me.fol += fol;
  const replyMix = tone === 2 && R() < 0.5 ? C.FANP.loss : C.FANP.replyMine;
  fans(p, ri(2, 6), replyMix, { f, o });
  let res = `Posted. +${fol} followers.`;
  switch (k) {
    case "promote": {
      const b = G.bk[sel.b]; b.promo = (b.promo || 0) + 1;
      if (b.promo <= 2) { b.purse = Math.round(b.purse * (1 + [0.04, 0.07, 0.1][tone])); res += ` Purse up ${[4, 7, 10][tone]}%.`; }
      f.pop = Math.min(100, f.pop + 1); if (tone) heat(f.id, o.id, [0, 8, 18][tone]);
      if (tone === 2) soon({ g: "ans", pid: p.id, from: o.id, to: f.id, k: "callout", me: 1 }, 30, 500);
      break;
    }
    case "callout": {
      const h = heat(f.id, o.id, [15, 25, 35][tone]);
      mood(f, tone === 2 ? (["Hotheaded", "Ambitious"].includes(f.pers) ? 4 : ["Easygoing", "Professional"].includes(f.pers) ? -3 : 1) : 2);
      const ag = o.st === "other" ? AGENT_OF[o.agency] : null; if (ag) rel("n:" + ag, -[0, 3, 8][tone]);
      soon({ g: "ans", pid: p.id, from: o.id, to: f.id, k: "callout", me: 1 }, 20, 400);
      res += ` Rivalry with ${last(o.name)}: ${h}/100.` + (h >= 55 ? " The matchmakers are watching." : "");
      break;
    }
    case "hype": { const g = [1, 2, 2][tone]; f.pop = Math.min(100, f.pop + g); mood(f, 2); res += ` ${last(f.name)} +${g} popularity.`; if (tone === 2 && R() < 0.3) { f.pop = Math.max(0, f.pop - 2); res += " Some fans think it's too much."; } break; }
    case "defend": mood(f, [5, 6, 4][tone]); res += ` ${last(f.name)} feels backed.`; break;
    case "thanks": mood(f, 2); ph.me.fol += 30; break;
    case "agency": { const id = AGENT_OF[sel.ag]; rel("n:" + id, [2, -6, -12][tone]); res += tone ? ` ${PEOPLE[id].name} won't like that.` : ""; if (tone === 2) G.rep = cl(G.rep + (R() < 0.5 ? 1 : -1), 0, 100); break; }
  }
  return res;
}
// Your reply options to someone else's post: depends on who wrote it.
export function replyOpts(p) {
  if (p.myr != null || p.a === "me") return [];
  const a = author(p.a);
  if (a.kind === "fighter") {
    if (isMine(a.f)) return C.REPLY.mine.map((r) => ({ label: r[0], text: fill(r[1], { f: a.f }) }));
    const riv = rivalFor(a.f);
    return C.REPLY.fighter.filter((r) => riv || r[2] === "respect").map((r) => ({ label: r[0], text: fill(r[1], { f: a.f, rival: riv && last(riv.name) }) }));
  }
  if (a.kind === "journalist" || a.kind === "media") return C.REPLY.journalist.map((r) => ({ label: r[0], text: fill(r[1], { n: a.name.split(" ")[0] }) }));
  return [];
}
const rivalFor = (f) => mine().filter((x) => x.wc === f.wc).sort((a, b) => ovr(b) - ovr(a))[0];
export function replyPost(pid, i) {
  const p = post(pid); if (!p) return "";
  const opts = replyOpts(p); if (!opts[i]) return "";
  const a = author(p.a), key = p.a;
  p.myr = i;
  p.rs.push({ id: P().id++, a: "me", text: opts[i].text, t: now(), reach: reachOf("me") });
  let res = "Replied.";
  if (a.kind === "fighter" && isMine(a.f)) { const k = C.REPLY.mine.find((r) => r[0] === opts[i].label)[2]; mood(a.f, k === "tease" ? (a.f.pers === "Easygoing" ? 1 : -2) : k === "hype" ? 3 : 2); res = k === "tease" ? `${last(a.f.name)} ${a.f.pers === "Easygoing" ? "laughed" : "didn't laugh"}.` : `${last(a.f.name)} liked that.`; }
  else if (a.kind === "fighter") {
    const k = C.REPLY.fighter.find((r) => r[0] === opts[i].label)[2], riv = rivalFor(a.f);
    if (k === "respect") { const r = rel(key, 5); res = `${last(a.f.name)} noticed.`; if (r >= 50 && !isContact(key)) res += " You can message him now."; }
    if (k === "banter") { rel(key, -3); heat(riv.id, a.f.id, 10); res = `${last(riv.name)} vs ${last(a.f.name)}: rivalry ${heatOf(riv.id, a.f.id)}/100.`; }
    if (k === "provoke") { rel(key, -10); const ag = a.f.st === "other" ? AGENT_OF[a.f.agency] : null; if (ag) rel("n:" + ag, -4); heat(riv.id, a.f.id, 20); soon({ g: "ans", pid: p.id, from: a.f.id, to: riv.id, k: "callout", me: 1 }, 15, 300); res = `He won't forget that. Rivalry ${heatOf(riv.id, a.f.id)}/100.`; }
  } else {
    const k = C.REPLY.journalist.find((r) => r[0] === opts[i].label)[2];
    const d = { thanks: 6, correct: -3, tease: 3 }[k]; rel(key, d);
    res = `${a.name}: ${d > 0 ? "relationship up" : "a bit annoyed"}.`;
    if (k === "tease" && a.id) { if (!isContact(key)) { meet(a.id); res += " They messaged you."; } else soon({ g: "npc", id: a.id, k: "interview" }, 60, 900); }
  }
  return res;
}
export function like(pid) { const p = post(pid); if (p) p.lk = p.lk ? 0 : 1; }
export function repost(pid) {
  const p = post(pid); if (!p) return "";
  p.rt = p.rt ? 0 : 1;
  const f = p.a.startsWith("f:") && G.f[+p.a.slice(2)];
  if (p.rt && isMine(f) && !p.rtm) { p.rtm = 1; mood(f, 1); return `${last(f.name)} saw the repost. 👍`; }
  return p.rt ? "Reposted." : "";
}
// Posts by one author, for profiles.
export const postsBy = (a) => P().feed.filter((p) => p.a === a && p.t <= now());
