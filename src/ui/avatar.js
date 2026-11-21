// Fighter portraits: the official UFC.com cut-out headshot, or a dark silhouette for prospects.
import { UFC_DATA } from "../state.js";

export const photoOf = (f) => (f.real && UFC_DATA[f.name] ? import.meta.env.BASE_URL + "fighters/" + UFC_DATA[f.name].file : null);

const SIL = `<svg viewBox="0 0 100 100" class="sil" aria-hidden="true"><path d="M50 14c-11 0-18 9-18 21 0 9 4 16 9 20v6c-14 3-27 9-31 22l-1 17h82l-1-17c-4-13-17-19-31-22v-6c5-4 9-11 9-20 0-12-7-21-18-21z"/></svg>`;

// size in px. cls: "round" for circular scorebug chips.
export function avatar(f, size = 56, cls = "") {
  const p = photoOf(f);
  const inner = p ? `<img src="${p}" alt="" loading="lazy" decoding="async">` : SIL;
  return `<span class="av ${cls} ${p ? "photo" : "none"} ${f.inj > 0 ? "hurt" : ""}" style="--s:${size}px;--h:${f.sh || 0}">${inner}</span>`;
}
