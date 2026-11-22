// The live octagon: one canvas with crowd, lights, fence, mat and two drawn, rigged fighters.
// fightview.js tells it what each fighter is doing (set: stand/top/bottom/ko/win) and what he just did (act);
// the arena works out the spacing, the motion and where every blow lands.
//
// How it fits together:
//  - A pose is a set of joint angles (STANCE/BASE/ACT below). Forward kinematics turns it into joints.
//  - Strikes, takedowns, ground-and-pound and guards use inverse kinematics: the glove, foot or knee is put
//    on the opponent's head, body or leg *as he is drawn this frame*, and the elbow/knee is solved from that.
//    When a target is out of reach the attacker steps in, so blows always land (unless the event was a miss).
//  - Parts (PARTS) are drawn as shaded, muscled outlines along each bone, lit from the rig above with a
//    corner-coloured rim light. A painted image could replace any part later by drawing along the same bone.
import SKIN from "../data/skintones.json";
import { UFC_DATA } from "../state.js";

// ---------- Looks: fixed per fighter ----------
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (h, arr, k = 0) => arr[(h >>> k) % arr.length];
// Made-up prospects: a skin tone from a range that fits where they're from.
const SKIN_BY_NAT = {
  Brazil: ["#f0c4a4", "#d9a07c", "#c88a64", "#a86f4e", "#8a5638", "#6b4029"], USA: ["#f3c9ac", "#e2ae8c", "#c48b67", "#9c6644", "#7a4a30", "#5c3622"],
  Russia: ["#f3cdb2", "#eabd9c", "#dcab88"], Mexico: ["#e4b08c", "#d29c78", "#bb8562"], Nigeria: ["#7a4a30", "#5f3822", "#4a2b1a"],
  any: ["#f0c8aa", "#e0ae8c", "#c99470", "#a87250", "#82543a", "#5e3a25"],
};
const HAIR = ["bald", "buzz", "buzz", "short", "short", "crop", "curly", "bun", "mohawk"];
const BEARD = ["none", "none", "stubble", "stubble", "short", "full"];
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function lum(hex) { const [r, g, b] = rgb(hex); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; }
function shade(hex, k, a = 1) { const c = rgb(hex).map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))))); return a < 1 ? `rgba(${c},${a})` : `rgb(${c})`; }
export function lookOf(f, col) {
  const h = hash(f.name), real = f.real && UFC_DATA[f.name];
  const skin = (real && String(SKIN[UFC_DATA[f.name].file] || "").replace("!", "")) || pick(h, SKIN_BY_NAT[f.nat] || SKIN_BY_NAT.any, 3);
  const light = lum(skin) > 0.62;
  const hairCol = light ? pick(h, ["#1d1611", "#2b1d14", "#3e2a1b", "#5a3b22", "#8c5a2e", "#b8894e", "#1d1611"], 7) : "#141010";
  const wc = f.wc ?? 3, ht = +f.ht || 70 + wc * 0.8;
  return {
    skin, hairCol, col, trim: pick(h, ["#ffffff", "#111111", "#e8c46a", "#ffffff"], 11),
    hair: pick(h, HAIR, 13), beard: pick(h, BEARD, 17),
    build: 0.9 + wc * 0.035, belly: wc === 7 ? 1.1 : 1, cut: wc >= 6 ? 0.5 : 1, tall: Math.max(0.94, Math.min(1.07, ht / 71)),
    style: f.style || "Well-rounded",
  };
}

// ---------- Poses (facing right; angles in degrees) ----------
// t torso lean (0 up, + forward) · h head tilt (+ chin down) · sF/sB shoulder (0 down, + forward/up) · eF/eB elbow bend
// kF/kB hip (0 down, + forward) · nF/nB knee (negative bends the shin back) · dx forward shift · up lifts off the floor
// F is the near (lead) side, drawn in front; B is the far side, drawn behind and darker.
const STANCE = {
  Boxer:          { t: 10, h: 10, sF: 58, eF: 112, sB: 30, eB: 132, kF: 22, nF: -26, kB: -16, nB: -8, bob: 1.6 },
  Kickboxer:      { t: 4, h: 8, sF: 64, eF: 104, sB: 34, eB: 128, kF: 16, nF: -14, kB: -16, nB: -6, bob: 1.2 },
  "Muay Thai":    { t: 0, h: 6, sF: 86, eF: 84, sB: 58, eB: 104, kF: 12, nF: -10, kB: -12, nB: -4, bob: 0.8 },
  Wrestler:       { t: 26, h: 2, sF: 52, eF: 76, sB: 40, eB: 96, kF: 40, nF: -62, kB: -22, nB: -18, bob: 0.9 },
  Grappler:       { t: 20, h: 4, sF: 54, eF: 86, sB: 36, eB: 108, kF: 32, nF: -46, kB: -20, nB: -12, bob: 0.9 },
  "Well-rounded": { t: 8, h: 8, sF: 60, eF: 106, sB: 32, eB: 128, kF: 20, nF: -24, kB: -16, nB: -8, bob: 1.2 },
};
const BASE = {
  top:    { t: 34, h: 12, sF: 70, eF: 70, sB: 60, eB: 80, kF: 14, nF: -104, kB: 2, nB: -96 },
  bottom: { t: -84, h: -20, sF: 120, eF: 60, sB: 105, eB: 70, kF: 118, nF: -86, kB: 100, nB: -96 },
  ko:     { t: -92, h: -44, sF: -70, eF: -20, sB: -95, eB: 10, kF: 88, nF: -10, kB: 74, nB: -22 },
  win:    { t: -4, h: -14, sF: 168, eF: 14, sB: 132, eB: 40, kF: 8, nF: -6, kB: -10, nB: -6 },
};
const ACT = {
  hit:     { p: { t: -14, h: -30, dx: -4 }, len: 0.34, in: 0.18 },
  bighit:  { p: { t: -26, h: -40, nF: -40, nB: -32, sF: 30, eF: 50, sB: 10, eB: 60, dx: -9 }, len: 0.65, in: 0.16 },
  kd:      { p: { t: -22, h: 12, sF: -30, eF: 20, sB: -45, eB: 15, kF: 86, nF: -14, kB: 80, nB: -50, dx: -8 }, len: 1.3, in: 0.14, hold: 0.55 },
  dodge:   { p: { t: -20, h: -8, dx: -6 }, len: 0.36, in: 0.3 },
  guard:   { p: { t: 16, h: 22, sF: 104, eF: 140, sB: 92, eB: 146 }, len: 0.45, in: 0.25 },
  sprawl:  { p: { t: 78, h: 8, sF: 70, eF: 30, sB: 60, eB: 40, kF: -52, nF: -2, kB: -72, nB: 0, dx: -2 }, len: 0.6, in: 0.3, grip: "back" },
};
// Strikes: which limb, what it aims at, how it travels (path), and how the body turns into it.
const STRIKE = {
  jab:        { limb: "hF", tgt: "head", path: "straight", p: { t: 16, h: 14 } },
  cross:      { limb: "hB", tgt: "head", path: "straight", p: { t: 24, h: 14, kB: -26, nB: -2 } },
  hook:       { limb: "hF", tgt: "head", path: "hook", p: { t: 20, h: 16 } },
  uppercut:   { limb: "hB", tgt: "head", path: "upper", p: { t: 4, h: 10, kF: 30, nF: -44 } },
  overhand:   { limb: "hB", tgt: "head", path: "over", p: { t: 34, h: 16, kB: -30 } },
  elbow:      { limb: "hF", tgt: "head", path: "elbow", p: { t: 22, h: 16 } },
  "body shot":{ limb: "hB", tgt: "body", path: "straight", p: { t: 30, h: 8, kF: 34, nF: -50 } },
  "leg kick": { limb: "ftB", tgt: "leg", path: "kick", p: { t: -12, sB: 10, eB: 50, sF: 70 }, kick: 1 },
  "body kick":{ limb: "ftB", tgt: "body", path: "kick", p: { t: -24, sB: 0, eB: 40, sF: 80 }, kick: 1 },
  "head kick":{ limb: "ftB", tgt: "head", path: "kick", p: { t: -36, h: 0, sB: -10, eB: 30, sF: 90 }, kick: 1 },
  knee:       { limb: "knB", tgt: "body", path: "knee", p: { t: -2, sF: 96, eF: 90, sB: 90, eB: 96 }, kick: 1, grip: "head" },
  pound:      { limb: "hF", tgt: "head", path: "pound", p: { t: 46, h: 10 } },
};
const STYLE_SHOTS = { Boxer: ["cross", "hook", "uppercut", "body shot"], Kickboxer: ["body kick", "head kick", "cross", "leg kick"], "Muay Thai": ["knee", "elbow", "leg kick"], Wrestler: ["overhand", "cross"], Grappler: ["cross", "jab"] };

// Where the gloves sit in the guard, relative to the head (forward, down): [lead, rear].
const GUARD = { Boxer: [[6, 4.5], [3, 6]], Kickboxer: [[7.5, 4], [3.5, 5.5]], "Muay Thai": [[11, 1.5], [6, 3]], Wrestler: [[10, 13], [6, 15]], Grappler: [[9, 9], [5, 11]], "Well-rounded": [[7, 4.5], [3.5, 6]] };

// ---------- Rig ----------
const LEN = { torso: 29, neck: 3.4, head: 6.6, uarm: 15.5, farm: 14.5, thigh: 22, shin: 22 };
const rad = (d) => (d * Math.PI) / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);
const P2 = (x, y) => ({ x, y });
const add = (a, b, k = 1) => P2(a.x + b.x * k, a.y + b.y * k);
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const limb = (o, a, l) => P2(o.x + Math.sin(rad(a)) * l, o.y + Math.cos(rad(a)) * l);
// Two-bone IK: elbow/knee position for a root, a target and two lengths. bend +1 = joint below the line (elbows), -1 = above/ahead (knees).
function ik(root, tgt, l1, l2, bend) {
  const dx = tgt.x - root.x, dy = tgt.y - root.y, d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, (l1 + l2) * 0.999), a = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), m = a + bend * A;
  return [P2(root.x + Math.cos(m) * l1, root.y + Math.sin(m) * l1), P2(root.x + Math.cos(a) * d, root.y + Math.sin(a) * d)];
}
// Joints in body units, hip at the origin. The near and far shoulders/hips are offset to give a three-quarter view.
function joints(P, L) {
  const T = L.tall, tr = rad(P.t), up = P2(Math.sin(tr), -Math.cos(tr)), fw = P2(Math.cos(tr), Math.sin(tr));
  const sh = P2(up.x * LEN.torso * T, up.y * LEN.torso * T), neck = add(sh, up, 1.5);
  const hr = rad(P.t * 0.5 + P.h), hp = rad(P.t * 0.85 + P.h * 0.15), hd = P2(neck.x + Math.sin(hp) * (LEN.neck + LEN.head * 0.75), neck.y - Math.cos(hp) * (LEN.neck + LEN.head * 0.75));
  const shF = add(add(sh, fw, 1.6 * L.build), up, -1.6), shB = add(add(sh, fw, -2.6 * L.build), up, -0.6);
  const hipF = P2(1.4, 0.4), hipB = P2(-1.6, -0.6);
  const arm = (s, e, o) => { const el = limb(o, s, LEN.uarm * T); return [el, limb(el, s + e, LEN.farm * T)]; };
  const leg = (k, n, o) => { const kn = limb(o, k, LEN.thigh * T); return [kn, limb(kn, k + n, LEN.shin * T)]; };
  const [elF, hF] = arm(P.sF, P.eF, shF), [elB, hB] = arm(P.sB, P.eB, shB), [knF, ftF] = leg(P.kF, P.nF, hipF), [knB, ftB] = leg(P.kB, P.nB, hipB);
  return { hip: P2(0, 0), sh, neck, hd, shF, shB, hipF, hipB, elF, hF, elB, hB, knF, ftF, knB, ftB, hr };
}
const ROOT = { hF: ["shF", "elF", "uarm", "farm", 1], hB: ["shB", "elB", "uarm", "farm", 1], ftF: ["hipF", "knF", "thigh", "shin", -1], ftB: ["hipB", "knB", "thigh", "shin", -1] };
function solve(J, end, tgt, L, bend) {
  const [r, mid, l1, l2, b] = ROOT[end], [m, e] = ik(J[r], tgt, LEN[l1] * L.tall, LEN[l2] * L.tall, bend ?? b);
  J[mid] = m; J[end] = e;
}

// ---------- Parts ----------
// A muscled segment from a to b. prof: [t, width on the +normal side, width on the -normal side] along the bone.
// Shaded across its width (lit side faces up, towards the rig), with sheen and a coloured rim on the shadow side.
function seg(c, a, b, prof, base, L, o = {}) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const k = (o.w || 1) * L.build, at = (t, w) => P2(a.x + ux * len * t + nx * w * k, a.y + uy * len * t + ny * w * k);
  const A = prof.map(([t, w1]) => at(t, w1)), B = prof.map(([t, , w2]) => at(t, -w2));
  const r0 = (prof[0][1] + prof[0][2]) / 2 * k, r1 = (prof[prof.length - 1][1] + prof[prof.length - 1][2]) / 2 * k;
  c.beginPath(); c.moveTo(A[0].x, A[0].y);
  for (let i = 1; i < A.length; i++) { const m = P2((A[i - 1].x + A[i].x) / 2, (A[i - 1].y + A[i].y) / 2); c.quadraticCurveTo(A[i - 1].x, A[i - 1].y, m.x, m.y); }
  c.lineTo(A[A.length - 1].x, A[A.length - 1].y);
  const e1 = at(1, 0); c.quadraticCurveTo(e1.x + ux * r1 * 1.1, e1.y + uy * r1 * 1.1, B[B.length - 1].x, B[B.length - 1].y);
  for (let i = B.length - 2; i >= 0; i--) { const m = P2((B[i + 1].x + B[i].x) / 2, (B[i + 1].y + B[i].y) / 2); c.quadraticCurveTo(B[i + 1].x, B[i + 1].y, m.x, m.y); }
  c.lineTo(B[0].x, B[0].y);
  const s0 = at(0, 0); c.quadraticCurveTo(s0.x - ux * r0 * 1.1, s0.y - uy * r0 * 1.1, A[0].x, A[0].y);
  c.closePath();
  // Light from above: whichever side's normal points up is the lit side.
  const litPlus = ny < 0, mid = at(0.4, 0), wmax = Math.max(...prof.map((p) => Math.max(p[1], p[2]))) * k;
  const g = c.createLinearGradient(mid.x + nx * wmax * (litPlus ? 1 : -1), mid.y + ny * wmax * (litPlus ? 1 : -1), mid.x - nx * wmax * (litPlus ? 1 : -1), mid.y - ny * wmax * (litPlus ? 1 : -1));
  const dk = o.dark || 0;
  g.addColorStop(0, shade(base, 0.2 - dk)); g.addColorStop(0.28, shade(base, 0.04 - dk)); g.addColorStop(0.7, shade(base, -0.22 - dk)); g.addColorStop(1, shade(base, -0.42 - dk));
  c.fillStyle = g; c.fill();
  if (o.noLine) return;
  const lit = litPlus ? A : B, dark = litPlus ? B : A;
  c.lineCap = "round";
  if (!o.cloth) { // sweat sheen just inside the lit edge
    c.strokeStyle = `rgba(255,245,230,${0.16 - dk * 0.2})`; c.lineWidth = 0.9 * L.build;
    c.beginPath(); lit.slice(1, -1).forEach((p, i) => { const q = P2(p.x - (litPlus ? nx : -nx) * 1.1, p.y - (litPlus ? ny : -ny) * 1.1); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); }); c.stroke();
  }
  if (L.rim) { c.strokeStyle = L.rim; c.globalAlpha = o.cloth ? 0.2 : 0.32 - dk; c.lineWidth = 0.7; c.beginPath(); dark.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke(); c.globalAlpha = 1; }
  c.strokeStyle = "rgba(0,0,0,0.22)"; c.lineWidth = 0.4; c.stroke();
}
// A line drawn in a segment's frame (t along, w across), for muscle definition.
function segLine(c, a, b, pts, col, lw) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  pts.forEach(([t, w], i) => { const x = a.x + ux * len * t + nx * w, y = a.y + uy * len * t + ny * w; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
}
const UARM = [[0, 4.4, 4.6], [0.18, 4.6, 4.4], [0.45, 3.9, 4.3], [0.75, 3.3, 3.7], [1, 2.8, 2.9]];
const FARM = [[0, 2.9, 2.9], [0.22, 3.5, 3.1], [0.6, 2.8, 2.6], [1, 2.1, 2.1]];
const THIGH = [[0, 6.2, 6.4], [0.3, 5.9, 6.2], [0.65, 4.9, 5.2], [1, 3.8, 3.8]];
const SHIN = [[0, 3.6, 3.6], [0.25, 4.4, 3.4], [0.55, 3.6, 2.8], [1, 2.1, 2.0]];
const PARTS = {
  arm(c, J, s, L, back) {
    const sh = J["sh" + s], el = J["el" + s], h = J["h" + s], o = { dark: back ? 0.22 : 0, w: back ? 0.95 : 1 }, b = L.build;
    seg(c, sh, el, UARM, L.skin, L, o);
    if (!back) { segLine(c, sh, el, [[0.12, -4.2 * b], [0.3, -1.4 * b], [0.2, 2.6 * b]], shade(L.skin, -0.45, 0.35), 0.6); } // deltoid
    seg(c, el, h, FARM, L.skin, L, o);
    PARTS.glove(c, h, el, L, back);
  },
  glove(c, h, el, L, back) {
    const ang = Math.atan2(h.y - el.y, h.x - el.x), b = L.build;
    c.save(); c.translate(h.x, h.y); c.rotate(ang); c.scale(b, b);
    c.fillStyle = back ? shade(L.col, -0.45) : L.col; c.beginPath(); c.roundRect(-3.6, -2.7, 3.4, 5.4, 1); c.fill(); // wrist strap
    c.fillStyle = back ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)"; c.fillRect(-2.2, -2.7, 0.5, 5.4);
    const g = c.createLinearGradient(0, -3.6, 0, 3.6); g.addColorStop(0, back ? "#2c2c2c" : "#4a4a4a"); g.addColorStop(0.45, back ? "#121212" : "#1e1e1e"); g.addColorStop(1, "#050505");
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.6, -3); c.quadraticCurveTo(3.6, -4.2, 5.4, -1.6); c.quadraticCurveTo(6.6, 1.2, 4.6, 3.4); c.quadraticCurveTo(1.6, 4.4, -0.6, 3.2); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(1, -2.9); c.quadraticCurveTo(4, -3.3, 5.1, -1.4); c.stroke(); // highlight
    c.strokeStyle = "rgba(0,0,0,0.6)"; c.beginPath(); c.moveTo(3.4, -2.8); c.lineTo(3.9, 2.9); c.stroke(); // knuckle seam
    c.restore();
  },
  leg(c, J, s, L, back) {
    const hip = J["hip" + s], kn = J["kn" + s], ft = J["ft" + s], o = { dark: back ? 0.22 : 0, w: back ? 0.95 : 1 }, b = L.build;
    seg(c, hip, kn, THIGH, L.skin, L, o);
    seg(c, kn, ft, SHIN, L.skin, L, o);
    if (!back) { segLine(c, kn, ft, [[0.12, 3.6 * b], [0.35, 4.2 * b], [0.6, 3.2 * b]], shade(L.skin, -0.45, 0.3), 0.5); segLine(c, kn, ft, [[0.05, -1.2 * b], [0.85, -1.4 * b]], "rgba(255,240,220,0.14)", 0.7); }
    PARTS.foot(c, kn, ft, L, o.dark);
    // Fight shorts over the upper thigh: flared, with a trim at the hem and a side split.
    const hem = P2(hip.x + (kn.x - hip.x) * 0.58, hip.y + (kn.y - hip.y) * 0.58);
    seg(c, hip, hem, [[-0.1, 6.8, 7.0], [0.5, 6.7, 7.0], [1, 6.4, 6.9]], L.col, L, { ...o, cloth: 1 });
    segLine(c, hip, hem, [[0.96, 6.8 * b], [0.96, -7.2 * b]], back ? shade(L.trim, -0.4) : L.trim, 1.3 * b);
    segLine(c, hip, hem, [[0.35, 3 * b], [0.85, 1.5 * b]], "rgba(0,0,0,0.22)", 0.7); // fold
  },
  foot(c, kn, ft, L, dk) {
    const ang = Math.atan2(ft.y - kn.y, ft.x - kn.x) - Math.PI / 2, b = L.build;
    c.save(); c.translate(ft.x, ft.y); c.rotate(clamp(ang, -1.2, 1.4)); c.scale(b, b);
    const g = c.createLinearGradient(0, -2, 0, 2.4); g.addColorStop(0, shade(L.skin, 0.1 - dk)); g.addColorStop(1, shade(L.skin, -0.35 - dk));
    c.fillStyle = g; c.beginPath(); c.moveTo(-2.4, -1.6); c.quadraticCurveTo(-3.4, 1.8, -1.6, 2.2); c.lineTo(6.6, 2.2); c.quadraticCurveTo(7.6, 1.6, 6.8, 0.6); c.quadraticCurveTo(3.6, -0.4, 1.8, -2); c.closePath(); c.fill();
    c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = 0.4; c.stroke(); c.restore();
  },
  torso(c, J, L) {
    const b = L.build, T = L.tall, tr = rad(J.tr ?? 0);
    c.save(); c.translate(0, 0); c.rotate(Math.atan2(J.sh.x, -J.sh.y)); // torso frame: x forward, -y up
    const s = (LEN.torso * T) / 29, X = (x) => x * b, Y = (y) => -y * s, bel = L.belly;
    c.beginPath();
    c.moveTo(X(-6.6), Y(-1.5));
    c.bezierCurveTo(X(-6.2), Y(6), X(-6.6), Y(10), X(-7.6), Y(17)); // lower back into the lats
    c.bezierCurveTo(X(-8.2), Y(22), X(-7.4), Y(26.5), X(-4.6), Y(29.6)); // upper back
    c.quadraticCurveTo(X(-1), Y(31.6), X(2.6), Y(30.2)); // traps and neck base
    c.bezierCurveTo(X(6.8), Y(29.2), X(8.8), Y(25), X(8.2), Y(20.6)); // shoulder cap into the chest
    c.bezierCurveTo(X(7.9), Y(18.8), X(6.6 * bel), Y(17.6), X(6.4 * bel), Y(15)); // under the pec
    c.bezierCurveTo(X(6.6 * bel), Y(10), X(6.4 * bel * bel), Y(5), X(6.2), Y(-1.5)); // abs / belly
    c.closePath();
    const g = c.createRadialGradient(X(3.5), Y(22), 2, X(1), Y(15), 17 * b);
    g.addColorStop(0, shade(L.skin, 0.2)); g.addColorStop(0.45, L.skin); g.addColorStop(0.85, shade(L.skin, -0.3)); g.addColorStop(1, shade(L.skin, -0.45));
    c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = 0.5; c.stroke();
    // Rim light down the back edge.
    if (L.rim) { c.strokeStyle = L.rim; c.globalAlpha = 0.4; c.lineWidth = 0.8; c.beginPath(); c.moveTo(X(-6.6), Y(1)); c.bezierCurveTo(X(-6.2), Y(6), X(-6.6), Y(10), X(-7.6), Y(17)); c.bezierCurveTo(X(-8.2), Y(22), X(-7.4), Y(26.5), X(-4.6), Y(29.6)); c.stroke(); c.globalAlpha = 1; }
    // Muscle definition: pec, sternum, abs, oblique, serratus.
    const dark = shade(L.skin, -0.5, 0.32 * L.cut), lite = `rgba(255,240,225,${0.14 * L.cut})`;
    c.lineCap = "round"; c.strokeStyle = shade(L.skin, -0.5, 0.4); c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(X(7.9), Y(18.6)); c.quadraticCurveTo(X(4.5), Y(16.4), X(1.2), Y(19.4)); c.stroke(); // pec
    c.strokeStyle = dark; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(X(5.7), Y(17)); c.quadraticCurveTo(X(5.9 * bel), Y(9), X(5.2), Y(2)); c.stroke(); // linea alba
    for (const y of [14, 10.5, 7]) { c.beginPath(); c.moveTo(X(2.4), Y(y + 0.6)); c.quadraticCurveTo(X(4), Y(y - 0.4), X(6 * bel), Y(y)); c.stroke(); }
    c.beginPath(); c.moveTo(X(0.6), Y(15.5)); c.quadraticCurveTo(X(1.4), Y(7), X(4.4), Y(0.5)); c.stroke(); // oblique
    for (const y of [17.4, 15.4]) { c.beginPath(); c.moveTo(X(-1.6), Y(y)); c.lineTo(X(0.6), Y(y - 1.2)); c.stroke(); }
    c.strokeStyle = lite; c.lineWidth = 1.1; c.beginPath(); c.moveTo(X(3), Y(26.5)); c.quadraticCurveTo(X(6.4), Y(25.2), X(7.4), Y(21.5)); c.stroke(); // chest highlight
    // Trunks: the top of the shorts wraps the hips, with the waistband.
    c.beginPath(); c.moveTo(X(-7.4), Y(-6)); c.lineTo(X(-6.9), Y(3.6)); c.quadraticCurveTo(X(0), Y(4.6), X(6.6 * bel), Y(3.4)); c.lineTo(X(7.4), Y(-6)); c.closePath();
    const sg = c.createLinearGradient(0, Y(4), 0, Y(-6)); sg.addColorStop(0, shade(L.col, 0.1)); sg.addColorStop(1, shade(L.col, -0.35));
    c.fillStyle = sg; c.fill();
    c.fillStyle = "#101010"; c.beginPath(); c.moveTo(X(-7), Y(4.2)); c.quadraticCurveTo(X(0), Y(5.4), X(6.7 * bel), Y(4)); c.lineTo(X(6.6 * bel), Y(2.2)); c.quadraticCurveTo(X(0), Y(3.4), X(-6.9), Y(2.4)); c.closePath(); c.fill();
    c.strokeStyle = L.trim; c.lineWidth = 0.6; c.beginPath(); c.moveTo(X(-6.9), Y(3.3)); c.quadraticCurveTo(X(0), Y(4.4), X(6.6 * bel), Y(3.1)); c.stroke();
    c.restore();
  },
  neck(c, J, L) {
    const c0 = Math.cos(J.hr), s0 = Math.sin(J.hr), top = add(J.hd, P2(-0.8 * c0 - 4.2 * s0, -0.8 * s0 + 4.2 * c0));
    seg(c, add(J.neck, P2(0, 1.5)), top, [[0, 4.6, 4.6], [0.6, 3.5, 3.4], [1, 3.3, 3.3]], L.skin, L, { dark: 0.12 });
  },
  head(c, J, L, hurt) {
    c.save(); c.translate(J.hd.x, J.hd.y); c.rotate(J.hr); const k = LEN.head / 6.6; c.scale(k, k);
    // Skull and face in one silhouette, facing right (three-quarter).
    c.beginPath();
    c.moveTo(-1.2, 6.2);
    c.bezierCurveTo(-5.4, 5.2, -6.8, 1, -6.4, -2.6);
    c.bezierCurveTo(-5.8, -6.8, -1.6, -8.4, 1.8, -7.8);
    c.bezierCurveTo(4.6, -7.2, 5.8, -5, 5.7, -2.6); // forehead
    c.quadraticCurveTo(6.1, -1.9, 5.9, -1.3); // brow ridge
    c.quadraticCurveTo(6.9, 0.6, 7.2, 1.3); c.quadraticCurveTo(6.6, 2.1, 5.9, 2.1); // nose
    c.quadraticCurveTo(6.3, 3, 6, 3.5); c.quadraticCurveTo(6.1, 4.1, 5.8, 4.5); // lips
    c.quadraticCurveTo(6.1, 5.8, 5.3, 6.7); // chin
    c.quadraticCurveTo(3.6, 7.6, 1.6, 7.2); c.closePath(); // jaw
    const g = c.createRadialGradient(3.2, -2.4, 0.5, 1, 0, 9);
    g.addColorStop(0, shade(L.skin, 0.18)); g.addColorStop(0.5, L.skin); g.addColorStop(1, shade(L.skin, -0.4));
    c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 0.4; c.stroke();
    if (L.rim) { c.strokeStyle = L.rim; c.globalAlpha = 0.6; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-1.2, 6.2); c.bezierCurveTo(-5.4, 5.2, -6.8, 1, -6.4, -2.6); c.stroke(); c.globalAlpha = 1; }
    const d = (a) => shade(L.skin, -0.55, a);
    c.fillStyle = d(0.28); c.beginPath(); c.ellipse(3.9, -0.7, 1.9, 1.2, 0.1, 0, 7); c.fill(); // eye socket
    c.fillStyle = "#1a1210"; c.beginPath(); c.ellipse(4.3, -0.6, 0.85, 0.42, 0.1, 0, 7); c.fill(); // eye
    c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.arc(4.55, -0.75, 0.16, 0, 7); c.fill();
    c.strokeStyle = shade(L.hairCol, 0.1, 0.85); c.lineWidth = 0.75; c.lineCap = "round"; c.beginPath(); c.moveTo(2.6, -2.2); c.quadraticCurveTo(4.3, -2.7, 5.7, -2); c.stroke(); // brow
    c.strokeStyle = d(0.5); c.lineWidth = 0.45; c.beginPath(); c.moveTo(5.9, 2.15); c.quadraticCurveTo(5.1, 2.4, 5, 1.6); c.stroke(); // nostril
    c.beginPath(); c.moveTo(5.9, 3.6); c.lineTo(4.9, 3.75); c.stroke(); // mouth
    c.strokeStyle = "rgba(255,240,225,0.25)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(2.4, 1.2); c.quadraticCurveTo(3.6, 1.8, 4.4, 1.4); c.stroke(); // cheekbone
    c.fillStyle = shade(L.skin, -0.25); c.beginPath(); c.ellipse(-1.6, 0.6, 1.5, 2.3, -0.15, 0, 7); c.fill(); // ear
    c.strokeStyle = d(0.6); c.lineWidth = 0.4; c.beginPath(); c.arc(-1.5, 0.6, 0.9, -1.2, 1.8); c.stroke();
    PARTS.beard(c, L); PARTS.hair(c, L);
    if (hurt) { c.fillStyle = "rgba(170,0,0,0.85)"; c.beginPath(); c.ellipse(4.4, -2.6, 1.6, 0.6, -0.3, 0, 7); c.fill(); c.fillRect(4.6, -2.4, 0.45, 3.4); c.fillStyle = "rgba(150,40,60,0.25)"; c.beginPath(); c.ellipse(3.6, 0.6, 2.2, 1.6, 0, 0, 7); c.fill(); }
    c.restore();
  },
  hair(c, L) {
    const col = L.hairCol; c.fillStyle = col;
    const cap = (lift, front = 4.8) => { c.beginPath(); c.moveTo(-6.5, -1.4 + lift * 0.3); c.bezierCurveTo(-6.4, -6.6 - lift, -1.8, -8.8 - lift, 1.8, -8.2 - lift); c.bezierCurveTo(4.4, -7.6 - lift, front + 0.6, -5.6, front, -4.4); c.quadraticCurveTo(1, -6.2, -1.6, -4.2); c.quadraticCurveTo(-3.4, -2.6, -4.2, -0.6); c.closePath(); c.fill(); };
    switch (L.hair) {
      case "bald": { const g = c.createRadialGradient(1.6, -6.2, 0, 1.6, -6.2, 3); g.addColorStop(0, "rgba(255,255,255,0.28)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(1.6, -6.2, 3, 0, 7); c.fill(); break; }
      case "buzz": c.globalAlpha = 0.6; cap(0, 4.4); c.globalAlpha = 1; break;
      case "short": cap(0.8); break;
      case "crop": cap(0.5); c.beginPath(); c.moveTo(-4.4, -1); c.lineTo(-2.6, -1); c.lineTo(-2.8, 2.4); c.lineTo(-4, 2.2); c.fill(); break;
      case "curly": cap(0.6); for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(-5.6 + i * 1.5, -7.2 + Math.abs(i - 4) * 0.5 - (i % 2) * 0.5, 1.5, 0, 7); c.fill(); } break;
      case "bun": cap(0.6); c.beginPath(); c.arc(-5.2, -6.2, 2.2, 0, 7); c.fill(); break;
      case "mohawk": c.globalAlpha = 0.45; cap(0, 4.2); c.globalAlpha = 1; c.beginPath(); c.moveTo(-5, -5.6); c.quadraticCurveTo(-1, -11, 4.2, -7.4); c.quadraticCurveTo(0, -8.4, -4.4, -4.6); c.fill(); break;
    }
    if (L.hair !== "bald") { c.strokeStyle = "rgba(255,255,255,0.12)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-3, -7.4); c.quadraticCurveTo(0.5, -8.6, 3.2, -7); c.stroke(); }
  },
  beard(c, L) {
    if (L.beard === "none") return;
    c.fillStyle = L.hairCol; c.globalAlpha = L.beard === "stubble" ? 0.32 : 0.92;
    const d = L.beard === "full" ? 1.6 : 0.5;
    c.beginPath(); c.moveTo(-1.6, 2.4); c.quadraticCurveTo(-1.8, 6.2 + d, 1.6, 7.4 + d); c.quadraticCurveTo(4.6, 7.8 + d, 5.7 + d * 0.2, 5.4 + d * 0.6);
    c.quadraticCurveTo(6.2, 4.6, 5.8, 4.3); c.lineTo(4.6, 4.2); c.quadraticCurveTo(5.6, 3.2, 5.8, 3.1); c.lineTo(4.4, 3.2); c.quadraticCurveTo(3.2, 4, 2.6, 2.8); c.quadraticCurveTo(0.6, 3.6, -0.4, 1.6); c.closePath(); c.fill();
    c.globalAlpha = 1;
  },
};

// ---------- Fighter state ----------
const mix = (a, b, w) => { const o = { ...a }; for (const k in b) o[k] = (a[k] ?? 0) + (b[k] - (a[k] ?? 0)) * w; return o; };
const ZERO = { dx: 0, up: 0 };
function curve(t, A) { const hold = A.hold || 0, i = A.in; if (t < i) return ease(t / i); if (t < i + hold) return 1; return ease(Math.max(0, 1 - (t - i - hold) / (1 - i - hold))); }

let S = null; // the scene
function fighter(f, col, side) { return { L: lookOf(f, col), side, tx: side ? 68 : 32, base: "stand", from: null, bt: 1, flags: {}, acts: [], ph: side * 2.1 }; }
export function arenaInit(FS, cols) {
  if (S && S.fs === FS) return;
  S = { fs: FS, F: [fighter(FS.f[0], cols[0], 0), fighter(FS.f[1], cols[1], 1)], hype: 0, t: 0, crowd: null, w: 0, h: 0, slow: 1, name: "", cx: 50, gap: 48, draw: [null, null] };
}
export function arenaSet(i, x, pose, flags = {}) {
  if (!S) return; const F = S.F[i]; F.tx = x; F.flags = flags;
  if (pose !== F.base) { F.from = F.last || null; F.bt = 0; F.base = pose; }
  if (pose === "ko" || pose === "win") S.hype = 1;
}
const strikeAct = (name, delay = 0, extra = {}) => { const s = STRIKE[name]; return { s, name, len: s.kick ? 0.52 : name === "pound" ? 0.3 : 0.32, imp: s.kick ? 0.48 : 0.42, t: -delay, ...extra }; };
// What a fighter does. kind: atk | flurry | hit | bighit | kd | dodge | guard | dash | sprawl | pound | squeeze. opt.miss makes a strike fall short.
export function arenaAct(i, kind, mv, opt = {}) {
  if (!S) return; const F = S.F[i];
  if (kind === "atk" || kind === "flurry") {
    const ground = F.base === "top";
    const pool = ground ? ["pound"] : STYLE_SHOTS[F.L.style] || ["jab", "cross", "hook"];
    if (kind === "flurry") { (ground ? ["pound", "pound", "pound"] : ["jab", "cross", "hook"]).forEach((n, k) => F.acts.push(strikeAct(n, k * 0.17, { alt: k % 2, miss: opt.miss }))); return; }
    const name = ground ? "pound" : STRIKE[mv] ? mv : /kick/.test(mv || "") ? "body kick" : pool[Math.floor(Math.random() * pool.length)];
    F.acts.push(strikeAct(name, 0, { miss: opt.miss }));
    return;
  }
  if (kind === "pound") { for (let k = 0; k < 3; k++) F.acts.push(strikeAct("pound", k * 0.26, { alt: k % 2 })); return; }
  if (kind === "dash") { F.acts.push({ dash: 1, len: 0.55, in: 0.45, t: 0 }); return; }
  if (kind === "squeeze") { F.acts.push({ squeeze: 1, len: 1.4, in: 0.25, hold: 0.55, t: 0 }); return; }
  const A = ACT[kind]; if (!A) return;
  if (kind === "bighit" || kind === "kd") S.hype = Math.min(1, S.hype + (kind === "kd" ? 0.8 : 0.45));
  let delay = 0;
  if (/hit|kd/.test(kind)) { const O = S.F[1 - i], s = O.acts.find((a) => a.s && a.t < a.len * a.imp); if (s) delay = s.len * s.imp - s.t; } // land the reaction on the impact
  if (kind === "dodge") { const O = S.F[1 - i], s = O.acts.find((a) => a.s && a.t < a.len * a.imp); if (s) delay = Math.max(0, s.len * s.imp - s.t - 0.12); }
  F.acts = F.acts.filter((a) => a.t < 0 || a.s); // a reaction cuts other reactions short
  F.acts.push({ ...A, t: -delay });
}
// Milliseconds until fighter i's current strike lands (0 if none), so effects can wait for the impact.
export function arenaImpactIn(i) { if (!S) return 0; const s = S.F[i].acts.find((a) => a.s && a.t < a.len * a.imp); return s ? Math.max(0, (s.len * s.imp - s.t) * 1000 / (S.slow || 1)) : 0; }
// Where fighter i is (in % of the arena) at his head and body, for bursts and rings.
export function arenaHitPt(i, part = "head") { const d = S?.draw[i]; if (!d) return null; const p = d.pts[part] || d.pts.head; return { x: (p.x / S.w) * 100, y: (p.y / S.h) * 100 }; }

function basePose(F) {
  const st = STANCE[F.L.style] || STANCE["Well-rounded"];
  return { ...ZERO, ...(F.base === "stand" ? st : { ...st, ...BASE[F.base] }) };
}
function poseOf(F, dt, moving) {
  const st = STANCE[F.L.style] || STANCE["Well-rounded"];
  let P = basePose(F);
  F.bt = Math.min(1, F.bt + dt / 0.4);
  if (F.from && F.bt < 1) P = mix(F.from, P, ease(F.bt));
  if (F.base === "stand") { // idle: bounce, breathe, footwork
    const b = Math.sin(S.t * 6 + F.ph) * (st.bob || 1);
    P.up += Math.max(0, b) * 0.6; P.sF += b * 2; P.sB -= b * 1.5; P.t += Math.sin(S.t * 3 + F.ph) * 1.2;
    if (moving) { const w = Math.sin(S.t * 14 + F.ph) * 9; P.kF += w; P.kB -= w; }
    if (F.flags.wobbly) { P.t += Math.sin(S.t * 3) * 7; P.h += Math.sin(S.t * 2.3) * 10; P.nF -= 8; P.sF -= 18; P.eF -= 30; }
  } else if (F.base === "win") { P.up += Math.max(0, Math.sin(S.t * 5)) * 4; P.sF += Math.sin(S.t * 5) * 6; }
  else if (F.base === "top" || F.base === "bottom") { const b = Math.sin(S.t * 2.2 + F.ph); P.t += b * 2.5; P.sF += b * 6; }
  for (const A of F.acts) {
    A.t += dt; if (A.t < 0) continue;
    const x = Math.min(1, A.t / A.len);
    if (A.s) { A.k = strikeK(x, A.imp); P = mix(P, A.s.p, A.k * 0.9); }
    else if (A.dash) { A.k = curve(x, A); P = mix(P, { t: 66, h: -6, sF: 60, eF: 30, sB: 50, eB: 40, kF: 64, nF: -118, kB: -46, nB: -8 }, A.k); }
    else if (A.squeeze) { A.k = curve(x, A); P = mix(P, { t: 62, h: 24 }, A.k); P.t += Math.sin(A.t * 14) * 3 * A.k; }
    else { A.k = curve(x, A); P = mix(P, A.p, A.k); }
  }
  F.acts = F.acts.filter((A) => A.t < A.len);
  F.last = P;
  return P;
}
// Strike timing: wind-up, snap to impact, a short hold, then recover.
function strikeK(x, imp) { if (x < imp) return ease(x / imp); if (x < imp + 0.12) return 1; return ease(Math.max(0, 1 - (x - imp - 0.12) / (1 - imp - 0.12))); }

// ---------- Scene ----------
function buildCrowd(w, h) {
  const out = [];
  for (let row = 0; row < 11; row++) {
    const y = h * (0.04 + row * 0.05), s = (0.55 + row * 0.1) * h / 500, gap = 15 * s;
    for (let x = -10 + (row % 2) * gap / 2; x < w + 10; x += gap * (0.8 + Math.random() * 0.5)) out.push({ x, y: y + Math.random() * 4, s, ph: Math.random() * 7, c: 10 + Math.floor(Math.random() * 14) + row * 2, flash: 0 });
  }
  return out;
}
function drawBack(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0a0a0d"); g.addColorStop(0.55, "#121216"); g.addColorStop(1, "#050505");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const sway = 0.6 + S.hype * 4;
  for (const p of S.crowd) {
    const bob = Math.sin(S.t * (2 + S.hype * 5) + p.ph) * sway * p.s, jump = S.hype > 0.5 ? Math.max(0, Math.sin(S.t * 9 + p.ph)) * 3 * S.hype * p.s : 0;
    c.fillStyle = `rgb(${p.c},${p.c},${p.c + 4})`;
    c.beginPath(); c.ellipse(p.x + bob, p.y + 10 * p.s - jump, 7 * p.s, 6 * p.s, 0, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(p.x + bob, p.y - jump, 3.4 * p.s, 0, 7); c.fill();
    if (Math.random() < 0.0006 + S.hype * 0.01) p.flash = 1;
    if (p.flash > 0) { c.fillStyle = `rgba(255,255,255,${p.flash})`; c.beginPath(); c.arc(p.x + bob + 3, p.y - 2 - jump, 1.6 * p.s, 0, 7); c.fill(); p.flash -= 0.08; }
  }
  c.save(); c.globalCompositeOperation = "lighter";
  for (const [k, x0] of [[0, 0.28], [1, 0.5], [2, 0.72]]) {
    const sw = Math.sin(S.t * 0.35 + k * 2) * w * 0.06, gx = w * x0 + sw;
    const lg = c.createLinearGradient(0, 0, 0, h * 0.85); lg.addColorStop(0, `rgba(255,248,230,${0.1 + S.hype * 0.06})`); lg.addColorStop(1, "rgba(255,248,230,0)");
    c.fillStyle = lg; c.beginPath(); c.moveTo(gx - 8, -5); c.lineTo(gx + 8, -5); c.lineTo(gx + w * 0.12, h * 0.85); c.lineTo(gx - w * 0.12, h * 0.85); c.fill();
  }
  c.restore();
}
function octPts(cx, cy, rx, ry) { const pts = []; for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + (k * Math.PI) / 4; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return pts; }
function drawCage(c, w, h, floorY) {
  const cx = w / 2, cy = floorY + h * 0.05, rx = w * 0.62, ry = h * 0.24;
  const back = octPts(cx, cy, rx, ry).filter((p) => p[1] < cy), fenceH = h * 0.42;
  c.save();
  c.beginPath(); c.moveTo(-10, floorY + 4); for (const [x, y] of back.sort((a, b) => a[0] - b[0])) c.lineTo(x, y); c.lineTo(w + 10, floorY + 4); c.lineTo(w + 10, floorY - fenceH); c.lineTo(-10, floorY - fenceH); c.closePath(); c.clip();
  c.strokeStyle = "rgba(200,200,210,0.07)"; c.lineWidth = 1;
  for (let x = -h; x < w + h; x += 14) { c.beginPath(); c.moveTo(x, floorY - fenceH); c.lineTo(x + fenceH, floorY); c.stroke(); c.beginPath(); c.moveTo(x + fenceH, floorY - fenceH); c.lineTo(x, floorY); c.stroke(); }
  c.restore();
  c.fillStyle = "#0b0b0b"; c.fillRect(0, floorY - fenceH - 6, w, 8);
  for (const [x, y] of back) { c.fillStyle = "#101010"; c.fillRect(x - 5, y - fenceH, 10, fenceH); c.fillStyle = "#1c1c1c"; c.fillRect(x - 5, y - fenceH * 0.45, 10, fenceH * 0.45 - 2); }
  const pts = octPts(cx, cy, rx, ry);
  const g = c.createRadialGradient(cx, cy - ry * 0.2, 10, cx, cy, rx); g.addColorStop(0, "#3d3d41"); g.addColorStop(0.55, "#252528"); g.addColorStop(1, "#0f0f10");
  c.fillStyle = g; c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
  c.strokeStyle = "#000"; c.lineWidth = 6; c.stroke();
  c.save(); c.translate(cx, cy - ry * 0.05); c.scale(1, 0.32); c.fillStyle = "rgba(255,255,255,0.06)"; c.font = `800 italic ${Math.round(w * 0.07)}px Oswald, Impact, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(S.name.toUpperCase(), 0, 0); c.restore();
  const sp = c.createRadialGradient(cx, floorY + h * 0.02, 0, cx, floorY + h * 0.02, w * 0.35); sp.addColorStop(0, `rgba(255,250,235,${0.08 + S.hype * 0.05})`); sp.addColorStop(1, "rgba(255,250,235,0)");
  c.fillStyle = sp; c.fillRect(0, floorY - h * 0.1, w, h * 0.5);
}

// Contact radii (body units) used to rest a fighter on the mat.
const RAD = { hip: 6, sh: 6.5, hd: 6.6, kn: 4, ft: 1.8, el: 3.2, h: 3.4 };
function restY(J) { let low = -1e9; for (const k in J) { const r = RAD[k] ?? RAD[k.replace(/[FB]$/, "")]; if (r != null && J[k].y != null) low = Math.max(low, J[k].y + r); } return low; }

// Fighter i's frame: where he stands on screen, his scale and which way he faces.
function place(i, P, J, U, floorY, cxPx) {
  const F = S.F[i], face = i ? -1 : 1;
  const X = cxPx + (i ? 1 : -1) * (S.gap / 2) * U + P.dx * U * face, Y = floorY - (restY(J) + P.up) * U;
  return { X, Y, face, U, toW: (p) => P2(X + face * p.x * U, Y + p.y * U), toL: (q) => P2((q.x - X) / (face * U), (q.y - Y) / U), F };
}
// Points on a fighter that blows aim at (local units), pushed out to the skin facing the attacker.
function targetPt(J, tgt) {
  if (tgt === "head") return add(J.hd, P2(Math.cos(J.hr) * 5.2 - Math.sin(J.hr) * 0.5, Math.sin(J.hr) * 5.2 + 1));
  if (tgt === "body") { const m = P2(J.sh.x * 0.42, J.sh.y * 0.42), tr = Math.atan2(J.sh.y, J.sh.x) + Math.PI / 2; return add(m, P2(Math.cos(tr), Math.sin(tr)), 6.2); }
  if (tgt === "leg") return add(P2((J.hipF.x + J.knF.x) / 2, (J.hipF.y + J.knF.y) / 2), P2(4, 0));
  if (tgt === "hip") return P2(5, -2);
  if (tgt === "neck") return add(J.neck, P2(0, 1));
  if (tgt === "back") return add(J.sh, P2(-3, -5));
  if (tgt === "waist") return P2(-7, -1);
  return J.hd;
}

// IK pass: puts gloves, feet and knees on the other fighter as he is drawn this frame.
function contact(me, op, P, J) {
  const F = me.F, L = F.L, oJ = op.J, toMe = (p) => me.toL(op.toW(p));
  let lunge = 0; const used = new Set();
  for (const A of F.acts) {
    if (A.t < 0) continue;
    if (A.s) {
      const s = A.s, end = s.limb === "knB" ? "ftB" : s.limb;
      // Aim: the target as seen now; a miss aims short and freezes there.
      let T = toMe(targetPt(oJ, s.tgt));
      if (A.miss) { if (!A.T) A.T = add(T, P2(-9, -3)); T = A.T; }
      else if (A.t <= A.len * A.imp) A.T = T; else T = A.T || T;
      const [rk, , l1, l2] = ROOT[end], root = J[rk], reach = s.limb === "knB" ? LEN.thigh * L.tall * 1.1 : (LEN[l1] + LEN[l2]) * L.tall * (s.kick ? 0.97 : 0.95);
      if (A.lunge == null || A.t <= A.len * A.imp) A.lunge = clamp(dist(root, T) - reach + (s.kick ? 2 : 1), 0, s.kick ? 24 : 20);
      lunge = Math.max(lunge, A.lunge * A.k);
      const Tl = P2(T.x - A.lunge * A.k, T.y), rest = J[end], k = A.k;
      let e = P2(lerp(rest.x, Tl.x, k), lerp(rest.y, Tl.y, k)), arc = Math.sin(Math.PI * Math.min(1, k)) * (1 - k * 0.6), bend;
      if (s.path === "hook") { e = add(e, P2(-2, -6), arc); bend = -1; }
      else if (s.path === "upper") e = add(e, P2(-3, 8), arc);
      else if (s.path === "over") { e = add(e, P2(-4, -10), arc); bend = -1; }
      else if (s.path === "pound") { e = add(e, P2(-6, -16), arc * 1.2); bend = 1; }
      else if (s.path === "elbow") { e = add(e, P2(-9, -1), k); bend = -1; }
      else if (s.path === "kick") { e = add(e, P2(-6, 6), arc); }
      if (s.limb === "knB") { // knee: drive the knee into the body, shin folded under
        const kn = P2(lerp(J.knB.x, Tl.x, k), lerp(J.knB.y, Tl.y, k)); J.knB = kn; J.ftB = add(kn, P2(-9, 16));
      } else { const hand = A.alt && end === "hF" ? "hB" : end; used.add(hand); solve(J, hand, e, L, bend); }
      if (s.grip === "head") used.add("hF").add("hB");
      if (s.grip === "head" && k > 0.05) { const n = toMe(targetPt(oJ, "neck")); for (const h of ["hF", "hB"]) { const r = J[h]; solve(J, h, P2(lerp(r.x, n.x - lunge, k), lerp(r.y, n.y, k)), L, 1); } }
    } else if (A.dash) { used.add("hF").add("hB"); // shot: shoulder into the hips, arms around the thighs
      const T = toMe(targetPt(oJ, "hip")); if (A.lunge == null || A.t < A.len * A.in) A.lunge = clamp(dist(J.shF, T) - 3, 0, 26);
      lunge = Math.max(lunge, A.lunge * A.k);
      for (const [h, kn] of [["hF", "knF"], ["hB", "knB"]]) { const t = toMe(add(oJ[kn], P2(-3, -6))), r = J[h]; solve(J, h, P2(lerp(r.x, t.x - A.lunge * A.k, A.k), lerp(r.y, t.y, A.k)), L, 1); }
    } else if (A.grip === "back" || A.squeeze) { used.add("hF").add("hB"); // sprawl onto his back / squeeze the neck
      const T = toMe(targetPt(oJ, A.squeeze ? "neck" : "back"));
      for (const h of ["hF", "hB"]) { const r = J[h]; solve(J, h, P2(lerp(r.x, T.x, A.k), lerp(r.y, T.y + (h === "hB" ? 2 : 0), A.k)), L, 1); }
    }
  }
  // Standing guard: gloves held at the chin (style decides how high and how far out), loosening when rocked.
  if (F.base === "stand" && F.bt > 0.5) {
    const g = GUARD[L.style] || GUARD["Well-rounded"], loose = Math.max(0, ...F.acts.filter((a) => a.p === ACT.bighit.p || a.p === ACT.kd.p).map((a) => a.k || 0));
    const w = (1 - loose) * (F.flags.wobbly ? 0.6 : 1) * ease(clamp((F.bt - 0.5) * 2, 0, 1));
    for (const [h, o] of [["hF", g[0]], ["hB", g[1]]]) if (!used.has(h) && !F.acts.some((a) => a.p === ACT.guard.p)) {
      const t = add(J.hd, P2(o[0] + Math.sin(S.t * 6 + F.ph + (h === "hB" ? 1 : 0)) * 0.6, o[1])), r = J[h];
      solve(J, h, P2(lerp(r.x, t.x, w), lerp(r.y, t.y, w)), L, 1);
    }
  }
  // Ground: the man underneath wraps his legs round the waist and frames on the shoulders.
  if (F.base === "bottom" && op.F.base === "top") {
    const w = clamp(F.bt * 1.4, 0, 1);
    for (const [ft, d] of [["ftF", P2(-2, 0)], ["ftB", P2(2, 1)]]) { const t = toMe(add(targetPt(oJ, "waist"), d)), r = J[ft]; solve(J, ft, P2(lerp(r.x, t.x, w), lerp(r.y, t.y, w)), L, -1); }
    if (!F.acts.some((a) => a.p === ACT.hit.p || a.p === ACT.bighit.p)) for (const [h, d] of [["hF", P2(0, 3)], ["hB", P2(-2, 6)]]) { const t = toMe(add(oJ.shF, d)), r = J[h]; solve(J, h, P2(lerp(r.x, t.x, w * 0.85), lerp(r.y, t.y, w * 0.85)), L, 1); }
  }
  return lunge;
}

function drawFighter(c, d) {
  const { F, J, X, Y, face, U } = d, L = F.L;
  L.rim = F.side ? "rgb(120,165,255)" : "rgb(255,120,95)";
  // Shadow on the mat, as wide as the body.
  const xs = ["ftF", "ftB", "hip", "sh", "hd", "knF", "knB"].map((k) => X + face * J[k].x * U);
  const lo = Math.min(...xs), hi = Math.max(...xs), floor = d.floorY;
  const sg = c.createRadialGradient((lo + hi) / 2, floor + 2, 0, (lo + hi) / 2, floor + 2, (hi - lo) / 2 + 14 * U);
  sg.addColorStop(0, "rgba(0,0,0,0.55)"); sg.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = sg; c.beginPath(); c.ellipse((lo + hi) / 2, floor + 2, (hi - lo) / 2 + 14 * U, 4.5 * U, 0, 0, 7); c.fill();
  c.save(); c.translate(X, Y); c.scale(face * U, U);
  if (F.base === "ko") c.filter = "brightness(0.65) saturate(0.7)";
  PARTS.arm(c, J, "B", L, true); PARTS.leg(c, J, "B", L, true);
  PARTS.torso(c, J, L); PARTS.leg(c, J, "F", L, false);
  PARTS.neck(c, J, L);
  if (F.base === "win") { PARTS.arm(c, J, "F", L, false); PARTS.head(c, J, L, F.flags.cut); }
  else { PARTS.head(c, J, L, F.flags.cut); PARTS.arm(c, J, "F", L, false); }
  c.restore();
}

// Fight positions from fightview are 0–100; only the centre is used — the arena sets the spacing itself.
const GAP = { stand: 56, ground: 9, end: 58, kd: 50 };
const centerPx = (c, w) => w / 2 + ((c - 50) / 100) * w * 0.7;
export function screenPct(x) { return +(50 + (x - 50) * 0.7).toFixed(2); }

let raf = 0, last = 0;
function frame(now) {
  const cv = document.getElementById("oct");
  if (!cv || !S) { raf = 0; return; }
  const dt0 = Math.min(0.05, (now - (last || now)) / 1000); last = now;
  const slow = document.getElementById("arena")?.classList.contains("mo-on") ? 0.25 : 1;
  S.slow += (slow - S.slow) * 0.15;
  let dt = dt0 * S.slow; if (S.paused) { dt = S.step || 0; S.step = 0; } S.t += dt; S.hype = Math.max(0, S.hype - dt0 * 0.25);
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  if (!S.crowd || S.w !== w || S.h !== h) { S.crowd = buildCrowd(w, h); S.w = w; S.h = h; }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bug = document.querySelector("#arena .bug"), floorY = Math.min(h * 0.8, (bug ? bug.offsetTop : h) - h * 0.03), U = Math.min((floorY * 0.74) / 88, w / 170);
  const ar = document.getElementById("arena");
  const fl = ((floorY / h) * 100).toFixed(1), fh = ((88 * U) / h * 100).toFixed(1);
  if (ar && ar.dataset.fl !== fl + fh) { ar.dataset.fl = fl + fh; ar.style.setProperty("--fl", fl); ar.style.setProperty("--fh", fh); }
  drawBack(c, w, h); drawCage(c, w, h, floorY);
  // Spacing: the centre follows momentum; the gap depends on what they're doing.
  const [A, B] = S.F, bases = [A.base, B.base];
  const tgap = bases.includes("ko") || bases.includes("win") ? GAP.end : bases.includes("top") ? GAP.ground : GAP.stand;
  const moving = Math.abs(tgap - S.gap) > 0.5 || Math.abs((A.tx + B.tx) / 2 - S.cx) > 0.3;
  S.gap += (tgap - S.gap) * Math.min(1, dt * 5); S.cx += ((A.tx + B.tx) / 2 - S.cx) * Math.min(1, dt * 4);
  const cxPx = centerPx(S.cx, w);
  // Pass 1: poses and joints. Pass 2: contact (IK) against the other man's pass-1 body.
  const poses = S.F.map((F) => poseOf(F, dt, moving && F.base === "stand"));
  const D = S.F.map((F, i) => { const J = joints(poses[i], F.L); return { ...place(i, poses[i], J, U, floorY, cxPx), J, floorY }; });
  const lunges = D.map((d, i) => contact(d, D[1 - i], poses[i], d.J));
  D.forEach((d, i) => { if (lunges[i]) { d.X += d.face * lunges[i] * U; } });
  for (const [i, d] of D.entries()) {
    S.draw[i] = { pts: { head: d.toW(d.J.hd), body: d.toW(P2(d.J.sh.x * 0.5, d.J.sh.y * 0.5)), legs: d.toW(d.J.knF) } };
    const p = document.getElementById("p" + i); if (p) p.style.setProperty("--x", ((d.toW(P2(d.J.sh.x * 0.5, 0)).x / w) * 100).toFixed(2));
  }
  // Draw order: whoever is underneath first.
  const order = [0, 1].sort((a, b) => (S.F[a].base === "top") - (S.F[b].base === "top") || (S.F[b].base === "ko") - (S.F[a].base === "ko"));
  for (const i of order) drawFighter(c, D[i]);
  const v = c.createRadialGradient(w / 2, h * 0.55, h * 0.3, w / 2, h * 0.55, w * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)");
  c.fillStyle = v; c.fillRect(0, 0, w, h);
  raf = requestAnimationFrame(frame);
}
// For the pose sheet: freeze time, then step it by exact amounts.
export function arenaPause(on) { if (S) S.paused = on; }
export function arenaStep(sec) { if (S) S.step = (S.step || 0) + sec; }
// Called after each render of the live screen; starts the loop if it isn't running.
export function arenaMount(name) { if (S) S.name = name; if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
