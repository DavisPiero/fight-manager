// Fight-night action icons (24×24, drawn with strokes). Keys match the icon names in sim/fight.js momentDef().
const A = {
  block: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
  slip: '<circle cx="8" cy="7" r="3"/><path d="M3 21c0-5 2-8 5-8"/><path d="M13 9h8M18 6l3 3-3 3"/>',
  counter: '<path d="M20 7H9a5 5 0 000 10h7"/><path d="M13 14l3 3-3 3"/>',
  pursue: '<path d="M4 6l6 6-6 6M12 6l6 6-6 6"/>',
  pressure: '<path d="M3 12h12M11 8l4 4-4 4"/><path d="M20 4v16"/>',
  cutoff: '<path d="M9 3h7l5 5v8l-5 5H9"/><path d="M3 12h10M10 9l3 3-3 3"/>',
  body: '<path d="M8 4h8l1 7-2 9H9l-2-9z"/><circle cx="12" cy="12" r="2.5"/>',
  head: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  takedown: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/>',
  clinch: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  circle: '<path d="M20 12a8 8 0 11-2.5-5.8"/><path d="M18 2v4.5h-4.5"/>',
  pound: '<path d="M12 3v10M8 9l4 4 4-4"/><path d="M4 17h16M7 21h10"/>',
  submit: '<path d="M6 19c0-8 3-13 9-13a4 4 0 010 8h-5"/><path d="M13 11l-3 3 3 3"/>',
  hold: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  getup: '<path d="M12 21V8M7 13l5-5 5 5"/><path d="M4 3h16"/>',
  flurry: '<path d="M3 8h8M5 12h10M3 16h8"/><path d="M15 6l6 6-6 6"/>',
  legkick: '<path d="M9 3v8l-4 10"/><path d="M9 11l10 4"/><path d="M19 12v6"/>',
  headkick: '<path d="M7 21l3-9 9-6"/><circle cx="19" cy="4" r="2"/>',
};
export const aicon = (k) => `<svg viewBox="0 0 24 24" class="aic">${A[k] || A.head}</svg>`;
