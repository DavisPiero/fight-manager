import "./ui/styles.css";
import { G, setG, newGame, load, save, wipe, mine, ovr, say } from "./state.js";
import { sleep, money } from "./util.js";
import { ATTR_KEYS } from "./data/constants.js";
import { UI } from "./ui/uistate.js";
import * as V from "./ui/views.js";
import { vFight, updateLive } from "./ui/fightview.js";
import { toast, stamp, confetti } from "./ui/components.js";
import { SND, saveSnd, sfx } from "./audio.js";
import { advance, offersFor, train } from "./sim/world.js";
import { trySign, release, list, unlist, sell, rejectBid, counter, tryRenew, canSell } from "./sim/market.js";
import { newFight, step, roundOver, endRound, startRound, finish, aiPlan } from "./sim/fight.js";

const app = document.getElementById("app");

// ---------- Render ----------
function render() {
  let h;
  const v = UI.view;
  if (v === "menu") h = V.vMenu();
  else if (v === "new") h = V.vNew();
  else if (G?.over) h = V.vGameOver();
  else if (v === "fight") h = vFight();
  else h = ({ home: V.vHome, fighters: V.vFighters, prof: V.vProfile, fights: V.vFights, gym: V.vGym, market: V.vMarket, rankings: V.vRankings, office: V.vOffice }[v] || V.vHome)();
  if (UI.modal && v !== "fight") h += modalHtml();
  app.innerHTML = h;
  UI.last = v;
  if (UI.modal?.kind === "neg" || UI.modal?.kind === "renew") V.negUpdate();
  if (UI.modal?.kind === "list") V.listUpdate();
  animateCash();
}
function modalHtml() {
  const m = UI.modal, f = G.f[m.fid];
  switch (m.kind) {
    case "neg": return V.mNegotiate(f);
    case "renew": return V.mRenew(f);
    case "list": return V.mList(f);
    case "counter": return V.mCounter(G.bids.find((b) => b.id === m.bid));
    case "release": return V.mConfirm(`Release ${f.name}?`, `He leaves for free and becomes a free agent. You lose 2 reputation. His ${f.ct.wks} remaining contract weeks are void.`, "dorelease", f.id, "Release him");
    case "abandon": return V.mConfirm("Abandon this career?", "Your save will be deleted. This can't be undone.", "doabandon", 0, "Delete career");
    case "inbox": return V.mInbox();
    case "week": return V.mWeek(m.sum);
  }
  return "";
}
let lastCash = null;
function animateCash() {
  const e = document.getElementById("cash");
  if (!e || !G) return;
  if (lastCash !== null && lastCash !== G.cash) {
    const a = lastCash, b = G.cash, t0 = performance.now();
    (function s(t) { const k = Math.min(1, (t - t0) / 600); e.textContent = money(a + (b - a) * k); if (k < 1) requestAnimationFrame(s); })(t0);
  }
  lastCash = G.cash;
}
function go(v, extra) {
  if (v === "prof" || v === "fight") { /* keep back target */ } else UI.back = v;
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
  const before = G.log.length ? G.log[0] : null;
  const due = advance();
  save();
  if (G.over) { render(); return; }
  sfx("whoosh");
  const idx = before ? G.log.indexOf(before) : G.log.length;
  const sum = G.log.slice(0, idx < 0 ? 8 : idx).slice(0, 10);
  if (due.length) { UI.queue = due.slice(1); startFight(due[0]); return; }
  if (sum.length) UI.modal = { kind: "week", sum };
  render();
}
function startFight(b) {
  UI.FS = newFight(b);
  UI.FS.plan[1] = "norm";
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
    updateLive(FS, ev);
    if (ev.dmg) sfx(ev.big ? "big" : "hit");
    if (ev.ko || ev.kind === "sub") {
      document.body.insertAdjacentHTML("beforeend", '<div class="ko-flash"></div>');
      setTimeout(() => document.querySelector(".ko-flash")?.remove(), 700);
    }
    if (UI.skip) continue;
    await sleep(ev.ko ? 900 : 900 / UI.speed);
    if (UI.FS !== FS) { running = false; return; }
  }
  running = false;
  if (FS.fin || FS.rd >= 3) {
    if (!FS.fin) endRound(FS);
    const r = finish(FS);
    UI.skip = false;
    save();
    render();
    if (r.won) { confetti(r.wasChamp ? 220 : 120); sfx("win"); stamp(r.wasChamp ? "Champion" : "Winner", "var(--green)"); } else sfx("bad");
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

// ---------- Actions ----------
const A = {
  go: (i, t) => go(i, t.dataset.x),
  menu: () => go("menu"),
  new: () => { UI.setup = { name: "", col: 0, diff: "Normal" }; go("new"); },
  cont: () => { setG(load()); go("home"); },
  ccol: (i) => { UI.setup.name = document.getElementById("an").value; UI.setup.col = +i; render(); },
  cdiff: (i) => { UI.setup.name = document.getElementById("an").value; UI.setup.diff = i; render(); },
  start: () => {
    const n = document.getElementById("an").value.trim();
    if (!n) { document.getElementById("an").focus(); toast("Name your agency first", "warn"); return; }
    setG(newGame({ ...UI.setup, name: n })); save(); lastCash = null; go("home");
  },
  tutx: () => { G.tutorial = 1; commit(); },
  adv: () => nextWeek(),
  inbox: () => { G.unread = 0; UI.modal = { kind: "inbox" }; commit(); },
  snd: () => { SND.on = SND.on ? 0 : 1; saveSnd(); render(); },
  mclose: () => { UI.modal = null; render(); },
  mbg: (i, t, e) => { if (e.target === t) A.mclose(); },
  prof: (i) => { UI.pid = +i; UI.view = "prof"; UI.modal = null; render(); scrollTo(0, 0); },
  // gym
  gymf: (i) => { UI.gym.fid = +i; go("gym"); },
  gsel: (i) => { UI.gym.fid = +i; render(); },
  garea: (i) => { UI.gym.area = i; render(); },
  gkey: (i) => { UI.gym.key = i; render(); },
  gint: (i) => { UI.gym.int = +i; render(); },
  train: () => {
    const f = G.f[UI.gym.fid], r = train(f, UI.gym.key, UI.gym.int);
    toast(r.msg, r.injured ? "bad" : r.ok ? (r.gain ? "" : "warn") : "warn");
    if (r.injured) sfx("bad"); else if (r.gain) sfx("cash");
    commit();
  },
  autotrain: () => {
    let n = 0;
    for (const f of mine()) while (f.sl > 0 && !f.inj && f.en >= 20 && G.cash >= 500) {
      const k = ATTR_KEYS.slice().sort((a, b) => f.at[a] - f.at[b])[0];
      const r = train(f, k, 1); if (!r.ok) break; n++;
      if (r.injured) toast(`${f.name} got hurt in training`, "bad");
    }
    toast(n ? `${n} session${n > 1 ? "s" : ""} done` : "Nobody can train right now", n ? "" : "warn");
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
    toast("Fight booked"); commit();
  },
  // market
  mktab: (i) => { UI.mk.tab = i; render(); },
  mkdiv: (i) => { UI.mk.div = +i; render(); },
  mksort: (i) => { UI.mk.sort = i; render(); },
  neg: (i) => { UI.modal = { kind: "neg", fid: +i }; render(); },
  nyears: (i) => { UI.modal.years = +i; render(); },
  offer: (i, t) => {
    const f = G.f[+i], m = UI.modal;
    t.classList.add("busy");
    setTimeout(() => {
      const r = trySign(f, m.cut, m.bonus, m.years, m.fee || 0);
      if (r.ok) { UI.modal = null; stamp("Signed", "var(--gold)"); confetti(80); sfx("win"); }
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
      if (r.ok) { UI.modal = null; stamp("Renewed", "var(--gold)"); sfx("win"); } else { toast(r.msg, r.rejected ? "bad" : "warn"); if (r.rejected) UI.modal = null; }
      commit();
    }, 600);
  },
  list: (i) => { if (!canSell(G.f[+i])) return toast("Too soon after signing to sell", "warn"); UI.modal = { kind: "list", fid: +i }; render(); },
  dolist: (i) => { list(G.f[+i], UI.modal.ask); UI.modal = null; toast("Listed. Bids arrive when you press Next week."); commit(); },
  unlist: (i) => { unlist(G.f[+i]); toast("Taken off the market"); commit(); },
  release: (i) => { UI.modal = { kind: "release", fid: +i }; render(); },
  dorelease: (i) => { release(G.f[+i]); UI.modal = null; if (UI.view === "prof") UI.view = "fighters"; commit(); },
  bidok: (i) => {
    const b = G.bids.find((x) => x.id === +i); if (!b) return;
    sell(b); stamp("Sold", "var(--blue)"); sfx("cash"); confetti(60);
    if (UI.view === "prof") UI.view = "market";
    UI.mk.tab = "desk"; commit();
  },
  bidno: (i) => { const b = G.bids.find((x) => x.id === +i); if (b) rejectBid(b); commit(); },
  bidcounter: (i) => { UI.modal = { kind: "counter", bid: +i }; render(); },
  docounter: (i) => {
    const b = G.bids.find((x) => x.id === +i), r = counter(b, UI.modal.amt);
    UI.modal = null;
    if (r === "accepted") { sell(b); stamp("Sold", "var(--blue)"); sfx("cash"); confetti(60); if (UI.view === "prof") UI.view = "market"; }
    else if (r === "raised") toast(`They came back with ${money(b.amount)}`, "money");
    else toast("They walked away", "bad");
    commit();
  },
  rkdiv: (i) => { UI.rk = +i; render(); },
  oftab: (i) => { UI.office = i; render(); },
  abandon: () => { UI.modal = { kind: "abandon" }; render(); },
  doabandon: () => { wipe(); setG(null); UI.modal = null; go("menu"); },
  // fight night
  plan: (i) => { UI.FS.plan[0] = i; if (UI.FS.ph !== "run") render(); else document.querySelectorAll('[data-a="plan"]').forEach((b) => b.classList.toggle("on", b.dataset.i === i)); },
  fstart: () => { startRound(UI.FS); runRound(); },
  corner: (i) => { UI.corner = i; render(); },
  nextround: () => { startRound(UI.FS, UI.corner); runRound(); },
  speed: (i) => { UI.speed = +i; document.querySelectorAll('[data-a="speed"]').forEach((b) => b.classList.toggle("on", b.dataset.i === i)); },
  skip: () => { UI.skip = true; },
  fdone: () => {
    UI.FS = null;
    if (UI.queue.length) { startFight(UI.queue.shift()); return; }
    go("home");
  },
};

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a]");
  if (!t) return;
  const a = t.dataset.a;
  if (a === "mbg" && e.target !== t) return;
  if (!A[a]) return;
  if (a !== "mbg") sfx("tick");
  A[a](t.dataset.i, t, e);
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input")) return;
  if ((e.key === "n" || e.key === "N") && G && !UI.modal && !["menu", "new", "fight"].includes(UI.view)) nextWeek();
  if (e.key === "Escape" && UI.modal) A.mclose();
  if (e.key === "Enter" && e.target.matches(".fc[data-a]")) e.target.click();
});
document.addEventListener("input", (e) => {
  const id = e.target.id, v = +e.target.value, m = UI.modal;
  if (id === "vol") { SND.vol = v / 100; saveSnd(); return; }
  if (id === "mkq") { UI.mk.q = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("mkq"); q.focus(); q.setSelectionRange(pos, pos); return; }
  if (!m) return;
  if (id === "r-cut") m.cut = v; else if (id === "r-bonus") m.bonus = v; else if (id === "r-fee") m.fee = v; else if (id === "r-ask") m.ask = v; else if (id === "r-amt") m.amt = v;
  if (m.kind === "list") V.listUpdate();
  else if (m.kind === "counter") document.getElementById("v-amt").textContent = money(m.amt);
  else V.negUpdate();
});

// Debug/test hook (used by the smoke test).
window.__fm = { get G() { return G; }, UI, go, render, nextWeek };

render();
