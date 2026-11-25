// The in-game smartphone: home screen with two apps (PULSE and PULSE CONNECT), settings, the shell
// around every screen, and pop-up banners. The apps themselves are in pulse.js and connect.js.
import { G } from "../state.js";
import { esc } from "../util.js";
import { avatar } from "./avatar.js";
import { UI } from "./uistate.js";
import { AGENCY_COLOURS } from "../data/constants.js";
import { P, now, unread, DAY } from "../sim/phone.js";
import { openDeals } from "../sim/connect.js";
import { pulseScreen } from "./pulse.js";
import { connectScreen } from "./connect.js";

export const I = {
  pulse: '<path d="M2 12h4l3-7 4 14 3-7h6"/>',
  connect: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  reply: '<path d="M4 5h16v11H9l-5 4z"/>', rt: '<path d="M7 7h10v6M17 17H7v-6"/><path d="M14 4l3 3-3 3M10 20l-3-3 3-3"/>',
  like: '<path d="M12 20s-8-5-8-11a4 4 0 018-1 4 4 0 018 1c0 6-8 11-8 11z"/>', views: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', play: '<path d="M8 5l11 7-11 7z"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  add: '<circle cx="10" cy="8" r="4"/><path d="M2 21c0-5 4-7 8-7s8 2 8 7M19 8v6M16 11h6"/>',
};
export const ic = (k) => `<svg viewBox="0 0 24 24">${I[k] || ""}</svg>`;
const APPS = [["pulse", "PULSE"], ["connect", "CONNECT"], ["settings", "Settings"]];
const NAMES = { pulse: "PULSE", connect: "PULSE CONNECT", settings: "Settings" };

// ---------- Time ----------
// In-game calendar: week 1 starts Monday 4 January 2027. t = minutes since then.
export const dateOf = (t) => new Date(2027, 0, 4 + Math.floor(t / DAY));
export const gameDate = (wk = G.wk) => dateOf((wk - 1) * 7 * DAY).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const clock = (t) => { const m = ((t % DAY) + DAY) % DAY; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
export const ago = (t) => { const d = now() - t; return d < 1 ? "now" : d < 60 ? d + "m" : d < DAY ? Math.floor(d / 60) + "h" : d < 7 * DAY ? Math.floor(d / DAY) + "d" : dateOf(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
export const dayLabel = (t) => { const d = Math.floor(now() / DAY) - Math.floor(t / DAY); return d <= 0 ? "Today" : d === 1 ? "Yesterday" : d < 7 ? dateOf(t).toLocaleDateString("en-GB", { weekday: "long" }) : dateOf(t).toLocaleDateString("en-GB", { day: "numeric", month: "long" }); };
export const fullTime = (t) => clock(t) + " · " + dateOf(t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const num = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1e4 ? Math.round(n / 1e3) + "K" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n));
// A face for anyone: headshot / silhouette for fighters, initials for everyone else.
export const face = (w, s = 40) => (w.f ? avatar(w.f, s, "round") : `<span class="ph-ini" style="--c:${w.col || "#444"};--s:${s}px">${esc(w.ini || (w.name || "?")[0])}</span>`);

// ---------- Badges ----------
const connectBadge = () => Object.values(P().threads).reduce((s, t) => s + (t.unread || 0), 0) + openDeals().filter((d) => !d.seen).length;
const pulseBadge = () => P().notes.filter((n) => !n.read && n.app === "pulse" && n.lvl !== "ord").length;
export function phoneBadge() {
  if (!G) return "";
  const n = P().notes.filter((x) => !x.read && x.lvl !== "ord").length, any = unread();
  return n ? `<i class="dotb">${n > 9 ? "9+" : n}</i>` : any ? '<i class="dotb dot"></i>' : "";
}

// ---------- Home ----------
function home() {
  const ph = P(), notes = ph.notes.filter((n) => !n.read).slice(0, 4);
  const b = { pulse: pulseBadge(), connect: connectBadge(), settings: 0 };
  const quiet = { pulse: !b.pulse && unread("pulse") > 0 };
  return `<div class="ph-home-in" style="--ag:${AGENCY_COLOURS[G.ag.col]}"><div class="ph-hello"><small>${gameDate()}</small><b>${esc(G.ag.name)}</b></div>
    <div class="ph-grid">${APPS.map(([k, n]) => `<button class="ph-app" data-a="papp" data-i="${k}"><span class="ph-icon ${k}">${ic(k)}${b[k] ? `<i>${b[k] > 9 ? "9+" : b[k]}</i>` : quiet[k] ? '<i class="q"></i>' : ""}</span><small>${n}</small></button>`).join("")}</div>
    ${notes.length ? `<div class="ph-recent"><small>Notifications</small>${notes.map(noteRow).join("")}${ph.notes.length ? '<button class="ph-link" data-a="pclear">Clear all</button>' : ""}</div>` : '<div class="ph-recent quiet"><small>All caught up</small></div>'}</div>`;
}
const noteRow = (n) => `<button class="ph-note ${n.lvl} ${n.read ? "read" : ""}" data-a="pnote" data-i="${n.id}"><span class="ph-icon sm ${n.app}">${ic(n.app)}</span><span class="t"><b>${esc(n.title)}</b><small>${esc(n.body).slice(0, 90)}</small></span><span class="w">${n.t != null ? ago(n.t) : ""}</span></button>`;
function settings() {
  const p = P().prefs, row = (k, t, s) => `<button class="ph-tog ${p[k] ? "on" : ""}" data-a="ppref" data-i="${k}"><span class="t"><b>${t}</b><small>${s}</small></span><span class="sw"></span></button>`;
  return `<div class="ph-sub">Critical alerts (expiring offers, injuries, fight offers, controversies) always pop up.</div>
    ${row("important", "Important pop-ups", "Messages and business offers")}${row("rumours", "Rumour pop-ups", "Rumours about your fighters")}${row("news", "News pop-ups", "Every headline about your agency")}${row("sound", "Phone sounds", "Different sound per urgency")}
    <div class="ph-sub">PULSE posts never pop up. Check the feed when you like.</div>`;
}

export function phoneHtml() {
  const s = UI.phone, v = s.v, app = v.app;
  let bar = "", body;
  if (app === "pulse") ({ bar, body } = pulseScreen(v));
  else if (app === "connect") ({ bar, body } = connectScreen(v));
  else if (app === "settings") { bar = backBar("Settings"); body = settings(); }
  else body = home();
  const t = now();
  return `<div class="ph-wrap" data-a="pclosebg"><div class="phone ${s.anim ? "in" : ""}" role="dialog" aria-label="Phone"><div class="ph-screen ${app}">
    <div class="ph-status"><b>${clock(t)}</b><span class="ph-island"></span><span class="ph-sig">${dateOf(t).toLocaleDateString("en-GB", { weekday: "short" })} <i></i><i></i><i></i><i></i> 5G</span></div>
    ${bar}<div class="ph-body ${app}${v.key ? " chat" : ""}" id="phbody">${body}</div>
    <button class="ph-homebar" data-a="phome" aria-label="Home"></button></div></div></div>`;
}
export const backBar = (title, sub = "", extra = "") => `<div class="ph-bar"><button data-a="pback" aria-label="Back">${ic("back")}</button><div class="ph-bt">${title}${sub ? `<small>${sub}</small>` : ""}</div>${extra}</div>`;

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
