// PULSE CONNECT: your professional network. Contacts are earned through play (people reach out when
// something happens, introductions, signing fighters), each has a relationship score that changes what
// they offer you, and every business opportunity arrives here as an offer card in a chat.
import { G, mine, ovr, rank, ranks, spend, earn, say, bumpRanks, askOf } from "../state.js";
import { R, ri, pk, cl, round100, last } from "../util.js";
import { AGENCIES, DIVISIONS, ROSTER_MAX, ATTR_KEYS, ATTR_NAMES } from "../data/constants.js";
import { PEOPLE, VOICE, PITCH, ASKS, BRAND_REP, AGENT_OF } from "../data/people.js";
import { P, fill, line, notify, msg, thread, now, money, schedule, soon, cdOk } from "./phone.js";
import * as PU from "./pulse.js";
import { acceptSponsor, declineSponsor, sponsorOffer } from "./sponsors.js";
import { sell, counter as bidCounter, rejectBid, canSell } from "./market.js";
import { purseFor } from "./world.js";

const first = (p) => p.name.replace(/^Dr\. /, "").split(" ")[0];
const say2 = (id, sit, c = {}, t) => { const p = PEOPLE[id]; return fill(line(VOICE[sit][p.voice], "v" + sit + p.voice), { n: first(p), org: p.org, ...c }); };

// ---------- Relationships ----------
// Your own fighters' relationship is their mood. Everyone else has a 0–100 score that starts near 40.
export const mood = (f, d) => { f.mood ??= 60; if (d) f.mood = cl(f.mood + d, 0, 100); return f.mood; };
export function rel(key, d = 0) {
  if (key.startsWith("f:")) { const f = G.f[+key.slice(2)]; if (f.st === "mine") return mood(f, d); }
  const ph = P(), v = (ph.rel[key] ??= key.startsWith("f:") ? 30 : 40);
  if (d) ph.rel[key] = cl(v + d, 0, 100);
  return ph.rel[key];
}
export const relWord = (r) => (r >= 75 ? "Close" : r >= 55 ? "Friendly" : r >= 35 ? "Neutral" : r >= 20 ? "Cool" : "Hostile");

// ---------- Contacts ----------
export const isContact = (key) => (key.startsWith("f:") && G.f[+key.slice(2)]?.st === "mine") || !!P().cx[key];
export function addContact(key, quiet) {
  const ph = P();
  if (ph.cx[key]) return;
  ph.cx[key] = { added: G.wk };
  if (!quiet) { const w = person(key); notify("ord", "connect", "New contact", `${w.name} · ${w.role}`, key, "msg"); }
}
// Someone reaches out to you for the first time.
export function meet(id, t) {
  const key = "n:" + id, ph = P();
  if (ph.cx[key] || ph.cd["gone" + key] || !PEOPLE[id]) return false;
  addContact(key, true);
  msg(key, say2(id, "hello"), { t });
  notify("imp", "connect", PEOPLE[id].name, `${PEOPLE[id].role}, ${PEOPLE[id].org} wants to connect`, key, "msg");
  return true;
}
// Can you add this person yourself? {ok, why}
export function reach(key) {
  if (isContact(key)) return { ok: false, why: "Already a contact" };
  if (key.startsWith("n:")) {
    const id = key.slice(2), p = PEOPLE[id], ph = P();
    if (p.tier === 2 && !ph.intro[id]) return { ok: false, why: "Needs an introduction from " + p.by.map((b) => PEOPLE[b].name).join(", ") };
    if (p.tier === 1 && G.rep < p.rep && !ph.intro[id]) return { ok: false, why: `Needs reputation ${p.rep} (you have ${Math.round(G.rep)})` };
    if (ph.cd["gone" + key] > G.wk - 8) return { ok: false, why: "You removed them recently" };
    return { ok: true };
  }
  const f = G.f[+key.slice(2)];
  if (!f || f.retired) return { ok: false, why: "Retired" };
  if (f.st === "free" || P().threads[key] || f.tl?.some((x) => /your agency/i.test(x.t))) return { ok: true };
  const ag = AGENT_OF[f.agency];
  if (rel(key) >= 50) return { ok: true };
  return isContact("n:" + ag) ? { ok: true } : { ok: false, why: `Signed with ${AGENCIES[f.agency].name}. Get to know ${PEOPLE[ag].name} first.` };
}
export function add(key) {
  const r = reach(key);
  if (!r.ok) return r.why;
  addContact(key, true);
  if (key.startsWith("n:")) { msg(key, "Hi, it's " + (G.ag.manager || G.ag.name) + " from " + G.ag.name + ".", { me: true }); msg(key, say2(key.slice(2), "hello"), { t: now() + 3 }); }
  else { const f = G.f[+key.slice(2)]; msg(key, `Hi ${last(f.name)}, ${G.ag.manager || "it's"} from ${G.ag.name}. Wanted to say hello.`, { me: true }); msg(key, f.st === "free" ? "Hey! Always good to hear from a manager 👀" : pk(["Hey, appreciate the message 👊", "What's up.", "Respect. Good to connect."]), { t: now() + 4 }); }
  thread(key).unread = 0;
  return "";
}
export function remove(key) {
  if (key.startsWith("f:") && G.f[+key.slice(2)].st === "mine") return "Your own fighters stay in your contacts.";
  delete P().cx[key];
  rel(key, -12);
  P().cd["gone" + key] = G.wk;
  if (key.startsWith("n:")) msg(key, say2(key.slice(2), "removed"), { t: now() + 5 });
  thread(key).unread = 0;
  return "Removed from contacts.";
}
// Everyone you know, for the Contacts list.
export function contacts() {
  const ph = P(), out = mine().map((f) => "f:" + f.id);
  Object.keys(ph.cx).forEach((k) => { if (!out.includes(k)) out.push(k); });
  return out;
}
// People you could meet: everyone in the directory who isn't a contact yet, with what it takes.
export function directory() {
  return Object.entries(PEOPLE).filter(([id]) => !isContact("n:" + id)).map(([id, p]) => {
    const key = "n:" + id, r = reach(key);
    return { key, ok: r.ok, why: r.ok ? "Will take your call" : r.why };
  }).sort((a, b) => b.ok - a.ok);
}
// Name, role and how to draw anyone you can chat with.
export function person(key) {
  if (key.startsWith("f:")) { const f = G.f[+key.slice(2)]; return { name: f.name, role: f.st === "mine" ? "Your fighter" : f.st === "free" ? "Free agent" : f.retired ? "Retired" : `${AGENCIES[f.agency]?.short || ""} fighter`, f }; }
  const p = PEOPLE[key.slice(2)]; return { name: p.name, role: p.role + ", " + p.org, p, id: key.slice(2) };
}

// ---------- Offers ----------
const TITLES = { promoter: "Fight offer", card: "Main card offer", rivalry: "Rivalry fight", media: "Podcast", interview: "Interview request", commercial: "Commercial", gym: "Gym partnership", camp: "Training camp", rehab: "Rehab", request: "Fighter wants to sign", sponsor: "Sponsorship", bid: "Transfer bid", sale: "Transfer offer" };
export const BIG = new Set(["promoter", "card", "rivalry", "bid", "sponsor", "sale"]);
function deliver(id, kind, c, extra, t) {
  const ph = P(), key = "n:" + id;
  meet(id, t);
  const text = fill(line(PITCH[kind], "p" + kind), { ...c, n: c.n });
  const d = { id: ph.id++, kind, npc: id, title: TITLES[kind], text, exp: G.wk + 2, state: "open", wk: G.wk, ...extra };
  ph.deals.unshift(d); ph.deals.length = Math.min(ph.deals.length, 40);
  msg(key, text, { kind: "deal", deal: d.id, t: (t ?? now()) + 1 });
  notify(BIG.has(kind) ? "crit" : "imp", "connect", d.title, `${PEOPLE[id].name}: ${text}`, "deal:" + d.id, "offer");
  return d;
}
const near = (f, gap = 9) => pk(ranks(f.wc).filter((o) => o.st !== "mine" && o.inj <= 0 && !o.retired && !G.bk.some((b) => b.oid === o.id || b.fid === o.id) && Math.abs(ovr(o) - ovr(f)) < gap));
const freeMine = () => mine().filter((f) => f.inj <= 0 && !G.bk.some((b) => b.fid === f.id));
// Build one offer of a kind from a person. f = the fighter it's about (optional). Returns the deal or null.
export function makeDeal(kind, f, id, t) {
  const r = (k) => rel("n:" + k) / 100, m = mine();
  f ||= pk(kind === "rehab" ? m.filter((x) => x.inj >= 2) : kind === "promoter" || kind === "card" ? freeMine() : m.filter((x) => x.inj <= 0));
  switch (kind) {
    case "promoter": case "card": {
      if (!f) return null;
      const o = near(f, kind === "card" ? 7 : 10); if (!o) return null;
      id ||= kind === "card" ? (isContact("n:jules") ? "jules" : "dana") : "promo";
      const purse = round100(purseFor(o) * (kind === "card" ? 1.55 : 1.2) * (0.9 + r(id) * 0.3));
      return deliver(id, kind, { f, o, amt: money(purse), wk: G.wk + 2 }, { fid: f.id, oid: o.id, purse, fwk: G.wk + 2, hype: kind === "card" ? 3 : 0 }, t);
    }
    case "media": { if (!f) return null; const pay = round100((1500 + f.pop * 80) * (0.9 + r("media") * 0.3)); return deliver("media", "media", { f, amt: money(pay) }, { fid: f.id, pay }, t); }
    case "interview": { if (!f) return null; id ||= pk(["kate", "ben", "mia", "raj"].filter((x) => isContact("n:" + x))) || "kate"; return deliver(id, "interview", { f }, { fid: f.id, pay: 0 }, t); }
    case "commercial": { if (!f) return null; id ||= pk(Object.values(BRAND_REP)); const pay = round100(4000 + f.pop * 200); return deliver(id, "commercial", { f, amt: money(pay) }, { fid: f.id, pay }, t); }
    case "gym": { const cost = round100(8000 + G.ro.length * 2500); return deliver("gym", "gym", { amt: money(cost) }, { cost }, t); }
    case "camp": {
      if (!f) return null; id ||= pk(["gym", "eddie", "paulo", "nong"].filter((x) => isContact("n:" + x))) || "gym";
      const k = ATTR_KEYS.slice().sort((a, b) => f.at[a] - f.at[b])[0], cost = round100((3000 + ovr(f) * 60) * (1.1 - r(id) * 0.2));
      return deliver(id, "camp", { f, amt: money(cost), skill: ATTR_NAMES[ATTR_KEYS.indexOf(k)].toLowerCase() }, { fid: f.id, cost, skill: k }, t);
    }
    case "rehab": { if (!f || f.inj < 2) return null; const cost = round100(2500 + f.inj * 600); return deliver("doc", "rehab", { f, amt: money(cost) }, { fid: f.id, cost }, t); }
    case "request": {
      const p = G.f.filter((x) => x.st === "free" && !x.retired && !x.real).sort((a, b) => (b.pot || 0) - (a.pot || 0))[ri(0, 5)];
      if (!p) return null;
      const cost = round100(askOf(p) * (0.6 - r("scout") * 0.1));
      return deliver("scout", "request", { f: p, amt: money(cost) }, { fid: p.id, cost }, t);
    }
    case "sale": {
      const ag = id ? PEOPLE[id].ag : ri(0, AGENCIES.length - 1); id ||= AGENT_OF[ag];
      const avg = m.length ? m.reduce((s, x) => s + ovr(x), 0) / m.length : 55;
      const p = pk(G.f.filter((x) => x.st === "other" && x.agency === ag && !x.retired && Math.abs(ovr(x) - avg) < 8));
      if (!p) return null;
      return deliver(id, "sale", { f: p, amt: money(round100(askOf(p) * 1.15)) }, { fid: p.id }, t);
    }
    case "buyout": case "bid": {
      f ||= pk(m.filter((x) => canSell(x))); if (!f) return null;
      const ag = id ? PEOPLE[id].ag : ri(0, AGENCIES.length - 1);
      G.bids.push({ id: P().id++, fid: f.id, ag, amount: round100(askOf(f) * (1.05 + R() * 0.3)), exp: G.wk + 2, unsolicited: 1 });
      scan(t); return P().deals[0];
    }
  }
  return null;
}
// A rivalry fight, offered by the matchmaker when the heat is high.
export function rivalryDeal(f, o, heat, t) {
  if (G.bk.some((b) => b.fid === f.id || b.oid === o.id || b.fid === o.id) || f.inj > 0 || o.inj > 0 || o.retired) return null;
  const purse = round100(purseFor(o) * (1.25 + heat / 120));
  return deliver(isContact("n:dana") ? "dana" : "promo", "rivalry", { f, o, amt: money(purse), wk: G.wk + 2 }, { fid: f.id, oid: o.id, purse, fwk: G.wk + 2, hype: Math.round(heat / 12) }, t);
}
// Sponsor offers and transfer bids made elsewhere in the game arrive as offer cards from the right person.
export function scan(t) {
  const ph = P();
  for (const o of G.spons) if (!ph.wrapped["s" + o.id]) { ph.wrapped["s" + o.id] = 1; wrap({ s: o.id }, t); }
  for (const b of G.bids) if (!ph.wrapped["b" + b.id]) { ph.wrapped["b" + b.id] = 1; wrap({ b: b.id }, t); }
}
export function wrap(it, t) {
  if (it.s != null) {
    const o = G.spons.find((x) => x.id === it.s); if (!o) return;
    const f = G.f[o.fid], id = BRAND_REP[o.brand] || "b_red";
    deliver(id, "sponsor", { f, brand: o.brand, amt: money(o.weekly), wks: o.weeks }, { fid: f.id, sid: o.id, exp: o.exp, weekly: o.weekly, weeks: o.weeks, brand: o.brand }, t);
  } else {
    const b = G.bids.find((x) => x.id === it.b); if (!b) return;
    const f = G.f[b.fid];
    deliver(AGENT_OF[b.ag], "bid", { f, amt: money(b.amount) }, { fid: f.id, bid: b.id, exp: b.exp, pay: b.amount }, t);
  }
}
// Offers made elsewhere can be settled elsewhere (Office, Sell desk). Keep the cards honest.
export function live(d) {
  if (d.state !== "open") return d.state;
  if (d.sid != null && !G.spons.some((o) => o.id === d.sid)) d.state = "gone";
  if (d.bid != null) { const b = G.bids.find((x) => x.id === d.bid); if (!b) d.state = "gone"; else d.pay = b.amount; }
  if (d.fid != null && ["media", "commercial", "camp", "rehab", "promoter", "card", "rivalry", "sponsor", "interview"].includes(d.kind) && G.f[d.fid].st !== "mine") d.state = "gone";
  return d.state;
}
export const openDeals = () => P().deals.filter((d) => live(d) === "open");
// Accept / decline / negotiate. Returns a result line, or "neg:<fid>" to open the signing screen.
export function dealAct(id, act) {
  const d = P().deals.find((x) => x.id === id);
  if (!d || live(d) !== "open") return "That offer is gone.";
  const f = G.f[d.fid], key = "n:" + d.npc, b = d.bid != null && G.bids.find((x) => x.id === d.bid), so = d.sid != null && G.spons.find((x) => x.id === d.sid);
  if (act === "no") {
    d.state = "declined"; rel(key, -3);
    if (b) rejectBid(b); if (so) declineSponsor(so);
    msg(key, "No thanks, not this time.", { me: true }); msg(key, say2(d.npc, "declined"), { t: now() + 2 }); thread(key).unread = 0;
    return "Declined.";
  }
  if (act === "counter") {
    if (d.countered) return "They already gave their best offer.";
    d.countered = 1; rel(key, -1);
    msg(key, "Can you do better?", { me: true });
    let res;
    if (b) { const r = bidCounter(b, round100(b.amount * 1.15)); d.pay = b.amount; res = r === "walked" ? ((d.state = "walked"), "They walked away.") : r === "accepted" ? "They agreed to 15% more. Accept to close it." : "They came up a little."; }
    else {
      const r = R() + rel(key) / 400;
      if (r < 0.2) { d.state = "walked"; res = "They walked away."; }
      else if (r < 0.7) { if (d.pay) d.pay = round100(d.pay * 1.15); if (d.purse) d.purse = round100(d.purse * 1.15); if (d.cost) d.cost = round100(d.cost * 0.88); if (so) { so.weekly = round100(so.weekly * 1.12); d.weekly = so.weekly; } res = "They improved the offer."; }
      else res = "They won't move. Take it or leave it.";
    }
    msg(key, { "They walked away.": "Then we're done here.", "They won't move. Take it or leave it.": "That's the offer. Take it or leave it.", "They improved the offer.": "Fine. I can go a bit higher. Updated it.", "They came up a little.": "We can come up a little. That's it.", "They agreed to 15% more. Accept to close it.": "OK. 15% more. Final." }[res] || "Let me think.", { t: now() + 2 }); thread(key).unread = 0;
    return res;
  }
  if ((d.cost || 0) > G.cash) return "Not enough cash.";
  d.state = "done"; rel(key, 5);
  const done = (r) => { msg(key, "Deal. 🤝", { me: true }); msg(key, say2(d.npc, "thanks"), { t: now() + 2 }); thread(key).unread = 0; return r; };
  switch (d.kind) {
    case "media": earn(d.pay, "inc"); f.pop = Math.min(100, f.pop + 3); f.en = Math.max(10, f.en - 15); PU.mediaPost(d.npc, f); return done(`Paid ${money(d.pay)}. ${last(f.name)} gains fans.`);
    case "interview": f.pop = Math.min(100, f.pop + ri(2, 4)); f.en = Math.max(10, f.en - 5); rel(key, 4); PU.mediaPost(d.npc, f); return done(`${last(f.name)} did the interview. More fans, and ${PEOPLE[d.npc].name} owes you one.`);
    case "commercial": earn(d.pay, "spons"); f.pop = Math.min(100, f.pop + 2); f.en = Math.max(10, f.en - 10); return done(`Paid ${money(d.pay)}.`);
    case "gym": spend(d.cost); mine().forEach((x) => { const k = pk(Object.keys(x.at)); x.at[k] = Math.min(96, x.at[k] + 1); x.prep = Math.min(100, x.prep + 10); }); return done("Your fighters train at Northside: +1 skill each.");
    case "camp": spend(d.cost); f.at[d.skill] = Math.min(96, f.at[d.skill] + 2); f.prep = Math.min(100, f.prep + 15); f.en = Math.max(10, f.en - 10); return done(`${last(f.name)} sharpened up: +2 ${ATTR_NAMES[ATTR_KEYS.indexOf(d.skill)].toLowerCase()}.`);
    case "rehab": spend(d.cost); f.inj = Math.max(0, f.inj - 2); return done(`${last(f.name)} is back 2 weeks sooner.`);
    case "request": {
      if (G.ro.length >= ROSTER_MAX) { d.state = "open"; return "Roster full."; }
      spend(d.cost); f.st = "mine"; f.agency = null; f.ct = { pct: 20, wks: 104, signed: G.wk }; G.ro.push(f.id); G.rep = cl(G.rep + 1, 0, 100);
      f.tl.push({ w: G.wk, t: `Signed with ${G.ag.name}` }); say(`${f.name} signed with you.`, "good"); PU.news("signing", f); bumpRanks();
      return done(`${f.name} signed.`);
    }
    case "promoter": case "card": case "rivalry": {
      if (G.bk.some((x) => x.fid === f.id || x.oid === d.oid || x.fid === d.oid) || f.inj > 0) { d.state = "open"; return `${last(f.name)} isn't free.`; }
      G.bk.push({ fid: f.id, oid: d.oid, purse: d.purse, bonus: d.purse, wk: d.fwk, exp: d.fwk, lab: TITLES[d.kind], hype: d.hype || 0 });
      say(`${f.name} booked vs ${G.f[d.oid].name} for week ${d.fwk}.`, "good");
      return done("Fight booked.");
    }
    case "sponsor": acceptSponsor(so); return done(`${f.name} signed with ${d.brand}.`);
    case "bid": sell(b); return done(`Sold ${f.name} for ${money(b.amount)}.`);
    case "sale": d.state = "open"; return "neg:" + f.id;
  }
  return done("Done.");
}

// ---------- Asking people for things ----------
export const asksFor = (key) => {
  if (key.startsWith("n:")) return ASKS[PEOPLE[key.slice(2)].kind] || [];
  const f = G.f[+key.slice(2)];
  if (f.st === "mine") return null; // own fighters use the topic list in phone-content
  const out = [["respect", "Show respect"]];
  if (mine().some((x) => x.wc === f.wc)) out.push(["trash", "Talk trash"]);
  if (f.st === "free") out.push(["join", "Want to join us?"]);
  return out;
};
export const needsFighter = (topic) => ["fight", "card", "story", "camp", "rehab", "pitch", "shop"].includes(topic);
// Fighters a topic can be about.
export function askable(topic) {
  const m = mine();
  if (topic === "rehab") return m.filter((f) => f.inj >= 2);
  if (topic === "fight" || topic === "card") return m.filter((f) => f.inj <= 0 && !G.bk.some((b) => b.fid === f.id));
  if (topic === "shop") return m.filter((f) => canSell(f));
  return m;
}
// You ask someone for something. Returns a result line; "neg:<fid>" opens the signing screen.
export function ask(key, topic, fid) {
  const ph = P(), f = fid != null ? G.f[fid] : null, label = (asksFor(key) || []).find((x) => x[0] === topic)?.[1] || topic;
  msg(key, f ? `${label.replace(/one of mine|one of my fighters/, last(f.name)).replace("an injured fighter", last(f.name))}` : label, { me: true });
  thread(key).unread = 0;
  if (key.startsWith("f:")) return askFighter(key, topic);
  const id = key.slice(2), p = PEOPLE[id], cd = "ask" + topic + key;
  if (ph.cd[cd] === G.wk) { msg(key, say2(id, "soon"), { t: now() + 2 }); thread(key).unread = 0; return ""; }
  ph.cd[cd] = G.wk;
  if (topic === "catch") { rel(key, ph.cd["catch" + key] === G.wk ? 0 : 2); ph.cd["catch" + key] = G.wk; msg(key, say2(id, "catch"), { t: now() + 2 }); thread(key).unread = 0; return ""; }
  const chance = 0.3 + rel(key) / 130;
  const yes = R() < chance, at = thread(key).msgs.length;
  let d = null;
  if (yes) {
    msg(key, say2(id, "yes"), { t: now() + 2 });
    const kind = { scout: "request", fight: "promoter", card: "card", camp: "camp", rehab: "rehab", buy: "sale", shop: "bid" }[topic];
    if (kind) d = makeDeal(kind, f, id, now() + 3);
    else if (topic === "story") d = makeDeal(p.kind === "media" ? "media" : "interview", f, id, now() + 3);
    else if (topic === "pitch") { const o = sponsorOffer(f, p.brand); if (o) { ph.wrapped["s" + o.id] = 1; wrap({ s: o.id }, now() + 3); d = 1; } }
  }
  if (!d) { thread(key).msgs.length = at; msg(key, say2(id, "no"), { t: now() + 2 }); }
  thread(key).unread = 0;
  return d ? "New offer in the chat." : "";
}
function askFighter(key, topic) {
  const f = G.f[+key.slice(2)], ph = P();
  if (ph.cd["fa" + topic + f.id] === G.wk) { msg(key, "We talked already 👍", { t: now() + 2 }); return ""; }
  ph.cd["fa" + topic + f.id] = G.wk;
  if (topic === "respect") { rel(key, 4); msg(key, pk(["Appreciate that 🙏", "Respect back. Means a lot.", "Thanks man. You run a good team."]), { t: now() + 3 }); return ""; }
  if (topic === "join") { msg(key, pk(["I'm listening. Make me an offer.", "Depends on the numbers 👀", "Could be interested. Talk to me."]), { t: now() + 3 }); return "neg:" + f.id; }
  if (topic === "trash") {
    const mineIn = mine().filter((x) => x.wc === f.wc).sort((a, b) => ovr(b) - ovr(a))[0];
    rel(key, -8); PU.heat(mineIn.id, f.id, 12);
    msg(key, fill(pk(byP(f)), { f: mineIn, o: f }), { t: now() + 3 });
    return `${last(mineIn.name)} vs ${last(f.name)}: the rivalry heats up.`;
  }
  return "";
}
const byP = (f) => ({ Hotheaded: ["Tell {fl} I'm coming for him. 😡", "You and {fl} are both done."], Professional: ["Let the fight do the talking.", "Not interested in noise."] }[f.pers] || ["Lol. Tell {fl} to sign then.", "Your guy {fl}? Please.", "Talk is cheap. Book it."]);

// Replies in a chat with a person (introductions, controversy questions).
export function replyNpc(key, m, i) {
  const id = key.slice(2);
  if (m.kind === "intro") {
    const who = m.x;
    if (i === 0) { msg(key, "Yes please, that would be great.", { me: true }); P().intro[who] = 1; rel(key, 2); msg(key, `Done. ${PEOPLE[who].name} will be in touch.`, { t: now() + 3 }); meet(who, now() + 30); thread(key).unread = 0; return `${PEOPLE[who].name} added to your contacts.`; }
    msg(key, "Not right now, thanks.", { me: true }); msg(key, say2(id, "declined"), { t: now() + 2 }); thread(key).unread = 0; return "";
  }
  if (m.kind === "contro") return PU.answerContro(m.x, i, key);
  return "";
}

// ---------- The week ----------
// Who notices you this week, introductions, and people getting in touch with something to offer.
export function week() {
  const ph = P(), m = mine(), cond = {
    start: true, wk2: G.wk >= 2, ranked: m.some((f) => rank(f) > 0 && rank(f) <= 15), rep25: G.rep >= 25, champ: m.some((f) => rank(f) === 0),
    win1: G.hist.w >= 1, wins3: G.hist.w >= 3, ko: ph.flags.ko, roster4: G.ro.length >= 4, loss: ph.flags.loss, inj: m.some((f) => f.inj > 0),
  };
  for (const [id, p] of Object.entries(PEOPLE)) if (p.meet && cond[p.meet] && !isContact("n:" + id) && !ph.cd["gone" + "n:" + id] && !ph.cd["met" + id]) { ph.cd["met" + id] = G.wk; schedule({ g: "npc", id, k: "meet" }, 0, 3); }
  // Introductions: a close contact offers to connect you with someone hard to reach.
  if (R() < 0.35) {
    const opts = Object.entries(PEOPLE).filter(([id, p]) => p.tier === 2 && !isContact("n:" + id) && !ph.intro[id]).flatMap(([id, p]) => p.by.filter((b) => isContact("n:" + b) && rel("n:" + b) >= 58).map((b) => [b, id]));
    const o = pk(opts); if (o && cdOk("intro" + o[1], 6)) { ph.cd["intro" + o[1]] = G.wk; schedule({ g: "npc", id: o[0], k: "intro", who: o[1] }, 1, 5); }
  }
  // People with something for you. At most three a week, fewer when offers are already waiting.
  let n = Math.max(0, 3 - openDeals().length);
  const people = Object.keys(ph.cx).filter((k) => k.startsWith("n:")).map((k) => k.slice(2)).sort(() => R() - 0.5);
  for (const id of people) {
    if (n <= 0) break;
    const k = want(id);
    if (k && R() < 0.22 + rel("n:" + id) / 300) { schedule({ g: "npc", id, k }, 0, 6); n--; }
  }
  // Agencies sometimes shop a fighter to you.
  if (G.wk > 6 && R() < 0.06) { const id = AGENT_OF[ri(0, AGENCIES.length - 1)]; if (isContact("n:" + id)) schedule({ g: "npc", id, k: "sale" }, 1, 5); }
  scan(); for (const k of Object.keys(ph.wrapped)) if (!G.spons.some((o) => "s" + o.id === k) && !G.bids.some((b) => "b" + b.id === k) && Object.keys(ph.wrapped).length > 200) delete ph.wrapped[k];
}
// What this person would bring you right now, given how your fighters are doing.
function want(id) {
  const p = PEOPLE[id], m = mine(), res = P().res;
  switch (p.kind) {
    case "scout": return G.ro.length < ROSTER_MAX ? "request" : null;
    case "matchmaker": return freeMine().some((f) => G.wk - (f.lastFight ?? 0) >= 3) ? "promoter" : null;
    case "promoter": return freeMine().some((f) => f.pop >= 35 || (rank(f) >= 0 && rank(f) <= 15)) ? "card" : null;
    case "journalist": return G.bk.length && m.length ? "interview" : null;
    case "media": return m.some((f) => res[f.id]?.won && G.wk - res[f.id].wk <= 2) ? "media" : null;
    case "coach": return m.some((f) => res[f.id] && !res[f.id].won && G.wk - res[f.id].wk <= 3) ? "camp" : R() < 0.3 ? (id === "gym" ? "gym" : "camp") : null;
    case "medic": return m.some((f) => f.inj >= 2) ? "rehab" : null;
    case "brand": return m.some((f) => f.pop >= 30) ? "commercial" : null;
  }
  return null;
}
// A queued message from a person arrives.
export function checkin(id, t, it) {
  const key = "n:" + id;
  if (it.k === "meet") return meet(id, t);
  if (it.k === "rivalry") return rivalryDeal(G.f[it.fid], G.f[it.oid], it.heat, t);
  if (!isContact(key)) return;
  if (it.k === "intro") { const p = PEOPLE[it.who]; msg(key, say2(id, "intro", { who: `${p.name} (${p.role}, ${p.org})` }), { t, kind: "intro", opts: ["Yes, introduce us", "Not now"], x: it.who }); notify("imp", "connect", PEOPLE[id].name, "Wants to introduce you to " + p.name, key, "msg"); return; }
  if (it.k === "say") { msg(key, say2(id, it.sit, { f: G.f[it.fid], o: G.f[it.oid] }), { t }); notify("ord", "connect", PEOPLE[id].name, "New message", key, "msg"); return; }
  const f = it.fid != null ? G.f[it.fid] : null;
  makeDeal(it.k, f && f.st === "mine" ? f : null, id, t);
}
// After your fighter's fight: a couple of people you know get in touch.
export function onFight(me, op, r) {
  const ppl = Object.keys(P().cx).filter((k) => k.startsWith("n:") && rel(k) >= 45).map((k) => k.slice(2)).sort(() => R() - 0.5).slice(0, r.won ? 2 : 1);
  ppl.forEach((id) => soon({ g: "npc", id, k: "say", sit: r.won ? "congrats" : "sorry", fid: me.id, oid: op.id }, 30, 900));
}
