import { G, ovr, rec, rank, rankLabel, rankShort, value, agencyOf } from "../state.js";
import { DIVISIONS, ATTR_KEYS, ATTR_SHORT } from "../data/constants.js";
import { esc, kmoney } from "../util.js";
import { avatar } from "./avatar.js";
import { listing, bidsFor } from "../sim/market.js";

const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  fighters: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/>',
  fights: '<path d="M6 14c0-6 3-9 8-9 3 0 5 2 5 5v7H9c-2 0-3-1-3-3z"/><path d="M9 20h10M10 10h5"/>',
  gym: '<path d="M2 9v6M5 6v12M19 6v12M22 9v6M5 12h14"/>',
  market: '<path d="M3 7h18l-2 11H5z"/><path d="M8 7V5a4 4 0 018 0v2"/>',
  rankings: '<path d="M6 4h12v5a6 6 0 01-12 0z"/><path d="M12 15v4M8 20h8M6 6H3c0 3 1 4 3 4M18 6h3c0 3-1 4-3 4"/>',
  office: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9c2 2 2 4 0 6M19 6c4 4 4 8 0 12"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  glove: '<path d="M7 11V7a3 3 0 013-3h4a4 4 0 014 4v6a6 6 0 01-6 6h-1a5 5 0 01-5-5v-1"/><path d="M7 11a2 2 0 104 0v-1"/><path d="M8 20h8"/>',
  mat: '<circle cx="12" cy="6" r="2.5"/><path d="M5 20l4-7 3 2 3-2 4 7"/><path d="M9 13l-2-3M15 13l2-3"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>',
  brain: '<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V5a2 2 0 00-3-1z"/><path d="M15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
export const icon = (k) => `<svg viewBox="0 0 24 24">${P[k] || ""}</svg>`;

export const ovrCol = (v) => (v >= 80 ? "var(--green)" : v >= 68 ? "#a6d55a" : v >= 56 ? "var(--gold)" : v >= 45 ? "#ff8a3d" : "var(--red2)");
export const ovrBadge = (f) => `<div class="ovr" style="color:${ovrCol(ovr(f))}" title="Overall rating (average of nine skills)">${ovr(f)}</div>`;

export function statusTags(f) {
  const t = [];
  const r = rank(f);
  if (r === 0) t.push('<span class="tag gold">Champion</span>');
  else if (r > 0 && r <= 15) t.push(`<span class="tag">${rankLabel(r)}</span>`);
  if (f.st === "mine") {
    t.push('<span class="tag gold">Yours</span>');
    if (f.ct && f.ct.wks <= 12) t.push(`<span class="tag red">Contract: ${f.ct.wks}w left</span>`);
    if (listing(f)) t.push('<span class="tag blue">For sale</span>');
    const nb = bidsFor(f).length;
    if (nb) t.push(`<span class="tag green">${nb} bid${nb > 1 ? "s" : ""}</span>`);
  } else if (f.st === "other") { const a = agencyOf(f); t.push(`<span class="tag" style="color:${a.col}">${esc(a.short)}</span>`); }
  else t.push('<span class="tag green">Free agent</span>');
  if (f.inj > 0) t.push(`<span class="tag red">Injured ${f.inj}w</span>`);
  if ((f.streak || 0) >= 3) t.push(`<span class="tag gold">W${f.streak} streak</span>`);
  return t.join("");
}

export function fighterCard(f, extra = "", opts = {}) {
  const r = rank(f);
  return `<div class="fc ${r === 0 ? "champ" : ""}" data-a="prof" data-i="${f.id}" tabindex="0">
    ${avatar(f, opts.size || 60)}
    <div class="info"><div class="nm">${esc(f.name)}</div>
      <div class="meta">${DIVISIONS[f.wc]} · ${rec(f)} · ${f.age}y${opts.value ? " · value " + kmoney(value(f)) : ""}</div>
      <div class="tags">${statusTags(f)}</div>${extra}</div>
    ${ovrBadge(f)}</div>`;
}

export function bar(v, col, h = 6) {
  return `<div class="bar" style="height:${h}px"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${col}"></i></div>`;
}

export function sparkline(a, col = "var(--red)", fmt = (v) => v) {
  if (!a || a.length < 2) return '<div class="empty small">Play a few weeks to build this chart.</div>';
  const mn = Math.min(...a), mx = Math.max(...a), r = mx - mn || 1;
  const pts = a.map((v, i) => [(i * 300) / (a.length - 1), 84 - ((v - mn) / r) * 72]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const id = "sp" + Math.random().toString(36).slice(2, 7);
  return `<svg class="spark" viewBox="0 0 300 92" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
  <path d="${d} L300 92 L0 92 Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg>
  <div class="row spread small dim"><span>Low ${fmt(mn)}</span><span>High ${fmt(mx)}</span></div>`;
}

export function radar(f, cmp) {
  const C = 130, Rr = 88, pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 9; return [(C + Math.cos(a) * Rr * v / 100).toFixed(1), (C + Math.sin(a) * Rr * v / 100).toFixed(1)]; };
  const poly = (fn) => ATTR_KEYS.map((k, i) => pt(i, fn(k)).join(",")).join(" ");
  const ring = (v) => `<polygon points="${poly(() => v)}" fill="none" stroke="#2a2f3a"/>`;
  return `<svg viewBox="0 0 260 260" style="width:100%;max-width:300px;display:block;margin:auto" role="img" aria-label="Skill radar">${ring(33)}${ring(66)}${ring(100)}
  ${cmp ? `<polygon points="${poly((k) => cmp.at[k])}" fill="#4c8dff33" stroke="#4c8dff" stroke-width="1.5"/>` : ""}
  <polygon points="${poly((k) => f.at[k])}" fill="#e1262d44" stroke="#ff4a50" stroke-width="2"/>
  ${ATTR_KEYS.map((_, i) => { const p = pt(i, 122); return `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" fill="#8d94a3" font-family="Inter">${ATTR_SHORT[i]}</text>`; }).join("")}</svg>`;
}

export function toast(t, k = "") {
  const c = document.getElementById("toasts"), e = document.createElement("div");
  e.className = "toast " + k; e.textContent = t; c.appendChild(e);
  setTimeout(() => e.remove(), 3000);
}
export function stamp(t, col) {
  const e = document.createElement("div");
  e.className = "stamp"; e.innerHTML = `<span style="--c:${col || "var(--red)"}">${t}</span>`;
  document.body.appendChild(e); setTimeout(() => e.remove(), 1600);
}
export function confetti(n = 140) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.width = innerWidth; c.height = innerHeight;
  c.style.cssText = "position:fixed;inset:0;z-index:65;pointer-events:none"; document.body.appendChild(c);
  const x = c.getContext("2d");
  const P = Array.from({ length: n }, () => ({ x: innerWidth / 2, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 18, vy: -4 - Math.random() * 13, c: ["#e1262d", "#fff", "#f2b33d", "#3ecf8e"][Math.floor(Math.random() * 4)], r: Math.random() * 6 }));
  let fr = 0;
  (function t() {
    x.clearRect(0, 0, c.width, c.height);
    P.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.42; p.r += 0.2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-4, -2, 8, 4); x.restore(); });
    if (++fr < 110) requestAnimationFrame(t); else c.remove();
  })();
}

export const modal = (inner, wide = false) => `<div class="modal" data-a="mbg"><div class="box ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${inner}</div></div>`;
export const closeBtn = () => `<button class="iconbtn" data-a="mclose" aria-label="Close" style="float:right">${icon("close")}</button>`;
export const rankBadge = (f) => rankShort(rank(f));
