// Fight night: tale of the tape, live broadcast view, corner between rounds, result.
import { G, ovr, rec, rankLabel } from "../state.js";
import { DIVISIONS, ATTR_KEYS, ATTR_SHORT } from "../data/constants.js";
import { esc, money, last } from "../util.js";
import { avatar } from "./avatar.js";
import { PLANS, CORNER, clock } from "../sim/fight.js";
import { UI } from "./uistate.js";
import { AGENCY_COLOURS } from "../data/constants.js";

const hpCol = (h) => (h > 55 ? "var(--green)" : h > 28 ? "var(--gold)" : "var(--red)");

export function vFight() {
  const FS = UI.FS;
  return FS.ph === "pre" ? pre(FS) : live(FS);
}

function pre(FS) {
  const [A, B] = FS.f;
  const row = (l, a, b, better) => `<div class="l ${better === 0 ? "adv" : ""}">${a}</div><div class="m">${l}</div><div class="r ${better === 1 ? "adv" : ""}">${b}</div>`;
  const cmp = (a, b) => (a > b ? 0 : b > a ? 1 : -1);
  return `<div class="view-in" style="max-width:1000px;margin:0 auto;padding:18px 16px 60px">
    <div class="centre small mute" style="letter-spacing:.16em;text-transform:uppercase">${FS.b.title ? '<span class="warn">Title fight</span> · ' : ""}${DIVISIONS[A.wc]} · 3 rounds · week ${G.wk}</div>
    <div class="arena" style="margin-top:12px">
      <div class="stage" style="min-height:0;margin:6px 0 18px">
        <div class="portrait" style="--pc:${AGENCY_COLOURS[G.ag.col]};animation:lungeL .7s reverse">${avatar(A, 190)}</div>
        <div class="centre"><div class="vs">VS</div></div>
        <div class="portrait" style="--pc:#4c8dff;animation:lungeR .7s reverse">${avatar(B, 190)}</div>
      </div>
      <div class="tape">
        <div class="l" style="font-size:28px">${esc(A.name)}</div><div class="m">Fighter</div><div class="r" style="font-size:28px">${esc(B.name)}</div>
        ${row("Record", rec(A), rec(B), -1)}
        ${row("Overall", ovr(A), ovr(B), cmp(ovr(A), ovr(B)))}
        ${row("Ranking", rankLabel(FS.r0[0]), rankLabel(FS.r0[1]), -1)}
        ${row("Age", A.age, B.age, -1)}
        ${row("Style", A.style, B.style, -1)}
        ${ATTR_KEYS.map((k, i) => row(ATTR_SHORT[i], A.at[k], B.at[k], cmp(A.at[k], B.at[k]))).join("")}
        ${row("Camp prep", A.prep + "%", "—", -1)}
      </div>
    </div>
    <div class="card" style="margin-top:16px"><h2>Your game plan for round 1</h2><p class="small mute">You can change it at any moment during the fight.</p>
      <div class="controls">${planButtons(FS)}</div>
      <button class="btn primary lg" data-a="fstart" style="margin-top:16px">Walk out</button></div></div>`;
}

const planButtons = (FS) => Object.entries(PLANS).map(([k, p]) => `<button class="plan ${FS.plan[0] === k ? "on" : ""}" data-a="plan" data-i="${k}"><b>${p.name}</b><small>${p.tip}</small></button>`).join("");

function side(FS, i) {
  const f = FS.f[i];
  return `<div class="fside ${i ? "r" : ""}">${avatar(f, 54, "round")}<div class="bars"><div class="nm">${esc(last(f.name))}</div><div class="small mute">${rec(f)} · OVR ${ovr(f)}</div>
    <div class="hpbar"><i class="ghost" id="hpg${i}" style="width:${Math.max(0, FS.hp[i])}%"></i><i id="hp${i}" style="width:${Math.max(0, FS.hp[i])}%;background:${hpCol(FS.hp[i])}"></i></div>
    <div class="stbar"><i id="st${i}" style="width:${FS.st[i]}%"></i></div>
    <div class="small dim" id="ss${i}">Strikes ${FS.stats[i].str}/${FS.stats[i].att} · TD ${FS.stats[i].td}</div></div></div>`;
}

function live(FS) {
  const [A, B] = FS.f, end = FS.ph === "end", res = FS.res;
  const lw = end ? res.w : -1;
  const pos = FS.pos === "ground" ? `<span class="posbadge gr">Ground · ${esc(last(FS.f[FS.top].name))} on top</span>` : '<span class="posbadge">Standing</span>';
  let ctl = "";
  if (FS.ph === "run") ctl = `<div class="controls"><span class="small mute" style="margin-right:4px">Shout to your fighter:</span>${planButtons(FS)}
    <div style="margin-left:auto" class="seg">${[1, 2, 4].map((s) => `<button class="${UI.speed === s ? "on" : ""}" data-a="speed" data-i="${s}">${s}×</button>`).join("")}<button data-a="skip">Skip ›</button></div></div>`;
  else if (FS.ph === "corner") {
    const c = FS.cards.map((cd) => cd[cd.length - 1].join("-")).join(" · ");
    ctl = `<div class="card" style="margin-top:14px;border-color:#f2b33d66"><div class="card-h"><h2>Corner · before round ${FS.rd + 1}</h2><span class="small mute">Round ${FS.rd} judges: ${c}</span></div>
      <p class="small mute">${FS.dm[0] > FS.dm[1] ? "You probably won that round." : FS.dm[0] < FS.dm[1] ? "You probably lost that round." : "Close round."} Pick one corner call and a plan.</p>
      <div class="controls">${Object.entries(CORNER).map(([k, c]) => `<button class="plan ${UI.corner === k ? "on" : ""}" data-a="corner" data-i="${k}"><b>${c.name}</b><small>${c.tip}</small></button>`).join("")}</div>
      <div class="controls">${Object.entries(PLANS).map(([k, p]) => `<button class="plan ${FS.plan[0] === k ? "on" : ""}" data-a="plan" data-i="${k}"><b>${p.corner}</b><small>${p.tip}</small></button>`).join("")}</div>
      <button class="btn primary lg" data-a="nextround" style="margin-top:14px">Seconds out · Round ${FS.rd + 1}</button></div>`;
  } else if (end) ctl = endCard(FS);
  return `<div style="max-width:1000px;margin:0 auto;padding:18px 16px 60px">
    <div class="arena">
      <div class="scorebug">${side(FS, 0)}<div class="clock"><div class="rd" id="rd">Round ${FS.rd} of 3</div><b id="clk">${clock(FS)}</b></div>${side(FS, 1)}</div>
      <div class="stage">
        <div class="portrait ${lw === 1 && FS.fin ? "down" : lw === 0 ? "win" : ""}" id="p0" style="--pc:${AGENCY_COLOURS[G.ag.col]}">${avatar(A, 200)}</div>
        <div class="centre"><div id="pos">${pos}</div><div class="small dim" style="margin-top:8px">${FS.b.title ? "TITLE FIGHT" : DIVISIONS[A.wc]}</div></div>
        <div class="portrait ${lw === 0 && FS.fin ? "down" : lw === 1 ? "win" : ""}" id="p1" style="--pc:#4c8dff">${avatar(B, 200)}</div>
      </div>
      <div class="row spread small dim"><span>${esc(last(A.name))} momentum</span><span>${esc(last(B.name))} momentum</span></div>
      <div class="momentum"><i id="mom" style="left:${50 - FS.mom / 2}%"></i></div>
      <div class="pbp" id="pbp">${FS.feed.slice(0, 5).map(pbpLine).join("") || '<div class="ln"><span class="t">0:00</span><span>The cage door closes. The referee waves them in.</span></div>'}</div>
    </div>${ctl}</div>`;
}
const pbpLine = (e) => { const el = 300 - (e.t + 1) * 25; return `<div class="ln ${e.side === 0 ? "l" : e.side === 1 ? "r" : ""}"><span class="t">R${e.rd} ${Math.floor(el / 60)}:${String(el % 60).padStart(2, "0")}</span><span>${e.txt}</span></div>`; };

// Partial update after each exchange so animations stay smooth.
export function updateLive(FS, ev) {
  const $ = (id) => document.getElementById(id);
  for (const i of [0, 1]) {
    const h = Math.max(0, FS.hp[i]);
    if ($("hp" + i)) { $("hp" + i).style.width = h + "%"; $("hp" + i).style.background = hpCol(h); }
    if ($("hpg" + i)) $("hpg" + i).style.width = h + "%";
    if ($("st" + i)) $("st" + i).style.width = FS.st[i] + "%";
    if ($("ss" + i)) $("ss" + i).textContent = `Strikes ${FS.stats[i].str}/${FS.stats[i].att} · TD ${FS.stats[i].td}`;
  }
  if ($("clk")) $("clk").textContent = clock(FS);
  if ($("mom")) $("mom").style.left = 50 - FS.mom / 2 + "%";
  if ($("pos")) $("pos").innerHTML = FS.pos === "ground" ? `<span class="posbadge gr">Ground · ${esc(last(FS.f[FS.top].name))} on top</span>` : '<span class="posbadge">Standing</span>';
  if ($("pbp")) $("pbp").innerHTML = FS.feed.slice(0, 5).map(pbpLine).join("");
  if (ev.a >= 0 && /punch|kick|gnp|td/.test(ev.kind)) {
    const pa = $("p" + ev.a);
    if (pa) { pa.classList.remove("attack", "l", "r"); void pa.offsetWidth; pa.classList.add("attack", ev.a ? "r" : "l"); }
  }
  if (ev.dmg && ev.d >= 0) {
    const pd = $("p" + ev.d);
    if (pd) {
      pd.classList.remove("hit"); void pd.offsetWidth; pd.classList.add("hit");
      const n = document.createElement("div"); n.className = "dmgnum" + (ev.big ? " big" : ""); n.textContent = "-" + Math.round(ev.dmg);
      pd.appendChild(n); setTimeout(() => n.remove(), 1000);
    }
  }
}

function endCard(FS) {
  const r = FS.res, F = FS.f, W = F[r.w], fin = r.how === "KO/TKO" || r.how === "Submission";
  const head = r.won ? (fin ? (r.how === "KO/TKO" ? "Knockout!" : "Submission!") : "Victory") : fin ? (r.how === "KO/TKO" ? "Knocked out" : "Tapped out") : "Defeat";
  const rk = (x) => rankLabel(x);
  return `<div class="card" style="margin-top:14px;text-align:center">
    <div class="result-banner" style="color:${r.won ? "var(--green)" : "var(--red2)"}">${r.wasChamp ? "New champion!" : head}</div>
    <h2 style="margin-top:8px">${esc(W.name)} wins by ${r.how.toLowerCase()}${r.detail && fin ? ` (${esc(r.detail)})` : ""}</h2>
    <div class="mute">${fin ? `Round ${r.rdEnd} · ${r.at}` : `After 3 rounds · ${esc(r.detail)}`}</div>
    <div class="grid g2" style="text-align:left;margin-top:16px">
      <div><div class="kv"><span>Significant strikes</span><b>${FS.stats[0].str} – ${FS.stats[1].str}</b></div>
        <div class="kv"><span>Takedowns</span><b>${FS.stats[0].td} – ${FS.stats[1].td}</b></div>
        <div class="kv"><span>${esc(F[0].name)}'s record</span><b>${rec(F[0])}</b></div>
        <div class="kv"><span>Ranking</span><b>${rk(FS.r0[0])} → ${rk(r.rk1[0])}</b></div></div>
      <div><div class="kv"><span>Purse${r.won ? " + win bonus" : ""}</span><b>${money(r.pay)}</b></div>
        <div class="kv"><span>Your commission (${F[0].ct.pct}%)</span><b class="warn" id="cu" data-v="${r.cut}">${money(r.cut)}</b></div>
        ${r.wks ? `<div class="kv"><span>Injury</span><b class="bad">${r.wks} weeks out</b></div>` : '<div class="kv"><span>Injury</span><b class="good">None</b></div>'}
        <div class="kv"><span>Reputation</span><b>${Math.round(G.rep)}</b></div></div>
    </div>
    <button class="btn primary lg" data-a="fdone" style="margin-top:18px">${UI.queue.length ? "Next fight" : "Back to the agency"}</button></div>`;
}
