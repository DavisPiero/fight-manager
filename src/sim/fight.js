// Fight simulation. One round = 12 exchanges (25 seconds each). The UI calls step() on a timer.
import { R, rnd, ri, cl, pk, last } from "../util.js";
import { G, ovr, rank, say, earn, bumpRanks } from "../state.js";
import { onFight } from "./phone.js";

export const PLANS = {
  norm: { name: "Balanced", tip: "Even approach", corner: "Keep it up" },
  agg: { name: "Pressure", tip: "More damage both ways", corner: "Go for the finish" },
  safe: { name: "Counter", tip: "Less risk, less damage", corner: "Stay safe" },
  td: { name: "Wrestle", tip: "Look for takedowns", corner: "Take him down" },
};
export const CORNER = {
  water: { name: "Ice and water", tip: "+20 stamina" },
  cut: { name: "Cutman", tip: "+10 health" },
  fire: { name: "Fire him up", tip: "+15% damage next round, -5 stamina" },
};
const art = (w) => (/^[aeiou]/.test(w) ? "an " : "a ") + w;
const agg = (p) => (p === "agg" ? 1.25 : p === "safe" ? 0.8 : 1);

export function newFight(b) {
  const me = G.f[b.fid], op = G.f[b.oid];
  const form = (f) => (f.pers === "Inconsistent" ? rnd(0.9, 1.1) : 1) * (1 + ((f.mood ?? 60) - 60) / 1000);
  return {
    b, f: [me, op], hp: [100, 100], st: [100, 100], pos: "stand", top: null,
    plan: ["norm", "norm"], rd: 1, ex: 0, dm: [0, 0], cards: [[], [], []],
    stats: [{ str: 0, att: 0, td: 0, kd: 0 }, { str: 0, att: 0, td: 0, kd: 0 }],
    feed: [], mom: 0, fin: null, ph: "pre", boost: [1, 1], form: [form(me), form(op)],
    r0: [rank(me), rank(op)], hits: [],
  };
}

function power(FS, i) {
  const f = FS.f[i], a = f.at, m = (0.75 + 0.25 * FS.st[i] / 100) * FS.form[i], p = 0.92 + 0.16 * (i === 0 ? f.prep : 50) / 100;
  return { str: (Math.max(a.box, a.kick, a.thai) * 0.6 + (a.box + a.kick + a.thai) / 3 * 0.4) * m * p, a, m };
}

export function aiPlan(FS) {
  const op = FS.f[1].at, me = FS.f[0].at;
  if (FS.hp[1] < 35 && FS.hp[0] > FS.hp[1]) return "safe";
  if (FS.rd === 3 && FS.dm[1] < FS.dm[0] - 5) return "agg";
  if (op.wres - me.tdd > 10) return "td";
  if (FS.hp[0] < 40) return "agg";
  if (FS.f[1].pers === "Hotheaded") return "agg";
  return pk(["norm", "norm", "safe", "agg"]);
}

// One exchange. Returns an event the UI can animate.
export function step(FS) {
  const F = FS.f, s = [power(FS, 0), power(FS, 1)], P = FS.plan;
  const ln = (i) => `<b>${last(F[i].name)}</b>`;
  let ev = { a: -1, d: -1, dmg: 0, big: false, txt: "", kind: "" };
  if (FS.pos === "stand") {
    const w0 = s[0].str * agg(P[0]), w1 = s[1].str * agg(P[1]);
    const a = R() < w0 / (w0 + w1) ? 0 : 1, d = 1 - a, A = s[a], D = s[d];
    ev.a = a; ev.d = d;
    const tdTry = 0.1 + (P[a] === "td" ? 0.35 : 0) + (A.a.wres > 75 ? 0.05 : 0);
    if (R() < tdTry) {
      const ok = R() < cl(0.35 + (A.a.wres - D.a.tdd) / 150, 0.1, 0.85);
      ev.kind = ok ? "td" : "tdx";
      if (ok) { FS.stats[a].td++; FS.pos = "ground"; FS.top = a; FS.dm[a] += 3; ev.txt = `${ln(a)} drives through and takes ${ln(d)} down!`; }
      else ev.txt = `${ln(d)} stuffs the takedown.`;
    } else {
      const mv = pk(["jab", "cross", "hook", "leg kick", "body kick", "head kick", "knee", "overhand", "uppercut", "elbow"]);
      const kk = /kick|knee/.test(mv), heavy = /head kick|hook|overhand|uppercut|elbow/.test(mv);
      FS.stats[a].att++;
      const land = R() < cl(0.5 + (A.str - (D.a.iq * 0.3 + D.str * 0.7)) / 150, 0.22, 0.85);
      ev.kind = kk ? "kick" : "punch"; ev.mv = mv;
      if (land) {
        FS.stats[a].str++;
        ev.dmg = (2.5 + R() * 4.5) * (heavy ? 1.35 : 1) * agg(P[a]) * FS.boost[a] * (1.1 - F[d].at.dur / 400) * (0.85 + A.a[kk ? "kick" : "box"] / 300);
        ev.big = ev.dmg > 7;
        // Heavy shots can drop anyone, more so when he's already hurt: a knockdown.
        if (heavy && R() < cl(0.04 + (A.str - F[d].at.dur) / 260 + (100 - FS.hp[d]) / 450, 0.02, 0.22) * agg(P[a])) {
          ev.kd = true; ev.big = true; ev.dmg += 6; FS.stats[a].kd++;
          ev.txt = `${ln(a)} lands ${art(mv)} — <em>${last(F[d].name)} goes down!</em>`;
        } else ev.txt = `${ln(a)} lands ${art(mv)}${ev.big ? " — <em>big shot!</em>" : "."}`;
      } else { ev.kind = "miss"; ev.txt = `${last(F[a].name)} throws ${art(mv)}, ${last(F[d].name)} slips it.`; }
    }
  } else {
    const t = FS.top, b = 1 - t, r = R();
    if (r < 0.42) {
      ev = { ...ev, a: t, d: b, kind: "gnp", dmg: (2 + R() * 3) * agg(P[t]) * FS.boost[t], txt: `${ln(t)} rains down ground and pound.` };
      FS.stats[t].str++; FS.stats[t].att++;
    } else if (r < 0.72) {
      ev.a = t; ev.d = b; ev.kind = "subtry";
      if (R() < cl(0.12 + (s[t].a.bjj - s[b].a.bjj * 0.9 - s[b].a.dur * 0.2) / 220, 0.03, 0.5)) {
        FS.fin = { w: t, how: "Submission", detail: pk(["rear-naked choke", "guillotine", "arm-triangle", "armbar", "kimura", "triangle choke"]) };
        ev.kind = "sub"; ev.txt = `${ln(t)} locks in a ${FS.fin.detail} — <em>TAP!</em>`;
      } else ev.txt = `${last(F[t].name)} hunts a submission, ${last(F[b].name)} survives.`;
    } else {
      ev.a = b; ev.d = t;
      if (R() < cl(0.3 + (s[b].a.wres + s[b].a.bjj - s[t].a.wres - s[t].a.bjj) / 300, 0.1, 0.7)) {
        FS.pos = "stand"; FS.top = null; ev.kind = "up"; ev.txt = `${last(F[b].name)} scrambles back to the feet.`;
      } else { ev.kind = "hold"; ev.txt = `${last(F[b].name)} can't get out from the bottom.`; }
    }
  }
  if (ev.dmg) {
    const a = ev.a, d = ev.d;
    FS.hp[d] -= ev.dmg; FS.dm[a] += ev.dmg;
    if (ev.dmg > 7.5 && FS.hp[d] < 70) { FS.dm[a] += 4; FS.stats[a].kd += ev.dmg > 9 ? 1 : 0; ev.txt += ` <em>${last(F[d].name)} is hurt!</em>`; }
    if (FS.hp[d] <= 0 || (ev.kd && R() < 0.22 + (100 - FS.hp[d]) / 220) || (ev.dmg > 6.5 && R() < Math.max(0, (40 - FS.hp[d]) / 40) * 0.4)) {
      FS.fin = { w: a, how: "KO/TKO", detail: ev.kind === "gnp" ? "ground and pound" : "strikes" };
      ev.ko = true; ev.txt += " <em>He's down — it's all over!</em>";
    }
  }
  FS.mom = cl(FS.mom * 0.85 + (ev.a === 0 ? 1 : ev.a === 1 ? -1 : 0) * (ev.dmg * 2.2 + (ev.kind === "td" ? 10 : 0)), -100, 100);
  [0, 1].forEach((i) => (FS.st[i] = Math.max(5, FS.st[i] - (1.5 + (100 - F[i].at.cardio) / 55) * agg(P[i]))));
  FS.feed.unshift({ t: FS.ex, rd: FS.rd, txt: ev.txt, side: ev.a });
  FS.ex++;
  if (!FS.fin) cueMoment(FS, ev);
  return ev;
}

// ---------- Key moments ----------
// A few times a round the fight pauses and your corner makes a call. Outcomes come from the fighters' skills.
const MAX_MOMENTS = 2;
function cueMoment(FS, ev) {
  if (FS.cue || (FS.moc || 0) >= MAX_MOMENTS || FS.ex - (FS.lastMo ?? -9) < 3 || FS.ex >= 12) return;
  const stand = FS.pos === "stand";
  let c = null;
  if (ev.dmg && ev.a === 0 && (ev.kd || (ev.big && FS.hp[1] < 62))) c = { id: "hurtOpp", kd: ev.kd };
  else if (ev.dmg && ev.a === 1 && (ev.kd || (ev.big && FS.hp[0] < 62))) c = { id: "hurtMe", kd: ev.kd };
  else if (ev.kind === "td") c = { id: ev.a === 0 ? "top" : "bottom" };
  else if (stand && FS.ex >= 9 && Math.abs(FS.dm[0] - FS.dm[1]) < 7 && !FS.moc) c = { id: "late" };
  else if (stand && FS.ex >= 2 && FS.ex <= 9 && ev.a === 1 && /punch|kick|miss/.test(ev.kind) && !ev.big && R() < 0.18) c = { id: "incoming" };
  else if (stand && FS.ex >= 2 && FS.ex <= 9 && ev.a === 0 && ev.dmg && !ev.big && FS.hp[1] <= FS.hp[0] && R() < 0.3) c = { id: "back" };
  else if (stand && FS.ex >= 3 && FS.ex <= 7 && !FS.moc && R() < 0.4) c = { id: "open", v: pk([0, 1]) };
  if (c) FS.cue = c;
}
// Which skill each style is built on, so a choice that plays to it can say so.
const STYLE_SK = { Boxer: "box", Kickboxer: "kick", "Muay Thai": "thai", Wrestler: "wres", Grappler: "bjj" };
const SK_WORD = { box: "Boxing", kick: "Kicks", thai: "Clinch", wres: "Wrestling", bjj: "Jiu-jitsu", tdd: "Defence", cardio: "Cardio", dur: "Chin", iq: "Fight IQ" };
// Each moment: a short title, who and where to highlight, and 3 choices [label, icon, skill it leans on, fit score].
function momentDef(FS, c) {
  const [me, op] = FS.f, A = me.at, B = op.at, pw = [power(FS, 0).str, power(FS, 1).str], n = (i) => last(FS.f[i].name);
  switch (c.id) {
    case "hurtOpp": return { tone: "good", title: c.kd ? `${n(1)} is down!` : `${n(1)} is hurt!`, focus: 1, target: c.kd ? null : "head",
      c: [["Pursue", "pursue", "box", 45 + (pw[0] - B.dur) / 2 + (FS.st[0] - 50) / 4], ["Head", "head", "box", 45 + (A.box - B.iq) / 2], ["Takedown", "takedown", "wres", 45 + (A.wres - B.tdd) / 2]] };
    case "hurtMe": return { tone: "bad", title: c.kd ? `${n(0)} is down!` : `${n(0)} is rocked!`, focus: 0, target: null,
      c: [["Clinch", "clinch", "wres", 45 + (A.wres - B.wres) / 2], ["Fire back", "counter", "box", 40 + (pw[0] - pw[1]) / 2 + (A.dur - 60) / 4], ["Circle out", "circle", "cardio", 45 + (A.cardio + A.iq - B.cardio - B.iq) / 4]] };
    case "top": return { tone: "good", title: `${n(0)} on top`, focus: 1, target: null,
      c: [["Pound", "pound", "wres", 45 + (A.wres - 60) / 2], ["Submit", "submit", "bjj", 45 + (A.bjj - B.bjj) / 2], ["Hold", "hold", "wres", 50]] };
    case "bottom": return { tone: "bad", title: `${n(0)} taken down`, focus: 0, target: null,
      c: [["Get up", "getup", "wres", 45 + (A.wres - B.wres) / 2 + (FS.st[0] - 50) / 4], ["Submit", "submit", "bjj", 40 + (A.bjj - B.bjj) / 2], ["Tie up", "clinch", "wres", 48]] };
    case "late": return { tone: "info", title: "Close round · 0:30", focus: 1, target: null,
      c: [["Flurry", "flurry", "box", 45 + (pw[0] - pw[1]) / 2], ["Takedown", "takedown", "wres", 45 + (A.wres - B.tdd) / 2], ["Stay safe", "block", "iq", 48]] };
    case "incoming": return { tone: "bad", title: "Incoming!", focus: 0, target: null,
      c: [["Block", "block", "dur", 45 + (A.dur - B.box) / 2], ["Slip", "slip", "iq", 45 + (A.iq - B.box) / 2 + (A.box - 60) / 4], ["Counter", "counter", "box", 40 + (A.box - B.iq) / 2 + (A.iq - 60) / 4]] };
    case "back": return { tone: "good", title: `${n(1)} backs off`, focus: 1, target: "body",
      c: [["Pressure", "pressure", "cardio", 45 + (A.cardio - B.cardio) / 2], ["Cut off", "cutoff", A.wres > Math.max(A.box, A.kick) ? "wres" : "iq", 45 + (A.iq - B.iq) / 2 + (Math.max(A.wres, A.box) - 60) / 4], ["Body", "body", A.kick > A.box ? "kick" : "box", 45 + ((A.box + A.kick) / 2 - B.dur) / 2]] };
    case "open": return c.v ? { tone: "info", title: "His lead leg is hurt", focus: 1, target: "legs",
      c: [["Leg kick", "legkick", "kick", 45 + (A.kick - 60) / 2], ["Head kick", "headkick", "kick", 40 + (A.kick - B.iq) / 2], ["Box", "head", "box", 45 + (A.box - B.box) / 2]] }
      : { tone: "info", title: "His hands are low", focus: 1, target: "head",
      c: [["Overhand", "head", "box", 45 + (A.box - B.iq) / 2], ["Shoot", "takedown", "wres", 45 + (A.wres - B.tdd) / 2], ["Stay tight", "block", "iq", 48]] };
  }
}
export function pendingMoment(FS) {
  const c = FS.cue; if (!c) return null;
  FS.cue = null; FS.moc = (FS.moc || 0) + 1; FS.lastMo = FS.ex;
  const M = momentDef(FS, c), me = FS.f[0];
  const choices = M.c.map(([label, icon, sk, fit]) => ({ label, icon, sk, fit }));
  // A soft hint: glow on the choice that clearly suits this fighter in this matchup.
  const order = choices.map((x, i) => i).sort((x, y) => choices[y].fit - choices[x].fit);
  const best = choices[order[0]], gap = best.fit - choices[order[1]].fit;
  const hint = best.fit >= 50 && gap >= 6 ? order[0] : -1;
  const why = hint < 0 ? "" : STYLE_SK[me.style] === best.sk ? me.style : SK_WORD[best.sk];
  return { ...c, tone: M.tone, title: M.title, focus: M.focus, target: M.target, choices, hint, why };
}
// What the fighter does if the corner doesn't call it: his personality decides.
export function autoChoice(FS, m) {
  const p = FS.f[0].pers, A = FS.f[0].at, B = FS.f[1].at;
  if (m.id === "hurtOpp") return FS.st[0] > 40 || p === "Hotheaded" ? 0 : 1;
  if (m.id === "hurtMe") return p === "Hotheaded" ? 1 : A.wres > B.wres ? 0 : 2;
  if (m.id === "top") return A.bjj > B.bjj + 8 ? 1 : 0;
  if (m.id === "bottom") return A.bjj > B.bjj + 10 ? 1 : 0;
  // Reacting on instinct: he does what he's best at (a hothead always swings back).
  if (m.id === "incoming" || m.id === "back") return p === "Hotheaded" ? (m.id === "incoming" ? 2 : 0) : m.choices.reduce((b, c, i) => (c.fit > m.choices[b].fit ? i : b), 0);
  return p === "Hotheaded" ? 0 : 2;
}
// Apply damage from a moment. Returns true if it ended the fight.
function land(FS, a, d, dmg, detail) {
  dmg *= FS.boost[a] * (1.1 - FS.f[d].at.dur / 400);
  FS.hp[d] -= dmg; FS.dm[a] += dmg; FS.stats[a].str++; FS.stats[a].att++;
  FS.mom = cl(FS.mom + (a === 0 ? 1 : -1) * dmg * 2.2, -100, 100);
  if (FS.hp[d] <= 0) { FS.fin = { w: a, how: "KO/TKO", detail }; return true; }
  return false;
}
export function resolveMoment(FS, m, i) {
  const [me, op] = FS.f, A = me.at, B = op.at, pw = [power(FS, 0).str, power(FS, 1).str];
  const n = (k) => `<b>${last(FS.f[k].name)}</b>`, roll = (p) => R() < cl(p, 0.05, 0.92);
  FS.moments = (FS.moments || 0) + 1;
  let txt = "", anim = "", ok = false, ko = false;
  const tdIn = (a, bonus) => { if (roll(0.35 + bonus + (FS.f[a].at.wres - FS.f[1 - a].at.tdd) / 140)) { FS.pos = "ground"; FS.top = a; FS.stats[a].td++; FS.dm[a] += 4; return true; } return false; };
  const subIn = (a, bonus) => { const d = 1 - a; if (roll(0.12 + bonus + (FS.f[a].at.bjj - FS.f[d].at.bjj * 0.9 - FS.f[d].at.dur * 0.15) / 160)) { FS.fin = { w: a, how: "Submission", detail: pk(["rear-naked choke", "guillotine", "arm-triangle", "armbar", "kimura", "triangle choke"]) }; return true; } return false; };
  switch (m.id + (m.v || "") + i) {
    case "hurtOpp0": ok = roll(0.24 + (pw[0] - B.dur) / 110 + (60 - FS.hp[1]) / 90 + (m.kd ? 0.15 : 0)); FS.st[0] = Math.max(5, FS.st[0] - 22);
      if (ok) { FS.fin = { w: 0, how: "KO/TKO", detail: m.kd ? "punches on the ground" : "a flurry of strikes" }; ko = true; anim = "swarm"; txt = `${n(0)} swarms — the referee jumps in! <em>It's stopped!</em>`; }
      else if (roll(0.35)) { ko = land(FS, 1, 0, rnd(6, 11), "a counter"); anim = "counter"; txt = `${n(1)} survives and catches ${n(0)} coming in!`; }
      else { anim = "swarm"; land(FS, 0, 1, rnd(4, 8)); txt = `${n(0)} unloads, but ${n(1)} covers up and survives.`; } break;
    case "hurtOpp1": anim = "flurry"; ko = land(FS, 0, 1, rnd(7, 12), "strikes"); txt = ko ? `${n(0)} picks him apart — <em>it's over!</em>` : `${n(0)} picks his shots and keeps hurting him.`; ok = true; break;
    case "hurtOpp2": ok = tdIn(0, 0.3); anim = ok ? "td" : "tdx"; txt = ok ? `${n(0)} drags the hurt man down.` : `${n(1)} stuffs it and recovers.`; if (!ok) FS.hp[1] += 6; break;
    case "hurtMe0": ok = roll(0.45 + (A.wres - B.wres) / 140); anim = ok ? "clinch" : "counter";
      if (ok) { FS.hp[0] += 7; txt = `${n(0)} ties him up and clears his head.`; } else { ko = land(FS, 1, 0, rnd(7, 12), "strikes in the clinch"); txt = `${n(1)} shakes him off and keeps landing!`; } break;
    case "hurtMe1": ok = roll(0.3 + (pw[0] - pw[1]) / 120 + (A.dur - 60) / 200); anim = "counter";
      if (ok) { ko = land(FS, 0, 1, rnd(10, 16), "a counter right hand"); txt = ko ? `${n(0)} fires back and <em>knocks him out cold!</em>` : `${n(0)} fires back and drops him!`; }
      else { ko = land(FS, 1, 0, rnd(10, 16), "punches"); txt = ko ? `${n(0)} trades and <em>gets put away!</em>` : `${n(0)} trades and eats a big one!`; anim = "eat"; } break;
    case "hurtMe2": ok = roll(0.4 + (A.cardio + A.iq - B.cardio - B.iq) / 200 + FS.st[0] / 400); anim = ok ? "escape" : "counter";
      if (ok) { FS.hp[0] += 5; txt = `${n(0)} circles away and buys time.`; } else { ko = land(FS, 1, 0, rnd(6, 10), "strikes against the fence"); txt = `${n(1)} cuts him off at the fence!`; } break;
    case "top0": anim = "gnp"; ko = land(FS, 0, 1, rnd(6, 11) * (0.8 + A.wres / 250), "ground and pound"); ok = true; txt = ko ? `${n(0)} rains down elbows — <em>stoppage!</em>` : `${n(0)} postures up and drops heavy shots.`; break;
    case "top1": ok = subIn(0, 0.12); anim = ok ? "sub" : "scramble"; txt = ok ? `${n(0)} locks in a ${FS.fin.detail} — <em>TAP!</em>` : `${n(1)} escapes the ${pk(["choke", "armbar", "kimura"])} and scrambles.`; if (!ok && roll(0.5)) { FS.pos = "stand"; FS.top = null; } break;
    case "top2": anim = "hold"; FS.dm[0] += 6; FS.st[0] = Math.min(100, FS.st[0] + 8); ok = true; txt = `${n(0)} pins him and banks the time.`; break;
    case "bottom0": ok = roll(0.38 + (A.wres + A.cardio - B.wres * 2) / 200 + FS.st[0] / 500); FS.st[0] = Math.max(5, FS.st[0] - 10);
      if (ok) { FS.pos = "stand"; FS.top = null; anim = "up"; txt = `${n(0)} explodes back to his feet!`; } else { anim = "gnp-me"; ko = land(FS, 1, 0, rnd(4, 8), "ground and pound"); txt = `${n(1)} flattens him back out.`; } break;
    case "bottom1": ok = subIn(0, 0.05); anim = ok ? "sub" : "gnp-me"; if (ok) txt = `${n(0)} snaps on a ${FS.fin.detail} from his back — <em>TAP!</em>`; else { ko = land(FS, 1, 0, rnd(5, 9), "ground and pound"); txt = `${n(1)} pulls free and punishes him.`; } break;
    case "bottom2": anim = "hold"; FS.dm[1] += 4; ok = true; txt = `${n(0)} ties him up; the ref will stand them soon.`; if (roll(0.5)) { FS.pos = "stand"; FS.top = null; } break;
    case "late0": ok = roll(0.45 + (pw[0] - pw[1]) / 120 + (FS.st[0] - FS.st[1]) / 200); FS.st[0] = Math.max(5, FS.st[0] - 14); anim = "flurry";
      if (ok) { FS.dm[0] += 10; land(FS, 0, 1, rnd(4, 7)); txt = `${n(0)} closes the round with a big flurry.`; } else { FS.dm[1] += 6; txt = `${n(1)} answers the flurry and steals the moment.`; } break;
    case "late1": ok = tdIn(0, 0.1); anim = ok ? "td" : "tdx"; if (ok) { FS.dm[0] += 6; txt = `${n(0)} lands a takedown at the horn.`; } else txt = `${n(1)} stuffs the late shot.`; break;
    case "late2": anim = "escape"; ok = true; txt = `${n(0)} plays it safe to the bell.`; break;
    case "open0": ok = roll(0.32 + (pw[0] - B.iq) / 140); anim = ok ? "big" : "counter";
      if (ok) { FS.stats[0].kd++; ko = land(FS, 0, 1, rnd(9, 15), "an overhand right"); txt = ko ? `${n(0)} times the overhand — <em>lights out!</em>` : `${n(0)} times the overhand — <em>${last(op.name)} goes down!</em>`; }
      else { ko = land(FS, 1, 0, rnd(5, 9), "a counter"); txt = `${n(1)} saw it coming and counters!`; } break;
    case "open1": ok = tdIn(0, 0.1); anim = ok ? "td" : "tdx"; txt = ok ? `${n(0)} changes levels and dumps him.` : `${n(1)} sprawls on the shot.`; break;
    case "open2": anim = "flurry"; ok = true; land(FS, 0, 1, rnd(2, 4)); FS.dm[0] += 3; txt = `${n(0)} keeps it tight and wins the exchange.`; break;
    case "open12": anim = "flurry"; ok = true; land(FS, 0, 1, rnd(2, 5)); FS.dm[0] += 3; txt = `${n(0)} goes back to boxing and wins the exchange.`; break;
    case "incoming0": ok = roll(0.65 + (A.dur - B.box) / 150 + (A.iq - 60) / 300); anim = "block";
      if (ok) { FS.dm[0] += 2; FS.st[0] = Math.min(100, FS.st[0] + 4); txt = `${n(0)} catches it on the gloves.`; } else { ko = land(FS, 1, 0, rnd(2, 5), "strikes"); txt = `${n(1)} gets it through the guard.`; } break;
    case "incoming1": ok = roll(0.5 + (A.iq - B.box) / 130 + (A.box - 60) / 300); anim = ok ? "slip" : "eat";
      if (ok) { land(FS, 0, 1, rnd(3, 6)); txt = `${n(0)} slips it and touches him on the way out.`; } else { ko = land(FS, 1, 0, rnd(4, 7), "strikes"); txt = `${n(0)} slips the wrong way and eats it.`; } break;
    case "incoming2": ok = roll(0.35 + (A.box - B.iq) / 120 + (pw[0] - pw[1]) / 150); anim = ok ? "counter" : "eat";
      if (ok) { ko = land(FS, 0, 1, rnd(8, 14), "a counter"); txt = ko ? `${n(0)} times the counter — <em>out cold!</em>` : `${n(0)} times the counter — <em>flush!</em>`; }
      else { ko = land(FS, 1, 0, rnd(6, 10), "strikes"); txt = `${n(1)} beats him to it.`; } break;
    case "back0": ok = roll(0.5 + (A.cardio - B.cardio) / 150 + (pw[0] - pw[1]) / 200); FS.st[0] = Math.max(5, FS.st[0] - 8); anim = ok ? "flurry" : "counter";
      if (ok) { ko = land(FS, 0, 1, rnd(4, 8), "strikes"); txt = `${n(0)} walks him down and keeps landing.`; } else { ko = land(FS, 1, 0, rnd(4, 7), "a counter"); txt = `${n(1)} catches him charging in.`; } break;
    case "back1": ok = roll(0.45 + (A.iq - B.iq) / 120);
      if (!ok) { anim = "escape"; txt = `${n(1)} circles out along the fence.`; }
      else if (A.wres > Math.max(A.box, A.kick)) { FS.dm[0] += 3; const t = tdIn(0, 0.15); anim = t ? "td" : "tdx"; txt = t ? `${n(0)} traps him on the fence and drags him down.` : `${n(0)} pins him on the fence; ${n(1)} pummels free.`; }
      else { FS.dm[0] += 3; anim = "flurry"; ko = land(FS, 0, 1, rnd(6, 10), "strikes against the fence"); txt = ko ? `${n(0)} traps him on the fence — <em>stoppage!</em>` : `${n(0)} traps him on the fence and unloads.`; } break;
    case "back2": ok = roll(0.55 + ((A.box + A.kick) / 2 - B.dur) / 150); anim = ok ? "kick" : "escape";
      if (ok) { ko = land(FS, 0, 1, rnd(3, 6), "body shots"); FS.st[1] = Math.max(5, FS.st[1] - 14); txt = `${n(0)} digs to the body. ${last(op.name)} is breathing hard.`; } else txt = `${n(1)} covers the body and resets.`; break;
    case "open10": anim = "kick"; ok = true; land(FS, 0, 1, rnd(4, 7)); FS.boost[1] *= 0.93; txt = `${n(0)} chops the leg again. ${last(op.name)} is limping.`; break;
    case "open11": ok = roll(0.25 + (A.kick - B.iq) / 120); anim = ok ? "big" : "counter";
      if (ok) { FS.stats[0].kd++; ko = land(FS, 0, 1, rnd(12, 20), "a head kick"); txt = ko ? `Fake low, kick high — <em>${n(0)} knocks him out with a head kick!</em>` : `${n(0)} lands a head kick and drops him!`; }
      else { ko = land(FS, 1, 0, rnd(5, 9), "a counter"); txt = `${n(1)} catches the kick and punishes him.`; } break;
    default: anim = "escape"; ok = true; txt = `${n(0)} stays patient.`;
  }
  FS.hp = FS.hp.map((h) => Math.min(100, h));
  ko = ko || !!FS.fin;
  FS.feed.unshift({ t: Math.max(0, FS.ex - 1), rd: FS.rd, txt, side: ok ? 0 : 1 });
  return { txt, anim, ok, ko, fin: FS.fin, id: m.id };
}

export const roundOver = (FS) => FS.ex >= 12;
export function endRound(FS) {
  const d = FS.dm[0] - FS.dm[1];
  FS.cards.forEach((cd) => { const j = d + rnd(-4, 4), big = Math.abs(j) >= 22 ? 8 : 9; cd.push(j > 0 ? [10, big] : [big, 10]); });
  FS.hp = FS.hp.map((h) => Math.min(100, h + 8));
  FS.st = FS.st.map((s) => Math.min(100, s + 25));
  FS.boost = [1, 1];
}
export function startRound(FS, corner) {
  if (FS.ex > 0) FS.rd++;
  FS.ex = 0; FS.dm = [0, 0]; FS.pos = "stand"; FS.top = null; FS.moc = 0; FS.lastMo = -9; FS.cue = null;
  if (corner === "water") FS.st[0] = Math.min(100, FS.st[0] + 20);
  if (corner === "cut") FS.hp[0] = Math.min(100, FS.hp[0] + 10);
  if (corner === "fire") { FS.boost[0] = 1.15; FS.st[0] = Math.max(5, FS.st[0] - 5); }
  FS.plan[1] = aiPlan(FS);
}
export const clock = (FS) => { const el = 300 - FS.ex * 25; return Math.floor(el / 60) + ":" + String(el % 60).padStart(2, "0"); };

// Apply the result to the world. Returns the result summary.
export function finish(FS) {
  let w, how, detail = "";
  if (FS.fin) { w = FS.fin.w; how = FS.fin.how; detail = FS.fin.detail; }
  else {
    const t = FS.cards.map((c) => c.reduce((s, r) => [s[0] + r[0], s[1] + r[1]], [0, 0]));
    const v = t.map((x) => (x[0] > x[1] ? 0 : x[1] > x[0] ? 1 : -1));
    const n0 = v.filter((x) => x === 0).length, n1 = v.filter((x) => x === 1).length;
    w = n0 > n1 ? 0 : n1 > n0 ? 1 : FS.hp[0] >= FS.hp[1] ? 0 : 1;
    how = n0 === 3 || n1 === 3 ? "Unanimous decision" : "Split decision";
    detail = t.map((x) => x.join("-")).join(", ");
  }
  const b = FS.b, F = FS.f, W = F[w], L = F[1 - w], won = w === 0, me = F[0];
  W.w++; L.l++;
  W.streak = Math.max(1, (W.streak || 0) + 1); L.streak = Math.min(-1, (L.streak || 0) - 1);
  W.pop = Math.min(100, W.pop + (won && ovr(L) > ovr(W) ? 5 : 3) + (won && G.ag.city === "dublin" ? 2 : 0)); L.pop = Math.max(0, L.pop - 1);
  const wasChamp = FS.r0[1] === 0 && won;
  const pay = b.purse + (won ? b.bonus : 0), cut = Math.round(pay * me.ct.pct / 100);
  me.earn += pay - cut; earn(cut);
  me.en = Math.max(10, me.en - 45); me.prep = 0;
  const wks = FS.fin && !won ? ri(3, 8) : R() < (me.pers === "Professional" ? 0.15 : 0.3) ? ri(1, 3) : 0;
  me.inj = Math.max(me.inj, wks);
  G.rep = cl(G.rep + (won ? 2 + Math.max(0, (ovr(L) - ovr(W)) / 8) + (wasChamp ? 8 : 0) : -1), 0, 100);
  won ? G.hist.w++ : G.hist.l++;
  if (wasChamp) { G.hist.titles++; W.b = (W.b || 0) + 40; }
  G.bk = G.bk.filter((x) => x !== b);
  bumpRanks();
  const rk1 = [rank(F[0]), rank(F[1])];
  const short = how === "KO/TKO" || how === "Submission" ? how : "Decision";
  say(`${me.name} ${won ? "beat" : "lost to"} ${F[1].name} by ${how.toLowerCase()}${wasChamp ? " and WON THE TITLE" : ""}. You earned $${cut.toLocaleString("en-US")}.`, won ? "good" : "bad");
  G.res.unshift({ wk: G.wk, n: me.name, o: F[1].name, won, how: short, fid: me.id });
  G.res.length = Math.min(G.res.length, 30);
  me.tl.push({ w: G.wk, t: `${won ? "Beat" : "Lost to"} ${F[1].name} (${short})${wasChamp ? " — new champion" : ""}` });
  if (wks) me.tl.push({ w: G.wk, t: `Injured for ${wks} weeks` });
  FS.res = { won, w, how, detail, cut, pay, wks, rk1, wasChamp, rdEnd: FS.rd, at: clock(FS) };
  onFight(FS, FS.res);
  FS.ph = "end";
  return FS.res;
}
