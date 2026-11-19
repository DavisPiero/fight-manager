// Tiny synthesised sound effects. Add ?mute to the URL to force silence (used by tests).
const KEY = "fightmanager_sound";
export const SND = (() => {
  let s = { on: 1, vol: 0.6 };
  try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY)) }; } catch (e) {}
  if (new URLSearchParams(location.search).has("mute")) s.on = 0;
  return s;
})();
export const saveSnd = () => { try { localStorage.setItem(KEY, JSON.stringify(SND)); } catch (e) {} };

let AC;
const TONES = {
  hit: [140, 0.09, "square", 0.7], big: [90, 0.22, "sawtooth", 1], win: [660, 0.4, "triangle", 1], tick: [600, 0.03, "sine", 0.35],
  bad: [120, 0.35, "sawtooth", 0.7], bell: [880, 1.1, "sine", 1], cash: [1046, 0.18, "triangle", 0.8], whoosh: [300, 0.06, "sine", 0.4],
};
export function sfx(k) {
  if (!SND.on || !SND.vol) return;
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)();
    const p = TONES[k]; if (!p) return;
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = p[2]; o.frequency.setValueAtTime(p[0], t);
    if (k === "win" || k === "cash") o.frequency.linearRampToValueAtTime(p[0] * 1.5, t + p[1] * 0.8);
    if (k === "big") o.frequency.exponentialRampToValueAtTime(40, t + p[1]);
    o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(0.08 * SND.vol * p[3], t); g.gain.exponentialRampToValueAtTime(0.001, t + p[1]);
    o.start(t); o.stop(t + p[1] + 0.02);
    if (k === "bell") { const o2 = AC.createOscillator(); o2.frequency.value = 1320; o2.connect(g); o2.start(t); o2.stop(t + 0.6); }
  } catch (e) {}
}
