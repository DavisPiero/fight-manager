// Fight simulation. One round = 12 exchanges (25 seconds each). The UI calls step() on a timer.
import { R, rnd, ri, cl, pk, last } from "../util.js";
import { G, ovr, rank, say, earn, bumpRanks } from "../state.js";

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
const agg = (p) => (p === "agg" ? 1.25 : p === "safe" ? 0.8 : 1);

export function newFight(b) {
  const me = G.f[b.fid], op = G.f[b.oid];
  const form = (f) => (f.pers === "Inconsistent" ? rnd(0.9, 1.1) : 1);
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
      ev.kind = kk ? "kick" : "punch";
      if (land) {
        FS.stats[a].str++;
        ev.dmg = (2.5 + R() * 4.5) * (heavy ? 1.35 : 1) * agg(P[a]) * FS.boost[a] * (1.1 - F[d].at.dur / 400) * (0.85 + A.a[kk ? "kick" : "box"] / 300);
        ev.big = ev.dmg > 7;
        ev.txt = `${ln(a)} lands a ${mv}${ev.big ? " — <em>big shot!</em>" : "."}`;
      } else { ev.kind = "miss"; ev.txt = `${last(F[a].name)} throws a ${mv}, ${last(F[d].name)} slips it.`; }
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
    if (FS.hp[d] <= 0 || (ev.dmg > 6.5 && R() < Math.max(0, (40 - FS.hp[d]) / 40) * 0.4)) {
      FS.fin = { w: a, how: "KO/TKO", detail: ev.kind === "gnp" ? "ground and pound" : "strikes" };
      ev.ko = true; ev.txt += " <em>He's down — it's all over!</em>";
    }
  }
  FS.mom = cl(FS.mom * 0.85 + (ev.a === 0 ? 1 : ev.a === 1 ? -1 : 0) * (ev.dmg * 2.2 + (ev.kind === "td" ? 10 : 0)), -100, 100);
  [0, 1].forEach((i) => (FS.st[i] = Math.max(5, FS.st[i] - (1.5 + (100 - F[i].at.cardio) / 55) * agg(P[i]))));
  FS.feed.unshift({ t: FS.ex, rd: FS.rd, txt: ev.txt, side: ev.a });
  FS.ex++;
  return ev;
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
  FS.ex = 0; FS.dm = [0, 0]; FS.pos = "stand"; FS.top = null;
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
  W.pop = Math.min(100, W.pop + (won && ovr(L) > ovr(W) ? 5 : 3)); L.pop = Math.max(0, L.pop - 1);
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
  FS.ph = "end";
  return FS.res;
}
