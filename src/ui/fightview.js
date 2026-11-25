// Fight night: walk-out intro, tale of the tape, live arena (fighters move, camera reacts), corner calls, result.
import { G, ovr, rec, rankLabel } from "../state.js";
import { DIVISIONS, ATTR_KEYS, ATTR_SHORT, AGENCY_COLOURS } from "../data/constants.js";
import { esc, money, last } from "../util.js";
import { photoOf } from "./avatar.js";
import { analyst, AREAS, areaVal, grade, ovrCol } from "./components.js";
import { PLANS, CORNER, clock } from "../sim/fight.js";
import { UI } from "./uistate.js";
import { aicon } from "./icons.js";
import { arenaInit, arenaSet, arenaAct, arenaMount, arenaImpactIn, arenaHitPt, arenaRock, arenaFocus, screenPct } from "./arena.js";

const SIL = '<svg viewBox="0 0 100 120" class="sil"><path d="M50 10c-12 0-20 10-20 23 0 10 5 18 10 22v7c-16 3-30 11-34 26L4 120h92l-2-32c-4-15-18-23-34-26v-7c5-4 10-12 10-22 0-13-8-23-20-23z"/></svg>';
const pic = (f) => { const p = photoOf(f); return p ? `<img src="${p}" alt="${esc(f.name)}">` : SIL; };
const hpCol = (h) => (h > 55 ? "#2fbf71" : h > 28 ? "#e8c46a" : "#ff2d2d");
const myCol = () => AGENCY_COLOURS[G.ag.col];
const OPP_COL = "#3d7bff";

export function vFight() { return UI.FS.ph === "pre" ? pre(UI.FS) : live(UI.FS); }

// ---------- Walk-out intro + tale of the tape ----------
function plate(FS, i) {
  const f = FS.f[i], o = ovr(f);
  return `<div class="in-plate" style="--c:${i ? OPP_COL : myCol()}">
    <div class="in-ovr" style="--oc:${ovrCol(o)}"><b>${o}</b><small>OVR</small></div>
    <div class="in-id"><small>${i ? "Opponent" : esc(G.ag.name)}</small>${f.nick ? `<i>"${esc(f.nick)}"</i>` : ""}<b>${esc(f.name)}</b>
    <span>${rec(f)} · ${rankLabel(FS.r0[i])} · ${esc(f.style)}</span></div></div>`;
}
const OCT = '<svg viewBox="-50 -50 100 100" class="in-oct"><polygon points="-20.7,-50 20.7,-50 50,-20.7 50,20.7 20.7,50 -20.7,50 -50,20.7 -50,-20.7"/><polygon points="-14.5,-35 14.5,-35 35,-14.5 35,14.5 14.5,35 -14.5,35 -35,14.5 -35,-14.5"/></svg>';
// The walk-out: its own overlay on <body>, so re-renders underneath can't cut it off. It fades in over whatever
// is on screen, calls onCovered() once it's opaque (the caller renders the fight screen then, unseen), steps
// through its stages on one timeline, and fades out to reveal the tale of the tape. A click skips to the fade.
export function walkout(FS, { onCovered, sfx = () => {} } = {}) {
  document.getElementById("intro")?.remove();
  FS.introSeen = true;
  const [A] = FS.f, e = document.createElement("div");
  e.className = "intro"; e.id = "intro";
  e.innerHTML = `<div class="wo-bg"></div>${OCT}<div class="in-streaks"><i></i><i></i><i></i><i></i></div>
    <div class="wo-spot l" style="--c:${myCol()}"></div><div class="wo-spot r" style="--c:${OPP_COL}"></div>
    <div class="in-title"><small>Fight night · Week ${G.wk}</small><b>${FS.b.title ? "Title fight" : "Main event"}</b><span>${DIVISIONS[A.wc]} · 3 rounds</span></div>
    <div class="in-f l"><div class="in-pic">${pic(FS.f[0])}</div>${plate(FS, 0)}</div>
    <div class="in-f r"><div class="in-pic">${pic(FS.f[1])}</div>${plate(FS, 1)}</div>
    <div class="in-vs">VS</div><div class="wo-flash"></div><div class="in-skip">Click to skip</div>`;
  document.body.appendChild(e);
  const timers = [], at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let covered = false;
  const cover = () => { if (!covered) { covered = true; onCovered?.(); } };
  const end = (fast) => {
    if (e.classList.contains("s-out")) return;
    timers.forEach(clearTimeout); cover();
    e.classList.toggle("fast", fast); e.classList.add("s-out");
    setTimeout(() => e.remove(), fast ? 320 : 600);
  };
  requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add("on")));
  at(380, cover);
  at(450, () => e.classList.add("s-title"));
  at(1700, () => { e.classList.add("s-a"); sfx("whoosh"); });
  at(3300, () => { e.classList.add("s-b"); sfx("whoosh"); });
  at(4900, () => { e.classList.add("s-vs"); sfx("crowd"); });
  at(6700, () => end(false));
  e.addEventListener("click", () => end(true));
}
function pre(FS) {
  const [A, B] = FS.f, a = analyst();
  const cmp = (x, y) => (x > y ? 0 : y > x ? 1 : -1);
  const row = (l, x, y, better = -1) => `<div class="trow"><b class="${better === 0 ? "adv" : ""}">${x}</b><span>${l}</span><b class="${better === 1 ? "adv" : ""}" style="text-align:left">${y}</b></div>`;
  const oA = ovr(A), oB = ovr(B), ob = cmp(oA, oB);
  const top = `<div class="trow tovr"><b class="${ob === 0 ? "adv" : ""}" style="color:${ovrCol(oA)}">${oA}</b><span>Overall</span><b class="${ob === 1 ? "adv" : ""}" style="text-align:left;color:${ovrCol(oB)}">${oB}</b></div>`;
  const rows = [row("Record", rec(A), rec(B)), row("Wins", A.w, B.w, cmp(A.w, B.w)), row("Losses", A.l, B.l, cmp(B.l, A.l)), row("Style", esc(A.style), esc(B.style)), row("Rank", rankLabel(FS.r0[0]), rankLabel(FS.r0[1]))];
  if (A.reach && B.reach) rows.push(row("Reach", A.reach + '"', B.reach + '"'));
  if (a) ATTR_KEYS.forEach((k, i) => rows.push(row(ATTR_SHORT[i], A.at[k], B.at[k], cmp(A.at[k], B.at[k]))));
  else AREAS.forEach(([n, k]) => { const x = areaVal(A, k), y = areaVal(B, k); rows.push(row(n, grade(x), grade(y), cmp(x, y))); });
  return `<div class="fn view-in">
    <div class="row spread" style="margin-bottom:12px"><div class="eyebrow">${FS.b.title ? "Title fight · " : ""}${DIVISIONS[A.wc]} bout · 3 rounds</div><span class="small mute">Week ${G.wk}</span></div>
    <div class="tape">
      <div class="tside l">${pic(A)}</div>
      <div class="mid"><div class="names"><b style="text-align:right">${esc(A.name)}</b><span class="vs">VS</span><b>${esc(B.name)}</b></div>${top}${rows.join("")}</div>
      <div class="tside r">${pic(B)}</div>
    </div>
    <div class="panel" style="margin-top:16px"><div class="panel-h"><h2>Game plan</h2><span class="small mute">Your corner will get calls to make during the fight</span></div>
      <div class="plans">${planButtons(FS)}</div>
      <button class="btn red lg" data-a="fstart" style="margin-top:16px">Start the fight</button></div></div>`;
}
const planButtons = (FS) => Object.entries(PLANS).map(([k, p]) => `<button class="plan ${FS.plan[0] === k ? "on" : ""}" data-a="plan" data-i="${k}"><b>${p.name}</b><small>${p.tip}</small></button>`).join("");

// ---------- Live arena ----------
function fs(FS, i) {
  const f = FS.f[i], a = analyst();
  return `<div class="fs ${i ? "r" : ""}" style="--c:${i ? OPP_COL : myCol()}"><div class="nm">${esc(last(f.name))}</div><div class="rk">${rankLabel(FS.r0[i])} · ${rec(f)}</div>
    <div class="hp"><i class="gh" id="hpg${i}" style="width:${Math.max(0, FS.hp[i])}%"></i><i id="hp${i}" style="width:${Math.max(0, FS.hp[i])}%;background:${hpCol(FS.hp[i])}"></i></div>
    <div class="stam"><i id="st${i}" style="width:${FS.st[i]}%"></i></div>${a ? `<div class="sub" id="ss${i}">${statLine(FS, i)}</div>` : ""}</div>`;
}
const statLine = (FS, i) => `Strikes ${FS.stats[i].str}/${FS.stats[i].att} · TD ${FS.stats[i].td} · KD ${FS.stats[i].kd}`;

// Where each fighter stands and how. Momentum pushes the fight towards the losing man's side.
function layout(FS) {
  const c = 50 + Math.max(-12, Math.min(12, FS.mom * 0.12));
  const end = FS.ph === "end" && FS.fin, lose = end ? 1 - FS.fin.w : -1;
  const pose = [0, 1].map((i) => (i === lose ? "ko" : end && i === FS.fin.w ? "win" : FS.pos === "ground" ? (FS.top === i ? "top" : "bottom") : "stand"));
  const x = FS.pos === "ground" ? [c - 4, c + 4] : [c - 18, c + 18];
  if (end && FS.fin.how !== "Submission") { x[lose] = lose ? c + 14 : c - 14; x[1 - lose] = lose ? c - 18 : c + 18; }
  return { x, pose };
}
// The arena canvas draws the fighters; #p0/#p1 are invisible anchors that keep their spot for effects.
function syncArena(FS) {
  const L = layout(FS);
  for (const i of [0, 1]) {
    arenaSet(i, L.x[i], L.pose[i], { cut: FS.hp[i] < 45, wobbly: FS.hp[i] < 28 });
  } // the arena keeps #p0/#p1 on the drawn fighters
}

function live(FS) {
  const [A, B] = FS.f, end = FS.ph === "end", a = analyst(), L = layout(FS);
  arenaInit(FS, [myCol(), OPP_COL]);
  requestAnimationFrame(() => { syncArena(FS); arenaMount(G.ag.name); });
  let ctl = "";
  if (FS.ph === "run") ctl = `<div class="plans">${planButtons(FS)}</div>
    <div class="fctl"><span class="small mute">Speed</span><div class="seg">${[1, 2, 4].map((s) => `<button class="${UI.speed === s ? "on" : ""}" data-a="speed" data-i="${s}">${s}×</button>`).join("")}</div><button class="btn quiet sm" data-a="skip" style="margin-left:auto">Skip to result</button></div>`;
  else if (FS.ph === "corner") {
    const verdict = FS.dm[0] > FS.dm[1] + 3 ? "You took that round." : FS.dm[0] < FS.dm[1] - 3 ? "You lost that round." : "Too close to call.";
    ctl = `<div class="panel" style="margin-top:14px;border-top:4px solid var(--gold)"><div class="panel-h"><h2>Corner · Round ${FS.rd} done</h2><span class="mute">${verdict}${a ? ` Judges: ${FS.cards.map((c) => c[c.length - 1].join("-")).join(" · ")}` : ""}</span></div>
      <div class="eyebrow" style="margin-bottom:8px">Between rounds</div>
      <div class="plans" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:0">${Object.entries(CORNER).map(([k, c]) => `<button class="plan ${UI.corner === k ? "on" : ""}" data-a="corner" data-i="${k}"><b>${c.name}</b><small>${c.tip}</small></button>`).join("")}</div>
      <div class="eyebrow" style="margin:16px 0 0">Plan for round ${FS.rd + 1}</div>
      <div class="plans" style="margin-top:8px">${Object.entries(PLANS).map(([k, p]) => `<button class="plan ${FS.plan[0] === k ? "on" : ""}" data-a="plan" data-i="${k}"><b>${p.corner}</b><small>${p.tip}</small></button>`).join("")}</div>
      <button class="btn red lg" data-a="nextround" style="margin-top:16px">Round ${FS.rd + 1}</button></div>`;
  } else if (end) ctl = endCard(FS);
  const e = FS.feed[0];
  return `<div class="fn">
    <div class="arena ${FS.title ? "title" : ""}" id="arena">
      <div class="cam" id="cam">
        <canvas id="oct" aria-label="${esc(A.name)} against ${esc(B.name)}"></canvas>
        <div class="anc" id="p0" style="--x:${screenPct(L.x[0])}"></div><div class="anc" id="p1" style="--x:${screenPct(L.x[1])}"></div>
        <div class="fx" id="fx"></div>
      </div>
      <div class="posb ${FS.pos === "ground" ? "gr" : ""}" id="pos">${posText(FS)}</div>
      <div class="bug">${fs(FS, 0)}<div class="clk"><small id="rd">R${FS.rd} OF 3</small><b id="clk">${clock(FS)}</b></div>${fs(FS, 1)}</div>
      <div id="mo"></div><div id="rcard"></div>
    </div>
    ${a ? `<div class="momentum" title="Momentum"><i id="mom" style="left:${50 - FS.mom / 2}%"></i></div>` : ""}
    <div class="call" id="call">${e ? callLine(e) : '<span class="t">R1 5:00</span><span>The referee waves them in.</span>'}</div>
    ${a ? `<div class="pbp" id="pbp">${FS.feed.slice(1, 4).map((x) => `<div>${x.txt}</div>`).join("")}</div>` : ""}
    ${ctl}</div>`;
}
const posText = (FS) => (FS.pos === "ground" ? `On the ground · ${esc(last(FS.f[FS.top].name))} on top` : "Standing");
const callLine = (e) => { const el = Math.max(0, 300 - (e.t + 1) * 25); return `<span class="t">R${e.rd} ${Math.floor(el / 60)}:${String(el % 60).padStart(2, "0")}</span><span>${e.txt.replace(/<b>/g, `<b class="${e.side === 0 ? "l" : "r"}">`)}</span>`; };

// ---------- Effects ----------
const $ = (id) => document.getElementById(id);
function retrigger(el, cls, mv, opt) { if (!el) return; if (/^p[01]$/.test(el.id)) arenaAct(+el.id[1], cls, mv, opt); }
function burst(FS, i, { big = false, label = "", col, part = "head" } = {}) {
  const fx = $("fx"), p = $("p" + i); if (!fx || !p) return;
  // On the drawn fighter: his head (or body), nudged towards the side the blow came from.
  const pt = arenaHitPt(i, part), cs = getComputedStyle($("arena")), fl = +cs.getPropertyValue("--fl") || 76, fh = +cs.getPropertyValue("--fh") || 43;
  const x = pt ? pt.x + (i ? -1.5 : 1.5) : +p.style.getPropertyValue("--x"), y = pt ? pt.y : fl - fh * 0.8;
  const b = document.createElement("div");
  b.className = "burst" + (big ? " big" : "");
  b.style.cssText = `left:${x}%;top:${y}%;${col ? `--bc:${col}` : ""}`;
  b.innerHTML = `<i></i>${label ? `<b>${label}</b>` : ""}`;
  fx.appendChild(b); setTimeout(() => b.remove(), big ? 1100 : 650);
}
function shake(big) { const c = $("cam"); if (!c) return; const k = big ? "shake-big" : "shake"; c.classList.remove(k); void c.offsetWidth; c.classList.add(k); }
function flash() { const a = $("arena"); if (!a) return; const f = document.createElement("div"); f.className = "flash"; a.appendChild(f); setTimeout(() => f.remove(), 500); }
const relayout = syncArena;

export function updateLive(FS, ev) {
  for (const i of [0, 1]) {
    const h = Math.max(0, FS.hp[i]);
    if ($("hp" + i)) { $("hp" + i).style.width = h + "%"; $("hp" + i).style.background = hpCol(h); }
    if ($("hpg" + i)) $("hpg" + i).style.width = h + "%";
    if ($("st" + i)) $("st" + i).style.width = FS.st[i] + "%";
    if ($("ss" + i)) $("ss" + i).textContent = statLine(FS, i);
  }
  if ($("clk")) $("clk").textContent = clock(FS);
  if ($("mom")) $("mom").style.left = 50 - FS.mom / 2 + "%";
  if ($("pos")) { $("pos").textContent = posText(FS); $("pos").className = "posb " + (FS.pos === "ground" ? "gr" : ""); }
  if ($("call") && FS.feed[0]) $("call").innerHTML = callLine(FS.feed[0]);
  if ($("pbp")) $("pbp").innerHTML = FS.feed.slice(1, 4).map((x) => `<div>${x.txt}</div>`).join("");
  if (!ev) return relayout(FS);
  const pa = $("p" + ev.a), pd = $("p" + ev.d);
  switch (ev.kind) {
    case "punch": case "kick": {
      retrigger(pa, "atk", ev.mv);
      if (ev.dmg) {
        retrigger(pd, ev.big ? "bighit" : "hit");
        if (ev.kd) retrigger(pd, "kd");
        const part = /leg kick/.test(ev.mv || "") ? "legs" : /body|knee/.test(ev.mv || "") ? "body" : "head";
        setTimeout(() => {
          burst(FS, ev.d, { big: ev.big, part, label: ev.kd ? "DOWN!" : ev.big ? ev.mv.toUpperCase() : "" });
          if (ev.big) shake(ev.kd);
          if (ev.kd) flash();
        }, arenaImpactIn(ev.a));
      } break;
    }
    case "miss": retrigger(pa, "atk", ev.mv, { miss: true }); retrigger(pd, "dodge"); break;
    case "td": retrigger(pa, "dash"); burst(FS, ev.d, { label: "TAKEDOWN", col: "#e8c46a" }); shake(false); break;
    case "tdx": retrigger(pa, "dash"); retrigger(pd, "sprawl"); break;
    case "gnp": retrigger(pa, "pound"); retrigger(pd, "hit"); burst(FS, ev.d, {}); break;
    case "subtry": retrigger(pa, "squeeze"); break;
    case "sub": retrigger(pa, "squeeze"); burst(FS, ev.d, { big: true, label: "TAP!", col: "#e8c46a" }); flash(); break;
  }
  if (ev.ko) { arenaAct(ev.d, "bighit"); setTimeout(() => { flash(); shake(true); burst(FS, ev.d, { big: true, label: "KO!" }); }, arenaImpactIn(ev.a)); }
  setTimeout(() => relayout(FS), ev.kind === "td" ? 260 : 120);
}

// Plays the outcome of a corner call on the arena.
export function playMoment(FS, res) {
  const anim = res.anim, ok = res.ok;
  const att = ["swarm", "gnp", "hold"].includes(anim) ? 0 : ["eat", "gnp-me"].includes(anim) ? 1 : ok ? 0 : 1, d = 1 - att;
  const pa = $("p" + att), pd = $("p" + d);
  const hitAnim = { swarm: "flurry", flurry: "flurry", big: "atk", kick: "atk", counter: "atk", eat: "atk", gnp: "pound", "gnp-me": "pound" }[anim];
  if (hitAnim) {
    retrigger(pa, hitAnim, { kick: "head kick", big: "overhand", counter: "cross", gnp: "", "gnp-me": "" }[anim]);
    const n = hitAnim === "flurry" ? 3 : 1;
    for (let k = 0; k < n; k++) setTimeout(() => { retrigger(pd, k === n - 1 && (anim === "big" || res.ko) ? "bighit" : "hit"); burst(FS, d, { big: k === n - 1 && (anim === "big" || res.ko || anim === "counter"), label: k === n - 1 ? (res.ko ? "KO!" : anim === "big" ? "DOWN!" : anim === "counter" ? "COUNTER" : "") : "" }); }, 120 + k * 170);
    if (anim === "big" || res.ko || anim === "counter") setTimeout(() => { shake(true); if (anim === "big") { retrigger(pd, "kd"); flash(); } }, 150 + (n - 1) * 170);
  } else if (anim === "td" || anim === "tdx") { retrigger(pa, "dash"); if (anim === "tdx") retrigger(pd, "sprawl"); else burst(FS, d, { label: "TAKEDOWN", col: "#e8c46a" }); }
  else if (anim === "sub") { retrigger(pa, "squeeze"); setTimeout(() => { burst(FS, d, { big: true, label: "TAP!", col: "#e8c46a" }); flash(); }, 500); }
  else if (anim === "clinch") { retrigger($("p0"), "dash"); }
  else if (anim === "block") { retrigger($("p1"), "atk"); retrigger($("p0"), ok ? "guard" : "hit"); if (!ok) burst(FS, 0, {}); }
  else if (anim === "slip") { retrigger($("p1"), "atk", "", { miss: true }); retrigger($("p0"), "dodge"); setTimeout(() => { retrigger($("p0"), "atk"); retrigger($("p1"), "hit"); burst(FS, 1, {}); }, 260); }
  else if (anim === "escape" || anim === "up" || anim === "scramble") { retrigger($("p0"), "dodge"); }
  if (res.ko) setTimeout(flash, 200);
  setTimeout(() => updateLive(FS), 400);
}

// Corner call: the fight slows, the camera pushes in on the key fighter, a ring marks the target,
// and 2–3 icon buttons appear. Resolves with the choice, or the fighter's own pick when time runs out.
export function askMoment(FS, m, autoIdx, seconds = 5) {
  const mo = $("mo"), arena = $("arena"), fx = $("fx"), pf = $("p" + m.focus);
  if (!mo || !arena) return Promise.resolve(autoIdx);
  const x = +pf?.style.getPropertyValue("--x") || 50;
  arena.style.setProperty("--fx", x + "%");
  arena.classList.add("mo-on"); arenaFocus(m.focus);
  const rocked = /^hurt/.test(m.id || "") ? m.focus : -1;
  if (rocked >= 0) arenaRock(rocked, true);
  let ring = null;
  if (m.target && fx) {
    ring = document.createElement("div");
    ring.className = `tgt t-${m.target} ${m.tone}`;
    ring.style.left = x + (m.focus ? -1 : 1) + "%"; ring.style.visibility = "hidden"; // shown once the camera has pushed in
    fx.appendChild(ring);
  }
  const btn = (c, i) => `<button data-a="mpick" data-i="${i}" class="${i === m.hint ? "hint" : ""}"><span class="mo-ic">${aicon(c.icon)}</span><b>${esc(c.label)}</b>${i === m.hint ? `<small>${esc(m.why)}</small>` : ""}</button>`;
  return new Promise((res) => {
    let t = 0, shown = false;
    const show = () => {
      shown = true;
      mo.innerHTML = `<div class="moment ${m.tone} f${m.focus}"><div class="mo-in"><h2>${esc(m.title)}</h2>
        <div class="mo-c n${m.choices.length}">${m.choices.map(btn).join("")}</div>
        <div class="mo-timer"><i style="animation-duration:${seconds}s"></i></div></div></div>`;
      t = setTimeout(() => done(autoIdx, true), seconds * 1000);
      const hp = ring && arenaHitPt(m.focus, m.target); if (hp) { ring.style.top = hp.y + "%"; ring.style.left = hp.x + (m.focus ? -1 : 1) + "%"; } if (ring) ring.style.visibility = ""; // where the camera now has him
    };
    const s0 = setTimeout(show, 380); // the slow-motion push-in plays first
    const done = (i, auto) => {
      clearTimeout(t); clearTimeout(s0); UI.mpick = null;
      arena.classList.remove("mo-on"); arenaFocus(-1); ring?.remove(); if (rocked >= 0) arenaRock(rocked, false);
      mo.innerHTML = auto ? `<div class="mo-auto">On instinct: <b>${esc(m.choices[i].label)}</b></div>` : "";
      setTimeout(() => { if (mo.firstChild?.className === "mo-auto") mo.innerHTML = ""; }, 1200);
      res(i);
    };
    UI.mpick = (i) => { if (i >= 0 && !shown) return; done(i < 0 ? autoIdx : i, false); };
  });
}
// Big text card over the arena: round starts, "It's all over", "To the judges".
export function card(text, sub = "", ms = 1100, cls = "") {
  const c = $("rcard"); if (!c) return;
  c.innerHTML = `<div class="rc ${cls}"><b>${text}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
  setTimeout(() => { if (c.firstChild) c.innerHTML = ""; }, ms);
}
export function resultBanner(txt) {
  const c = $("rcard"); if (!c) return;
  c.innerHTML = `<div class="mo-res">${txt}</div>`;
  setTimeout(() => { if (c.firstChild?.className === "mo-res") c.innerHTML = ""; }, 1700);
}

function endCard(FS) {
  const r = FS.res, F = FS.f, W = F[r.w], fin = r.how === "KO/TKO" || r.how === "Submission", a = analyst();
  const head = r.wasChamp ? "New champion" : r.won ? (fin ? (r.how === "KO/TKO" ? "Knockout" : "Submission") : "Victory") : fin ? (r.how === "KO/TKO" ? "Knocked out" : "Tapped out") : "Defeat";
  return `<div class="panel result" style="margin-top:14px;border-top:4px solid ${r.won ? "var(--green)" : "var(--red)"}">
    <div class="big" style="color:${r.won ? "#fff" : "var(--red2)"}">${head}</div>
    <h2 style="margin-top:12px">${esc(W.name)} wins by ${r.how.toLowerCase()}${r.detail && fin ? ` (${esc(r.detail)})` : ""}</h2>
    <div class="mute">${fin ? `Round ${r.rdEnd} · ${r.at}` : `After 3 rounds${a ? " · " + esc(r.detail) : ""}`}</div>
    <div class="hero-strip" style="max-width:720px;margin:20px auto 0;text-align:left"><div><small>Your commission</small><b class="warn" id="cu" data-v="${r.cut}">${money(r.cut)}</b></div>
      <div><small>Ranking</small><b>${rankLabel(r.rk1[0])}</b></div><div><small>${r.wks ? "Injury" : "Record"}</small><b class="${r.wks ? "bad" : ""}">${r.wks ? r.wks + " weeks out" : rec(F[0])}</b></div></div>
    ${a ? `<div class="small mute" style="margin-top:10px">Strikes ${FS.stats[0].str}–${FS.stats[1].str} · Takedowns ${FS.stats[0].td}–${FS.stats[1].td} · Knockdowns ${FS.stats[0].kd}–${FS.stats[1].kd} · Purse ${money(r.pay)} · Rep ${Math.round(G.rep)}</div>` : ""}
    <button class="btn red lg" data-a="fdone" style="margin-top:20px">${UI.queue.length ? "Next fight" : "Continue"}</button></div>`;
}
