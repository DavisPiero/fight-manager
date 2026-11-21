// Random weekly events. Each one has a situation and two or three choices with consequences.
import { G, mine, ovr, value, say, spend, earn, rank, ranks, rankLabel, makeProspect } from "../state.js";
import { R, ri, pk, cl, round100 } from "../util.js";
import { AGENCIES } from "../data/constants.js";
import { purseFor } from "./world.js";
import { sell } from "./market.js";

const fit = () => mine().filter((f) => !f.inj);
const unbooked = () => fit().filter((f) => !G.bk.some((b) => b.fid === f.id));
const $ = (n) => "$" + Math.round(n).toLocaleString("en-US");
const nameOf = (c) => G.f[c.fid].name;

export const EVENTS = {
  shortNotice: {
    title: "Short-notice fight",
    pick() {
      const f = pk(unbooked()); if (!f) return null;
      const busy = new Set(G.bk.flatMap((b) => [b.oid, b.fid]));
      const r = Math.max(1, rank(f) - ri(2, 6));
      const o = ranks(f.wc).slice(1, 16).filter((x) => x.st !== "mine" && !busy.has(x.id) && x.inj <= 0).sort((a, b) => Math.abs(rank(a) - r) - Math.abs(rank(b) - r))[0];
      return o && { fid: f.id, oid: o.id, purse: round100(purseFor(o) * 1.6) };
    },
    text: (c) => `A main card fighter pulled out. The promotion wants ${nameOf(c)} to step in against ${G.f[c.oid].name} (${rankLabel(rank(G.f[c.oid]))}) next week. No camp, but double the exposure and ${$(c.purse)} to show.`,
    choices: [
      { label: "Take the fight", hint: "No camp prep, big purse", run(c) { G.bk.push({ fid: c.fid, oid: c.oid, purse: c.purse, bonus: c.purse, wk: G.wk + 1, exp: G.wk, lab: "Short notice" }); G.f[c.fid].pop += 3; G.rep += 1; return `Booked. ${nameOf(c)} fights next week.`; } },
      { label: "Turn it down", hint: "No risk", run: () => "You pass. The promotion finds someone else." },
    ],
  },
  raise: {
    title: "Contract talk",
    pick() { const f = pk(mine().filter((f) => (f.streak || 0) >= 2 && f.ct.pct > 12)); return f && { fid: f.id, bonus: round100(value(f) * 0.08) }; },
    text: (c) => `${nameOf(c)} is on a winning streak and thinks he deserves better terms. He wants your cut lowered by 5%, or a ${$(c.bonus)} loyalty bonus.`,
    choices: [
      { label: "Lower my cut 5%", hint: "Less commission from now on", run(c) { G.f[c.fid].ct.pct -= 5; return `${nameOf(c)} is happy. Your cut is now ${G.f[c.fid].ct.pct}%.`; } },
      { label: "Pay the bonus", hint: (c) => $(c.bonus), run(c) { spend(c.bonus); G.f[c.fid].ct.wks += 8; return `Paid. He adds 8 weeks to his contract out of gratitude.`; } },
      { label: "Refuse", hint: "He may sulk", run(c) { const f = G.f[c.fid]; f.prep = 0; f.en = Math.max(10, f.en - 30); if (R() < 0.35) { f.ct.wks = Math.min(f.ct.wks, 10); return `${f.name} is furious and says he won't renew. Contract now ends in ${f.ct.wks} weeks.`; } return `${f.name} skips a few sessions but gets over it.`; } },
    ],
  },
  viral: {
    title: "Gone viral",
    pick() { const f = pk(mine()); return f && { fid: f.id }; },
    text: (c) => `A clip of ${nameOf(c)} from training has millions of views overnight.`,
    choices: [
      { label: "Media tour", hint: "$2,000, big popularity boost", run(c) { spend(2000); G.f[c.fid].pop = Math.min(100, G.f[c.fid].pop + 10); return "The podcasts love him. Popularity way up."; } },
      { label: "Keep him focused", hint: "Small boost, +camp prep", run(c) { const f = G.f[c.fid]; f.pop = Math.min(100, f.pop + 4); f.prep = Math.min(100, f.prep + 10); return "He stays in the gym. Camp prep up."; } },
    ],
  },
  party: {
    title: "Night out",
    pick() { const f = pk(mine()); return f && { fid: f.id }; },
    text: (c) => `${nameOf(c)} was photographed at a club at 4am, two days into camp.`,
    choices: [
      { label: "Fine him", hint: "Lose some energy, earn some respect", run(c) { const f = G.f[c.fid]; f.en = Math.max(10, f.en - 20); G.rep += 1; return "He takes it on the chin. The press respects the discipline."; } },
      { label: "Bury the story", hint: "$5,000, might leak", run(c) { spend(5000); if (R() < 0.3) { G.rep = Math.max(0, G.rep - 4); return "It leaked anyway. Reputation took a hit."; } return "Story killed. Nobody heard a thing."; } },
    ],
  },
  sparring: {
    title: "Sparring scare",
    pick() { const f = pk(fit()); return f && { fid: f.id }; },
    text: (c) => `${nameOf(c)} tweaked his knee in hard sparring. The doctor says it's probably fine.`,
    choices: [
      { label: "Rest him", hint: "Lose camp prep, no risk", run(c) { G.f[c.fid].prep = Math.max(0, G.f[c.fid].prep - 15); G.f[c.fid].sl = 0; return "Ice and rest. He'll be fine."; } },
      { label: "Push through", hint: "40% chance of injury", run(c) { const f = G.f[c.fid]; if (R() < 0.4) { f.inj = ri(2, 4); return `Bad call. ${f.name} is out for ${f.inj} weeks.`; } f.prep = Math.min(100, f.prep + 8); return "He trains through it and looks sharp."; } },
    ],
  },
  poach: {
    title: "Rival sniffing around",
    pick() { const f = pk(mine().filter((f) => ovr(f) >= 55)); return f && { fid: f.id, ag: ri(0, AGENCIES.length - 1), bonus: round100(value(f) * 0.06) }; },
    text: (c) => `${AGENCIES[c.ag].name} has been whispering in ${nameOf(c)}'s ear. He's tempted.`,
    choices: [
      { label: "Pay to keep him", hint: (c) => `${$(c.bonus)}, +12 contract weeks`, run(c) { spend(c.bonus); G.f[c.fid].ct.wks += 12; return "He stays and extends his deal."; } },
      { label: "Call their bluff", hint: "25% he forces a sale", run(c) { const f = G.f[c.fid]; if (R() < 0.25) { const amt = round100(value(f) * 0.85); G.bids.push({ id: G.wk * 1000 + 999, fid: f.id, ag: c.ag, amount: amt, exp: G.wk + 1 }); sell(G.bids[G.bids.length - 1]); return `${f.name} forced a move to ${AGENCIES[c.ag].name}. You got ${$(amt)}.`; } return "He stays. Loyal after all."; } },
    ],
  },
  media: {
    title: "Media day",
    pick() { const f = pk(mine().filter((f) => G.bk.some((b) => b.fid === f.id))); return f && { fid: f.id }; },
    text: (c) => `Cameras are on ${nameOf(c)} ahead of his fight. How should he play it?`,
    choices: [
      { label: "Talk trash", hint: "+popularity, -1 reputation", run(c) { G.f[c.fid].pop = Math.min(100, G.f[c.fid].pop + 6); G.rep = Math.max(0, G.rep - 1); return "The clip blows up. Fans are split."; } },
      { label: "Stay humble", hint: "+1 reputation", run() { G.rep += 1; return "Classy. The matchmakers noticed."; } },
    ],
  },
  gymSponsor: {
    title: "Local sponsor",
    pick: () => ({ amt: round100(ri(4, 12) * 1000 * (1 + G.rep / 50)) }),
    text: (c) => `A local business offers ${$(c.amt)} to put its logo on your gym walls and fight shorts for a few months.`,
    choices: [
      { label: "Take the money", hint: (c) => `+${$(c.amt)}`, run(c) { earn(c.amt, "spons"); return "Cash in the bank."; } },
      { label: "Keep the brand clean", hint: "+1 reputation", run() { G.rep += 1; return "Your agency looks premium."; } },
    ],
  },
  scout: {
    title: "Scout's tip",
    pick: () => ({}),
    text: () => "Your scout found a raw talent fighting in regional shows. Nobody else has noticed yet.",
    choices: [
      { label: "Fly out to see him", hint: "$3,000, he hits the market", run() { spend(3000); const p = makeProspect(G.f.length, false); p.pot = ri(88, 95); p.age = ri(19, 22); p.pop = ri(5, 12); Object.keys(p.at).forEach((k) => (p.at[k] = Math.max(p.at[k], 48))); p.gem = 1; G.f.push(p); return `You found ${p.name}. He's a free agent with elite potential. Check the Market.`; } },
      { label: "Pass", hint: "Save the money", run: () => "Maybe next time." },
    ],
  },
  repairs: {
    title: "Gym repairs",
    pick: () => ({ amt: round100(ri(3, 8) * 1000) }),
    text: (c) => `The cage padding is torn and the mats need replacing. The bill is ${$(c.amt)}.`,
    choices: [
      { label: "Fix it properly", hint: (c) => `-${$(c.amt)}`, run(c) { spend(c.amt); return "Fresh mats. Everyone's happier."; } },
      { label: "Patch it up", hint: "Cheaper, injury risk next week", run(c) { spend(Math.round(c.amt * 0.3)); const f = pk(fit()); if (f && R() < 0.35) { f.inj = ri(1, 3); return `${f.name} rolled an ankle on the torn mat (${f.inj} weeks).`; } return "Duct tape holds. For now."; } },
    ],
  },
  fans: {
    title: "Fan meet-and-greet",
    pick: () => ({}),
    text: () => "A fan group asks if your fighters can do a signing session this weekend.",
    choices: [
      { label: "Host it", hint: "$1,000, +2 reputation, +popularity", run() { spend(1000); G.rep += 2; mine().forEach((f) => (f.pop = Math.min(100, f.pop + 2))); return "Long lines, happy fans."; } },
      { label: "Too busy", hint: "Nothing happens", run: () => "Maybe next time." },
    ],
  },
};

export function rollEvent() {
  if (G.wk < 3 || R() > 0.4) return null;
  const ids = Object.keys(EVENTS).filter((k) => k !== G.lastEvent);
  for (let i = 0; i < 6; i++) {
    const id = pk(ids), ctx = EVENTS[id].pick();
    if (ctx) { G.lastEvent = id; return { id, ctx }; }
  }
  return null;
}
export function resolveEvent(i) {
  const e = G.event, ev = EVENTS[e.id], ch = ev.choices[i];
  const msg = ch.run(e.ctx);
  G.rep = cl(G.rep, 0, 100);
  say(`${ev.title}: ${msg}`, "info");
  G.event = null;
  return msg;
}
export const hintOf = (ch, ctx) => (typeof ch.hint === "function" ? ch.hint(ctx) : ch.hint);
