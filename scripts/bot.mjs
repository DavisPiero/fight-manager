// Balance benchmark: plays 20 seeded one-year careers headlessly and compares with the recorded baseline.
// Run: npm run bot            Record a new baseline: npm run bot -- --save
import { createServer } from "vite";
import fs from "node:fs";

const BASE = "scripts/bot-baseline.json";
const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: { ignored: ["**/*"] } }, appType: "custom", logLevel: "error" });
const g = globalThis; g.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const bot = await server.ssrLoadModule("/src/sim/bot.js");
const t0 = Date.now();
const now = bot.run(20, 52);
await server.close();
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, "utf8")) : null;
const fmt = (v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : v);
console.log(`20 careers × 52 weeks in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
console.log("metric".padEnd(14), "baseline".padStart(14), "now".padStart(14));
for (const k of Object.keys(now)) console.log(k.padEnd(14), String(base ? fmt(base[k] ?? "—") : "—").padStart(14), String(fmt(now[k])).padStart(14));
if (process.argv.includes("--save") || !base) { fs.writeFileSync(BASE, JSON.stringify(now, null, 2) + "\n"); console.log(`\nSaved as baseline → ${BASE}`); }
