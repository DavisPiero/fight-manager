export const R = Math.random;
export const rnd = (a, b) => a + R() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const cl = (v, a, b) => Math.max(a, Math.min(b, v));
export const pk = (a) => a[Math.floor(R() * a.length)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (n) => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
export const kmoney = (n) => {
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, "") + "M";
  if (a >= 1e4) return s + "$" + Math.round(a / 1e3) + "k";
  return money(n);
};
export const round100 = (n) => Math.round(n / 100) * 100;
export const last = (name) => name.split(" ").pop();
export const slug = (n) =>
  n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
