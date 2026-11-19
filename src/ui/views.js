// Every screen except fight night. Each view returns an HTML string.
import { G, ovr, rec, mine, rank, ranks, rankLabel, value, askOf, repNeeded, agencyOf, weeklyCost, slots, city, UFC_DATA, SETTINGS } from "../state.js";
import { DIVISIONS, DIV_SHORT, ATTR_KEYS, ATTR_NAMES, ATTR_DESC, INTENSITY, PERSONALITIES, AGENCIES, AGENCY_COLOURS, DIFFICULTY, ROSTER_MAX, NO_SALE_WEEKS, WEEKS_IN_RED_LIMIT, CITIES, FOCUS, EMBLEMS } from "../data/constants.js";
import { esc, money, kmoney } from "../util.js";
import { avatar } from "./avatar.js";
import { icon, emblem, analyst, ovrCol, grade, AREAS, areaVal, summary, card, bar, sparkline, radar, modal, closeBtn, toggle } from "./components.js";
import { listing, bidsFor, canSell, transferFee, dealChance, renewalAsk, renewChance } from "../sim/market.js";
import { dealsOf, offersFor as sponsorOffers, PITCH_COST } from "../sim/sponsors.js";
import { EVENTS, hintOf } from "../sim/events.js";
import { weakest } from "../sim/world.js";
import { SND } from "../audio.js";
import { UI } from "./uistate.js";

const NAV = [["home", "Home"], ["fighters", "Fighters"], ["fights", "Fights"], ["gym", "Gym"], ["market", "Market"], ["rankings", "Rankings"], ["office", "Office"]];
const last = (f) => esc(f.name.split(" ").pop());
const page = (title, sub, right = "") => `<div class="ph"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${right}</div>`;

// ---------- Shell ----------
function badges() {
  const m = mine();
  return {
    fights: m.filter((f) => !f.inj && !G.bk.some((b) => b.fid === f.id)).length,
    market: G.bids.length,
    fighters: m.filter((f) => f.ct.wks <= 8).length + G.spons.length,
  };
}
export function shell(content) {
  const nb = badges(), c = city();
  return `<header class="hdr"><div class="hdr-in">
    <div class="mark">${emblem(G.ag)}<div><b>${esc(G.ag.name)}</b><small>${c.name} · Week ${G.wk}</small></div></div>
    <nav class="nav">${NAV.map(([k, n]) => `<a class="${UI.view === k ? "on" : ""}" data-a="go" data-i="${k}" data-tut="nav-${k}" tabindex="0">${icon(k)}<span>${n}</span>${nb[k] ? `<i class="dotb">${nb[k]}</i>` : ""}</a>`).join("")}</nav>
    <div class="hdr-r">
      <div class="money" data-tut="cash"><b id="cash" class="num ${G.cash < 0 ? "bad" : ""}">${kmoney(G.cash)}</b><small>${G.red ? `<span class="bad">Red ${G.red}/${WEEKS_IN_RED_LIMIT}</span>` : `Rep ${Math.round(G.rep)}`}</small></div>
      <button class="ib" data-a="inbox" aria-label="News">${icon("bell")}${G.unread ? `<i class="dotb">${Math.min(G.unread, 99)}</i>` : ""}</button>
      <button class="btn red sm adv-btn" data-a="adv" data-tut="next" title="Advance one week (N)"><span class="lbl">Next week</span><span class="kbd">N</span></button>
    </div></div></header>
  <main class="${UI.view !== UI.last ? "view-in" : ""}">${content}</main>`;
}

// ---------- Menu / setup ----------
export function vMenu() {
  const champs = Object.entries(UFC_DATA).filter(([, d]) => (d.tags || []).some((t) => /title holder/i.test(t))).map(([, d]) => d.file);
  const pics = [...champs, ...Object.values(UFC_DATA).map((d) => d.file)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
  const order = [pics[3], pics[1], pics[0], pics[2], pics[4]].filter(Boolean);
  const sl = slots();
  return `<div class="menu"><div class="glow"></div>
    <div class="lineup">${order.map((p) => `<img src="${import.meta.env.BASE_URL}fighters/${p}" alt="">`).join("")}</div><div class="fade"></div>
    <div class="top"><div class="logo">Fight<br><span>Manager</span></div><div class="logo-sub">Build the camp · Work the corner · Sell the stars</div></div>
    <div class="bottom">
      <div class="slots">${sl.map((s) => s.name ? `<button class="slot" data-a="loadslot" data-i="${s.slot}"><span class="sn">Slot ${s.slot}</span>
          <div class="row" style="gap:10px;margin-top:6px">${emblem(s)}<b style="margin:0">${esc(s.name)}</b></div>
          <div class="meta">${CITIES.find((c) => c.id === s.city)?.name || ""} · Week ${s.wk}</div>
          <div class="meta">${kmoney(s.cash)} · ${s.w}-${s.l}${s.titles ? ` · ${s.titles} title${s.titles > 1 ? "s" : ""}` : ""}${s.over ? ' · <span class="bad">Folded</span>' : ""}</div>
          <span class="del" data-a="delslot" data-i="${s.slot}" role="button" aria-label="Delete save">Delete</span></button>`
        : `<button class="slot empty" data-a="newslot" data-i="${s.slot}"><span class="sn">Slot ${s.slot}</span><b>+ New agency</b><span class="meta">Start a new career</span></button>`).join("")}</div>
      <div class="legal">Unofficial fan game. Not affiliated with or endorsed by the UFC. Fighter images © their owners, from ufc.com. Records as of November 2026; skills are the game's own estimates.</div>
    </div></div>`;
}
export function vSetup() {
  const c = UI.setup, ci = CITIES.find((x) => x.id === c.city);
  return `<div class="setup view-in">
    <div class="row spread" style="margin-bottom:18px"><div><div class="eyebrow">Slot ${c.slot} · New agency</div><h1 style="font-size:56px">Set up your agency</h1></div><button class="btn quiet" data-a="menu">Back</button></div>
    <div class="preview" style="--c:${AGENCY_COLOURS[c.col]}">${emblem(c)}<div><b id="pv-name">${esc(c.name || "Your Agency")}</b><span class="mute">${esc(c.manager || "Manager")} · ${ci.name}, ${ci.country}</span></div></div>
    <div class="grid g2">
      <div><label class="f" for="an">Agency name</label><input id="an" type="text" maxlength="26" placeholder="e.g. Southside Fight Co." value="${esc(c.name)}" autocomplete="off"></div>
      <div><label class="f" for="mn">Your name (manager)</label><input id="mn" type="text" maxlength="24" placeholder="e.g. Alex Reyes" value="${esc(c.manager)}" autocomplete="off"></div>
    </div>
    <div class="grid g2">
      <div><label class="f">Colour</label><div class="swatches">${AGENCY_COLOURS.map((k, i) => `<button class="swatch ${c.col === i ? "on" : ""}" data-a="scol" data-i="${i}" style="background:${k}" aria-label="Colour ${i + 1}"></button>`).join("")}</div></div>
      <div><label class="f">Emblem</label><div class="embs">${Object.entries(EMBLEMS).map(([k, p]) => `<button class="${c.emblem === k ? "on" : ""}" data-a="semb" data-i="${k}" aria-label="${k}"><svg viewBox="0 0 24 24">${p}</svg></button>`).join("")}</div></div>
    </div>
    <label class="f">Home city <b>${ci.note}</b></label>
    <div class="opts">${CITIES.map((x) => `<button class="opt ${c.city === x.id ? "on" : ""}" data-a="scity" data-i="${x.id}"><b>${x.name}</b><small>${x.country} · costs ${x.cost < 1 ? "low" : x.cost > 1.1 ? "high" : "normal"}${x.rep ? ` · +${x.rep} rep` : ""}</small><small>Faster: ${x.bonus.map((k) => ATTR_NAMES[ATTR_KEYS.indexOf(k)]).join(", ")}</small></button>`).join("")}</div>
    <div class="grid g2">
      <div><label class="f">Gym focus</label><div class="opts" style="grid-template-columns:1fr">${Object.entries(FOCUS).map(([k, x]) => `<button class="opt ${c.focus === k ? "on" : ""}" data-a="sfocus" data-i="${k}"><b>${x.name}</b><small>+15% training: ${x.keys.map((q) => ATTR_NAMES[ATTR_KEYS.indexOf(q)]).join(", ")}</small></button>`).join("")}</div></div>
      <div><label class="f">Difficulty</label><div class="opts" style="grid-template-columns:1fr">${Object.entries(DIFFICULTY).map(([d, v]) => `<button class="opt ${c.diff === d ? "on" : ""}" data-a="sdiff" data-i="${d}"><b>${d}</b><small>${v.label}</small></button>`).join("")}</div></div>
    </div>
    <div class="row" style="margin-top:28px"><button class="btn red lg" data-a="start">Open the doors</button></div>
  </div>`;
}
export function vGameOver() {
  return `<div class="menu"><div class="glow"></div><div class="top" style="margin:auto">
    <div class="logo">Agency<br><span>Folded</span></div>
    <p class="mute" style="font-size:17px;margin-top:20px">You stayed in the red for ${WEEKS_IN_RED_LIMIT} weeks. The bank called in the loan.</p>
    <div class="hero-strip" style="max-width:600px;margin:24px auto"><div><small>Weeks</small><b>${G.wk}</b></div><div><small>Record</small><b>${G.hist.w}-${G.hist.l}</b></div><div><small>Titles</small><b>${G.hist.titles}</b></div></div>
    <button class="btn red lg" data-a="menu">Main menu</button></div></div>`;
}

// ---------- Home ----------
function tasks() {
  const m = mine(), out = [];
  if (G.event) out.push(["var(--gold)", EVENTS[G.event.id].title, "Something came up. Your call.", "Decide", "event", 0]);
  if (G.bids.length) out.push(["var(--green)", `${G.bids.length} offer${G.bids.length > 1 ? "s" : ""} to buy your fighters`, "Rival agencies are bidding. Offers expire.", "Review", "go", "market", "desk"]);
  G.spons.forEach((o) => out.push([o.col, `${o.brand} wants ${esc(G.f[o.fid].name)}`, `${money(o.weekly)}/week for ${o.weeks} weeks. You take ${G.f[o.fid].ct.pct}%.`, "View", "prof", o.fid]));
  m.filter((f) => f.ct.wks <= 12).forEach((f) => out.push(["var(--red)", `${esc(f.name)}'s contract ends in ${f.ct.wks} weeks`, "Renew him, or sell before he walks for free.", "Renew", "renew", f.id]));
  const idle = m.filter((f) => !f.inj && !G.bk.some((b) => b.fid === f.id));
  if (idle.length) out.push(["var(--red)", `${idle.length} fighter${idle.length > 1 ? "s need" : " needs"} a fight`, idle.map((f) => esc(f.name)).join(", "), "Find fights", "go", "fights"]);
  if (!G.autotrain) { const fresh = m.filter((f) => !f.inj && f.sl > 0 && f.en >= 20); if (fresh.length) out.push(["var(--blue)", `${fresh.length} fighter${fresh.length > 1 ? "s" : ""} can train`, "Or switch on auto-train in the Gym.", "Gym", "go", "gym"]); }
  if (m.length < 3) out.push(["var(--gold)", "Your roster is thin", `${m.length} of ${ROSTER_MAX} spots filled.`, "Market", "go", "market"]);
  return out;
}
export function vHome() {
  const t = tasks(), bk = G.bk.slice().sort((a, b) => a.wk - b.wk), a = analyst();
  return shell(`${page(`Week ${G.wk}`, G.ag.manager ? `Welcome back, ${esc(G.ag.manager)}.` : "")}
    <div class="hero-strip"><div><small>Cash</small><b class="${G.cash < 0 ? "bad" : ""}">${kmoney(G.cash)}</b>${a ? `<div class="small mute">−${kmoney(weeklyCost())}/week</div>` : ""}</div>
      <div><small>Record</small><b>${G.hist.w}-${G.hist.l}</b>${G.hist.titles ? `<div class="small warn">${G.hist.titles} title${G.hist.titles > 1 ? "s" : ""}</div>` : ""}</div>
      <div><small>Reputation</small><b>${Math.round(G.rep)}</b>${a ? `<div class="small mute">Roster value ${kmoney(mine().reduce((s, f) => s + value(f), 0))}</div>` : ""}</div></div>
    <div class="grid side-split">
      <div class="panel" data-tut="todo"><div class="panel-h"><h2>This week</h2></div>
        ${t.map(([c, h, s, btn, act, i, x]) => `<div class="task" style="--c:${c}"><span class="ic"></span><div class="t"><b>${h}</b><span>${s}</span></div><button class="btn sm quiet" data-a="${act}" data-i="${i}" ${x ? `data-x="${x}"` : ""}>${btn}</button></div>`).join("") || '<div class="empty">All set. Press <b>Next week</b>.</div>'}
      </div>
      <div class="panel"><div class="panel-h"><h2>Upcoming fights</h2></div>
        ${bk.map((b) => { const f = G.f[b.fid], o = G.f[b.oid]; return `<div class="bout" data-a="prof" data-i="${f.id}">${avatar(f, 46, "round")}<div class="n">${last(f)}</div><div class="vs">VS</div><div class="n r">${last(o)}</div>${avatar(o, 46, "round")}<div class="when">${b.title ? '<span class="warn">TITLE FIGHT · </span>' : ""}${b.wk - G.wk <= 0 ? "This week" : `Week ${b.wk}`}</div></div>`; }).join("") || '<div class="empty small">Nothing booked.</div>'}
      </div>
    </div>
    <div class="grid ${a ? "g2" : ""}">
      <div class="panel"><div class="panel-h"><h2>News</h2></div><div class="feed">${G.log.slice(0, 6).map(logItem).join("")}</div></div>
      ${a ? `<div class="panel"><div class="panel-h"><h2>Cash</h2></div>${sparkline(G.ch, "var(--green)", kmoney)}</div>` : ""}
    </div>`);
}
const logItem = (l) => `<div class="it"><span class="dot ${l.k}"></span><span class="wk">WK ${l.wk}</span><span>${esc(l.t)}</span></div>`;

// ---------- Fighters ----------
export function vFighters() {
  const m = mine();
  const items = m.map((f) => {
    const l = listing(f), bk = G.bk.find((b) => b.fid === f.id);
    return `<div class="unit">${card(f, { value: 1 })}
      <div class="card-actions">
        <span class="small mute" style="flex:1;align-self:center">${bk ? `Fights ${esc(G.f[bk.oid].name)} · wk ${bk.wk}` : f.inj ? `Out ${f.inj} weeks` : "No fight booked"}${dealsOf(f).length ? ` · ${dealsOf(f).length} sponsor${dealsOf(f).length > 1 ? "s" : ""}` : ""}</span>
        ${!bk && !f.inj ? `<button class="btn sm quiet" data-a="go" data-i="fights">Book</button>` : ""}
        <button class="btn sm quiet" data-a="list" data-i="${f.id}" ${canSell(f) ? "" : "disabled"}>${l ? "Listed" : "Sell"}</button>
        ${f.ct.wks <= 26 ? `<button class="btn sm gold" data-a="renew" data-i="${f.id}">Renew</button>` : ""}
      </div></div>`;
  });
  return shell(`${page("Your fighters", `${m.length} of ${ROSTER_MAX} roster spots.`, `<button class="btn quiet" data-a="go" data-i="market">Sign fighters</button>`)}
    <div class="cards" data-tut="roster">${items.join("") || '<div class="empty">No fighters. Head to the Market.</div>'}</div>`);
}

// ---------- Profile ----------
export function vProfile() {
  const f = G.f[UI.pid], o = ovr(f), r = rank(f), isMine = f.st === "mine", ag = agencyOf(f), a = analyst();
  const U = UFC_DATA[f.name];
  let actions;
  if (isMine) {
    const l = listing(f), bk = G.bk.find((b) => b.fid === f.id);
    actions = `${!bk && !f.inj ? `<button class="btn red" data-a="go" data-i="fights">Book a fight</button>` : ""}
      <button class="btn quiet" data-a="gymf" data-i="${f.id}">Train</button>
      <button class="btn quiet" data-a="list" data-i="${f.id}" ${canSell(f) ? "" : "disabled"}>${l ? "Edit sale" : "Sell"}</button>
      <button class="btn quiet" data-a="renew" data-i="${f.id}">Renew</button>
      <button class="btn link" data-a="release" data-i="${f.id}">Release</button>`;
  } else actions = `<button class="btn red" data-a="neg" data-i="${f.id}" ${f.lock > G.wk ? "disabled" : ""}>${f.lock > G.wk ? `Won't talk until week ${f.lock}` : f.st === "other" ? "Make transfer offer" : "Offer contract"}</button>`;
  const bids = isMine ? bidsFor(f) : [], spons = isMine ? sponsorOffers(f) : [];
  const facts = [["Record", rec(f)], ["Age", f.age], ["Division", DIVISIONS[f.wc].replace(" ", "<br>")]];
  if (f.ht) facts.push(["Height", `${Math.floor(f.ht / 12)}'${Math.round(f.ht % 12)}"`]);
  if (f.reach) facts.push(["Reach", `${f.reach}"`]);
  return shell(`<p style="margin:0 0 14px"><a class="btn link" data-a="go" data-i="${UI.back || "home"}">← Back</a></p>
    <div class="prof-hero" style="--hc:${isMine ? AGENCY_COLOURS[G.ag.col] + "66" : r === 0 ? "#5a4a2266" : "#2a0606"}">
      ${avatar(f, 300)}
      <div class="t"><div class="eyebrow">${rankLabel(r)} ${DIVISIONS[f.wc]}</div>${f.nick ? `<div class="nick">"${esc(f.nick)}"</div>` : ""}<h1>${esc(f.name)}</h1>
        <div class="mute" style="margin-top:6px">${summary(f)}${f.home ? " · " + esc(f.home) : f.nat ? " · " + f.nat : ""}${isMine ? "" : ` · ${ag ? ag.name : "Free agent"}`}</div>
        <div class="facts">${facts.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>
        <div class="row" style="margin-top:20px">${actions}</div></div>
      <div class="rt"><b style="color:${ovrCol(o)}">${o}</b><small>OVERALL</small><div style="margin-top:12px;font:800 26px var(--display)">${kmoney(value(f))}</div><small>MARKET VALUE</small></div>
    </div>
    ${bids.length ? `<div class="panel" style="border-left:4px solid var(--green)"><div class="panel-h"><h2>Offers to buy him</h2></div>${bids.map(bidRow).join("")}</div>` : ""}
    ${spons.map((s) => `<div class="panel" style="border-left:4px solid ${s.col}"><div class="row spread"><div><div class="eyebrow" style="color:${s.col}">Sponsorship offer</div><h2 style="margin-top:4px">${esc(s.brand)}</h2><div class="mute">${money(s.weekly)} a week for ${s.weeks} weeks · you take ${f.ct.pct}% (${money(s.weekly * f.ct.pct / 100)}/wk)${s.perf ? " · ends if he loses twice in a row" : ""} · expires week ${s.exp}</div></div><div class="row"><button class="btn gold sm" data-a="spok" data-i="${s.id}">Sign deal</button><button class="btn link" data-a="spno" data-i="${s.id}">Decline</button></div></div></div>`).join("")}
    <div class="grid g3">
      <div class="panel"><div class="panel-h"><h2>Skills</h2></div>
        ${a ? ATTR_KEYS.map((k, i) => `<div class="attr" title="${ATTR_DESC[k]}"><span>${ATTR_NAMES[i]}</span>${bar(f.at[k], ovrCol(f.at[k]), 7)}<b style="color:${ovrCol(f.at[k])}">${f.at[k]}</b></div>`).join("")
          : AREAS.map(([n, k]) => { const v = areaVal(f, k); return `<div class="grade"><div class="g" style="color:${ovrCol(v)}">${grade(v)}</div><div class="t"><b>${n}</b><span class="small mute">${k.map((q) => ATTR_NAMES[ATTR_KEYS.indexOf(q)]).join(" · ")}</span></div></div>`; }).join("")}
      </div>
      ${a ? `<div class="panel"><div class="panel-h"><h2>Skill shape</h2></div>${radar(f)}</div>` : ""}
      <div class="panel"><div class="panel-h"><h2>${isMine ? "Business" : "Career"}</h2></div>
        <div class="kv"><span>Popularity</span><b>${f.pop}</b></div>
        <div class="kv"><span>Streak</span><b>${(f.streak || 0) > 0 ? "Won " + f.streak : (f.streak || 0) < 0 ? "Lost " + -f.streak : "—"}</b></div>
        ${f.ct ? `<div class="kv"><span>Contract</span><b>${f.ct.wks} weeks${isMine ? ` · your cut ${f.ct.pct}%` : ""}</b></div>` : ""}
        ${f.camp ? `<div class="kv"><span>Trains at</span><b style="text-align:right">${esc(f.camp)}</b></div>` : ""}
        ${!f.real && isMine ? `<div class="kv"><span>Potential</span><b>${f.pot >= 86 ? "Elite" : f.pot >= 78 ? "High" : "Moderate"}</b></div>` : ""}
        ${a ? `<div class="kv"><span>Personality</span><b title="${PERSONALITIES[f.pers]}">${f.pers}</b></div><div class="kv"><span>Career earnings</span><b>${money(f.earn)}</b></div>` : ""}
        ${isMine ? `<div style="margin-top:12px"><div class="eyebrow" style="margin-bottom:6px">Sponsors</div>${dealsOf(f).map((d) => `<div class="deal" style="--c:${d.col}"><i></i><div class="t"><b>${esc(d.brand)}</b><span class="small mute">${money(d.weekly)}/wk · ${d.left} weeks left</span></div></div>`).join("") || '<div class="small mute">No sponsors yet.</div>'}
          <button class="btn sm quiet" style="margin-top:10px" data-a="pitch" data-i="${f.id}" ${dealsOf(f).length >= 3 || f.pitched === G.wk ? "disabled" : ""}>Pitch to brands · ${money(PITCH_COST)}</button></div>` : ""}
      </div>
      ${!a ? `<div class="panel"><div class="panel-h"><h2>Timeline</h2></div><div class="feed">${f.tl.slice().reverse().slice(0, 6).map((e) => `<div class="it"><span class="wk">WK ${e.w}</span><span>${esc(e.t)}</span></div>`).join("") || '<div class="small mute">Nothing yet.</div>'}</div></div>` : ""}
    </div>
    ${a ? `<div class="grid g2">
      ${U?.stats ? `<div class="panel"><div class="panel-h"><h2>UFC career stats</h2><a class="small mute" href="${U.source}" target="_blank" rel="noopener">ufc.com ↗</a></div><div class="statgrid">
        ${[["Sig. strikes / min", U.stats.slpm], ["Absorbed / min", U.stats.sapm], ["Striking acc.", U.stats.stracc != null ? U.stats.stracc + "%" : null], ["Takedowns / 15m", U.stats.td], ["Takedown acc.", U.stats.tdacc != null ? U.stats.tdacc + "%" : null], ["Takedown def.", U.stats.tddef != null ? U.stats.tddef + "%" : null], ["Strike def.", U.stats.strdef != null ? U.stats.strdef + "%" : null], ["Subs / 15m", U.stats.sub], ["Knockdowns / 15m", U.stats.kd]].map(([k, v]) => `<div><b>${v ?? "—"}</b><small>${k}</small></div>`).join("")}</div></div>` : `<div class="panel"><div class="panel-h"><h2>Development</h2></div>${isMine ? sparkline(f.hist.length ? f.hist : [o], "var(--gold2)") : '<div class="empty small">Tracked for your fighters.</div>'}</div>`}
      <div class="panel"><div class="panel-h"><h2>Timeline</h2></div><div class="feed">${f.tl.slice().reverse().slice(0, 8).map((e) => `<div class="it"><span class="wk">WK ${e.w}</span><span>${esc(e.t)}</span></div>`).join("") || '<div class="small mute">Nothing yet.</div>'}</div></div></div>` : ""}`);
}
export function bidRow(b) {
  const ag = AGENCIES[b.ag], f = G.f[b.fid], d = b.amount / value(f) - 1;
  return `<div class="task" style="--c:${ag.col}"><span class="ic"></span><div class="t"><b>${ag.name}</b><span>${b.unsolicited ? "Unsolicited · " : ""}for ${esc(f.name)} · expires week ${b.exp}${analyst() ? ` · ${d >= 0 ? `<span class="good">${Math.round(d * 100)}% over</span>` : `<span class="bad">${Math.round(-d * 100)}% under</span>`} value` : ""}</span></div>
    <b style="font:800 26px var(--display)">${kmoney(b.amount)}</b>
    <button class="btn gold sm" data-a="bidok" data-i="${b.id}">Accept</button><button class="btn quiet sm" data-a="bidcounter" data-i="${b.id}">Counter</button><button class="btn link" data-a="bidno" data-i="${b.id}">Reject</button></div>`;
}

// ---------- Fights ----------
export function vFights() {
  const m = mine(), a = analyst();
  const any = m.some((f) => !f.inj && !G.bk.some((b) => b.fid === f.id) && !G.offers.some((o) => o.fid === f.id));
  const rows = m.map((f) => {
    const bk = G.bk.find((b) => b.fid === f.id);
    let body;
    if (bk) { const o = G.f[bk.oid]; body = `<div class="task" style="--c:var(--gold)"><span class="ic"></span><div class="t"><b>${bk.title ? "Title fight vs " : "Booked vs "}${esc(o.name)}</b><span>Week ${bk.wk} · purse ${kmoney(bk.purse)} + ${kmoney(bk.bonus)} to win</span></div><button class="btn sm quiet" data-a="prof" data-i="${o.id}">Scout</button></div>`; }
    else if (f.inj > 0) body = `<div class="small mute" style="padding:8px 0">Injured for ${f.inj} more week${f.inj > 1 ? "s" : ""}.</div>`;
    else {
      const list = G.offers.filter((o) => o.fid === f.id);
      body = list.length ? list.map((o) => offerRow(o, f, a)).join("") : `<button class="btn red sm" data-a="seek" data-i="${f.id}" data-tut="seek">Find opponents</button>`;
    }
    return `<div class="panel">${card(f, { slim: 1 })}<div style="margin-top:10px">${body}</div></div>`;
  });
  return shell(`${page("Fights", "Pick an opponent. Tougher fights pay more and build reputation. Fights happen two weeks after booking.", any ? '<button class="btn red" data-a="seekall" data-tut="seek">Find opponents for everyone</button>' : "")}
    ${rows.join("") || '<div class="empty">Sign a fighter first.</div>'}`);
}
function offerRow(o, f, a) {
  const op = G.f[o.oid], i = G.offers.indexOf(o), cut = Math.round((o.purse + o.bonus) * f.ct.pct / 100);
  const c = o.title ? "var(--gold)" : o.lab === "Dangerous" ? "var(--red)" : o.lab === "Even" ? "#888" : "var(--green)";
  return `<div class="task" style="--c:${c}"><span class="ic"></span>${avatar(op, 52, "round")}
    <div class="t"><b>${esc(op.name)} <span class="pill" style="margin-left:6px">${o.title ? "Title shot" : o.lab}</span></b><span>${rankLabel(rank(op))} · ${rec(op)} · OVR ${ovr(op)}${a ? ` · ${op.style}` : ""} · you could earn ${kmoney(cut)}</span></div>
    <button class="btn red sm" data-a="acc" data-i="${i}">Accept</button>
    ${a ? `<button class="btn quiet sm" data-a="push" data-i="${i}" ${o.push ? "disabled" : ""} title="30% chance they pull the offer">+20%</button>` : ""}
    <button class="btn link" data-a="prof" data-i="${op.id}">Scout</button></div>`;
}

// ---------- Gym ----------
export function vGym() {
  const m = mine(), a = analyst();
  if (!m.length) return shell(page("Gym") + '<div class="empty">Sign a fighter first.</div>');
  if (!m.some((f) => f.id === UI.gym.fid)) UI.gym.fid = m[0].id;
  const f = G.f[UI.gym.fid], g = UI.gym;
  const I = INTENSITY[g.int], can = !f.inj && f.sl > 0 && f.en >= I.energy && G.cash >= I.cost;
  const why = f.inj ? "Injured" : f.sl < 1 ? "No sessions left this week" : f.en < I.energy ? "Too tired" : G.cash < I.cost ? "Not enough cash" : "";
  const boosted = (k) => city().bonus.includes(k) || FOCUS[G.ag.focus]?.keys.includes(k);
  const wk = weakest(f);
  return shell(`${page("Gym", "Two sessions per fighter each week. Energy refills on Next week.")}
    <div class="panel" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
      ${toggle(G.autotrain, "autotoggle", "Auto-train", "Every week, each fighter trains his weakest skill at Normal intensity, while he has energy.", "autotrain")}
    </div>
    <div class="roster-pick">${m.map((x) => `<button class="rp ${x.id === f.id ? "on" : ""}" data-a="gsel" data-i="${x.id}">${avatar(x, 56)}<div><b>${last(x)}</b><span class="small mute">${x.inj ? "Injured" : `${x.sl}/2 sessions`}</span></div></button>`).join("")}</div>
    <div class="grid side-split">
      <div class="panel"><div class="panel-h"><h2>Pick a skill</h2>${a ? `<span class="small mute">Gold = faster in ${city().name} / your gym</span>` : ""}</div>
        <div class="skills">${ATTR_KEYS.map((k, i) => `<button class="sk ${g.key === k ? "on" : ""}" data-a="gkey" data-i="${k}"><div class="row"><span>${ATTR_NAMES[i]}</span><b style="color:${ovrCol(f.at[k])}">${a ? f.at[k] : grade(f.at[k])}</b></div>${bar(f.at[k], ovrCol(f.at[k]), 4)}${boosted(k) ? '<div class="boost">FAST TRACK</div>' : k === wk ? '<div class="area">Weakest</div>' : ""}</button>`).join("")}</div>
        <p class="small mute" style="margin-bottom:0">${ATTR_DESC[g.key]}</p>
      </div>
      <div class="panel"><div class="panel-h"><h2>Session</h2></div>
        <div class="seg" style="margin-bottom:10px">${INTENSITY.map((x, i) => `<button class="${g.int === i ? "on" : ""}" data-a="gint" data-i="${i}">${x.name}</button>`).join("")}</div>
        <div class="kv"><span>Cost</span><b>${money(I.cost)}</b></div>
        <div class="kv"><span>Energy</span><b>${f.en} → ${Math.max(0, f.en - I.energy)}</b></div>
        <div class="kv"><span>Risk</span><b>${I.risk}</b></div>
        ${a ? `<div class="kv"><span>Camp prep</span><b>${f.prep}% → ${Math.min(100, f.prep + I.prep)}%</b></div>` : ""}
        <button class="btn red lg block" style="margin-top:14px" data-a="train" ${can ? "" : "disabled"}>${can ? `Train ${ATTR_NAMES[ATTR_KEYS.indexOf(g.key)]}` : why}</button>
      </div>
    </div>`);
}

// ---------- Market ----------
export const price = (f) => (f.st === "other" ? transferFee(f) + askOf(f) * 0.5 : askOf(f));
export function vMarket() {
  const k = UI.mk, a = analyst();
  const tabs = `<div class="seg" data-tut="market-tabs">${[["free", "Free agents"], ["other", "Rival fighters"], ["desk", `Sell${G.bids.length ? ` (${G.bids.length})` : ""}`]].map(([t, n]) => `<button class="${k.tab === t ? "on" : ""}" data-a="mktab" data-i="${t}">${n}</button>`).join("")}</div>`;
  const sub = k.tab === "desk" ? "List fighters for sale. Rival agencies bid each week." : k.tab === "free" ? "Unsigned fighters. Pay a signing bonus and take a cut of their purses." : "Fighters signed to rival agencies. Pay their agency a transfer fee to bring them over.";
  if (k.tab === "desk") return shell(page("Market", sub, tabs) + vDesk());
  let l = G.f.filter((f) => f.st === k.tab && !f.retired && (k.div < 0 || f.wc === k.div) && (!k.q || f.name.toLowerCase().includes(k.q.toLowerCase())));
  const sorts = { ovr: (x, y) => ovr(y) - ovr(x), cheap: (x, y) => price(x) - price(y), age: (x, y) => x.age - y.age };
  l.sort(sorts[k.sort] || sorts.ovr); l = l.slice(0, 36);
  const filt = `<div class="row" style="margin-bottom:18px"><div class="chips"><button class="chip ${k.div < 0 ? "on" : ""}" data-a="mkdiv" data-i="-1">All</button>${DIV_SHORT.map((d, i) => `<button class="chip ${k.div === i ? "on" : ""}" data-a="mkdiv" data-i="${i}">${d}</button>`).join("")}</div>
    <input class="search" id="mkq" type="search" placeholder="Search" value="${esc(k.q)}" style="width:180px">
    <select id="mksort" aria-label="Sort">${[["ovr", "Best"], ["cheap", "Cheapest"], ["age", "Youngest"]].map(([s, n]) => `<option value="${s}" ${k.sort === s ? "selected" : ""}>${n}</option>`).join("")}</select></div>`;
  const items = l.map((f) => {
    const ok = G.rep >= repNeeded(f), locked = f.lock > G.wk;
    return `<div class="unit">${card(f)}<div class="card-actions" style="align-items:center">
      <b style="font:800 24px var(--display);flex:1">${kmoney(price(f))}<span class="small mute" style="font:500 12px var(--body);margin-left:8px">${f.st === "other" ? "fee + bonus" : "signing bonus"}</span></b>
      ${!ok ? `<span class="small bad" title="Reputation he wants">Needs rep ${repNeeded(f)}</span>` : ""}
      <button class="btn ${ok ? "red" : "quiet"} sm" data-a="neg" data-i="${f.id}" ${locked ? "disabled" : ""}>${locked ? "Wk " + f.lock : "Negotiate"}</button></div></div>`;
  });
  return shell(`${page("Market", `${sub} Roster ${G.ro.length}/${ROSTER_MAX}.`, tabs)}${filt}<div class="cards">${items.join("") || '<div class="empty">Nobody matches.</div>'}</div>`);
}
function vDesk() {
  const rows = mine().map((f) => {
    const l = listing(f), bids = bidsFor(f), sellable = canSell(f);
    return `<div class="panel">${card(f, { slim: 1, value: 1 })}
      <div class="row spread" style="margin-top:12px"><span class="small mute">${l ? `Listed at <b class="warn">${kmoney(l.ask)}</b>` : sellable ? "Not listed. Hot fighters still attract bids." : `Can be sold from week ${f.ct.signed + NO_SALE_WEEKS}.`}</span>
      <div class="row">${l ? `<button class="btn sm quiet" data-a="list" data-i="${f.id}">Change price</button><button class="btn link" data-a="unlist" data-i="${f.id}">Take off market</button>` : `<button class="btn sm gold" data-a="list" data-i="${f.id}" ${sellable ? "" : "disabled"}>List for sale</button>`}</div></div>
      ${bids.map(bidRow).join("")}</div>`;
  });
  return rows.join("") || '<div class="empty">No fighters to sell.</div>';
}

// ---------- Rankings ----------
export function vRankings() {
  const l = ranks(UI.rk).slice(0, 16), ch = l[0];
  const agc = (f) => { const ag = agencyOf(f); return f.st === "mine" ? `<span class="warn">${esc(G.ag.name)}</span>` : ag ? `<span style="color:${ag.col}">${ag.short}</span>` : '<span class="good">Free</span>'; };
  return shell(`${page("Rankings", "Win to climb. Fighters in the top 3 can earn a title shot.")}
    <div class="chips" style="margin-bottom:18px">${DIVISIONS.map((d, i) => `<button class="chip ${UI.rk === i ? "on" : ""}" data-a="rkdiv" data-i="${i}">${d}</button>`).join("")}</div>
    ${ch ? `<div class="champ-row" data-a="prof" data-i="${ch.id}">${avatar(ch, 150)}<div class="t"><div class="eyebrow" style="color:var(--gold2)">${DIVISIONS[UI.rk]} Champion</div><div class="nm">${esc(ch.name)}</div><div class="mute">${rec(ch)} · ${agc(ch)}</div></div><div style="font:800 54px var(--display);color:${ovrCol(ovr(ch))}">${ovr(ch)}</div></div>` : ""}
    <div class="panel" style="padding:8px 18px"><table class="tbl"><tbody>
    ${l.slice(1).map((f, i) => `<tr class="click ${f.st === "mine" ? "me" : ""}" data-a="prof" data-i="${f.id}"><td class="rk">${i + 1}</td><td style="width:56px">${avatar(f, 44, "round")}</td><td><div class="nm">${esc(f.name)}</div><div class="small mute">${rec(f)}</div></td><td class="small">${agc(f)}</td><td style="text-align:right"><b style="font:800 24px var(--display);color:${ovrCol(ovr(f))}">${ovr(f)}</b></td></tr>`).join("")}
    </tbody></table></div>`);
}

// ---------- Office ----------
export function vOffice() {
  const t = UI.office;
  const tabs = `<div class="seg">${[["set", "Settings"], ["fin", "Finances"], ["hist", "History"], ["agency", "Agency"]].map(([k, n]) => `<button class="${t === k ? "on" : ""}" data-a="oftab" data-i="${k}">${n}</button>`).join("")}</div>`;
  let body = "";
  if (t === "fin") {
    const f = G.fin;
    body = `<div class="grid g2"><div class="panel"><div class="panel-h"><h2>Cash</h2></div>${sparkline(G.ch, "var(--green)", kmoney)}</div>
      <div class="panel"><div class="panel-h"><h2>Ledger</h2></div>
        <div class="kv"><span>Balance</span><b class="${G.cash < 0 ? "bad" : ""}">${money(G.cash)}</b></div>
        <div class="kv"><span>Fight commission</span><b class="good">${money(f.inc)}</b></div>
        <div class="kv"><span>Sponsorships</span><b class="good">${money(f.spons || 0)}</b></div>
        <div class="kv"><span>Fighter sales</span><b class="good">${money(f.sales)}</b></div>
        <div class="kv"><span>Transfer fees paid</span><b class="bad">${money(f.buys)}</b></div>
        <div class="kv"><span>All spending</span><b class="bad">${money(f.exp)}</b></div>
        <div class="kv"><span>Weekly office costs (${city().name})</span><b>${money(weeklyCost())}</b></div>
        <p class="small mute">${WEEKS_IN_RED_LIMIT} weeks in a row below $0 and the agency folds.</p></div></div>`;
  } else if (t === "hist") {
    body = `<div class="grid g2"><div class="panel"><div class="panel-h"><h2>Results</h2></div>${G.res.map((r) => `<div class="kv"><span>WK ${r.wk} · ${esc(r.n)} vs ${esc(r.o)}</span><b class="${r.won ? "good" : "bad"}">${r.won ? "W" : "L"} · ${r.how}</b></div>`).join("") || '<div class="empty small">No fights yet.</div>'}</div>
      <div class="panel"><div class="panel-h"><h2>Activity</h2></div><div class="feed">${G.log.map(logItem).join("")}</div></div></div>`;
  } else if (t === "agency") {
    const c = city();
    body = `<div class="panel" style="max-width:640px"><div class="preview" style="--c:${AGENCY_COLOURS[G.ag.col]};margin:-20px -20px 18px">${emblem(G.ag)}<div><b>${esc(G.ag.name)}</b><span class="mute">${esc(G.ag.manager || "")} · ${c.name}, ${c.country}</span></div></div>
      <div class="kv"><span>Home city</span><b>${c.name}</b></div><div class="kv"><span>City perk</span><b style="text-align:right">${c.note}</b></div>
      <div class="kv"><span>Gym focus</span><b>${FOCUS[G.ag.focus]?.name || "—"}</b></div><div class="kv"><span>Difficulty</span><b>${G.diff}</b></div>
      <label class="f" for="ren">Rename agency</label><div class="row"><input id="ren" type="text" maxlength="26" value="${esc(G.ag.name)}" style="flex:1"><button class="btn quiet" data-a="rename">Save</button></div>
      <label class="f">Colour</label><div class="swatches">${AGENCY_COLOURS.map((k, i) => `<button class="swatch ${G.ag.col === i ? "on" : ""}" data-a="agcol" data-i="${i}" style="background:${k}"></button>`).join("")}</div>
      <label class="f">Emblem</label><div class="embs">${Object.entries(EMBLEMS).map(([k, p]) => `<button class="${G.ag.emblem === k ? "on" : ""}" data-a="agemb" data-i="${k}"><svg viewBox="0 0 24 24">${p}</svg></button>`).join("")}</div></div>`;
  } else {
    body = `<div class="panel" style="max-width:640px">
      <div style="padding:6px 0 16px;border-bottom:1px solid var(--line)" data-tut="analyst">${toggle(SETTINGS.analyst, "analyst", "Analyst Mode", "Show every number: exact skills, radar charts, UFC career stats, stamina, strike counts, momentum and market maths.")}</div>
      <div style="padding:16px 0;border-bottom:1px solid var(--line)">${toggle(SND.on, "snd", "Sound", "Button clicks, crowd and fight effects.")}
        <label class="f">Volume <b>${Math.round(SND.vol * 100)}%</b></label><input type="range" id="vol" min="0" max="100" value="${SND.vol * 100}"></div>
      <div class="row" style="padding-top:16px"><button class="btn quiet" data-a="tour">Replay tutorial</button><button class="btn quiet" data-a="menu">Save &amp; exit to menu</button><button class="btn link bad" data-a="abandon">Delete this career</button></div>
      <p class="small dim" style="margin-top:18px">Saves automatically to slot ${G.slot}. Unofficial fan game, not affiliated with the UFC. Fighter images © their owners, from ufc.com.</p></div>`;
  }
  return shell(page("Office", "", tabs) + body);
}

// ---------- Modals ----------
export function mNegotiate(f) {
  const buy = f.st === "other", fee = buy ? transferFee(f) : 0, ask = askOf(f), ag = agencyOf(f), m = UI.modal;
  m.cut ??= 20; m.bonus ??= Math.round((buy ? ask * 0.5 : ask) / 500) * 500; m.years ??= 2; m.fee ??= Math.round(fee / 1000) * 1000;
  return modal(`${closeBtn()}<div class="row" style="gap:14px;align-items:flex-end">${avatar(f, 90)}<div><div class="eyebrow">${buy ? "Transfer offer" : "Contract offer"}</div><h2 style="font-size:30px">${esc(f.name)}</h2><div class="small mute">${PERSONALITIES[f.pers]}</div></div></div>
    ${G.rep < repNeeded(f) ? `<p class="small bad" style="margin-bottom:0">He wants an agency with ${repNeeded(f)} reputation. You have ${Math.round(G.rep)}. Pay more to compensate.</p>` : ""}
    ${buy ? `<label class="f">Fee to ${ag.name} <b id="v-fee">${money(m.fee)}</b></label><input type="range" id="r-fee" min="${Math.round(fee * 0.5 / 1000) * 1000}" max="${Math.round(fee * 1.8 / 1000) * 1000}" step="1000" value="${m.fee}">` : ""}
    <label class="f">Signing bonus <b id="v-bonus">${money(m.bonus)}</b></label><input type="range" id="r-bonus" min="0" max="${Math.max(2000, Math.round(ask * 2 / 500) * 500)}" step="500" value="${m.bonus}">
    <label class="f">Your cut of his purses <b id="v-cut">${m.cut}%</b></label><input type="range" id="r-cut" min="10" max="35" value="${m.cut}">
    <label class="f">Contract length</label><div class="seg">${[1, 2, 3].map((y) => `<button class="${m.years === y ? "on" : ""}" data-a="nyears" data-i="${y}">${y} year${y > 1 ? "s" : ""}</button>`).join("")}</div>
    <div class="ring" id="ring"><div><b id="v-p">–</b></div></div><div class="small mute" style="text-align:center">chance he signs · total <b id="v-total"></b></div>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn link" data-a="mclose">Walk away</button><button class="btn red" data-a="offer" data-i="${f.id}">Make offer</button></div>`);
}
export function negUpdate() {
  const m = UI.modal, f = G.f[m.fid];
  const p = m.kind === "renew" ? renewChance(f, m.cut, m.bonus, m.years) : dealChance(f, m.cut, m.bonus, m.years, m.fee || 0);
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set("v-cut", m.cut + "%"); set("v-bonus", money(m.bonus)); set("v-fee", money(m.fee || 0)); set("v-p", Math.round(p * 100) + "%"); set("v-total", money(m.bonus + (m.fee || 0)));
  const r = document.getElementById("ring");
  if (r) { r.style.setProperty("--p", Math.round(p * 100)); r.style.setProperty("--c", p > 0.65 ? "var(--green)" : p > 0.4 ? "var(--gold)" : "var(--red)"); }
}
export function mRenew(f) {
  const ask = renewalAsk(f), m = UI.modal;
  m.cut ??= f.ct.pct; m.bonus ??= Math.round(ask / 500) * 500; m.years ??= 2;
  return modal(`${closeBtn()}<div class="row" style="gap:14px;align-items:flex-end">${avatar(f, 80)}<div><div class="eyebrow">Renewal · ${f.ct.wks} weeks left</div><h2 style="font-size:28px">${esc(f.name)}</h2></div></div>
    <label class="f">Renewal bonus <b id="v-bonus">${money(m.bonus)}</b></label><input type="range" id="r-bonus" min="0" max="${Math.max(2000, Math.round(ask * 2 / 500) * 500)}" step="500" value="${m.bonus}">
    <label class="f">Your cut <b id="v-cut">${m.cut}%</b></label><input type="range" id="r-cut" min="10" max="35" value="${m.cut}">
    <label class="f">New length</label><div class="seg">${[1, 2, 3].map((y) => `<button class="${m.years === y ? "on" : ""}" data-a="nyears" data-i="${y}">${y} year${y > 1 ? "s" : ""}</button>`).join("")}</div>
    <div class="ring" id="ring"><div><b id="v-p">–</b></div></div><div class="small mute" style="text-align:center">chance he re-signs</div>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn link" data-a="mclose">Not now</button><button class="btn gold" data-a="dorenew" data-i="${f.id}">Offer renewal</button></div>`);
}
export function mList(f) {
  const v = value(f), l = listing(f), m = UI.modal;
  m.ask ??= l ? l.ask : Math.round(v / 1000) * 1000;
  return modal(`${closeBtn()}<div class="row" style="gap:14px;align-items:flex-end">${avatar(f, 80)}<div><div class="eyebrow">Transfer list</div><h2 style="font-size:28px">${esc(f.name)}</h2><div class="small mute">Worth about ${money(v)}</div></div></div>
    <label class="f">Asking price <b id="v-ask">${money(m.ask)}</b></label><input type="range" id="r-ask" min="${Math.round(v * 0.5 / 1000) * 1000}" max="${Math.round(v * 2 / 1000) * 1000}" step="1000" value="${m.ask}">
    <div class="small" id="v-interest" style="margin-top:8px"></div>
    <p class="small mute">Value goes up with skill, wins, ranking, popularity, youth and contract length.</p>
    <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn link" data-a="mclose">Cancel</button><button class="btn gold" data-a="dolist" data-i="${f.id}">${l ? "Update price" : "List him"}</button></div>`);
}
export function listUpdate() {
  const m = UI.modal, v = value(G.f[m.fid]), r = m.ask / v;
  const e = document.getElementById("v-ask"); if (e) e.textContent = money(m.ask);
  const i = document.getElementById("v-interest");
  if (i) i.innerHTML = r <= 0.9 ? '<span class="good">Bargain. Expect bids fast.</span>' : r <= 1.1 ? '<span class="good">Fair. Bids within a few weeks.</span>' : r <= 1.4 ? '<span class="warn">Ambitious. Bids will be rare.</span>' : '<span class="bad">Way too high. Almost nobody will bid.</span>';
}
export function mCounter(b) {
  const f = G.f[b.fid], ag = AGENCIES[b.ag], m = UI.modal;
  m.amt ??= Math.round(b.amount * 1.15 / 1000) * 1000;
  return modal(`${closeBtn()}<div class="eyebrow">Counter offer</div><h2 style="font-size:28px">${ag.name}</h2><p class="small mute">They offered ${money(b.amount)} for ${esc(f.name)}. They're a ${ag.style}. Push too hard and they walk.</p>
    <label class="f">Your price <b id="v-amt">${money(m.amt)}</b></label><input type="range" id="r-amt" min="${Math.round(b.amount / 1000) * 1000}" max="${Math.round(b.amount * 1.6 / 1000) * 1000}" step="1000" value="${m.amt}">
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn link" data-a="mclose">Cancel</button><button class="btn red" data-a="docounter" data-i="${b.id}">Send counter</button></div>`);
}
export const mConfirm = (title, text, action, id, btn = "Confirm") => modal(`<h2 style="font-size:28px">${title}</h2><p class="mute">${text}</p><div class="row" style="justify-content:flex-end"><button class="btn link" data-a="mclose">Cancel</button><button class="btn red" data-a="${action}" data-i="${id}">${btn}</button></div>`);
export const mInbox = () => modal(`${closeBtn()}<h2 style="font-size:28px;margin-bottom:10px">News</h2><div class="feed">${G.log.slice(0, 20).map(logItem).join("")}</div>`, true);
export function mWeek(sum) {
  return modal(`<div class="eyebrow">Week ${G.wk}</div><h2 style="font-size:30px;margin-bottom:8px">What happened</h2><div class="feed">${sum.map(logItem).join("") || '<div class="empty small">A quiet week.</div>'}</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px">${G.bids.length ? '<button class="btn quiet" data-a="go" data-i="market" data-x="desk">See offers</button>' : ""}<button class="btn red" data-a="weekok">Continue</button></div>`, true);
}
export function mEvent() {
  const e = G.event, ev = EVENTS[e.id], f = e.ctx.fid != null ? G.f[e.ctx.fid] : null;
  return modal(`<div class="row" style="gap:14px;align-items:flex-end">${f ? avatar(f, 84) : ""}<div><div class="eyebrow">Event</div><h2 style="font-size:32px">${ev.title}</h2></div></div>
    <p style="font-size:16px;margin:14px 0 4px">${esc(ev.text(e.ctx))}</p>
    ${ev.choices.map((c, i) => `<button class="choice" data-a="evpick" data-i="${i}"><b>${c.label}</b><span>${esc(hintOf(c, e.ctx))}</span></button>`).join("")}`, true);
}
export const mEventResult = (msg) => modal(`<div class="eyebrow">Outcome</div><p style="font-size:17px">${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn red" data-a="mclose">Continue</button></div>`);
