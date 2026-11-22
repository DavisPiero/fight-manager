// PULSE CONNECT screens: chats, offers, contacts, a chat, a contact's profile and "add contact".
import { G, rank, ovr } from "../state.js";
import { esc, last } from "../util.js";
import { UI } from "./uistate.js";
import { AGENCIES, DIVISIONS } from "../data/constants.js";
import { TOPICS } from "../data/phone-content.js";
import { PEOPLE } from "../data/people.js";
import { P, now, money, moodWord } from "../sim/phone.js";
import * as CN from "../sim/connect.js";
import { ic, clock, ago, dayLabel, face, backBar } from "./phone.js";

const who = (key) => { const p = CN.person(key); return { ...p, ini: p.p ? p.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("") : "", col: p.p?.col }; };
const relBar = (key) => { const r = CN.rel(key); return `<span class="cn-rel r${Math.min(4, Math.floor(r / 20))}" title="Relationship ${Math.round(r)}/100"><i style="width:${r}%"></i></span><small>${key.startsWith("f:") && G.f[+key.slice(2)].st === "mine" ? moodWord(r) : CN.relWord(r)}</small>`; };
const KIND = { matchmaker: "Matchmakers & promoters", promoter: "Matchmakers & promoters", journalist: "Media", media: "Media", coach: "Coaches & medical", medic: "Coaches & medical", brand: "Brands", agent: "Agencies", scout: "Scouts" };

// ---------- Offer card ----------
const fact = (d) => {
  const f = G.f[d.fid], o = d.oid != null && G.f[d.oid];
  if (o) return `<div class="of-vs"><span>${face({ f }, 34)}<b>${esc(last(f.name))}</b></span><em>vs</em><span><b>${esc(last(o.name))}</b>${face({ f: o }, 34)}</span></div><div class="of-n"><span><small>Purse</small><b>${money(d.purse)}</b></span><span><small>Fight week</small><b>${d.fwk}</b></span><span><small>Their overall</small><b>${ovr(o)}</b></span></div>`;
  if (d.kind === "sponsor") return `<div class="of-n"><span><small>${esc(last(f.name))} gets</small><b>${money(d.weekly)}/wk</b></span><span><small>Length</small><b>${d.weeks} wks</b></span><span><small>Your cut</small><b>${f.ct?.pct ?? 20}%</b></span></div>`;
  if (d.kind === "bid") return `<div class="of-n"><span><small>For</small><b>${esc(last(f.name))}</b></span><span><small>Offer</small><b>${money(d.pay)}</b></span><span><small>From</small><b>${esc(AGENCIES[PEOPLE[d.npc].ag].short)}</b></span></div>`;
  if (d.kind === "sale") return `<div class="of-n"><span>${face({ f }, 34)}</span><span><small>${esc(f.name)}</small><b>${ovr(f)} OVR · ${DIVISIONS[f.wc]}</b></span></div>`;
  const amt = d.pay ? ["You get", money(d.pay)] : d.cost ? ["Cost", money(d.cost)] : null;
  return amt ? `<div class="of-n">${f ? `<span><small>Fighter</small><b>${esc(last(f.name))}</b></span>` : ""}<span><small>${amt[0]}</small><b>${amt[1]}</b></span></div>` : "";
};
export function offerCard(d, inChat) {
  const st = CN.live(d), open = st === "open", soonx = open && d.exp <= G.wk + 1;
  return `<div class="of ${open ? "open" : "closed"} ${CN.BIG.has(d.kind) ? "big" : ""}"><div class="of-h"><span class="of-k">${esc(d.title)}</span><small class="${soonx ? "bad" : ""}">${open ? `Answer by week ${d.exp}` : st === "done" ? "Accepted" : st === "gone" ? "No longer available" : st[0].toUpperCase() + st.slice(1)}</small></div>
    ${inChat ? "" : `<button class="of-from" data-a="pthread" data-i="n:${d.npc}">${face(who("n:" + d.npc), 22)}<span>${esc(PEOPLE[d.npc].name)}</span></button>`}
    ${fact(d)}${inChat ? "" : `<p>${esc(d.text)}</p>`}
    ${open ? `<div class="of-a"><button class="main" data-a="pdeal" data-i="${d.id}" data-x="yes">${d.kind === "sale" ? "Negotiate" : "Accept"}</button>${d.countered || d.kind === "sale" || d.kind === "interview" ? "" : `<button data-a="pdeal" data-i="${d.id}" data-x="counter">Ask for more</button>`}<button data-a="pdeal" data-i="${d.id}" data-x="no">Decline</button></div>` : ""}</div>`;
}

// ---------- Lists ----------
function chats() {
  const ph = P(), list = Object.entries(ph.threads).filter(([, t]) => t.msgs.length).sort((a, b) => b[1].last - a[1].last);
  return list.map(([k, t]) => {
    const w = who(k), m = t.msgs[t.msgs.length - 1], deal = m.deal != null && ph.deals.find((d) => d.id === m.deal);
    const prev = deal ? `<span class="tag">${esc(deal.title)}</span>${esc(deal.text)}` : (m.me ? '<span class="tk">✓✓</span> ' : "") + esc(m.text);
    const open = ph.deals.some((d) => d.npc === k.slice(2) && CN.live(d) === "open");
    return `<button class="cn-row" data-a="pthread" data-i="${k}">${face(w, 46)}<span class="t"><span class="tt"><b>${esc(w.name)}</b><span class="w ${t.unread ? "u" : ""}">${Math.floor(t.last / 1440) === Math.floor(now() / 1440) ? clock(t.last) : dayLabel(t.last)}</span></span><span class="tt"><small>${prev}</small>${t.unread ? `<i class="cn-dot">${t.unread}</i>` : open ? '<i class="cn-dot of">!</i>' : ""}</span></span></button>`;
  }).join("") || '<div class="ph-empty">No chats yet. Your fighters and the people you meet will message you here.</div>';
}
function offers() {
  const ph = P(), open = CN.openDeals().sort((a, b) => CN.BIG.has(b.kind) - CN.BIG.has(a.kind)), past = ph.deals.filter((d) => CN.live(d) !== "open").slice(0, 6);
  open.forEach((d) => (d.seen = 1));
  return (open.map((d) => offerCard(d)).join("") || '<div class="ph-empty">No open offers. Promoters, brands, coaches and agencies will reach out as your name grows.</div>') + (past.length ? `<div class="ph-sub">Earlier</div>${past.map((d) => offerCard(d)).join("")}` : "");
}
function contactsList() {
  const keys = CN.contacts(), groups = {};
  keys.forEach((k) => { const g = k.startsWith("f:") ? (G.f[+k.slice(2)].st === "mine" ? "Your fighters" : "Fighters") : KIND[PEOPLE[k.slice(2)].kind]; (groups[g] ||= []).push(k); });
  const order = ["Your fighters", "Matchmakers & promoters", "Media", "Brands", "Coaches & medical", "Agencies", "Scouts", "Fighters"];
  return `<button class="btn gold sm cn-addbtn" data-a="pdir">${ic("add")} Add contact</button><div class="ph-sub">${keys.length} contacts. Meet more by winning, signing fighters, doing deals and getting introduced.</div>`
    + order.filter((g) => groups[g]).map((g) => `<div class="cn-group"><small>${g}</small>${groups[g].map((k) => { const w = who(k); return `<button class="cn-row" data-a="pinfo" data-i="${k}">${face(w, 40)}<span class="t"><b>${esc(w.name)}</b><small>${esc(w.role)}</small></span><span class="cn-r">${relBar(k)}</span></button>`; }).join("")}</div>`).join("");
}
function directory() {
  return `<div class="ph-sub">People in the business. Some take your call, others want a reputation or an introduction first.</div>`
    + CN.directory().map((d) => { const w = who(d.key); return `<div class="cn-row ${d.ok ? "" : "lock"}">${face(w, 40)}<span class="t"><b>${esc(w.name)}</b><small>${esc(w.role)}</small><small class="why">${esc(d.why)}</small></span>${d.ok ? `<button class="btn sm" data-a="padd" data-i="${d.key}">Add</button>` : '<span class="lk">🔒</span>'}</div>`; }).join("");
}

// ---------- Chat ----------
function chat(key) {
  const ph = P(), t = ph.threads[key] || { msgs: [] }, w = who(key);
  let day = -1, html = "";
  const lastMe = t.msgs.map((m) => m.me).lastIndexOf(true);
  t.msgs.forEach((m, i) => {
    const d = Math.floor(m.t / 1440);
    if (d !== day) { day = d; html += `<div class="cn-day"><span>${dayLabel(m.t)}</span></div>`; }
    const deal = m.deal != null && ph.deals.find((x) => x.id === m.deal);
    const read = m.me && t.msgs.slice(i + 1).some((x) => !x.me);
    html += `<div class="bub ${m.me ? "me" : ""} ${deal ? "deal" : ""}">${deal ? `<span class="bt">${esc(m.text)}</span>${offerCard(deal, true)}` : esc(m.text)}<span class="bm">${clock(m.t)}${m.me ? ` <i class="${read || i < lastMe ? "rd" : ""}">✓✓</i>` : ""}</span></div>`;
  });
  const pend = [...t.msgs].reverse().find((m) => m.opts && !m.done);
  const f = key.startsWith("f:") && G.f[+key.slice(2)], own = f && f.st === "mine", contact = CN.isContact(key);
  let foot = "";
  if (pend) foot = `<div class="ph-replies"><small>Reply</small>${pend.opts.map((o, i) => `<button data-a="preply" data-i="${i}">${esc(o)}</button>`).join("")}</div>`;
  else if (UI.phone.pick) foot = `<div class="ph-replies ask"><small>About which fighter?</small>${CN.askable(UI.phone.pick).map((x) => `<button data-a="paskf" data-i="${x.id}">${esc(last(x.name))}</button>`).join("") || "<span class=\"ph-sub\">Nobody fits right now.</span>"}<button class="x" data-a="pcancel">Cancel</button></div>`;
  else if (!contact) foot = `<div class="ph-replies ask"><small>Not in your contacts</small><button data-a="pinfo" data-i="${key}">See profile</button></div>`;
  else { const topics = own ? TOPICS : CN.asksFor(key); foot = `<div class="ph-replies ask"><small>Message ${esc(w.name.replace("Dr. ", "").split(" ")[0])}</small>${topics.map(([k, q]) => `<button data-a="pask" data-i="${k}">${esc(q)}</button>`).join("")}</div>`; }
  return {
    bar: `<div class="ph-bar cn-bar"><button data-a="pback" aria-label="Back">${ic("back")}</button><button class="cn-who" data-a="pinfo" data-i="${key}">${face(w, 34)}<span><b>${esc(w.name)}</b><small>${esc(own ? moodWord(CN.rel(key)) + " · " + DIVISIONS[f.wc] : w.role)}</small></span></button></div>`,
    body: `<div class="ph-thread"><div class="ph-msgs" id="phmsgs">${html || '<div class="ph-empty">No messages yet. Say hello.</div>'}</div>${foot}</div>`,
  };
}
function info(key) {
  const w = who(key), f = w.f, own = f && f.st === "mine", contact = CN.isContact(key), r = CN.reach(key);
  const facts = f ? [["Record", `${f.w}-${f.l}`], ["Division", DIVISIONS[f.wc]], ["Rank", rank(f) === 0 ? "Champion" : rank(f) > 0 && rank(f) <= 15 ? "#" + rank(f) : "Unranked"], ["Personality", f.pers]] : [["Company", w.p.org], ["Role", w.p.role], ["Style", { warm: "Friendly", blunt: "Blunt", formal: "Formal", hype: "Loud", sly: "Sly" }[w.p.voice]]];
  const sec = [];
  if (!own) sec.push(contact ? `<button class="btn sm" data-a="prem" data-i="${key}">Remove contact</button>` : r.ok ? `<button class="btn sm" data-a="padd" data-i="${key}">Add contact</button>` : "");
  if (P().threads[key]?.msgs.length) sec.push(`<button class="btn sm" data-a="pdel" data-i="${key}">Delete chat</button>`);
  return {
    bar: backBar("Contact"),
    body: `<div class="cn-info">${face(w, 96)}<b>${esc(w.name)}</b><small>${esc(w.role)}</small>${w.p ? `<p>${esc(w.p.bio)}</p>` : ""}
      <div class="cn-relrow">${relBar(key)}</div>
      ${contact ? `<button class="btn gold" data-a="pthread" data-i="${key}">Message</button>` : !r.ok ? `<div class="ph-sub">${esc(r.why)}</div>` : ""}
      <dl>${facts.map(([a, b]) => `<dt>${a}</dt><dd>${esc(String(b))}</dd>`).join("")}</dl>
      <div class="cn-sec">${sec.join("")}</div>
      ${key.startsWith("f:") || PEOPLE[key.slice(2)]?.handle ? `<button class="ph-link" data-a="pprof" data-i="${key}">See on PULSE</button>` : ""}</div>`,
  };
}
export function connectScreen(v) {
  if (v.key) return chat(v.key);
  if (v.info) return info(v.info);
  if (v.dir) return { bar: backBar("Add contact"), body: directory() };
  const tab = v.tab || "chats", nOff = CN.openDeals().length, nMsg = Object.values(P().threads).reduce((s, t) => s + (t.unread || 0), 0);
  const bar = `<div class="cn-top"><b>CONNECT</b><small>by PULSE</small></div><div class="pu-tabs cn-tabs">${[["chats", "Chats", nMsg], ["offers", "Offers", nOff], ["contacts", "Contacts", 0]].map(([k, t, n]) => `<button class="${tab === k ? "on" : ""}" data-a="ptab" data-i="${k}">${t}${n ? `<i>${n}</i>` : ""}</button>`).join("")}</div>`;
  return { bar, body: tab === "offers" ? offers() : tab === "contacts" ? contactsList() : chats() };
}
