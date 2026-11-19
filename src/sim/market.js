// Signing, buying, selling, releasing and renewing fighters.
import { G, ovr, value, askOf, acceptChance, say, spend, earn, mine, rank, bumpRanks } from "../state.js";
import { R, rnd, ri, cl, pk, round100 } from "../util.js";
import { AGENCIES, ROSTER_MAX, NO_SALE_WEEKS } from "../data/constants.js";

export const canSell = (f) => G.wk - (f.ct?.signed ?? -99) >= NO_SALE_WEEKS;
export const listing = (f) => G.listings.find((l) => l.fid === f.id);
export const bidsFor = (f) => G.bids.filter((b) => b.fid === f.id);
export const transferFee = (f) => round100(value(f) * (f.real ? 1.25 : 1.1));

function joinRoster(f, cut, years) {
  f.st = "mine"; f.agency = null;
  f.ct = { pct: cut, wks: years * 52, signed: G.wk };
  f.hist = [ovr(f)]; f.en = Math.max(f.en, 60); f.sl = 2;
  f.tl = f.tl || []; f.tl.push({ w: G.wk, t: "Signed by your agency" });
  G.ro.push(f.id);
  bumpRanks();
}
function leaveRoster(f) {
  G.ro = G.ro.filter((i) => i !== f.id);
  G.bk = G.bk.filter((b) => b.fid !== f.id);
  G.offers = G.offers.filter((o) => o.fid !== f.id);
  G.listings = G.listings.filter((l) => l.fid !== f.id);
  G.bids = G.bids.filter((b) => b.fid !== f.id);
  f.hist = []; f.prep = 0;
}

// Returns {ok, msg}. bonus = signing bonus to fighter, fee = transfer fee to agency (buy-outs).
export function trySign(f, cut, bonus, years, fee = 0) {
  if (G.ro.length >= ROSTER_MAX) return { ok: false, msg: "Roster full. Release or sell someone first." };
  if (G.cash < bonus + fee) return { ok: false, msg: "Not enough cash." };
  if (f.lock > G.wk) return { ok: false, msg: `${f.name} won't talk until week ${f.lock}.` };
  const p = dealChance(f, cut, bonus, years, fee);
  if (R() < p) {
    spend(bonus + fee);
    if (fee) { G.fin.buys += fee; const ag = AGENCIES[f.agency]; say(`Bought ${f.name} from ${ag.name} for ${moneyS(fee)}.`, "good"); }
    else say(`Signed ${f.name}.`, "good");
    joinRoster(f, cut, years);
    return { ok: true };
  }
  f.lock = G.wk + 4;
  say(`${f.name} turned down your offer.`, "bad");
  return { ok: false, msg: "Rejected. They won't talk for 4 weeks.", rejected: true };
}
const moneyS = (n) => "$" + Math.round(n).toLocaleString("en-US");

// Combined chance: fighter agrees (and, for a buy-out, the agency accepts the fee).
export function dealChance(f, cut, bonus, years, fee = 0) {
  let p = acceptChance(f, cut, bonus, years, f.st === "other" ? askOf(f) * 0.5 : askOf(f));
  if (f.st === "other") {
    const want = transferFee(f);
    p *= cl(0.5 + (fee / want - 1) * 2.2, 0.03, 0.97);
  }
  return p;
}

export function release(f) {
  leaveRoster(f);
  f.st = "free"; f.ct = null; f.lock = G.wk + 12;
  G.rep = Math.max(0, G.rep - 2);
  f.tl.push({ w: G.wk, t: "Released by your agency" });
  say(`You released ${f.name}.`, "warn");
}

export function list(f, ask) {
  const l = listing(f);
  if (l) l.ask = ask; else G.listings.push({ fid: f.id, ask, wk: G.wk });
  say(`${f.name} is on the transfer list at ${moneyS(ask)}.`);
}
export function unlist(f) { G.listings = G.listings.filter((l) => l.fid !== f.id); }

export function sell(bid) {
  const f = G.f[bid.fid], ag = AGENCIES[bid.ag];
  leaveRoster(f);
  earn(bid.amount, "sales");
  f.st = "other"; f.agency = bid.ag;
  f.ct = { pct: 20, wks: Math.max(f.ct?.wks || 0, 104) };
  f.tl.push({ w: G.wk, t: `Sold to ${ag.name} for ${moneyS(bid.amount)}` });
  G.hist.sold++;
  G.rep = cl(G.rep + 1, 0, 100);
  say(`Sold ${f.name} to ${ag.name} for ${moneyS(bid.amount)}.`, "good");
  bumpRanks();
}
export function rejectBid(bid) { G.bids = G.bids.filter((b) => b !== bid); }

// Counter offer: returns "accepted" | "raised" | "walked".
export function counter(bid, amount) {
  const ratio = amount / bid.amount;
  const style = AGENCIES[bid.ag].style;
  const tol = style === "big spender" ? 0.25 : style === "bargain hunter" ? 0.08 : 0.15;
  if (ratio <= 1.02 || R() < cl(1 - (ratio - 1) / tol, 0, 0.9)) { bid.amount = round100(amount); return "accepted"; }
  if (R() < 0.5 && !bid.countered) { bid.amount = round100(bid.amount + (amount - bid.amount) * rnd(0.3, 0.6)); bid.countered = 1; return "raised"; }
  rejectBid(bid);
  return "walked";
}

// Weekly: rival agencies bid on listed fighters, and sometimes on hot fighters who aren't listed.
export function weeklyBids() {
  G.bids = G.bids.filter((b) => b.exp > G.wk && G.ro.includes(b.fid));
  for (const f of mine()) {
    if (!canSell(f)) continue;
    const v = value(f), l = listing(f), form = 1 + cl(f.streak || 0, -2, 4) * 0.05;
    const taken = new Set(bidsFor(f).map((b) => b.ag));
    const fresh = AGENCIES.filter((a) => !taken.has(a.id));
    if (l) {
      // Interest drops if the asking price is far above value.
      const chance = cl(0.5 - (l.ask / v - 1) * 0.6, 0.05, 0.6);
      for (const a of fresh) if (R() < chance / 2) addBid(f, a, v * rnd(0.68, 1.02) * form * styleMul(a, f), false);
    } else if (v > 30000 && ((f.streak || 0) >= 2 || (rank(f) >= 0 && rank(f) <= 10)) && R() < 0.1 && fresh.length) {
      addBid(f, pk(fresh), v * rnd(0.95, 1.3) * form, true);
    }
  }
}
function styleMul(a, f) {
  if (a.style === "big spender") return 1.1;
  if (a.style === "bargain hunter") return 0.85;
  if (a.style === "loves prospects" && f.age < 25) return 1.12;
  if (a.style === "chases champions" && rank(f) >= 0 && rank(f) <= 5) return 1.15;
  return 1;
}
function addBid(f, a, amount, unsolicited) {
  G.bids.push({ id: G.wk * 1000 + ri(0, 999), fid: f.id, ag: a.id, amount: round100(amount), exp: G.wk + 3, unsolicited });
  say(`${a.name} ${unsolicited ? "made an unsolicited bid" : "bid"} ${moneyS(amount)} for ${f.name}.`, "money");
}

// --- Contracts ---------------------------------------------------------------
export const renewalAsk = (f) => round100(askOf(f) * 0.6);
export function renewChance(f, cut, bonus, years) {
  let p = acceptChance(f, cut, bonus, years, renewalAsk(f));
  p += 0.1 + cl(f.streak || 0, -2, 3) * 0.03; // fighters you've treated well like to stay
  if (f.pers === "Loyal") p += 0.1;
  return cl(p, 0.03, 0.98);
}
export function tryRenew(f, cut, bonus, years) {
  if (G.cash < bonus) return { ok: false, msg: "Not enough cash." };
  if (f.ct.renewLock > G.wk) return { ok: false, msg: "They want to wait a couple of weeks." };
  if (R() < renewChance(f, cut, bonus, years)) {
    spend(bonus);
    f.ct = { ...f.ct, pct: cut, wks: years * 52 };
    f.tl.push({ w: G.wk, t: `Renewed for ${years} year${years > 1 ? "s" : ""}` });
    say(`${f.name} renewed for ${years} year${years > 1 ? "s" : ""}.`, "good");
    return { ok: true };
  }
  f.ct.renewLock = G.wk + 2;
  return { ok: false, msg: "They said no. Try again in 2 weeks.", rejected: true };
}
export function contractTick() {
  for (const f of mine()) {
    f.ct.wks--;
    if (f.ct.wks === 8) say(`${f.name}'s contract ends in 8 weeks. Renew or sell before then.`, "warn");
    if (f.ct.wks <= 0) {
      leaveRoster(f);
      f.st = "free"; f.ct = null; f.lock = G.wk + 8;
      f.tl.push({ w: G.wk, t: "Contract expired, left the agency" });
      say(`${f.name}'s contract expired. He walked away for nothing.`, "bad");
    }
  }
  for (const f of G.f) {
    if (f.st === "other" && f.ct) {
      f.ct.wks--;
      if (f.ct.wks <= 0) {
        if (R() < 0.7) f.ct.wks = ri(52, 156);
        else { f.st = "free"; f.agency = null; f.ct = null; }
      }
    }
  }
}
