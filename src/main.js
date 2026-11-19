import "./ui/styles.css";
import { G, setG, newGame, load, save, wipe, mine, say, SETTINGS, saveSettings } from "./state.js";
import { sleep, money } from "./util.js";
import { UI } from "./ui/uistate.js";
import * as V from "./ui/views.js";
import { vFight, updateLive } from "./ui/fightview.js";
import { toast, stamp, confetti } from "./ui/components.js";
import { drawTour, STEPS } from "./ui/tour.js";
import { SND, saveSnd, sfx } from "./audio.js";
import { advance, offersFor, train } from "./sim/world.js";
import { trySign, release, list, unlist, sell, rejectBid, counter, tryRenew, canSell } from "./sim/market.js";
import { acceptSponsor, declineSponsor, pitch } from "./sim/sponsors.js";
import { resolveEvent } from "./sim/events.js";
import { newFight, step, roundOver, endRound, startRound, finish, aiPlan } from "./sim/fight.js";

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
  if (UI.modal && v !== "fight") h += modalHtml();
  app.innerHTML = h;
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
    case "week": return V.mWeek(m.sum);
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
  UI.modal = null;
  render();
  scrollTo(0, 0);
}
const commit = () => { save(); render(); };

// ---------- Week / fights ----------
function nextWeek() {
  if (UI.view === "fight" || G.over) return;
  const before = G.log[0];
  const due = advance();
  save();
  if (G.over) { render(); return; }
  sfx("whoosh");
  const idx = G.log.indexOf(before);
  UI.pendingSum = G.log.slice(0, idx < 0 ? 8 : idx).slice(0, 10);
  if (due.length) { UI.queue = due.slice(1); startFight(due[0]); return; }
  afterWeek();
}
// After fights: event first (if any), then the summary.
function afterWeek() {
  if (G.event) { UI.modal = { kind: "event" }; }
  else if (UI.pendingSum?.length) { UI.modal = { kind: "week", sum: UI.pendingSum }; UI.pendingSum = null; }
  else UI.modal = null;
  if (UI.view === "fight") UI.view = "home";
  render();
}
function startFight(b) {
  UI.FS = newFight(b);
  UI.corner = null;
  UI.view = "fight";
  UI.modal = null;
  render(); scrollTo(0, 0);
}
let running = false;
async function runRound() {
  const FS = UI.FS;
  if (running) return;
  running = true;
  sfx("bell");
  FS.ph = "run";
  render();
  while (!FS.fin && !roundOver(FS)) {
    if (FS.ex && FS.ex % 4 === 0) FS.plan[1] = aiPlan(FS);
    const ev = step(FS);
    if (!UI.skip) {
      updateLive(FS, ev);
      if (ev.dmg) sfx(ev.big ? "big" : "hit");
      if (ev.ko || ev.kind === "sub") {
        sfx("crowd");
        document.body.insertAdjacentHTML("beforeend", '<div class="ko-flash"></div>');
        setTimeout(() => document.querySelector(".ko-flash")?.remove(), 700);
      }
      await sleep(ev.ko ? 900 : 950 / UI.speed);
    }
    if (UI.FS !== FS) { running = false; return; }
  }
  running = false;
  if (FS.fin || FS.rd >= 3) {
    if (!FS.fin) endRound(FS);
    const r = finish(FS);
    UI.skip = false;
    save();
    render();
    if (r.won) { confetti(r.wasChamp ? 220 : 110); sfx("win"); sfx("crowd"); stamp(r.wasChamp ? "Champion" : "Winner", r.wasChamp ? "var(--gold)" : "var(--red)"); } else sfx("bad");
    countUp();
    return;
  }
  endRound(FS);
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
  menu: () => { save(); setG(null); go("menu"); },
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
  weekok: () => { UI.modal = null; render(); },
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
  seekall: () => { mine().filter((f) => !f.inj && !G.bk.some((b) => b.fid === f.id) && !G.offers.some((o) => o.fid === f.id)).forEach((f) => G.offers.push(...offersFor(f))); commit(); },
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
  mkdiv: (i) => { UI.mk.div = +i; render(); },
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
  doabandon: () => { wipe(G.slot); setG(null); UI.modal = null; go("menu"); },
  // fight night
  plan: (i) => { UI.FS.plan[0] = i; if (UI.FS.ph !== "run") render(); else document.querySelectorAll('[data-a="plan"]').forEach((b) => b.classList.toggle("on", b.dataset.i === i)); },
  fstart: () => { startRound(UI.FS); runRound(); },
  corner: (i) => { UI.corner = i; render(); },
  nextround: () => { startRound(UI.FS, UI.corner); runRound(); },
  speed: (i) => { UI.speed = +i; document.querySelectorAll('[data-a="speed"]').forEach((b) => b.classList.toggle("on", b.dataset.i === i)); },
  skip: () => { UI.skip = true; },
  fdone: () => { UI.FS = null; if (UI.queue.length) { startFight(UI.queue.shift()); return; } afterWeek(); },
};
const QUIET = new Set(["mbg", "skip", "speed"]);
const TABS = new Set(["go", "mktab", "oftab", "rkdiv", "mkdiv", "gsel", "gkey", "gint", "plan", "corner", "scol", "semb", "scity", "sfocus", "sdiff", "nyears"]);

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
  if ((e.key === "n" || e.key === "N") && G && !UI.modal && !["menu", "setup", "fight"].includes(UI.view)) nextWeek();
  if (e.key === "Escape" && UI.modal && !["event", "week"].includes(UI.modal.kind)) A.mclose();
  if (e.key === "Enter" && e.target.matches(".ac[data-a]")) e.target.click();
});
document.addEventListener("input", (e) => {
  const id = e.target.id, v = +e.target.value, m = UI.modal;
  if (id === "vol") { SND.vol = v / 100; saveSnd(); return; }
  if (id === "an") { const p = document.getElementById("pv-name"); if (p) p.textContent = e.target.value || "Your Agency"; return; }
  if (id === "mkq") { UI.mk.q = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("mkq"); q.focus(); q.setSelectionRange(pos, pos); return; }
  if (!m) return;
  if (id === "r-cut") m.cut = v; else if (id === "r-bonus") m.bonus = v; else if (id === "r-fee") m.fee = v; else if (id === "r-ask") m.ask = v; else if (id === "r-amt") m.amt = v;
  if (m.kind === "list") V.listUpdate();
  else if (m.kind === "counter") document.getElementById("v-amt").textContent = money(m.amt);
  else V.negUpdate();
});
document.addEventListener("change", (e) => { if (e.target.id === "mksort") { UI.mk.sort = e.target.value; render(); } });
addEventListener("resize", () => drawTour());

// Debug/test hook (used by the smoke test).
window.__fm = { get G() { return G; }, UI, go, render, nextWeek, afterWeek };

render();
