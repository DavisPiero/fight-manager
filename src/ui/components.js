import { G, ovr, rec, rank, rankLabel, value, agencyOf, SETTINGS } from "../state.js";
import { DIVISIONS, ATTR_KEYS, ATTR_SHORT, EMBLEMS, AGENCY_COLOURS } from "../data/constants.js";
import { esc, kmoney } from "../util.js";
import { avatar } from "./avatar.js";
import { listing, bidsFor } from "../sim/market.js";

const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  fighters: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/>',
  fights: '<path d="M6 14c0-6 3-9 8-9 3 0 5 2 5 5v7H9c-2 0-3-1-3-3z"/><path d="M9 20h10"/>',
  gym: '<path d="M2 9v6M5 6v12M19 6v12M22 9v6M5 12h14"/>',
  market: '<path d="M3 7h18l-2 11H5z"/><path d="M8 7V5a4 4 0 018 0v2"/>',
  rankings: '<path d="M6 4h12v5a6 6 0 01-12 0z"/><path d="M12 15v4M8 20h8"/>',
  office: '<rect x="3" y="7" width="18" height="13"/><path d="M8 7V4h8v3"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9c2 2 2 4 0 6"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  ff: '<path d="M3 5l8 7-8 7zM13 5l8 7-8 7z"/>',
};
export const icon = (k) => `<svg viewBox="0 0 24 24">${P[k] || ""}</svg>`;
export const emblem = (ag, size) => `<span class="emb" style="--c:${AGENCY_COLOURS[ag.col]}${size ? `;width:${size}px;height:${size}px` : ""}"><svg viewBox="0 0 24 24">${EMBLEMS[ag.emblem] || EMBLEMS.fist}</svg></span>`;
export const analyst = () => SETTINGS.analyst;

export const ovrCol = (v) => (v >= 80 ? "var(--green)" : v >= 68 ? "#a6d55a" : v >= 56 ? "var(--gold2)" : v >= 45 ? "#ff8a3d" : "var(--red2)");
export const grade = (v) => (v >= 88 ? "A+" : v >= 80 ? "A" : v >= 72 ? "B+" : v >= 65 ? "B" : v >= 58 ? "C+" : v >= 50 ? "C" : "D");
export const AREAS = [["Striking", ["box", "kick", "thai"]], ["Grappling", ["wres", "bjj", "tdd"]], ["Conditioning", ["cardio", "dur"]], ["Fight IQ", ["iq"]]];
export const areaVal = (f, keys) => Math.round(keys.reduce((s, k) => s + f.at[k], 0) / keys.length);
export function summary(f) {
  const vals = AREAS.map(([n, k]) => [n, areaVal(f, k)]).sort((a, b) => b[1] - a[1]);
  const best = vals[0], o = ovr(f);
  const lvl = o >= 82 ? "Elite" : o >= 72 ? "Contender" : o >= 62 ? "Solid" : o >= 52 ? "Developing" : "Raw";
  const what = { Striking: "striker", Grappling: "grappler", Conditioning: "grinder", "Fight IQ": "tactician" }[best[0]];
  return `${lvl} ${what}`;
}

// One status pill at most, so cards stay calm. Analyst mode shows everything.
export function statusPills(f) {
  const t = [], r = rank(f), a = analyst();
  if (r === 0) t.push('<span class="pill gold">Champion</span>');
  else if (r > 0 && r <= 15) t.push(`<span class="pill">${rankLabel(r)}</span>`);
  if (f.inj > 0) t.push(`<span class="pill red">Injured ${f.inj}w</span>`);
  else if (f.st === "mine" && f.ct?.wks <= 12) t.push(`<span class="pill red">Contract ${f.ct.wks}w</span>`);
  else if (f.st === "mine" && bidsFor(f).length) t.push(`<span class="pill green">Offers in</span>`);
  else if (f.st === "mine" && listing(f)) t.push('<span class="pill blue">For sale</span>');
  if (f.gem) t.push('<span class="pill gold">Scout find</span>');
  if (a) {
    if (f.st === "other") t.push(`<span class="pill out" style="color:${agencyOf(f).col}">${agencyOf(f).short}</span>`);
    if (f.st === "free") t.push('<span class="pill out">Free agent</span>');
    if ((f.streak || 0) >= 2) t.push(`<span class="pill out">W${f.streak}</span>`);
  }
  return t.join("");
}

export function card(f, opts = {}) {
  const r = rank(f), a = analyst();
  const meta = [DIVISIONS[f.wc], rec(f)];
  if (a) meta.push(f.age + "y", kmoney(value(f)));
  else if (opts.value) meta.push(kmoney(value(f)));
  return `<div class="ac ${r === 0 ? "champ" : ""} ${opts.slim ? "slim" : ""}" data-a="prof" data-i="${f.id}" tabindex="0">
    ${avatar(f, opts.slim ? 76 : 112)}
    <div class="info">${f.nick ? `<div class="nick">"${esc(f.nick)}"</div>` : ""}<div class="nm">${esc(f.name)}</div>
      <div class="meta">${meta.join(" · ")}</div><div class="tags">${statusPills(f)}</div></div>
    <div class="ovr"><b style="color:${ovrCol(ovr(f))}">${ovr(f)}</b><small>OVR</small></div></div>`;
}

export function bar(v, col, h = 6) {
  return `<div class="bar" style="height:${h}px"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${col}"></i></div>`;
}
export function sparkline(a, col = "var(--red)", fmt = (v) => v) {
  if (!a || a.length < 2) return '<div class="empty small">Play a few weeks to build this chart.</div>';
  const mn = Math.min(...a), mx = Math.max(...a), r = mx - mn || 1;
  const pts = a.map((v, i) => [(i * 300) / (a.length - 1), 84 - ((v - mn) / r) * 72]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return `<svg class="spark" viewBox="0 0 300 92" preserveAspectRatio="none"><path d="${d} L300 92 L0 92 Z" fill="${col}" opacity=".12"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg>
  <div class="row spread small dim"><span>Low ${fmt(mn)}</span><span>High ${fmt(mx)}</span></div>`;
}
export function radar(f) {
  const C = 130, Rr = 88, pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 9; return [(C + Math.cos(a) * Rr * v / 100).toFixed(1), (C + Math.sin(a) * Rr * v / 100).toFixed(1)]; };
  const poly = (fn) => ATTR_KEYS.map((k, i) => pt(i, fn(k)).join(",")).join(" ");
  const ring = (v) => `<polygon points="${poly(() => v)}" fill="none" stroke="#2a2a2a"/>`;
  return `<svg viewBox="0 0 260 260" style="width:100%;max-width:280px;display:block;margin:auto" role="img" aria-label="Skill radar">${ring(33)}${ring(66)}${ring(100)}
  <polygon points="${poly((k) => f.at[k])}" fill="#d20a0a44" stroke="#ff2d2d" stroke-width="2"/>
  ${ATTR_KEYS.map((_, i) => { const p = pt(i, 122); return `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" fill="#8a8a8a" font-family="Inter">${ATTR_SHORT[i]}</text>`; }).join("")}</svg>`;
}

export function toast(t, k = "") {
  const c = document.getElementById("toasts"), e = document.createElement("div");
  e.className = "toast " + k; e.textContent = t; c.appendChild(e);
  setTimeout(() => e.remove(), 3000);
}
export function stamp(t, col) {
  const e = document.createElement("div");
  e.className = "stamp"; e.innerHTML = `<span style="--c:${col || "var(--red)"}">${t}</span>`;
  document.body.appendChild(e); setTimeout(() => e.remove(), 1500);
}
export function confetti(n = 140) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.width = innerWidth; c.height = innerHeight;
  c.style.cssText = "position:fixed;inset:0;z-index:75;pointer-events:none"; document.body.appendChild(c);
  const x = c.getContext("2d");
  const P = Array.from({ length: n }, () => ({ x: innerWidth / 2, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 18, vy: -4 - Math.random() * 13, c: ["#d20a0a", "#fff", "#c9a24a"][Math.floor(Math.random() * 3)], r: Math.random() * 6 }));
  let fr = 0;
  (function t() {
    x.clearRect(0, 0, c.width, c.height);
    P.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.42; p.r += 0.2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-4, -2, 8, 4); x.restore(); });
    if (++fr < 110) requestAnimationFrame(t); else c.remove();
  })();
}
export const modal = (inner, wide = false) => `<div class="modal" data-a="mbg"><div class="box ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${inner}</div></div>`;
export const closeBtn = () => `<button class="ib mx" data-a="mclose" aria-label="Close">${icon("close")}</button>`;
export const toggle = (on, action, title, sub, id = "") => `<button class="toggle ${on ? "on" : ""}" data-a="${action}" ${id ? `data-tut="${id}"` : ""} role="switch" aria-checked="${on}"><span class="sw"></span><span><b>${title}</b><span>${sub}</span></span></button>`;
