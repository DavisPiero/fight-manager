// The in-game smartphone: home screen, apps, threads, notification centre and pop-up banners.
import { G, rankLabel, rank } from "../state.js";
import { esc, last } from "../util.js";
import { avatar, photoOf } from "./avatar.js";
import { UI } from "./uistate.js";
import { AGENCY_COLOURS } from "../data/constants.js";
import { TOPICS, NPCS } from "../data/phone-content.js";
import { P, contacts, thread, unread, mood, moodWord } from "../sim/phone.js";

const I = {
  messages: '<path d="M4 5h16v11H9l-5 4z"/>',
  contacts: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/>',
  deals: '<path d="M3 12l5-5 4 4 4-4 5 5-9 8z"/>',
  news: '<rect x="4" y="4" width="16" height="16"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  social: '<path d="M7 9a5 5 0 1110 0c0 4-5 4-5 8M12 21h.01"/>',
  rumours: '<path d="M3 12c3-5 15-5 18 0-3 5-15 5-18 0z"/><circle cx="12" cy="12" r="2.5"/>',
  alerts: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24">${I[k] || ""}</svg>`;
const APPS = [["messages", "Messages"], ["contacts", "Contacts"], ["deals", "Deals"], ["news", "News"], ["social", "Social"], ["rumours", "Rumours"], ["alerts", "Alerts"], ["settings", "Settings"]];
const NAMES = Object.fromEntries(APPS);
// In-game calendar: week 1 is Monday 4 January 2027.
export const gameDate = (wk = G.wk) => new Date(2027, 0, 4 + (wk - 1) * 7).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const clockNow = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const ago = (wk) => (wk >= G.wk ? "This week" : G.wk - wk === 1 ? "Last week" : `${G.wk - wk} wks ago`);

function badge(app) {
  if (app === "messages") return Object.values(P().threads).reduce((s, t) => s + (t.unread || 0), 0);
  if (app === "alerts") return P().notes.filter((n) => !n.read && n.lvl !== "ord").length;
  if (app === "deals") return P().deals.filter((d) => d.state === "open").length;
  // Background apps show a quiet dot, not a number, so they never nag.
  if (app === "social" || app === "contacts") return 0;
  if (app === "news" || app === "rumours") return P().notes.filter((n) => !n.read && n.app === app && n.lvl !== "ord").length;
  return unread(app);
}
export function phoneBadge() {
  if (!G) return "";
  const n = P().notes.filter((x) => !x.read && x.lvl !== "ord").length, any = unread();
  return n ? `<i class="dotb">${Math.min(n, 99)}</i>` : any ? '<i class="dotb dot"></i>' : "";
}
const who = (key) => {
  if (key.startsWith("f:")) { const f = G.f[+key.slice(2)]; return { name: f.name, av: avatar(f, 40, "round"), sub: f.st === "mine" ? `${moodWord(mood(f))} · ${rankLabel(rank(f))}` : "Former fighter", f }; }
  const n = NPCS[key.slice(4)]; return { name: n.name, av: `<span class="ph-ini" style="--c:${n.col}">${n.ini}</span>`, sub: n.role };
};
const sAv = (p) => { const f = p.fid != null ? G.f[p.fid] : null; return f && photoOf(f) ? avatar(f, 36, "round") : `<span class="ph-ini sm" style="--c:#333">${esc((p.who || "?")[0])}</span>`; };

// ---------- Apps ----------
function home() {
  const ph = P(), recent = Object.entries(ph.threads).sort((a, b) => b[1].last - a[1].last).slice(0, 4);
  const notes = ph.notes.filter((n) => !n.read).slice(0, 3);
  return `<div class="ph-home-in" style="--ag:${AGENCY_COLOURS[G.ag.col]}"><div class="ph-hello"><small>${gameDate()}</small><b>${esc(G.ag.name)}</b></div>
    <div class="ph-grid">${APPS.map(([k, n]) => { const b = badge(k); return `<button class="ph-app" data-a="papp" data-i="${k}"><span class="ph-icon ${k}">${ic(k)}${b ? `<i>${Math.min(b, 99)}</i>` : ""}</span><small>${n}</small></button>`; }).join("")}</div>
    ${notes.length ? `<div class="ph-recent"><small>Latest</small>${notes.map((n) => noteRow(n)).join("")}</div>` : '<div class="ph-recent quiet"><small>All caught up</small></div>'}
    ${recent.length ? `<div class="ph-dock">${recent.map(([k]) => `<button data-a="pthread" data-i="${k}" title="${esc(who(k).name)}">${who(k).av}</button>`).join("")}</div>` : ""}</div>`;
}
const noteRow = (n) => `<button class="ph-note ${n.lvl} ${n.read ? "read" : ""}" data-a="pnote" data-i="${n.id}"><span class="ph-icon sm ${n.app}">${ic(n.app)}</span><span class="t"><b>${esc(n.title)}</b><small>${esc(n.body).slice(0, 90)}</small></span><span class="w">${n.wk === G.wk ? "now" : "wk " + n.wk}</span></button>`;
function messages() {
  const ph = P(), list = Object.entries(ph.threads).sort((a, b) => b[1].last - a[1].last);
  return list.map(([k, t]) => { const w = who(k), m = t.msgs[t.msgs.length - 1]; return `<button class="ph-row" data-a="pthread" data-i="${k}">${w.av}<span class="t"><b>${esc(w.name)}</b><small>${m ? (m.me ? "You: " : "") + esc(m.text).slice(0, 60) : ""}</small></span>${t.unread ? `<i class="ph-dot">${t.unread}</i>` : `<span class="w">${ago(t.last)}</span>`}</button>`; }).join("")
    || '<div class="ph-empty">No messages yet. Your fighters and contacts will reach out.</div>';
}
function contactsApp() {
  const list = contacts();
  return `<div class="ph-sub">${list.length} contacts · meet more by signing fighters and doing business</div>` + list.map((c) => `<button class="ph-row" data-a="pthread" data-i="${c.key}">${who(c.key).av}<span class="t"><b>${esc(c.name)}</b><small>${esc(c.sub)}</small></span></button>`).join("");
}
function threadView(key) {
  const t = thread(key), w = who(key), pend = [...t.msgs].reverse().find((m) => m.opts && !m.done), canAsk = w.f && w.f.st === "mine";
  return `<div class="ph-thread"><div class="ph-msgs" id="phmsgs">${t.msgs.map((m) => `<div class="bub ${m.me ? "me" : ""}">${esc(m.text)}</div>`).join("") || '<div class="ph-empty">Say hello.</div>'}</div>
    ${pend ? `<div class="ph-replies"><small>Reply</small>${pend.opts.map((o, i) => `<button data-a="preply" data-i="${i}">${esc(o)}</button>`).join("")}</div>`
      : canAsk ? `<div class="ph-replies ask"><small>Message ${esc(last(w.name))}</small>${TOPICS.map(([k, q]) => `<button data-a="pask" data-i="${k}">${q}</button>`).join("")}</div>` : ""}</div>`;
}
function deals() {
  const ph = P(), open = ph.deals.filter((d) => d.state === "open"), past = ph.deals.filter((d) => d.state !== "open").slice(0, 6);
  const card = (d) => `<div class="ph-deal ${d.state}"><div class="row spread"><b>${esc(d.title)}</b><small class="${d.state === "open" && d.exp <= G.wk + 1 ? "bad" : ""}">${d.state === "open" ? `Answer by wk ${d.exp}` : d.state}</small></div>
    <small class="from">${d.npc ? esc(NPCS[d.npc].name) : "Rival agency"}</small><p>${esc(d.text)}</p>
    ${d.state === "open" ? `<div class="ph-acts"><button class="ok" data-a="pdeal" data-i="${d.id}" data-x="yes">Accept</button>${d.countered ? "" : `<button data-a="pdeal" data-i="${d.id}" data-x="counter">Counter</button>`}<button data-a="pdeal" data-i="${d.id}" data-x="no">Decline</button></div>` : ""}</div>`;
  return (open.map(card).join("") || '<div class="ph-empty">No open offers. Promoters, brands and gyms will call as your name grows.</div>') + (past.length ? `<div class="ph-sub">Earlier</div>${past.map(card).join("")}` : "");
}
function news() {
  return P().news.map((n) => `<div class="ph-news ${n.mine ? "mine" : ""}"><small>${ago(n.wk)}</small><b>${esc(n.h)}</b></div>`).join("") || '<div class="ph-empty">No news yet.</div>';
}
function social() {
  const f = UI.phone.filter, list = P().social.filter((p) => !f || (p.fid != null && G.f[p.fid]?.st === "mine"));
  return `<div class="ph-chips"><button class="${!f ? "on" : ""}" data-a="pfilter" data-i="">All</button><button class="${f ? "on" : ""}" data-a="pfilter" data-i="mine">My fighters</button></div>`
    + (list.map((p) => `<div class="ph-post">${sAv(p)}<div><b>${esc(p.who)}</b> <small>${esc(p.handle)} · ${ago(p.wk)}</small><p>${esc(p.text)}</p><small class="lk">♥ ${p.likes.toLocaleString("en-US")}</small></div></div>`).join("") || '<div class="ph-empty">Quiet timeline.</div>');
}
function rumours() {
  const lbl = { true: ["True", "good"], partly: ["Partly true", "warn"], false: ["False", "bad"] };
  return `<div class="ph-sub">Insider talk. Credibility is a guide, not a promise.</div>` + (P().rumours.map((r) => `<div class="ph-rum"><div class="row spread"><span class="cred c${r.cred}"><i></i><i></i><i></i> ${["Low", "Medium", "High"][r.cred]}</span><span class="pill ${r.out ? lbl[r.out][1] : "out"}">${r.out ? lbl[r.out][0] : "Unconfirmed"}</span></div>
    <p>${esc(r.txt)}</p><small>via ${esc(r.src)} · ${ago(r.wk)}</small></div>`).join("") || '<div class="ph-empty">No whispers yet.</div>');
}
function alerts() {
  const n = P().notes, grp = [["crit", "Critical"], ["imp", "Important"], ["ord", "Everything else"]];
  return `<div class="row spread ph-sub"><span>${n.length} notifications</span>${n.length ? '<button class="ph-link" data-a="pclear">Clear all</button>' : ""}</div>`
    + (grp.map(([l, t]) => { const L = n.filter((x) => x.lvl === l).slice(0, l === "ord" ? 12 : 30); return L.length ? `<div class="ph-group"><small>${t}</small>${L.map(noteRow).join("")}</div>` : ""; }).join("") || '<div class="ph-empty">Nothing here.</div>');
}
function settings() {
  const p = P().prefs, row = (k, t, s) => `<button class="ph-tog ${p[k] ? "on" : ""}" data-a="ppref" data-i="${k}"><span class="t"><b>${t}</b><small>${s}</small></span><span class="sw"></span></button>`;
  return `<div class="ph-sub">Critical alerts (expiring offers, injuries, fight offers) always pop up.</div>
    ${row("important", "Important pop-ups", "Messages and business offers")}${row("rumours", "Rumour pop-ups", "Rumours about your fighters")}${row("news", "News pop-ups", "Headlines about your agency")}${row("sound", "Phone sounds", "Different sound per urgency")}
    <div class="ph-sub">Social media never pops up. Check the app when you like.</div>`;
}

export function phoneHtml() {
  const s = UI.phone, key = s.key, app = s.app;
  let title = NAMES[app] || "", sub = "", body;
  if (key) { const w = who(key); title = w.name; sub = w.sub; body = threadView(key); }
  else body = ({ home, messages, contacts: contactsApp, deals, news, social, rumours, alerts, settings }[app] || home)();
  return `<div class="ph-wrap" data-a="pclosebg"><div class="phone ${s.anim ? "in" : ""}" role="dialog" aria-label="Phone"><div class="ph-screen">
    <div class="ph-status"><b>${clockNow()}</b><span class="ph-island"></span><span class="ph-sig"><i></i><i></i><i></i><i></i> 5G ▮</span></div>
    ${app === "home" && !key ? "" : `<div class="ph-bar"><button data-a="pback" aria-label="Back">${ic("back")}</button><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div></div>`}
    <div class="ph-body ${app}" id="phbody">${body}</div>
    <button class="ph-homebar" data-a="phome" aria-label="Home"></button></div></div></div>`;
}

// Smartphone-style banners. Critical ones stay longer. Clicking opens the phone there.
export function banners(list, sfx) {
  if (!list.length) return;
  let box = document.getElementById("ph-banners");
  if (!box) { box = document.createElement("div"); box.id = "ph-banners"; document.body.appendChild(box); }
  const crit = list.some((n) => n.lvl === "crit");
  if (P().prefs.sound) sfx(crit ? "alarm" : "ping2");
  list.sort((a, b) => (a.lvl === "crit" ? 0 : 1) - (b.lvl === "crit" ? 0 : 1)).forEach((n, i) => {
    const b = document.createElement("button");
    b.className = "ph-banner " + n.lvl; b.dataset.a = "pnote"; b.dataset.i = n.id;
    b.innerHTML = `<span class="ph-icon sm ${n.app}">${ic(n.app)}</span><span class="t"><small>${NAMES[n.app] || n.app}${n.lvl === "crit" ? " · urgent" : ""}</small><b>${esc(n.title)}</b><span>${esc(n.body).slice(0, 110)}</span></span>`;
    b.style.animationDelay = i * 0.12 + "s";
    box.appendChild(b);
    setTimeout(() => { b.classList.add("out"); setTimeout(() => b.remove(), 400); }, n.lvl === "crit" ? 9000 : 6000);
  });
}
