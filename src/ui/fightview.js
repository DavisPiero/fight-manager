// Fight night: tale of the tape, live broadcast view, corner between rounds, result.
import { G, ovr, rec, rankLabel } from "../state.js";
import { DIVISIONS, ATTR_KEYS, ATTR_SHORT, AGENCY_COLOURS } from "../data/constants.js";
import { esc, money, last } from "../util.js";
import { photoOf } from "./avatar.js";
import { analyst, AREAS, areaVal, grade } from "./components.js";
import { PLANS, CORNER, clock } from "../sim/fight.js";
import { UI } from "./uistate.js";

const SIL = '<svg viewBox="0 0 100 120" class="sil"><path d="M50 10c-12 0-20 10-20 23 0 10 5 18 10 22v7c-16 3-30 11-34 26L4 120h92l-2-32c-4-15-18-23-34-26v-7c5-4 10-12 10-22 0-13-8-23-20-23z"/></svg>';
const pic = (f) => { const p = photoOf(f); return p ? `<img src="${p}" alt="${esc(f.name)}">` : SIL; };
const hpCol = (h) => (h > 55 ? "#2fbf71" : h > 28 ? "#e8c46a" : "#ff2d2d");
const myCol = () => AGENCY_COLOURS[G.ag.col];

export function vFight() { return UI.FS.ph === "pre" ? pre(UI.FS) : live(UI.FS); }

function pre(FS) {
  const [A, B] = FS.f, a = analyst();
  const cmp = (x, y) => (x > y ? 0 : y > x ? 1 : -1);
  const row = (l, x, y, better = -1) => `<div class="trow"><b class="${better === 0 ? "adv" : ""}">${x}</b><span>${l}</span><b class="${better === 1 ? "adv" : ""}" style="text-align:left">${y}</b></div>`;
  const rows = [row("Record", rec(A), rec(B)), row("Rank", rankLabel(FS.r0[0]), rankLabel(FS.r0[1])), row("Age", A.age, B.age), row("Overall", ovr(A), ovr(B), cmp(ovr(A), ovr(B)))];
  if (a) ATTR_KEYS.forEach((k, i) => rows.push(row(ATTR_SHORT[i], A.at[k], B.at[k], cmp(A.at[k], B.at[k]))));
  else AREAS.forEach(([n, k]) => { const x = areaVal(A, k), y = areaVal(B, k); rows.push(row(n, grade(x), grade(y), cmp(x, y))); });
  if (A.reach && B.reach) rows.push(row("Reach", A.reach + '"', B.reach + '"'));
  return `<div class="fn view-in">
    <div class="row spread" style="margin-bottom:12px"><div class="eyebrow">${FS.b.title ? "Title fight · " : ""}${DIVISIONS[A.wc]} bout · 3 rounds</div><span class="small mute">Week ${G.wk}</span></div>
    <div class="tape">
      <div class="side l">${pic(A)}</div>
      <div class="mid"><div class="names"><b style="text-align:right">${esc(A.name)}</b><span class="vs">VS</span><b>${esc(B.name)}</b></div>${rows.join("")}</div>
      <div class="side r">${pic(B)}</div>
    </div>
    <div class="panel" style="margin-top:16px"><div class="panel-h"><h2>Game plan</h2><span class="small mute">You can shout new instructions at any time</span></div>
      <div class="plans">${planButtons(FS)}</div>
      <button class="btn red lg" data-a="fstart" style="margin-top:16px">Walk out</button></div></div>`;
}
const planButtons = (FS) => Object.entries(PLANS).map(([k, p]) => `<button class="plan ${FS.plan[0] === k ? "on" : ""}" data-a="plan" data-i="${k}"><b>${p.name}</b><small>${p.tip}</small></button>`).join("");

function fs(FS, i) {
  const f = FS.f[i], a = analyst();
  return `<div class="fs ${i ? "r" : ""}" style="--c:${i ? "#3d7bff" : myCol()}"><div class="nm">${esc(last(f.name))}</div><div class="rk">${rankLabel(FS.r0[i])} · ${rec(f)}</div>
    <div class="hp"><i class="gh" id="hpg${i}" style="width:${Math.max(0, FS.hp[i])}%"></i><i id="hp${i}" style="width:${Math.max(0, FS.hp[i])}%;background:${hpCol(FS.hp[i])}"></i></div>
    ${a ? `<div class="stam"><i id="st${i}" style="width:${FS.st[i]}%"></i></div><div class="sub" id="ss${i}">${statLine(FS, i)}</div>` : ""}</div>`;
}
const statLine = (FS, i) => `Strikes ${FS.stats[i].str}/${FS.stats[i].att} · TD ${FS.stats[i].td}`;

function live(FS) {
  const [A, B] = FS.f, end = FS.ph === "end", a = analyst();
  const loser = end && FS.fin ? 1 - FS.res.w : -1;
  let ctl = "";
  if (FS.ph === "run") ctl = `<div class="plans">${planButtons(FS)}</div>
    <div class="fctl"><span class="small mute">Speed</span><div class="seg">${[1, 2, 4].map((s) => `<button class="${UI.speed === s ? "on" : ""}" data-a="speed" data-i="${s}">${s}×</button>`).join("")}</div><button class="btn quiet sm" data-a="skip" style="margin-left:auto">Skip to result</button></div>`;
  else if (FS.ph === "corner") {
    const verdict = FS.dm[0] > FS.dm[1] + 3 ? "You took that round." : FS.dm[0] < FS.dm[1] - 3 ? "You lost that round." : "Too close to call.";
    ctl = `<div class="panel" style="margin-top:14px;border-top:4px solid var(--gold)"><div class="panel-h"><h2>Corner · Round ${FS.rd} done</h2><span class="mute">${verdict}${a ? ` Judges: ${FS.cards.map((c) => c[c.length - 1].join("-")).join(" · ")}` : ""}</span></div>
      <div class="eyebrow" style="margin-bottom:8px">Your corner's call</div>
      <div class="plans" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:0">${Object.entries(CORNER).map(([k, c]) => `<button class="plan ${UI.corner === k ? "on" : ""}" data-a="corner" data-i="${k}"><b>${c.name}</b><small>${c.tip}</small></button>`).join("")}</div>
      <div class="eyebrow" style="margin:16px 0 0">Plan for round ${FS.rd + 1}</div>
      <div class="plans" style="margin-top:8px">${Object.entries(PLANS).map(([k, p]) => `<button class="plan ${FS.plan[0] === k ? "on" : ""}" data-a="plan" data-i="${k}"><b>${p.corner}</b><small>${p.tip}</small></button>`).join("")}</div>
      <button class="btn red lg" data-a="nextround" style="margin-top:16px">Round ${FS.rd + 1}</button></div>`;
  } else if (end) ctl = endCard(FS);
  const e = FS.feed[0];
  return `<div class="fn">
    <div class="octagon">
      <div class="posb ${FS.pos === "ground" ? "gr" : ""}" id="pos">${posText(FS)}</div>
      <div class="corner-l ${loser === 0 ? "down" : ""}" id="p0">${pic(A)}</div>
      <div class="corner-r ${loser === 1 ? "down" : ""}" id="p1">${pic(B)}</div>
      <div class="bug">${fs(FS, 0)}<div class="clk"><small id="rd">R${FS.rd} OF 3</small><b id="clk">${clock(FS)}</b></div>${fs(FS, 1)}</div>
    </div>
    ${a ? `<div class="momentum" title="Momentum"><i id="mom" style="left:${50 - FS.mom / 2}%"></i></div>` : ""}
    <div class="call" id="call">${e ? callLine(e) : '<span class="t">R1 5:00</span><span>The referee waves them in.</span>'}</div>
    ${a ? `<div class="pbp" id="pbp">${FS.feed.slice(1, 4).map((x) => `<div>${x.txt}</div>`).join("")}</div>` : ""}
    ${ctl}</div>`;
}
const posText = (FS) => (FS.pos === "ground" ? `On the ground · ${esc(last(FS.f[FS.top].name))} on top` : "Standing");
const callLine = (e) => { const el = 300 - (e.t + 1) * 25; return `<span class="t">R${e.rd} ${Math.floor(el / 60)}:${String(el % 60).padStart(2, "0")}</span><span>${e.txt.replace(/<b>/g, `<b class="${e.side === 0 ? "l" : "r"}">`)}</span>`; };

export function updateLive(FS, ev) {
  const $ = (id) => document.getElementById(id);
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
  if ($("call")) $("call").innerHTML = callLine(FS.feed[0]);
  if ($("pbp")) $("pbp").innerHTML = FS.feed.slice(1, 4).map((x) => `<div>${x.txt}</div>`).join("");
  if (ev.a >= 0 && /punch|kick|gnp|td/.test(ev.kind)) { const pa = $("p" + ev.a); if (pa) { pa.classList.remove("attack"); void pa.offsetWidth; pa.classList.add("attack"); } }
  if (ev.dmg && ev.d >= 0) {
    const pd = $("p" + ev.d);
    if (pd) {
      pd.classList.remove("hit"); void pd.offsetWidth; pd.classList.add("hit");
      if (ev.big || analyst()) { const n = document.createElement("div"); n.className = "dmg" + (ev.big ? " big" : ""); n.textContent = ev.big ? (ev.ko ? "KO!" : "BIG SHOT") : "-" + Math.round(ev.dmg); pd.appendChild(n); setTimeout(() => n.remove(), 900); }
    }
  }
}

function endCard(FS) {
  const r = FS.res, F = FS.f, W = F[r.w], fin = r.how === "KO/TKO" || r.how === "Submission", a = analyst();
  const head = r.wasChamp ? "New champion" : r.won ? (fin ? (r.how === "KO/TKO" ? "Knockout" : "Submission") : "Victory") : fin ? (r.how === "KO/TKO" ? "Knocked out" : "Tapped out") : "Defeat";
  return `<div class="panel result" style="margin-top:14px;border-top:4px solid ${r.won ? "var(--green)" : "var(--red)"}">
    <div class="big" style="color:${r.won ? "#fff" : "var(--red2)"}">${head}</div>
    <h2 style="margin-top:12px">${esc(W.name)} wins by ${r.how.toLowerCase()}${r.detail && fin ? ` (${esc(r.detail)})` : ""}</h2>
    <div class="mute">${fin ? `Round ${r.rdEnd} · ${r.at}` : `After 3 rounds${a ? " · " + esc(r.detail) : ""}`}</div>
    <div class="hero-strip" style="max-width:720px;margin:20px auto 0;text-align:left"><div><small>Your commission</small><b class="warn" id="cu" data-v="${r.cut}">${money(r.cut)}</b></div>
      <div><small>Ranking</small><b>${rankLabel(r.rk1[0])}</b></div><div><small>${r.wks ? "Injury" : "Record"}</small><b class="${r.wks ? "bad" : ""}">${r.wks ? r.wks + " weeks" : rec(F[0])}</b></div></div>
    ${a ? `<div class="small mute" style="margin-top:10px">Strikes ${FS.stats[0].str}–${FS.stats[1].str} · Takedowns ${FS.stats[0].td}–${FS.stats[1].td} · Purse ${money(r.pay)} · Rep ${Math.round(G.rep)}</div>` : ""}
    <button class="btn red lg" data-a="fdone" style="margin-top:20px">${UI.queue.length ? "Next fight" : "Continue"}</button></div>`;
}
