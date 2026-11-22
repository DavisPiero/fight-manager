import "./ui/styles.css";
import { G, setG, newGame, load, save, wipe, mine, say, SETTINGS, saveSettings } from "./state.js";
import { sleep, money } from "./util.js";
import { UI } from "./ui/uistate.js";
import * as V from "./ui/views.js";
import { vFight, updateLive } from "./ui/fightview.js";
import * as FV from "./ui/fightview.js";
import { toast, stamp, confetti } from "./ui/components.js";
import { drawTour, STEPS } from "./ui/tour.js";
import * as PH from "./ui/phone.js";
import * as PS from "./sim/phone.js";
import * as CN from "./sim/connect.js";
import * as PU from "./sim/pulse.js";
import { SND, saveSnd, sfx } from "./audio.js";
import { advance, offersFor, train, autoBook } from "./sim/world.js";
import { trySign, release, list, unlist, sell, rejectBid, counter, tryRenew, canSell } from "./sim/market.js";
import { acceptSponsor, declineSponsor, pitch } from "./sim/sponsors.js";
import { resolveEvent } from "./sim/events.js";
import { newFight, step, roundOver, endRound, startRound, finish, aiPlan, pendingMoment, resolveMoment, autoChoice } from "./sim/fight.js";

const app = document.getElementById("app");

// ---------- Render ----------
function render() {
  const v = UI.view;
  let h;
  if (v === "menu") h = V.vMenu();
  else if (v === "setup") h = V.vSetup();
  else if (G?.over) h = V.vGameOver();
  else if (v === "fight") h = vFight();
  else h = ({ home: V.vHome, fighters: V.vFighters, prof: V.vProfile, fights: V.vFights, gym: V.vGym, market: V.vMarket, rankings: V.vRankings, office: V.vOffice }[v] || V.vHome)();
  if (UI.modal && (v !== "fight" || UI.modal.kind === "settings")) h += modalHtml();
  else if (UI.phone.open && G && !["menu", "setup", "fight"].includes(v)) h += PH.phoneHtml();
  // Keep the phone's scroll position when the same phone screen is redrawn (likes, new posts arriving).
  const sig = UI.phone.open ? JSON.stringify(UI.phone.v) : "", pb = document.getElementById("phbody"), sc = pb && sig === UI.phone.sig ? pb.scrollTop : null;
  app.innerHTML = h;
  UI.phone.sig = sig;
  if (sc != null) { const nb = document.getElementById("phbody"); if (nb) nb.scrollTop = sc; }
  document.body.classList.toggle("phone-open", !!(UI.phone.open && G));
  UI.last = v;
  if (UI.modal?.kind === "neg" || UI.modal?.kind === "renew") V.negUpdate();
  if (UI.modal?.kind === "list") V.listUpdate();
  animateCash();
  requestAnimationFrame(drawTour);
}
function modalHtml() {
  const m = UI.modal, f = G?.f[m.fid];
  switch (m.kind) {
    case "neg": return V.mNegotiate(f);
    case "renew": return V.mRenew(f);
    case "list": return V.mList(f);
    case "counter": return V.mCounter(G.bids.find((b) => b.id === m.bid));
    case "release": return V.mConfirm(`Release ${f.name}?`, `He leaves for free and you lose 2 reputation. His remaining ${f.ct.wks} weeks are void.`, "dorelease", f.id, "Release him");
    case "abandon": return V.mConfirm("Delete this career?", `Slot ${G.slot} will be wiped. This can't be undone.`, "doabandon", 0, "Delete");
    case "delslot": return V.mConfirm(`Delete slot ${m.slot}?`, "This career will be wiped. This can't be undone.", "dodelslot", m.slot, "Delete");
    case "inbox": return V.mInbox();
    case "week": return V.mWeek(m.sum, m.d);
    case "settings": return V.mSettings();
    case "quick": return V.mQuick(f);
    case "more": return V.mMore(f);
    case "rep": return V.mRep();
    case "event": return V.mEvent();
    case "evres": return V.mEventResult(m.msg);
  }
  return "";
}
let lastCash = null;
function animateCash() {
  const e = document.getElementById("cash");
  if (!e || !G) return;
  if (lastCash !== null && lastCash !== G.cash) {
    const a = lastCash, b = G.cash, t0 = performance.now(), fmt = (n) => (Math.abs(n) >= 1e4 ? (n < 0 ? "-" : "") + "$" + Math.round(Math.abs(n) / 1e3) + "k" : money(n));
    (function s(t) { const k = Math.min(1, (t - t0) / 600); e.textContent = fmt(a + (b - a) * k); if (k < 1) requestAnimationFrame(s); })(t0);
  }
  lastCash = G.cash;
}
function go(v, extra) {
  if (v !== "prof" && v !== "fight") UI.back = v;
  UI.view = v;
  if (v === "market" && extra) UI.mk.tab = extra;
  if (v === "office" && extra) UI.office = extra;
  UI.modal = null;
  render();
  scrollTo(0, 0);
}
const commit = () => { save(); render(); };
const scrollMsgs = () => { const m = document.getElementById("phmsgs"); if (m) m.scrollTop = m.scrollHeight; };

// ---------- Week / fights ----------
function nextWeek() {
  if (UI.view === "fight" || G.over || UI.ffBusy) return;
  const before = G.log[0], cash0 = G.cash, wk0 = G.wk;
  const due = advance();
  save();
  fastForward(wk0, G.wk, due.length);
  if (G.over) { render(); return; }
  sfx("whoosh");
  const idx = G.log.indexOf(before);
  UI.pendingSum = G.log.slice(0, idx < 0 ? 8 : idx).slice(0, 10);
  UI.pendingDelta = G.cash - cash0;
  if (due.length) {
    UI.queue = due.slice(1);
    // Let the week fast-forward finish ("Fight night" tag) before cutting to the walk-out.
    if (UI.instant || matchMedia("(prefers-reduced-motion: reduce)").matches) { startFight(due[0]); return; }
    UI.ffBusy = true; UI.modal = null; render();
    return new Promise((done) => setTimeout(() => { UI.ffBusy = false; startFight(due[0]); done(); }, 950)); // the walk-out fades in over the banner
  }
  afterWeek();
}
// After fights: event first (if any), then the summary.
function afterWeek() {
  if (G.event) { UI.modal = { kind: "event" }; }
  else if (UI.pendingSum?.length) { UI.modal = { kind: "week", sum: UI.pendingSum, d: UI.pendingDelta || 0 }; UI.pendingSum = null; }
  else UI.modal = null;
  if (UI.view === "fight") UI.view = "home";
  render();
  if (!UI.modal) flushBanners();
}
// Phone pop-ups for anything new since the last time we showed them (critical / important only).
function flushBanners() {
  if (!G || UI.view === "fight") return;
  const ph = PS.P(), list = PS.popups(UI.noteMark ?? ph.id);
  UI.noteMark = ph.id;
  if (!UI.phone.open) PH.banners(list, sfx);
}
// The world keeps moving while you play: every few seconds something arrives (posts, messages, offers),
// spread across the in-game week. Paused on menus, fight night, pop-ups and hidden tabs. UI.still stops it (tests).
let nextDrop = Date.now() + 4000;
setInterval(() => {
  if (!G || UI.still || document.hidden || UI.ffBusy || UI.modal || G.over || ["menu", "setup", "fight"].includes(UI.view)) return;
  if (Date.now() < nextDrop) return;
  nextDrop = Date.now() + 5000 + Math.random() * 8000;
  if (!PS.tick()) { if (UI.phone.open) render(); return; }
  save();
  if (UI.phone.open) render();
  else { const b = document.querySelector(".phone-btn"); if (b) { b.querySelector(".dotb")?.remove(); b.insertAdjacentHTML("beforeend", PH.phoneBadge()); } }
  flushBanners();
}, 1000);
// Phone navigation: a stack of screens. v = {app, tab, key (chat), info, dir, post, prof, cmp}.
const markKey = (key) => { const t = PS.P().threads[key]; if (t) t.unread = 0; PS.P().notes.forEach((n) => { if (n.key === key) n.read = 1; }); };
const phoneGo = (v, push = true) => {
  const s = UI.phone;
  if (push && s.open && s.v.app !== "home") s.stack.push(s.v);
  if (!push) s.stack = [];
  s.open = true; s.v = v; UI.phone.pick = null;
  if (v.key) markKey(v.key);
  if (v.app === "pulse" && !v.post && !v.prof && !v.cmp) { if (!(s.seen > 0)) s.seen = PS.P().id; PS.P().notes.forEach((n) => { if (n.app === "pulse" && n.lvl === "ord") n.read = 1; }); }
};
const phoneRender = () => { render(); scrollMsgs(); };
// A phone action that may open the signing screen ("neg:<fid>"). Returns true if it did.
const phoneDone = (r) => {
  if (typeof r === "string" && r.startsWith("neg:")) { UI.phone.open = false; save(); UI.modal = { kind: "neg", fid: +r.slice(4) }; render(); return true; }
  if (r) toast(r); save(); phoneRender(); return false;
};
// Week fast-forward: a one-second overlay that sweeps the calendar and rolls the week number.
// Purely visual: the new week is already drawn underneath and clicks pass straight through.
function fastForward(a, b, fights) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelector(".ff")?.remove();
  const e = document.createElement("div");
  e.className = "ff";
  const cells = Array.from({ length: 13 }, (_, i) => a - 6 + i).map((w) => `<span class="${w === a ? "from" : w === b ? "to" : ""}">${w > 0 ? w : ""}</span>`).join("");
  e.innerHTML = `<div class="ff-band"><div class="ff-tl">${cells}</div>
    <div class="ff-mid"><span class="ff-arrows"><svg viewBox="0 0 24 24"><path d="M3 5l8 7-8 7zM13 5l8 7-8 7z"/></svg></span>
    <div class="ff-wk"><small>Week</small><b><i>${a}</i><i>${b}</i></b></div>
    ${fights ? `<span class="ff-tag">Fight night</span>` : ""}</div></div>`;
  document.body.appendChild(e);
  // On fight night the walk-out fades in over this banner, so it stays put instead of fading (no double fade).
  setTimeout(() => { if (!fights) e.classList.add("out"); document.getElementById("wknum")?.classList.add("tick"); }, 950);
  setTimeout(() => e.remove(), 1350);
}
function startFight(b) {
  UI.FS = newFight(b);
  UI.corner = null;
  UI.view = "fight";
  UI.modal = null;
  const show = () => { render(); scrollTo(0, 0); };
  if (UI.instant || matchMedia("(prefers-reduced-motion: reduce)").matches) { UI.FS.introSeen = true; show(); return; }
  FV.walkout(UI.FS, { sfx, onCovered: show }); // the fight screen is drawn under the walk-out once it's opaque
}
let running = false;
async function runRound() {
  const FS = UI.FS;
  if (running) return;
  running = true;
  sfx("bell");
  FS.ph = "run";
  render();
  if (!UI.skip) { FV.card(`Round ${FS.rd}`, FS.rd === 1 ? "Fight!" : FS.rd === 3 ? "Final round" : "", 1100, "round"); await sleep(1150); }
  const gone = () => UI.FS !== FS;
  while (!FS.fin && !roundOver(FS)) {
    if (FS.ex && FS.ex % 4 === 0) FS.plan[1] = aiPlan(FS);
    const ev = step(FS);
    if (!UI.skip) {
      updateLive(FS, ev);
      if (ev.dmg) sfx(ev.big ? "big" : "hit");
      if (ev.kd) sfx("crowd");
      await sleep(ev.ko ? 700 : ev.kd ? 1100 : ev.big ? 850 : 650 / UI.speed);
      if (gone()) { running = false; return; }
    }
    // Key moment: the fight pauses for your corner's call.
    const m = !FS.fin && pendingMoment(FS);
    if (m) {
      const auto = autoChoice(FS, m);
      let i = auto;
      if (!UI.skip) { sfx("tab"); i = await FV.askMoment(FS, m, auto); if (gone()) { running = false; return; } }
      const res = resolveMoment(FS, m, i);
      if (!UI.skip) {
        FV.playMoment(FS, res); FV.resultBanner(res.txt);
        sfx(res.ko ? "big" : res.ok ? "hit" : "bad"); if (res.ko || res.anim === "big") sfx("crowd");
        await sleep(res.ko ? 1300 : 1500);
        if (gone()) { running = false; return; }
      }
    }
  }
  running = false;
  if (FS.fin || FS.rd >= 3) {
    const fin = !!FS.fin;
    if (!fin) endRound(FS);
    const r = finish(FS);
    if (!UI.skip) {
      FS.ph = "run"; updateLive(FS); // loser drops, winner stands tall
      if (fin) { sfx("crowd"); FV.card("It's all over", `${r.how}${r.detail ? " · " + r.detail : ""}`, 1700, "over"); await sleep(1800); }
      else { sfx("bell"); FV.card("To the judges", "After three rounds", 1400); await sleep(1500); }
      FS.ph = "end";
    }
    UI.skip = false;
    save();
    render();
    if (r.won) { confetti(r.wasChamp ? 220 : 110); sfx("win"); sfx("crowd"); stamp(r.wasChamp ? "Champion" : "Winner", r.wasChamp ? "var(--gold)" : "var(--red)"); } else sfx("bad");
    if (r.wks) setTimeout(() => { stamp(`Injured · ${r.wks} wks`, "#7a0d0d"); sfx("bad"); }, r.won ? 1500 : 900);
    countUp();
    return;
  }
  endRound(FS);
  if (!UI.skip) { sfx("bell"); FV.card(`End of round ${FS.rd}`, "", 1000); await sleep(1050); if (gone()) return; }
  UI.skip = false;
  FS.ph = "corner";
  UI.corner = null;
  render();
}
function countUp() {
  const e = document.getElementById("cu"); if (!e) return;
  const v = +e.dataset.v; let t = 0;
  (function s() { t += 0.04; e.textContent = money(v * Math.min(1, t)); if (t < 1) requestAnimationFrame(s); })();
}
const setupVals = () => { const a = document.getElementById("an"), m = document.getElementById("mn"); if (a) UI.setup.name = a.value; if (m) UI.setup.manager = m.value; };

// ---------- Actions ----------
const A = {
  go: (i, t) => go(i, t.dataset.x),
  menu: () => { save(); setG(null); UI.menuPage = "slots"; UI.slotHero = null; UI.phone.open = false; document.getElementById("ph-banners")?.remove(); go("menu"); },
  play: () => { UI.menuPage = "slots"; UI.slotHero = null; render(); },
  menuback: () => { UI.menuPage = "main"; render(); },
  settings: () => { UI.modal = { kind: "settings" }; render(); },
  agency: () => { UI.office = "agency"; go("office"); },
  autobook: () => {
    const done = autoBook();
    if (!done.length) { toast("No opponents available", "warn"); return commit(); }
    toast(`Booked ${done.length} even fight${done.length > 1 ? "s" : ""}`); sfx("sign"); stamp("Booked", "var(--red)");
    commit();
  },
  newslot: (i) => { UI.setup = { slot: +i, name: "", manager: "", col: 0, diff: "Normal", city: "vegas", focus: "strike", emblem: "fist" }; go("setup"); },
  loadslot: (i) => { const g = load(+i); if (!g) return; setG(g); lastCash = null; go("home"); },
  delslot: (i) => { UI.modal = { kind: "delslot", slot: +i }; render(); },
  dodelslot: (i) => { wipe(+i); UI.modal = null; render(); },
  scol: (i) => { setupVals(); UI.setup.col = +i; render(); },
  semb: (i) => { setupVals(); UI.setup.emblem = i; render(); },
  scity: (i) => { setupVals(); UI.setup.city = i; render(); },
  sfocus: (i) => { setupVals(); UI.setup.focus = i; render(); },
  sdiff: (i) => { setupVals(); UI.setup.diff = i; render(); },
  start: () => {
    setupVals();
    if (!UI.setup.name.trim()) { document.getElementById("an").focus(); toast("Name your agency first", "warn"); return; }
    setG(newGame(UI.setup)); save(); lastCash = null; sfx("sign"); go("home");
  },
  adv: () => nextWeek(),
  weekok: () => { UI.modal = null; render(); flushBanners(); },
  // phone
  phone: () => { if (UI.phone.open) UI.phone.open = false; else { phoneGo({ app: "home" }, false); UI.phone.anim = 1; } render(); UI.phone.anim = 0; },
  pclosebg: (i, t, e) => { if (e.target === t) { UI.phone.open = false; render(); } },
  phome: () => { phoneGo({ app: "home" }, false); render(); },
  pback: () => { const s = UI.phone; if (UI.phone.pick) UI.phone.pick = null; else s.v = s.stack.pop() || { app: "home" }; if (s.v.key) markKey(s.v.key); render(); scrollMsgs(); },
  papp: (i) => { phoneGo({ app: i }, false); render(); },
  ptab: (i) => { UI.phone.v = { ...UI.phone.v, tab: i }; if (i !== "for" && UI.phone.v.app === "pulse") UI.phone.seen = PS.P().id; render(); document.getElementById("phbody")?.scrollTo(0, 0); },
  pthread: (i) => { phoneGo({ app: "connect", key: i }); phoneRender(); },
  pinfo: (i) => { phoneGo({ app: "connect", info: i }); render(); },
  pdir: () => { phoneGo({ app: "connect", dir: 1 }); render(); },
  padd: (i) => { const r = CN.add(i); if (r) toast(r, "warn"); else { toast("Added to your contacts", "good"); phoneGo({ app: "connect", key: i }); } save(); phoneRender(); },
  prem: (i) => { const r = CN.remove(i); toast(r, /stay/.test(r) ? "warn" : ""); commit(); },
  pdel: (i) => { PS.delThread(i); toast("Chat deleted"); UI.phone.v = UI.phone.stack.pop() || { app: "connect", tab: "chats" }; if (UI.phone.v.key === i) UI.phone.v = { app: "connect", tab: "chats" }; commit(); },
  pnote: (i) => {
    const n = PS.P().notes.find((x) => x.id === +i); if (!n) return;
    n.read = 1; document.getElementById("ph-banners")?.replaceChildren();
    const k = n.key || "";
    if (k === "sell") { UI.phone.open = false; go("market", "desk"); return; }
    if (k.startsWith("f:") || k.startsWith("n:")) phoneGo({ app: "connect", key: k });
    else if (k.startsWith("deal:")) phoneGo({ app: "connect", tab: "offers" });
    else if (k.startsWith("post:")) phoneGo({ app: "pulse", post: +k.slice(5) });
    else if (n.app === "pulse") phoneGo({ app: "pulse", tab: k === "rumours" ? "news" : "for" });
    else phoneGo({ app: n.app || "home" });
    phoneRender();
  },
  preply: (i) => {
    const key = UI.phone.v.key, r = PS.reply(key, +i);
    if (r === "renew") { UI.phone.open = false; save(); UI.modal = { kind: "renew", fid: +key.slice(2) }; render(); return; }
    if (r) toast(r); save(); phoneRender();
  },
  pask: (i) => {
    const key = UI.phone.v.key;
    if (key.startsWith("f:") && G.f[+key.slice(2)].st === "mine") { PS.ask(key, i); save(); phoneRender(); return; }
    if (CN.needsFighter(i)) { UI.phone.pick = i; phoneRender(); return; }
    phoneDone(CN.ask(key, i));
  },
  paskf: (i) => { const t = UI.phone.pick; UI.phone.pick = null; phoneDone(CN.ask(UI.phone.v.key, t, +i)); },
  pcancel: () => { UI.phone.pick = null; phoneRender(); },
  pdeal: (i, t) => {
    const r = CN.dealAct(+i, t.dataset.x);
    if (r.startsWith("neg:")) return phoneDone(r);
    const bad = /gone|enough|walked|isn't|full/i.test(r);
    toast(r, bad ? "warn" : t.dataset.x === "yes" ? "money" : ""); if (t.dataset.x === "yes" && !bad) sfx("cash");
    save(); phoneRender();
  },
  // PULSE
  ppost: (i) => { phoneGo({ app: "pulse", post: +i }); render(); },
  pprof: (i) => { phoneGo({ app: "pulse", prof: i }); render(); },
  plike: (i) => { PU.like(+i); save(); render(); },
  prt: (i) => { const r = PU.repost(+i); if (r) toast(r); save(); render(); },
  pnew: () => { UI.phone.seen = PS.P().id; render(); document.getElementById("phbody")?.scrollTo(0, 0); },
  pcomp: () => { phoneGo({ app: "pulse", cmp: { sel: {} } }); render(); },
  pck: (i) => { UI.phone.v = { app: "pulse", cmp: { k: i, sel: {} } }; render(); },
  ptg: (i) => { const c = UI.phone.v.cmp, need = PU.needs(c.k).find((n) => c.sel[n] == null); c.sel[need] = +i; render(); },
  pcpub: (i) => { const c = UI.phone.v.cmp, r = PU.publish(c.k, c.sel, +i); toast(r, /No posts|no longer/.test(r) ? "warn" : "good"); sfx("tab"); UI.phone.v = UI.phone.stack.pop() || { app: "pulse" }; UI.phone.seen = PS.P().id; commit(); },
  prp: (i) => { const r = PU.replyPost(UI.phone.v.post, +i); if (r) toast(r); save(); render(); },
  pclear: () => { PS.P().notes = []; commit(); },
  ppref: (i) => { const p = PS.P().prefs; p[i] = p[i] ? 0 : 1; commit(); },
  inbox: () => { G.unread = 0; UI.modal = { kind: "inbox" }; commit(); },
  snd: () => { SND.on = SND.on ? 0 : 1; saveSnd(); render(); },
  analyst: () => { SETTINGS.analyst = !SETTINGS.analyst; saveSettings(); render(); },
  autotoggle: () => { G.autotrain = !G.autotrain; toast(G.autotrain ? "Auto-train on. Runs every Next week." : "Auto-train off"); commit(); },
  tour: () => { G.tour = 0; go(STEPS[0].view); },
  tournext: () => { G.tour++; const s = STEPS[G.tour]; if (s) { if (s.office) UI.office = s.office; if (s.view === "market") UI.mk.tab = "free"; go(s.view); } else { G.tour = -1; save(); render(); } save(); },
  tourskip: () => { G.tour = -1; save(); render(); },
  mclose: () => { const wasEvent = UI.modal?.kind === "evres"; UI.modal = null; if (wasEvent) afterWeek(); else render(); },
  mbg: (i, t, e) => { if (e.target === t && !["event", "week"].includes(UI.modal?.kind)) A.mclose(); },
  prof: (i) => { UI.pid = +i; UI.view = "prof"; UI.modal = null; render(); scrollTo(0, 0); },
  // events
  event: () => { UI.modal = { kind: "event" }; render(); },
  evpick: (i) => { const msg = resolveEvent(+i); save(); UI.modal = { kind: "evres", msg }; sfx("tab"); render(); },
  // gym
  gymf: (i) => { UI.gym.fid = +i; go("gym"); },
  gsel: (i) => { UI.gym.fid = +i; render(); },
  gkey: (i) => { UI.gym.key = i; render(); },
  gint: (i) => { UI.gym.int = +i; render(); },
  train: () => {
    const f = G.f[UI.gym.fid], r = train(f, UI.gym.key, UI.gym.int);
    toast(r.msg, r.injured ? "bad" : r.ok ? (r.gain ? "" : "warn") : "warn");
    sfx(r.injured ? "bad" : r.gain ? "sign" : "tick");
    commit();
  },
  // fights
  seek: (i) => { const o = offersFor(G.f[+i]); G.offers.push(...o); if (!o.length) toast("No opponents available", "warn"); commit(); },
  push: (i) => {
    const o = G.offers[+i]; o.push = 1;
    if (Math.random() < 0.3) { G.offers.splice(+i, 1); toast("They pulled the offer", "bad"); }
    else { o.purse = Math.round(o.purse * 1.2 / 100) * 100; o.bonus = o.purse; toast("Purse raised 20%", "money"); sfx("cash"); }
    commit();
  },
  acc: (i) => {
    const o = G.offers[+i];
    G.bk.push(o); G.offers = G.offers.filter((x) => x.fid !== o.fid && x.oid !== o.oid);
    say(`${G.f[o.fid].name} booked vs ${G.f[o.oid].name} for week ${o.wk}${o.title ? " — TITLE FIGHT" : ""}.`, "good");
    toast("Fight booked"); sfx("sign"); commit();
  },
  // market
  mktab: (i) => { UI.mk.tab = i; render(); },
  mkreach: () => { UI.mk.reach = !UI.mk.reach; render(); },
  mquick: (i) => { UI.modal = { kind: "quick", fid: +i }; render(); },
  more: (i) => { UI.modal = { kind: "more", fid: +i }; render(); },
  rephelp: () => { UI.modal = { kind: "rep" }; render(); },
  neg: (i) => { UI.modal = { kind: "neg", fid: +i }; render(); },
  nyears: (i) => { UI.modal.years = +i; render(); },
  offer: (i, t) => {
    const f = G.f[+i], m = UI.modal;
    t.classList.add("busy");
    setTimeout(() => {
      const r = trySign(f, m.cut, m.bonus, m.years, m.fee || 0);
      if (r.ok) { UI.modal = null; stamp("Signed", "var(--red)"); confetti(80); sfx("win"); }
      else { toast(r.msg, r.rejected ? "bad" : "warn"); if (r.rejected) { UI.modal = null; sfx("bad"); } }
      commit();
    }, 700);
  },
  renew: (i) => { UI.modal = { kind: "renew", fid: +i }; render(); },
  dorenew: (i, t) => {
    const f = G.f[+i], m = UI.modal;
    t.classList.add("busy");
    setTimeout(() => {
      const r = tryRenew(f, m.cut, m.bonus, m.years);
      if (r.ok) { UI.modal = null; stamp("Renewed", "var(--gold)"); sfx("sign"); } else { toast(r.msg, r.rejected ? "bad" : "warn"); if (r.rejected) UI.modal = null; }
      commit();
    }, 600);
  },
  list: (i) => { if (!canSell(G.f[+i])) return toast("Too soon after signing to sell", "warn"); UI.modal = { kind: "list", fid: +i }; render(); },
  dolist: (i) => { list(G.f[+i], UI.modal.ask); UI.modal = null; toast("Listed. Offers arrive when you press Next week."); commit(); },
  unlist: (i) => { unlist(G.f[+i]); toast("Taken off the market"); commit(); },
  release: (i) => { UI.modal = { kind: "release", fid: +i }; render(); },
  dorelease: (i) => { release(G.f[+i]); UI.modal = null; if (UI.view === "prof") UI.view = "fighters"; commit(); },
  bidok: (i) => {
    const b = G.bids.find((x) => x.id === +i); if (!b) return;
    sell(b); stamp("Sold", "var(--gold)"); sfx("cash"); confetti(60);
    if (UI.view === "prof") UI.view = "market";
    UI.mk.tab = "desk"; commit();
  },
  bidno: (i) => { const b = G.bids.find((x) => x.id === +i); if (b) rejectBid(b); commit(); },
  bidcounter: (i) => { UI.modal = { kind: "counter", bid: +i }; render(); },
  docounter: (i) => {
    const b = G.bids.find((x) => x.id === +i), r = counter(b, UI.modal.amt);
    UI.modal = null;
    if (r === "accepted") { sell(b); stamp("Sold", "var(--gold)"); sfx("cash"); confetti(60); if (UI.view === "prof") UI.view = "market"; }
    else if (r === "raised") toast(`They came back with ${money(b.amount)}`, "money");
    else toast("They walked away", "bad");
    commit();
  },
  // sponsors
  spok: (i) => { const o = G.spons.find((x) => x.id === +i); if (o) { acceptSponsor(o); sfx("cash"); toast(`Signed with ${o.brand}`, "money"); } commit(); },
  spno: (i) => { const o = G.spons.find((x) => x.id === +i); if (o) declineSponsor(o); commit(); },
  pitch: (i) => { const r = pitch(G.f[+i]); toast(r.msg, r.offer ? "money" : r.ok ? "warn" : "bad"); if (r.offer) sfx("cash"); commit(); },
  // office
  rkdiv: (i) => { UI.rk = +i; render(); },
  oftab: (i) => { UI.office = i; render(); },
  rename: () => { const n = document.getElementById("ren").value.trim(); if (n) { G.ag.name = n; toast("Agency renamed"); commit(); } },
  agcol: (i) => { G.ag.col = +i; commit(); },
  agemb: (i) => { G.ag.emblem = i; commit(); },
  abandon: () => { UI.modal = { kind: "abandon" }; render(); },
  doabandon: () => { wipe(G.slot); setG(null); UI.modal = null; UI.menuPage = "slots"; go("menu"); },
  // fight night
  plan: (i) => { UI.FS.plan[0] = i; if (UI.FS.ph !== "run") render(); else document.querySelectorAll('[data-a="plan"]').forEach((b) => b.classList.toggle("on", b.dataset.i === i)); },
  fstart: () => { startRound(UI.FS); runRound(); },
  corner: (i) => { UI.corner = i; render(); },
  nextround: () => { startRound(UI.FS, UI.corner); runRound(); },
  speed: (i) => { UI.speed = +i; document.querySelectorAll('[data-a="speed"]').forEach((b) => b.classList.toggle("on", b.dataset.i === i)); },
  skip: () => { UI.skip = true; UI.mpick?.(-1); },
  mpick: (i) => { UI.mpick?.(+i); },
  fdone: () => { UI.FS = null; if (UI.queue.length) { startFight(UI.queue.shift()); return; } afterWeek(); },
};
const QUIET = new Set(["mbg", "skip", "speed"]);
const TABS = new Set(["papp", "pthread", "pback", "phome", "pfilter", "go", "mktab", "oftab", "rkdiv", "mkdiv", "gsel", "gkey", "gint", "plan", "corner", "scol", "semb", "scity", "sfocus", "sdiff", "nyears"]);

// Front menu parallax: the line-up drifts a little against the mouse.
document.addEventListener("mousemove", (e) => {
  if (UI.view !== "menu") return;
  const m = document.querySelector(".menu.front"); if (!m) return;
  m.style.setProperty("--mx", (e.clientX / innerWidth - 0.5).toFixed(3)); m.style.setProperty("--my", (e.clientY / innerHeight - 0.5).toFixed(3));
});
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a]");
  if (!t) return;
  const a = t.dataset.a;
  if (a === "mbg" && e.target !== t) return;
  if (!A[a]) return;
  if (a === "delslot") e.stopPropagation();
  if (!QUIET.has(a)) sfx(TABS.has(a) ? "tab" : "tick");
  A[a](t.dataset.i, t, e);
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, select")) return;
  if (UI.mpick && /^[1-3]$/.test(e.key)) { UI.mpick(+e.key - 1); return; }
  if ((e.key === "n" || e.key === "N") && G && !UI.modal && !["menu", "setup", "fight"].includes(UI.view)) nextWeek();
  if (e.key === "Escape" && UI.phone.open && !UI.modal) { UI.phone.open = false; render(); return; }
  if ((e.key === "p" || e.key === "P") && G && !UI.modal && !["menu", "setup", "fight"].includes(UI.view)) A.phone();
  if (e.key === "Escape" && UI.modal && !["event", "week"].includes(UI.modal.kind)) A.mclose();
  if (e.key === "Enter" && e.target.matches(".ac[data-a]")) e.target.click();
});
document.addEventListener("input", (e) => {
  const id = e.target.id, v = +e.target.value, m = UI.modal;
  if (id === "vol") { SND.vol = v / 100; saveSnd(); const l = document.getElementById("v-vol"); if (l) l.textContent = v + "%"; return; }
  if (id === "an") { const p = document.getElementById("pv-name"); if (p) p.textContent = e.target.value || "Your Agency"; return; }
  if (id === "mkq") { UI.mk.q = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("mkq"); q.focus(); q.setSelectionRange(pos, pos); return; }
  if (!m) return;
  if (id === "r-cut") m.cut = v; else if (id === "r-bonus") m.bonus = v; else if (id === "r-fee") m.fee = v; else if (id === "r-ask") m.ask = v; else if (id === "r-amt") m.amt = v;
  if (m.kind === "list") V.listUpdate();
  else if (m.kind === "counter") document.getElementById("v-amt").textContent = money(m.amt);
  else V.negUpdate();
});
document.addEventListener("change", (e) => {
  if (e.target.id === "mksort") { UI.mk.sort = e.target.value; render(); }
  if (e.target.id === "mkdiv") { UI.mk.div = +e.target.value; render(); }
});
addEventListener("resize", () => drawTour());

// Debug/test hook (used by the smoke test).
window.__fm = { get G() { return G; }, UI, go, render, nextWeek, afterWeek, startFight, PS, CN, PU, flushBanners };

// Loading sting: logo slams in behind a red sweep while the menu fighters load. Click to skip.
function boot() {
  render();
  const e = document.createElement("div");
  e.className = "boot";
  e.innerHTML = `<div class="boot-bar"></div><div class="logo">Fight<br><span>Manager</span></div><div class="boot-load"><i></i></div>`;
  document.body.appendChild(e);
  const imgs = [...document.querySelectorAll(".menu img")].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))).filter(Boolean);
  let gone = false;
  const done = () => { if (gone) return; gone = true; e.classList.add("out"); setTimeout(() => e.remove(), 450); };
  e.addEventListener("click", done);
  Promise.all([Promise.race([Promise.all(imgs), sleep(2500)]), sleep(1400)]).then(done);
}
boot();
