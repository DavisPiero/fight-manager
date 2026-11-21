// The live octagon: one canvas with crowd, lights, fence, mat and two drawn, rigged fighters.
// fightview.js tells it where each fighter stands (set) and what he just did (act); it animates the rest.
//
// Fighters are built from vector parts (PARTS below). Each part is drawn between two joints, so a painted
// image can replace any part later without touching the animation: draw the image along the same segment.
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
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))))); return `rgb(${c})`; }
export function lookOf(f, col) {
  const h = hash(f.name), real = f.real && UFC_DATA[f.name];
  const skin = (real && String(SKIN[UFC_DATA[f.name].file] || "").replace("!", "")) || pick(h, SKIN_BY_NAT[f.nat] || SKIN_BY_NAT.any, 3);
  const light = lum(skin) > 0.62;
  const hairCol = light ? pick(h, ["#1d1611", "#2b1d14", "#3e2a1b", "#5a3b22", "#8c5a2e", "#b8894e", "#1d1611"], 7) : "#141010";
  const wc = f.wc ?? 3, ht = +f.ht || 70 + wc * 0.8;
  return {
    skin, hairCol, col, trim: pick(h, ["#ffffff", "#111111", "#e8c46a", "#ffffff"], 11),
    hair: pick(h, HAIR, 13), beard: pick(h, BEARD, 17),
    build: 0.86 + wc * 0.045, belly: wc === 7 ? 1.12 : 1, tall: Math.max(0.93, Math.min(1.08, ht / 71)),
    style: f.style || "Well-rounded",
  };
}

// ---------- Poses (facing right; angles in degrees) ----------
// t torso lean (0 up, + forward) · h head tilt · sF/sB shoulder (0 down, + forward/up) · eF/eB elbow bend
// kF/kB hip (0 down, + forward) · nF/nB knee (negative bends the shin back) · dx forward shift · up lifts off the floor
const STANCE = {
  Boxer:        { t: 12, h: -6, sF: 62, eF: 108, sB: 36, eB: 128, kF: 20, nF: -24, kB: -18, nB: 6, bob: 1.6 },
  Kickboxer:    { t: 4,  h: -4, sF: 70, eF: 100, sB: 40, eB: 125, kF: 14, nF: -12, kB: -16, nB: 6, bob: 1.2 },
  "Muay Thai":  { t: 2,  h: -2, sF: 96, eF: 70,  sB: 66, eB: 100, kF: 12, nF: -10, kB: -14, nB: 6, bob: 0.8 },
  Wrestler:     { t: 28, h: -14, sF: 58, eF: 70, sB: 44, eB: 92,  kF: 38, nF: -56, kB: -26, nB: -10, bob: 0.9 },
  Grappler:     { t: 22, h: -10, sF: 60, eF: 80, sB: 40, eB: 105, kF: 30, nF: -44, kB: -22, nB: -6, bob: 0.9 },
  "Well-rounded": { t: 10, h: -6, sF: 66, eF: 100, sB: 38, eB: 125, kF: 20, nF: -24, kB: -18, nB: 6, bob: 1.2 },
};
const BASE = {
  top:    { t: 38, h: -10, sF: 40, eF: 20, sB: 30, eB: 30, kF: 30, nF: -125, kB: 8, nB: -105 },
  bottom: { t: -88, h: 20, sF: 140, eF: 30, sB: 120, eB: 50, kF: 130, nF: -80, kB: 110, nB: -95 },
  ko:     { t: -90, h: 30, sF: -95, eF: 15, sB: 75, eB: 10, kF: 85, nF: -8, kB: 75, nB: -20 },
  win:    { t: -4, h: 14, sF: 145, eF: 25, sB: 100, eB: 70, kF: 8, nF: -6, kB: -10, nB: -6 },
};
const STRIKE = {
  jab:        { t: 16, h: -4, sF: 92, eF: 2, dx: 3 },
  cross:      { t: 26, h: -8, sB: 94, eB: 2, kB: -28, nB: -4, dx: 6 },
  hook:       { t: 24, h: -6, sF: 96, eF: 70, dx: 4 },
  uppercut:   { t: 8, h: -10, sB: 70, eB: 118, kF: 30, nF: -40, dx: 3 },
  overhand:   { t: 36, h: -12, sB: 150, eB: 50, kB: -30, dx: 7 },
  elbow:      { t: 22, h: -6, sF: 100, eF: 150, dx: 5 },
  "leg kick": { t: -10, sB: 20, eB: 40, kB: 72, nB: -18, dx: 2 },
  "body kick":{ t: -22, sB: 10, eB: 30, kB: 96, nB: -8, dx: 2 },
  "head kick":{ t: -38, h: 10, sB: 0, eB: 20, kB: 128, nB: -4, dx: 2 },
  knee:       { t: -4, sF: 100, eF: 50, sB: 94, eB: 60, kB: 88, nB: -125, dx: 6 },
};
const STYLE_SHOTS = { Boxer: ["cross", "hook", "uppercut"], Kickboxer: ["body kick", "head kick", "cross"], "Muay Thai": ["knee", "elbow", "leg kick"], Wrestler: ["overhand", "cross"], Grappler: ["cross", "jab"] };
// Reactions and moves. len seconds; reps repeats; ease "in" fraction reaches the pose.
const ACT = {
  hit:     { p: { t: -12, h: -26, dx: -3 }, len: 0.32, in: 0.2 },
  bighit:  { p: { t: -24, h: -34, nF: -40, nB: -30, sF: 40, eF: 40, dx: -8 }, len: 0.6, in: 0.18 },
  kd:      { p: { t: -24, h: -20, sF: 25, eF: 30, sB: 10, eB: 20, kF: 84, nF: -70, kB: 74, nB: -90, dx: -6 }, len: 1.2, in: 0.15, hold: 0.6 },
  dodge:   { p: { t: -18, h: -12, dx: -4 }, len: 0.32, in: 0.3 },
  guard:   { p: { t: 18, h: 16, sF: 112, eF: 132, sB: 92, eB: 140 }, len: 0.4, in: 0.25 },
  dash:    { p: { t: 62, h: -30, sF: 84, eF: 20, sB: 70, eB: 30, kF: 72, nF: -112, kB: -40, nB: -10, dx: 14 }, len: 0.45, in: 0.4 },
  sprawl:  { p: { t: 72, h: -10, sF: 30, eF: 10, sB: 20, eB: 10, kF: -48, nF: -4, kB: -70, nB: 0, dx: -4 }, len: 0.5, in: 0.3 },
  pound:   { p: { t: 52, sF: 70, eF: 0, sB: 40, eB: 30 }, alt: { sF: 160, eF: 60 }, len: 0.28, reps: 3, in: 0.5 },
  squeeze: { p: { t: 70, h: 10, sF: 80, eF: 70, sB: 70, eB: 80 }, len: 0.35, reps: 4, in: 0.4 },
};

// ---------- Rig ----------
const LEN = { torso: 30, neck: 3, head: 7.6, uarm: 16, farm: 15, thigh: 22, shin: 22 };
const rad = (d) => (d * Math.PI) / 180;
const limb = (o, a, l) => ({ x: o.x + Math.sin(rad(a)) * l, y: o.y + Math.cos(rad(a)) * l });
function joints(P, L) {
  const T = L.tall, hip = { x: 0, y: 0 };
  const sh = { x: Math.sin(rad(P.t)) * LEN.torso * T, y: -Math.cos(rad(P.t)) * LEN.torso * T };
  const hd = { x: sh.x + Math.sin(rad(P.t + P.h * 0.5)) * (LEN.neck + LEN.head), y: sh.y - Math.cos(rad(P.t + P.h * 0.5)) * (LEN.neck + LEN.head) };
  const arm = (s, e) => { const el = limb(sh, s, LEN.uarm * T); return [el, limb(el, s + e, LEN.farm * T)]; };
  const leg = (k, n) => { const kn = limb(hip, k, LEN.thigh * T); return [kn, limb(kn, k + n, LEN.shin * T)]; };
  const [elF, hF] = arm(P.sF, P.eF), [elB, hB] = arm(P.sB, P.eB), [knF, ftF] = leg(P.kF, P.nF), [knB, ftB] = leg(P.kB, P.nB);
  return { hip, sh, hd, elF, hF, elB, hB, knF, ftF, knB, ftB };
}

// ---------- Parts (swap any of these for painted art later) ----------
function capsule(c, a, b, w1, w2, fill, rim) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
  c.beginPath();
  c.moveTo(a.x + nx * w1, a.y + ny * w1); c.lineTo(b.x + nx * w2, b.y + ny * w2);
  c.arc(b.x, b.y, w2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  c.lineTo(a.x - nx * w1, a.y - ny * w1);
  c.arc(a.x, a.y, w1, ang - Math.PI / 2, ang + Math.PI / 2, true);
  c.closePath(); c.fillStyle = fill; c.fill();
  if (rim) { c.strokeStyle = rim; c.lineWidth = 0.8; c.stroke(); }
}
const PARTS = {
  arm(c, J, side, L, back) {
    const b = L.build, sk = back ? shade(L.skin, -0.28) : L.skin;
    capsule(c, J.sh, J["el" + side], 4.2 * b, 3.4 * b, sk, L.rim);
    capsule(c, J["el" + side], J["h" + side], 3.4 * b, 2.6 * b, sk, L.rim);
    PARTS.glove(c, J["h" + side], J["el" + side], L, back);
  },
  glove(c, h, el, L, back) {
    const ang = Math.atan2(h.y - el.y, h.x - el.x);
    c.save(); c.translate(h.x, h.y); c.rotate(ang);
    c.fillStyle = back ? "#0b0b0b" : "#181818"; c.beginPath(); c.ellipse(1.2, 0, 4.4, 3.6, 0, 0, 7); c.fill();
    c.fillStyle = L.col; c.fillRect(-3.2, -3, 1.6, 6); c.restore();
  },
  leg(c, J, side, L, back) {
    const b = L.build, sk = back ? shade(L.skin, -0.28) : L.skin;
    capsule(c, J.hip, J["kn" + side], 6 * b, 4.4 * b, sk, L.rim);
    capsule(c, J["kn" + side], J["ft" + side], 4.2 * b, 2.8 * b, sk, L.rim);
    const ft = J["ft" + side], kn = J["kn" + side], ang = Math.atan2(ft.y - kn.y, ft.x - kn.x) - Math.PI / 2;
    c.save(); c.translate(ft.x, ft.y); c.rotate(ang); c.fillStyle = sk; c.beginPath(); c.ellipse(2.6, 0.6, 4.2, 1.9, 0, 0, 7); c.fill(); c.restore();
    // Shorts over the top of the thigh.
    const mid = { x: J.hip.x + (kn.x - J.hip.x) * 0.55, y: J.hip.y + (kn.y - J.hip.y) * 0.55 };
    capsule(c, J.hip, mid, 7.2 * b, 6 * b, back ? shade(L.col, -0.35) : L.col);
  },
  torso(c, J, L) {
    const b = L.build, ang = Math.atan2(J.sh.y - J.hip.y, J.sh.x - J.hip.x), nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
    const wW = 7.4 * b * L.belly, sW = 9.6 * b, ch = 1.8 * b; // chest pushes forward
    const mx = (J.hip.x + J.sh.x) / 2, my = (J.hip.y + J.sh.y) / 2;
    c.beginPath();
    c.moveTo(J.hip.x - nx * wW, J.hip.y - ny * wW);
    c.quadraticCurveTo(mx - nx * (wW + ch * 1.6), my - ny * (wW + ch * 1.6), J.sh.x - nx * sW, J.sh.y - ny * sW);
    c.quadraticCurveTo(J.sh.x + Math.cos(ang) * 4, J.sh.y + Math.sin(ang) * 4, J.sh.x + nx * sW, J.sh.y + ny * sW);
    c.quadraticCurveTo(mx + nx * (wW + 0.6), my + ny * (wW + 0.6), J.hip.x + nx * wW, J.hip.y + ny * wW);
    c.closePath();
    const g = c.createLinearGradient(J.hip.x - nx * wW, J.hip.y - ny * wW, J.hip.x + nx * wW, J.hip.y + ny * wW);
    g.addColorStop(0, shade(L.skin, 0.08)); g.addColorStop(1, shade(L.skin, -0.22));
    c.fillStyle = g; c.fill(); c.strokeStyle = L.rim; c.lineWidth = 0.8; c.stroke();
    // Waistband.
    const wb = (k) => ({ x: J.hip.x + nx * wW * k + Math.cos(ang) * 1.5, y: J.hip.y + ny * wW * k + Math.sin(ang) * 1.5 });
    capsule(c, wb(-1), wb(1), 2.6 * b, 2.6 * b, L.col); capsule(c, wb(-0.95), wb(0.95), 0.7 * b, 0.7 * b, L.trim);
  },
  head(c, J, L, P, hurt) {
    const r = LEN.head, ang = rad(P.t + P.h);
    c.save(); c.translate(J.hd.x, J.hd.y); c.rotate(ang);
    capsule(c, { x: 0, y: 0 }, { x: -Math.sin(rad(P.h)) * 6, y: 8 }, 3.6 * L.build, 4.2 * L.build, shade(L.skin, -0.15)); // neck
    c.fillStyle = L.skin; c.beginPath(); c.ellipse(0, 0, r * 0.86, r, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(r * 0.6, -1); c.quadraticCurveTo(r * 1.05, 2, r * 0.82, 4.2); c.quadraticCurveTo(r * 0.5, r * 1.02, -1, r * 0.95); c.lineTo(0, 0); c.fill(); // jaw
    c.beginPath(); c.moveTo(r * 0.8, -1.6); c.lineTo(r * 1.08, 1.2); c.lineTo(r * 0.82, 1.6); c.fill(); // nose
    c.fillStyle = shade(L.skin, -0.3); c.beginPath(); c.ellipse(-1.4, 0.6, 1.5, 2.1, 0, 0, 7); c.fill(); // ear
    c.fillStyle = "#151010"; c.fillRect(r * 0.42, -2.2, 2.2, 1); // eye
    c.fillStyle = shade(L.skin, -0.35); c.fillRect(r * 0.3, -3.6, 3.4, 0.9); // brow
    PARTS.beard(c, L, r); PARTS.hair(c, L, r);
    if (hurt) { c.fillStyle = "#b00000cc"; c.beginPath(); c.ellipse(r * 0.45, -3.2, 2.2, 0.9, -0.4, 0, 7); c.fill(); c.fillRect(r * 0.4, -3, 0.7, 4); }
    c.restore();
  },
  hair(c, L, r) {
    c.fillStyle = L.hairCol;
    const cap = (h) => { c.beginPath(); c.ellipse(-0.6, -1, r * 0.92, r * h, 0, Math.PI * 1.02, Math.PI * 2.02); c.fill(); };
    switch (L.hair) {
      case "bald": c.fillStyle = "#ffffff22"; c.beginPath(); c.ellipse(1, -r * 0.6, 2.6, 1.2, 0, 0, 7); c.fill(); break;
      case "buzz": c.globalAlpha = 0.75; cap(1.04); c.globalAlpha = 1; break;
      case "short": cap(1.12); break;
      case "crop": cap(1.1); c.fillRect(-r * 0.9, -2, 3, 5); break;
      case "curly": for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-r * 0.8 + i * 2.2, -r * 0.82 + Math.abs(i - 3) * 0.6, 2.4, 0, 7); c.fill(); } break;
      case "bun": cap(1.08); c.beginPath(); c.arc(-r * 0.7, -r * 0.85, 2.8, 0, 7); c.fill(); break;
      case "mohawk": c.globalAlpha = 0.5; cap(1.02); c.globalAlpha = 1; c.fillRect(-r * 0.5, -r * 1.22, r * 1.1, 3); break;
    }
  },
  beard(c, L, r) {
    if (L.beard === "none") return;
    c.fillStyle = L.hairCol; c.globalAlpha = L.beard === "stubble" ? 0.35 : 0.95;
    const d = L.beard === "full" ? 2.4 : 0.8;
    c.beginPath(); c.moveTo(-1, 2); c.quadraticCurveTo(-0.5, r + d, r * 0.5, r * 0.96 + d); c.quadraticCurveTo(r * 0.95, 5.5 + d * 0.4, r * 0.88, 2.6); c.lineTo(r * 0.45, 4.2); c.quadraticCurveTo(r * 0.2, 2.5, 1.5, 2); c.closePath(); c.fill();
    c.globalAlpha = 1;
  },
};

// ---------- Fighter state ----------
const mix = (a, b, w) => { const o = { ...a }; for (const k in b) o[k] = (a[k] ?? 0) + (b[k] - (a[k] ?? 0)) * w; return o; };
const ZERO = { dx: 0, up: 0 };
function curve(t, A) { const hold = A.hold || 0, i = A.in; if (t < i) return t / i; if (t < i + hold) return 1; return Math.max(0, 1 - (t - i - hold) / (1 - i - hold)); }

let S = null; // the scene
function fighter(f, col, side) { return { L: lookOf(f, col), side, x: side ? 62 : 38, tx: side ? 62 : 38, base: "stand", flags: {}, acts: [], ph: side * 2.1 }; }
export function arenaInit(FS, cols) {
  if (S && S.fs === FS) return;
  S = { fs: FS, F: [fighter(FS.f[0], cols[0], 0), fighter(FS.f[1], cols[1], 1)], hype: 0, t: 0, crowd: null, w: 0, h: 0, slow: 1, name: "" };
}
export function arenaSet(i, x, pose, flags = {}) {
  if (!S) return; const F = S.F[i]; F.tx = x; F.base = pose; F.flags = flags;
  if (pose === "ko" || pose === "win") S.hype = 1;
}
export function arenaAct(i, kind, mv) {
  if (!S) return; const F = S.F[i];
  if (kind === "atk" || kind === "flurry") {
    const pool = STYLE_SHOTS[F.L.style] || ["jab", "cross", "hook"];
    const n = kind === "flurry" ? 3 : 1;
    for (let k = 0; k < n; k++) {
      const name = kind === "flurry" ? ["jab", "cross", "hook"][k] : STRIKE[mv] ? mv : pool[Math.floor(Math.random() * pool.length)];
      const kick = /kick|knee/.test(name);
      F.acts.push({ p: STRIKE[name], len: kick ? 0.5 : 0.3, in: kick ? 0.4 : 0.35, t: -k * (kind === "flurry" ? 0.2 : 0) });
    }
    return;
  }
  const A = ACT[kind]; if (!A) return;
  if (kind === "bighit" || kind === "kd") S.hype = Math.min(1, S.hype + (kind === "kd" ? 0.8 : 0.45));
  F.acts = F.acts.filter((a) => a.t < 0); // a reaction cuts the current move short
  F.acts.push({ ...A, t: 0 });
}

function poseOf(F, dt, moving) {
  const st = STANCE[F.L.style] || STANCE["Well-rounded"];
  let P = { ...ZERO, ...(F.base === "stand" ? st : { ...st, ...BASE[F.base] }) };
  const live = F.base === "stand";
  if (live) { // idle: bounce, breathe, a step when moving
    const b = Math.sin(S.t * 6 + F.ph) * (st.bob || 1);
    P.up = Math.max(0, b) * 0.8; P.sF += b * 2; P.sB -= b * 1.5;
    if (moving) { const w = Math.sin(S.t * 16 + F.ph) * 12; P.kF += w; P.kB -= w; }
    if (F.flags.wobbly) { P.t += Math.sin(S.t * 3) * 7; P.h += Math.sin(S.t * 2.3) * 9; P.nF -= 8; }
  } else if (F.base === "win") { P.up = Math.max(0, Math.sin(S.t * 5)) * 4; P.sF += Math.sin(S.t * 5) * 6; }
  else if (F.base === "bottom" || F.base === "top") { const b = Math.sin(S.t * 2.2 + F.ph); P.t += b * 3; P.sF += b * 8; }
  for (const A of F.acts) {
    A.t += dt; if (A.t < 0) continue;
    const reps = A.reps || 1, x = Math.min(1, A.t / (A.len * reps)), r = Math.min(reps - 1, Math.floor(x * reps)), t1 = x * reps - r;
    const target = A.alt && r % 2 ? { ...A.p, ...A.alt } : A.p;
    P = mix(P, target, curve(t1, A));
  }
  F.acts = F.acts.filter((A) => A.t < A.len * (A.reps || 1));
  return P;
}

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
  // Crowd: rows of heads and shoulders, swaying more when it's loud.
  const sway = 0.6 + S.hype * 4;
  for (const p of S.crowd) {
    const bob = Math.sin(S.t * (2 + S.hype * 5) + p.ph) * sway * p.s, jump = S.hype > 0.5 ? Math.max(0, Math.sin(S.t * 9 + p.ph)) * 3 * S.hype * p.s : 0;
    c.fillStyle = `rgb(${p.c},${p.c},${p.c + 4})`;
    c.beginPath(); c.ellipse(p.x + bob, p.y + 10 * p.s - jump, 7 * p.s, 6 * p.s, 0, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(p.x + bob, p.y - jump, 3.4 * p.s, 0, 7); c.fill();
    if (Math.random() < 0.0006 + S.hype * 0.01) p.flash = 1;
    if (p.flash > 0) { c.fillStyle = `rgba(255,255,255,${p.flash})`; c.beginPath(); c.arc(p.x + bob + 3, p.y - 2 - jump, 1.6 * p.s, 0, 7); c.fill(); p.flash -= 0.08; }
  }
  // Lights: soft beams from the rig that sweep slowly.
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
  // Fence: mesh behind the fighters, between the back posts.
  c.save();
  c.beginPath(); c.moveTo(-10, floorY + 4); for (const [x, y] of back.sort((a, b) => a[0] - b[0])) c.lineTo(x, y); c.lineTo(w + 10, floorY + 4); c.lineTo(w + 10, floorY - fenceH); c.lineTo(-10, floorY - fenceH); c.closePath(); c.clip();
  c.strokeStyle = "rgba(200,200,210,0.07)"; c.lineWidth = 1;
  for (let x = -h; x < w + h; x += 14) { c.beginPath(); c.moveTo(x, floorY - fenceH); c.lineTo(x + fenceH, floorY); c.stroke(); c.beginPath(); c.moveTo(x + fenceH, floorY - fenceH); c.lineTo(x, floorY); c.stroke(); }
  c.restore();
  c.fillStyle = "#0b0b0b"; c.fillRect(0, floorY - fenceH - 6, w, 8); // top rail
  for (const [x, y] of back) { c.fillStyle = "#101010"; c.fillRect(x - 5, y - fenceH, 10, fenceH); c.fillStyle = "#1c1c1c"; c.fillRect(x - 5, y - fenceH * 0.45, 10, fenceH * 0.45 - 2); }
  // Mat
  const pts = octPts(cx, cy, rx, ry);
  const g = c.createRadialGradient(cx, cy - ry * 0.2, 10, cx, cy, rx); g.addColorStop(0, "#3b3b3e"); g.addColorStop(0.55, "#242427"); g.addColorStop(1, "#0f0f10");
  c.fillStyle = g; c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
  c.strokeStyle = "#000"; c.lineWidth = 6; c.stroke();
  c.save(); c.translate(cx, cy - ry * 0.05); c.scale(1, 0.32); c.fillStyle = "rgba(255,255,255,0.06)"; c.font = `800 italic ${Math.round(w * 0.07)}px Oswald, Impact, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(S.name.toUpperCase(), 0, 0); c.restore();
  // Ring of light on the mat
  const sp = c.createRadialGradient(cx, floorY + h * 0.02, 0, cx, floorY + h * 0.02, w * 0.35); sp.addColorStop(0, `rgba(255,250,235,${0.08 + S.hype * 0.05})`); sp.addColorStop(1, "rgba(255,250,235,0)");
  c.fillStyle = sp; c.fillRect(0, floorY - h * 0.1, w, h * 0.5);
}
function drawFighter(c, F, P, U, floorY, w, h) {
  const face = F.side ? -1 : 1, L = F.L;
  L.rim = F.side ? "rgba(90,140,255,0.55)" : "rgba(255,80,70,0.5)";
  const J = joints(P, L);
  let low = 0; for (const k in J) low = Math.max(low, J[k].y + (k.startsWith("ft") ? 1.5 : k.startsWith("kn") ? 4 : k === "hd" ? LEN.head : k === "sh" || k === "hip" ? 7 : 3));
  const X = (squeeze(F.x, w, h) / 100) * w + P.dx * U * face, Y = floorY - (low + P.up) * U;
  // Shadow
  c.fillStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.ellipse(X, floorY + 2, (P.t < -60 ? 30 : 16) * U, 3.2 * U, 0, 0, 7); c.fill();
  c.save(); c.translate(X, Y); c.scale(face * U, U);
  if (F.base === "ko") c.filter = "brightness(0.6) saturate(0.6)";
  PARTS.arm(c, J, "B", L, true); PARTS.leg(c, J, "B", L, true);
  PARTS.torso(c, J, L); PARTS.leg(c, J, "F", L, false);
  if (F.base === "win") { PARTS.arm(c, J, "F", L, false); PARTS.head(c, J, L, P, F.flags.cut); } // arms up: keep the face in view
  else { PARTS.head(c, J, L, P, F.flags.cut); PARTS.arm(c, J, "F", L, false); }
  c.restore();
}

// Fight positions are 0–100 across the arena; on screen they're pulled in so punches can reach.
const squeeze = (x, w, h) => 50 + (x - 50) * (Math.min(w, h * 1.5) * 0.85) / w;
export function screenPct(x) { const a = document.getElementById("arena"); return +squeeze(x, a?.clientWidth || 1000, a?.clientHeight || 500).toFixed(2); }

let raf = 0, last = 0;
function frame(now) {
  const cv = document.getElementById("oct");
  if (!cv || !S) { raf = 0; return; }
  const dt0 = Math.min(0.05, (now - (last || now)) / 1000); last = now;
  const slow = document.getElementById("arena")?.classList.contains("mo-on") ? 0.25 : 1;
  S.slow += (slow - S.slow) * 0.15;
  const dt = dt0 * S.slow; S.t += dt; S.hype = Math.max(0, S.hype - dt0 * 0.25);
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  if (!S.crowd || S.w !== w || S.h !== h) { S.crowd = buildCrowd(w, h); S.w = w; S.h = h; }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bug = document.querySelector("#arena .bug"), floorY = Math.min(h * 0.76, (bug ? bug.offsetTop : h) - h * 0.04), U = (floorY * 0.66) / 100;
  // Effects (bursts, target ring) line up with the drawn bodies through these two numbers.
  const fl = ((floorY / h) * 100).toFixed(1), fh = ((86 * U) / h * 100).toFixed(1), ar = document.getElementById("arena");
  if (ar && ar.dataset.fl !== fl + fh) { ar.dataset.fl = fl + fh; ar.style.setProperty("--fl", fl); ar.style.setProperty("--fh", fh); }
  drawBack(c, w, h); drawCage(c, w, h, floorY);
  const poses = S.F.map((F) => { const mv = Math.abs(F.tx - F.x) > 0.3; F.x += (F.tx - F.x) * Math.min(1, dt * 7); return poseOf(F, dt, mv); });
  // Draw order: whoever is underneath first.
  const order = S.F.map((F, i) => i).sort((a, b) => (S.F[a].base === "top") - (S.F[b].base === "top") || (S.F[b].base === "ko") - (S.F[a].base === "ko"));
  for (const i of order) drawFighter(c, S.F[i], poses[i], U, floorY, w, h);
  // Vignette
  const v = c.createRadialGradient(w / 2, h * 0.55, h * 0.3, w / 2, h * 0.55, w * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)");
  c.fillStyle = v; c.fillRect(0, 0, w, h);
  raf = requestAnimationFrame(frame);
}
// Called after each render of the live screen; starts the loop if it isn't running.
export function arenaMount(name) { if (S) S.name = name; if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
