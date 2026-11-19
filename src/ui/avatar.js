// Fighter portraits: a real photo when we have a free-licensed one, otherwise a flat drawn avatar.
import PHOTOS from "../data/photos.json";

const SKIN = ["#f3d2b3", "#e7b48a", "#c98c5f", "#a56b43", "#7a4a2c", "#55331f"];
const HAIR = ["#1a120b", "#3b2414", "#6b4423", "#c9a35a", "#8d8d8d"];

export const photoOf = (f) => (f.real && PHOTOS[f.name] ? import.meta.env.BASE_URL + "photos/" + PHOTOS[f.name].file : null);
export const credits = () => PHOTOS;

function hairPath(h) {
  switch (h) {
    case 1: return '<path d="M30 40c0-17 11-25 20-25s20 8 20 25c-4-8-11-12-20-12s-16 4-20 12z"/>'; // short crop
    case 2: return '<path d="M29 44c-2-20 9-31 21-31s23 11 21 31l-3-10c-5-6-12-8-18-8s-13 2-18 8z"/>'; // fuller
    case 3: return '<path d="M45 30c-1-8 1-15 5-18 4 3 6 10 5 18-3-1-7-1-10 0z"/>'; // mohawk strip
    case 4: return '<path d="M28 46c-3-24 10-34 22-34s25 10 22 34c-2-7-3-13-6-16-4 3-10 4-16 4s-12-1-16-4c-3 3-4 9-6 16z"/><path d="M27 44c-2 8 0 16 3 20l1-18z"/><path d="M73 44c2 8 0 16-3 20l-1-18z"/>'; // long
    case 5: return '<path d="M31 37c1-14 10-21 19-21s18 7 19 21c-5-4-12-6-19-6s-14 2-19 6z" opacity=".55"/>'; // buzz
    default: return ""; // bald
  }
}
function beard(b) {
  if (b === 1) return '<path d="M35 58c2 14 9 20 15 20s13-6 15-20c-3 6-9 8-15 8s-12-2-15-8z" opacity=".9"/>';
  if (b === 2) return '<path d="M40 63c2 3 6 5 10 5s8-2 10-5c-2 7-5 10-10 10s-8-3-10-10z"/><path d="M42 61h16v2H42z" />';
  if (b === 3) return '<path d="M34 54c1 18 9 26 16 26s15-8 16-26c-2 4-5 6-8 6-2 3-5 4-8 4s-6-1-8-4c-3 0-6-2-8-6z"/>';
  return "";
}

export function drawnAvatar(f) {
  const sk = SKIN[f.sk % SKIN.length], hc = HAIR[f.hc % HAIR.length];
  const bg1 = `hsl(${f.sh} 35% 26%)`, bg2 = `hsl(${(f.sh + 40) % 360} 40% 14%)`, shirt = `hsl(${f.sh} 55% 42%)`;
  const id = "g" + f.id;
  const brow = f.br === 1 ? "M38 44l8 1M54 45l8-1" : f.br === 2 ? "M38 45h8M54 45h8" : "M38 45l8-1M54 44l8 1";
  return `<svg viewBox="0 0 100 100" class="av-svg" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#${id})"/>
<path d="M10 100c3-17 18-24 40-24s37 7 40 24z" fill="${shirt}"/>
<path d="M42 66h16v14c-5 3-11 3-16 0z" fill="${sk}"/><path d="M42 72c5 2 11 2 16 0v-4H42z" fill="#000" opacity=".12"/>
<ellipse cx="30.5" cy="50" rx="4" ry="6" fill="${sk}"/><ellipse cx="69.5" cy="50" rx="4" ry="6" fill="${sk}"/>
<path d="M31 46c0-18 9-28 19-28s19 10 19 28c0 17-8 28-19 28S31 63 31 46z" fill="${sk}"/>
<path d="M50 74c-11 0-19-11-19-28 0 0 5 21 19 21s19-21 19-21c0 17-8 28-19 28z" fill="#000" opacity=".08"/>
<g fill="${hc}">${hairPath(f.hr)}${beard(f.bd)}</g>
<path d="${brow}" stroke="${f.hr === 0 ? "#2a1c12" : hc}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
<circle cx="42" cy="50" r="2.2" fill="#1d1410"/><circle cx="58" cy="50" r="2.2" fill="#1d1410"/>
<path d="M50 51v7l-3 2" stroke="#000" stroke-opacity=".22" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M45 64c3 1.5 7 1.5 10 0" stroke="#000" stroke-opacity=".35" stroke-width="1.8" fill="none" stroke-linecap="round"/>
${f.inj > 0 ? '<path d="M56 40l8 3" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M58 38l2 7" stroke="#fff" stroke-width="2"/>' : ""}
</svg>`;
}

// size in px; extra class e.g. "lg"
export function avatar(f, size = 56, cls = "") {
  const p = photoOf(f);
  const inner = p ? `<img src="${p}" alt="" loading="lazy" decoding="async">` : drawnAvatar(f);
  return `<span class="av ${cls} ${f.inj > 0 ? "hurt" : ""}" style="--s:${size}px">${inner}</span>`;
}
