// Synthesised sound effects (no audio files). Add ?mute to the URL to force silence (used by tests).
const KEY = "fightmanager_sound";
export const SND = (() => {
  let s = { on: 1, vol: 0.6 };
  try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY)) }; } catch (e) {}
  if (new URLSearchParams(location.search).has("mute")) s.on = 0;
  return s;
})();
export const saveSnd = () => { try { localStorage.setItem(KEY, JSON.stringify(SND)); } catch (e) {} };

let AC, NOISE;
function ctx() {
  AC ||= new (window.AudioContext || window.webkitAudioContext)();
  if (!NOISE) {
    NOISE = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = NOISE.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return AC;
}
const out = (gain) => { const g = AC.createGain(); g.gain.value = gain * SND.vol; g.connect(AC.destination); return g; };
function tone(freq, dur, type = "sine", gain = 0.1, when = 0, slideTo) {
  const t = AC.currentTime + when, o = AC.createOscillator(), g = out(gain);
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, filter = "lowpass", freq = 1000, gain = 0.1, when = 0, attack = 0.002, q = 0.8) {
  const t = AC.currentTime + when, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = out(gain);
  s.buffer = NOISE; f.type = filter; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * SND.vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}

const FX = {
  // Crisp UI click: tiny filtered tick plus a soft low knock.
  tick() { noise(0.025, "highpass", 3500, 0.05); tone(180, 0.05, "sine", 0.06); },
  tab() { noise(0.02, "bandpass", 2600, 0.05, 0, 0.001, 2); tone(320, 0.04, "triangle", 0.03); },
  whoosh() { noise(0.35, "bandpass", 900, 0.06, 0, 0.15, 0.7); },
  hit() { noise(0.09, "lowpass", 900, 0.22); tone(95, 0.1, "sine", 0.18, 0, 50); },
  big() { noise(0.18, "lowpass", 1400, 0.35); tone(70, 0.25, "sine", 0.3, 0, 35); noise(0.6, "bandpass", 700, 0.05, 0.05, 0.08); },
  bell() { [1, 2.76, 5.4].forEach((m, i) => tone(820 * m, 1.4 - i * 0.3, "sine", 0.06 / (i + 1))); tone(820, 1.2, "sine", 0.05, 0.28); },
  crowd() { noise(2.2, "bandpass", 650, 0.16, 0, 0.5, 0.5); noise(1.8, "bandpass", 1300, 0.07, 0.2, 0.4, 0.6); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, "triangle", 0.07, i * 0.09)); },
  bad() { tone(220, 0.4, "triangle", 0.08, 0, 140); tone(165, 0.5, "triangle", 0.07, 0.15, 110); },
  cash() { tone(1318, 0.12, "triangle", 0.06); tone(1760, 0.25, "triangle", 0.06, 0.07); noise(0.05, "highpass", 5000, 0.04, 0.0); },
  sign() { tone(392, 0.12, "triangle", 0.07); tone(587, 0.3, "triangle", 0.07, 0.1); },
  // Phone notifications: ordinary / important / critical.
  ping() { tone(1568, 0.09, "sine", 0.04); },
  ping2() { tone(1175, 0.1, "sine", 0.05); tone(1568, 0.16, "sine", 0.05, 0.1); },
  alarm() { [0, 0.16, 0.32].forEach((w) => tone(988, 0.11, "square", 0.035, w)); },
};
export function sfx(k) {
  if (!SND.on || !SND.vol || !FX[k]) return;
  try { ctx(); FX[k](); } catch (e) {}
}
