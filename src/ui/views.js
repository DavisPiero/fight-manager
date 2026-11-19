// Every screen except fight night. Each view returns an HTML string.
import { G, ovr, rec, mine, rank, ranks, rankLabel, rankShort, value, askOf, repNeeded, agencyOf, weeklyCost, load } from "../state.js";
import { DIVISIONS, DIV_SHORT, ATTR_KEYS, ATTR_NAMES, ATTR_DESC, GYM_AREAS, INTENSITY, PERSONALITIES, AGENCIES, AGENCY_COLOURS, DIFFICULTY, ROSTER_MAX, NO_SALE_WEEKS, WEEKS_IN_RED_LIMIT } from "../data/constants.js";
import { esc, money, kmoney } from "../util.js";
import { avatar, photoOf, credits } from "./avatar.js";
import { icon, ovrCol, ovrBadge, statusTags, fighterCard, bar, sparkline, radar, modal, closeBtn } from "./components.js";
import { listing, bidsFor, canSell, transferFee, dealChance, renewalAsk, renewChance } from "../sim/market.js";
import { SND } from "../audio.js";
import { UI } from "./uistate.js";

const NAV = [["home", "Dashboard"], ["fighters", "Fighters"], ["fights", "Fights"], ["gym", "Gym"], ["market", "Market"], ["rankings", "Rankings"], ["office", "Office"]];
const lastName = (f) => esc(f.name.split(" ").pop());

// ---------- Shell ----------
function badges() {
  const m = mine();
  return {
    fights: m.filter((f) => !f.inj && !G.bk.some((b) => b.fid === f.id)).length,
    market: G.bids.length,
    fighters: m.filter((f) => f.ct.wks <= 8).length,
    gym: 0,
  };
}
export function shell(content) {
  const nb = badges();
  const side = `<nav class="side">
    <div class="brand"><div class="logo">F</div><div><b>Fight Manager</b><small>Week ${G.wk}</small></div></div>
    ${NAV.map(([k, n]) => `<a class="nav ${UI.view === k || (k === "fighters" && UI.view === "prof" && G.f[UI.pid]?.st === "mine") ? "on" : ""}" data-a="go" data-i="${k}" tabindex="0">${icon(k)}<span>${n}</span>${nb[k] ? `<i class="bdg ${k === "market" ? "gold" : ""}">${nb[k]}</i>` : ""}</a>`).join("")}
    <div class="foot">Unofficial fan game. Not affiliated with the UFC.</div></nav>`;
  return `<div class="shell">${side}<main class="${UI.view !== UI.last ? "view-in" : ""}">${topbar()}${content}</main></div>`;
}
function topbar() {
  const unread = Math.min(G.unread, 99);
  return `<div class="topbar">
    <div class="ag"><span class="agdot" style="background:${AGENCY_COLOURS[G.ag.col]};color:${AGENCY_COLOURS[G.ag.col]}"></span><h1>${esc(G.ag.name)}</h1></div>
    <div class="stat"><b id="cash" class="num ${G.cash < 0 ? "bad" : ""}">${money(G.cash)}</b><small>Cash${G.red ? ` · <span class="bad">in the red ${G.red}/${WEEKS_IN_RED_LIMIT}</span>` : ""}</small></div>
    <div class="stat" title="Reputation decides which fighters will sign with you"><b>${Math.round(G.rep)}</b><small>Reputation</small><div class="repbar"><i style="width:${Math.max(2, G.rep)}%"></i></div></div>
    <div class="stat"><b>${G.wk}</b><small>Week</small></div>
    <button class="iconbtn" data-a="inbox" aria-label="News">${icon("bell")}${unread ? `<i class="bdg">${unread}</i>` : ""}</button>
    <button class="iconbtn" data-a="snd" aria-label="Sound on or off" title="Sound ${SND.on ? "on" : "off"}">${icon(SND.on ? "sound" : "mute")}</button>
    <button class="btn primary" data-a="adv" title="Advance one week (N)">Next week <span class="kbd">N</span></button>
  </div>`;
}

// ---------- Menu / new game ----------
export function vMenu() {
  const pics = Object.values(credits()).slice(0, 60).map((p) => `<img src="${import.meta.env.BASE_URL}photos/${p.file}" alt="">`).join("");
  const has = !!load();
  return `<div class="menu"><div class="mosaic">${pics}</div><div class="inner">
    <div class="title">Fight<span>Manager</span></div>
    <p class="mute" style="font-size:17px;margin:18px 0 26px">Sign the talent. Build them up in the gym. Work the corner on fight night. Sell high, or keep them and chase the belt.</p>
    <div class="row"><button class="btn primary lg" data-a="new">New career</button>
    <button class="btn lg" data-a="cont" ${has ? "" : "disabled"}>Continue</button></div>
    <p class="dim small" style="margin-top:28px">Unofficial fan game, not affiliated with the UFC. Records as of November 2026; skills are the game's own estimates. Photos from Wikimedia Commons, see Office › Credits.</p>
  </div></div>`;
}
export function vNew() {
  const c = UI.setup;
  return `<div class="menu"><div class="inner">
    <h1 style="font-size:48px">Open your agency</h1>
    <p class="mute">Pick a name and colours. You start with three young prospects.</p>
    <label class="f" for="an">Agency name</label>
    <input id="an" type="text" maxlength="28" placeholder="e.g. Southside Fight Co." value="${esc(c.name)}" autocomplete="off">
    <label class="f">Colour</label>
    <div class="row">${AGENCY_COLOURS.map((k, i) => `<button class="swatch ${c.col === i ? "on" : ""}" data-a="ccol" data-i="${i}" style="background:${k}" aria-label="Colour ${i + 1}"></button>`).join("")}</div>
    <label class="f">Difficulty</label>
    <div class="optgrid">${Object.entries(DIFFICULTY).map(([d, v]) => `<button class="opt ${c.diff === d ? "on" : ""}" data-a="cdiff" data-i="${d}"><b>${d}</b><small>${v.label}</small></button>`).join("")}</div>
    <div class="row" style="margin-top:24px"><button class="btn primary lg" data-a="start">Open the doors</button><button class="btn ghost" data-a="menu">Back</button></div>
  </div></div>`;
}
export function vGameOver() {
  return `<div class="menu"><div class="inner" style="text-align:center">
    <div class="title" style="font-size:80px">Agency<span>Folded</span></div>
    <p class="mute" style="font-size:17px">You stayed in the red for ${WEEKS_IN_RED_LIMIT} weeks. The bank called in the loan.</p>
    <div class="tiles" style="grid-template-columns:repeat(3,1fr);margin:24px 0"><div class="tile"><small>Weeks survived</small><b>${G.wk}</b></div><div class="tile"><small>Record</small><b>${G.hist.w}-${G.hist.l}</b></div><div class="tile"><small>Titles</small><b>${G.hist.titles}</b></div></div>
    <button class="btn primary lg" data-a="new">Start again</button></div></div>`;
}

// ---------- Dashboard ----------
function todos() {
  const m = mine(), out = [];
  if (G.bids.length) out.push(["green", `${G.bids.length} offer${G.bids.length > 1 ? "s" : ""} for your fighters`, "Rival agencies want to buy. Offers expire after 3 weeks.", "Review", "go", "market", "desk"]);
  m.filter((f) => f.ct.wks <= 12).forEach((f) => out.push(["red", `${esc(f.name)}'s contract ends in ${f.ct.wks} weeks`, "Renew, or sell him before he walks for free.", "Renew", "renew", f.id]));
  G.bk.filter((b) => b.wk - G.wk <= 1).forEach((b) => out.push(["gold", `Fight ${b.wk === G.wk + 1 ? "next week" : "this week"}: ${esc(G.f[b.fid].name)} vs ${esc(G.f[b.oid].name)}`, "Train to build camp prep before fight night.", "Gym", "gymf", b.fid]));
  const idle = m.filter((f) => !f.inj && !G.bk.some((b) => b.fid === f.id));
  if (idle.length) out.push(["blue", `${idle.length} fighter${idle.length > 1 ? "s have" : " has"} no fight booked`, idle.map((f) => esc(f.name)).join(", "), "Find fights", "go", "fights"]);
  const fresh = m.filter((f) => !f.inj && f.sl > 0 && f.en >= 20);
  if (fresh.length) out.push(["blue", `${fresh.length} fighter${fresh.length > 1 ? "s" : ""} can train this week`, "Each fighter gets two sessions a week.", "Gym", "go", "gym"]);
  if (m.length < 3) out.push(["gold", "Your roster is thin", `You have ${m.length} of ${ROSTER_MAX} spots filled.`, "Market", "go", "market"]);
  return out;
}
export function vHome() {
  const t = todos();
  const bk = G.bk.slice().sort((a, b) => a.wk - b.wk);
  const tut = G.tutorial < 1 ? `<div class="card" style="border-color:#e1262d66;background:linear-gradient(120deg,#e1262d1f,var(--s1) 60%)">
      <div class="card-h"><h2>How to run your agency</h2><button class="btn sm ghost" data-a="tutx">Got it</button></div>
      <div class="grid g4 small">
        <div><b>1. Book fights</b><div class="mute">Fights pay purses. You keep your cut, usually 20%.</div></div>
        <div><b>2. Train</b><div class="mute">Skills go up and camp prep gives an edge on fight night.</div></div>
        <div><b>3. Work the corner</b><div class="mute">Change tactics live and pick your corner's call between rounds.</div></div>
        <div><b>4. Sell high</b><div class="mute">List a fighter in the Market when his value peaks, or keep him and chase the belt.</div></div>
      </div></div>` : "";
  return shell(`${tut}
    <div class="tiles">
      <div class="tile"><small>Cash</small><b class="${G.cash < 0 ? "bad" : ""}">${kmoney(G.cash)}</b><span class="small mute">−${kmoney(weeklyCost())}/week costs</span></div>
      <div class="tile"><small>Fight record</small><b>${G.hist.w}-${G.hist.l}</b><span class="small mute">${G.hist.titles} title${G.hist.titles === 1 ? "" : "s"} won</span></div>
      <div class="tile"><small>Roster value</small><b>${kmoney(mine().reduce((s, f) => s + value(f), 0))}</b><span class="small mute">${mine().length}/${ROSTER_MAX} fighters</span></div>
      <div class="tile"><small>Sales</small><b>${kmoney(G.fin.sales)}</b><span class="small mute">${G.hist.sold} fighter${G.hist.sold === 1 ? "" : "s"} sold</span></div>
    </div>
    <div class="grid g2">
      <div>
        <div class="card"><div class="card-h"><h2>To do</h2><span class="small dim">This week</span></div>
          ${t.map(([c, h, s, btn, a, i, x]) => `<div class="todo ${c}"><div class="t"><b>${h}</b><span class="small mute">${s}</span></div><button class="btn sm" data-a="${a}" data-i="${i}" ${x ? `data-x="${x}"` : ""}>${btn}</button></div>`).join("") || '<div class="empty">All set. Press <b>Next week</b>.</div>'}
        </div>
        <div class="card"><h2>Upcoming fights</h2>
          ${bk.map((b) => { const a = G.f[b.fid], o = G.f[b.oid]; return `<div class="fc" data-a="prof" data-i="${a.id}">${avatar(a, 46)}<div class="info"><div class="nm">${lastName(a)} <span class="mute">vs</span> ${lastName(o)}</div><div class="meta">Week ${b.wk} · ${b.wk - G.wk <= 0 ? "this week" : b.wk - G.wk + " wk to go"} · prep ${a.prep}%${b.title ? ' · <span class="warn">TITLE FIGHT</span>' : ""}</div></div>${avatar(o, 46)}</div>`; }).join('<div style="height:8px"></div>') || '<div class="empty">Nothing booked yet.</div>'}
        </div>
      </div>
      <div>
        <div class="card"><div class="card-h"><h2>Cash</h2><span class="small dim">since week 1</span></div>${sparkline(G.ch, "var(--green)", kmoney)}</div>
        <div class="card"><h2>News</h2><div class="feed">${G.log.slice(0, 8).map(logItem).join("")}</div></div>
      </div>
    </div>`);
}
const logItem = (l) => `<div class="it"><span class="dot ${l.k}"></span><span class="wk">Wk ${l.wk}</span><span>${esc(l.t)}</span></div>`;

// ---------- My fighters ----------
export function vFighters() {
  const m = mine();
  const cards = m.map((f) => {
    const l = listing(f), bk = G.bk.find((b) => b.fid === f.id), nb = bidsFor(f).length;
    return `<div class="card" style="margin:0;padding:14px">${fighterCard(f, "", { value: 1 })}
      <div class="grid g3 small" style="margin-top:12px;gap:10px">
        <div><span class="mute">Energy</span>${bar(f.en, f.en < 35 ? "var(--gold)" : "var(--green)")}</div>
        <div><span class="mute">Camp prep</span>${bar(f.prep, "var(--blue)")}</div>
        <div><span class="mute">Contract</span><div class="${f.ct.wks <= 12 ? "bad" : ""}">${f.ct.wks} wk · ${f.ct.pct}% cut</div></div>
      </div>
      <div class="small mute" style="margin-top:8px">${bk ? `Booked vs ${esc(G.f[bk.oid].name)}, week ${bk.wk}` : f.inj ? `Injured for ${f.inj} weeks` : "No fight booked"}</div>
      <div class="row" style="margin-top:12px">
        <button class="btn sm" data-a="gymf" data-i="${f.id}">Train</button>
        ${!bk && !f.inj ? `<button class="btn sm" data-a="go" data-i="fights">Find fight</button>` : ""}
        ${nb ? `<button class="btn sm green" data-a="go" data-i="market" data-x="desk">${nb} bid${nb > 1 ? "s" : ""}</button>` : ""}
        <button class="btn sm" data-a="list" data-i="${f.id}" ${canSell(f) ? "" : `disabled title="Can't sell within ${NO_SALE_WEEKS} weeks of signing"`}>${l ? "Listed " + kmoney(l.ask) : "Sell"}</button>
        ${f.ct.wks <= 26 ? `<button class="btn sm gold" data-a="renew" data-i="${f.id}">Renew</button>` : ""}
      </div></div>`;
  });
  for (let i = m.length; i < ROSTER_MAX; i++) cards.push(`<button class="card empty" style="margin:0;min-height:150px" data-a="go" data-i="market">+ Empty spot<br><span class="small">Sign a fighter in the Market</span></button>`);
  return shell(`<div class="card-h" style="margin-bottom:14px"><h1>My fighters <span class="mute">${m.length}/${ROSTER_MAX}</span></h1><span class="small mute">Roster value ${kmoney(m.reduce((s, f) => s + value(f), 0))}</span></div><div class="grid gauto" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">${cards.join("")}</div>`);
}

// ---------- Profile ----------
export function vProfile() {
  const f = G.f[UI.pid], o = ovr(f), r = rank(f), isMine = f.st === "mine", ph = photoOf(f), cr = credits()[f.name];
  const ag = agencyOf(f);
  let actions = "";
  if (isMine) {
    const l = listing(f), bk = G.bk.find((b) => b.fid === f.id);
    actions = `<button class="btn" data-a="gymf" data-i="${f.id}">Train</button>
      ${!bk && !f.inj ? `<button class="btn" data-a="go" data-i="fights">Find a fight</button>` : ""}
      <button class="btn ${l ? "" : "gold"}" data-a="list" data-i="${f.id}" ${canSell(f) ? "" : "disabled"}>${l ? "Edit listing" : "List for sale"}</button>
      ${l ? `<button class="btn ghost" data-a="unlist" data-i="${f.id}">Take off market</button>` : ""}
      <button class="btn" data-a="renew" data-i="${f.id}">Renew contract</button>
      <button class="btn ghost" data-a="release" data-i="${f.id}">Release</button>`;
  } else if (f.st === "other") actions = `<button class="btn primary" data-a="neg" data-i="${f.id}">Make transfer offer</button>`;
  else actions = `<button class="btn primary" data-a="neg" data-i="${f.id}">Negotiate contract</button>`;
  const bids = isMine ? bidsFor(f) : [];
  const back = UI.back || "home";
  return shell(`<p><a data-a="go" data-i="${back}">← Back</a></p>
    <div class="hero" style="--hc:${isMine ? AGENCY_COLOURS[G.ag.col] : ag ? ag.col : "#3ecf8e"}">
      ${avatar(f, 150)}
      <div style="min-width:0;flex:1"><div class="small mute" style="text-transform:uppercase;letter-spacing:.12em">${DIVISIONS[f.wc]} · ${rankLabel(r)}</div>
        <h1>${esc(f.name)}</h1>
        <div class="mute">${rec(f)} · ${f.age} years old${f.nat ? " · " + f.nat : ""} · ${f.style} · <span title="${PERSONALITIES[f.pers]}" style="border-bottom:1px dotted">${f.pers}</span></div>
        <div class="tags row" style="margin-top:8px;gap:5px">${statusTags(f)}</div>
        <div class="row" style="margin-top:14px">${actions}</div></div>
      <div class="big-ovr"><b style="color:${ovrCol(o)}">${o}</b><span class="small mute">OVERALL</span><div class="price" style="margin-top:8px">${kmoney(value(f))}</div><span class="small mute">MARKET VALUE</span></div>
    </div>
    ${bids.length ? `<div class="card" style="border-color:#3ecf8e66"><h2>Offers on the table</h2>${bids.map(bidRow).join("")}</div>` : ""}
    <div class="grid g3">
      <div class="card"><h2>Skills</h2>${ATTR_KEYS.map((k, i) => `<div class="attr" title="${ATTR_DESC[k]}"><span>${ATTR_NAMES[i]}</span>${bar(f.at[k], ovrCol(f.at[k]), 7)}<b style="color:${ovrCol(f.at[k])}">${f.at[k]}</b></div>`).join("")}</div>
      <div class="card"><h2>Skill shape</h2>${radar(f)}</div>
      <div class="card"><h2>Career</h2>
        <div class="kv"><span>Record</span><b>${rec(f)}</b></div>
        <div class="kv"><span>Ranking</span><b>${rankLabel(r)}</b></div>
        <div class="kv"><span>Streak</span><b>${(f.streak || 0) > 0 ? "W" + f.streak : (f.streak || 0) < 0 ? "L" + -f.streak : "—"}</b></div>
        <div class="kv"><span>Popularity</span><b>${f.pop}</b></div>
        <div class="kv"><span>Career earnings</span><b>${money(f.earn)}</b></div>
        <div class="kv"><span>Agency</span><b>${isMine ? esc(G.ag.name) : ag ? ag.name : "Free agent"}</b></div>
        ${f.ct ? `<div class="kv"><span>Contract</span><b>${f.ct.wks} weeks${isMine ? " · " + f.ct.pct + "% cut" : ""}</b></div>` : ""}
        ${!f.real && isMine ? `<div class="kv"><span>Potential</span><b>${f.pot >= 86 ? "Elite" : f.pot >= 78 ? "High" : "Moderate"}</b></div>` : ""}
      </div>
    </div>
    <div class="grid g2">
      <div class="card"><h2>Development</h2>${isMine ? sparkline(f.hist.length ? f.hist : [o], "var(--gold)") : '<div class="empty small">Tracked for fighters you manage.</div>'}</div>
      <div class="card"><h2>Timeline</h2><div class="feed">${f.tl.slice().reverse().slice(0, 8).map((e) => `<div class="it"><span class="wk">Wk ${e.w}</span><span>${esc(e.t)}</span></div>`).join("") || '<div class="empty small">Nothing yet.</div>'}</div></div>
    </div>
    ${ph && cr ? `<p class="small dim">Photo: ${esc(cr.artist)}, ${esc(cr.license)}, via <a href="${cr.source}" target="_blank" rel="noopener">Wikimedia Commons</a>. Record from the UFC roster (Nov 2026). Skills are the game's own estimates.</p>` : ""}`);
}
export function bidRow(b) {
  const a = AGENCIES[b.ag], f = G.f[b.fid], v = value(f), d = b.amount / v - 1;
  return `<div class="todo ${b.unsolicited ? "gold" : "green"}"><div class="t"><b style="color:${a.col}">${a.name} <span class="mute small">· ${a.style}</span></b>
    <span class="small mute">${b.unsolicited ? "Unsolicited bid" : "Bid"} for ${esc(f.name)} · expires week ${b.exp} · ${d >= 0 ? `<span class="good">${Math.round(d * 100)}% above</span>` : `<span class="bad">${Math.round(-d * 100)}% below</span>`} value</span></div>
    <div class="price">${kmoney(b.amount)}</div>
    <button class="btn sm green" data-a="bidok" data-i="${b.id}">Accept</button><button class="btn sm" data-a="bidcounter" data-i="${b.id}">Counter</button><button class="btn sm ghost" data-a="bidno" data-i="${b.id}">Reject</button></div>`;
}

// ---------- Fights ----------
export function vFights() {
  const m = mine();
  const any = m.some((f) => !f.inj && !G.bk.some((b) => b.fid === f.id) && !G.offers.some((o) => o.fid === f.id));
  const rows = m.map((f) => {
    const bk = G.bk.find((b) => b.fid === f.id);
    let body;
    if (bk) {
      const o = G.f[bk.oid];
      body = `<div class="todo gold"><div class="t"><b>${bk.title ? "TITLE FIGHT · " : ""}Booked vs ${esc(o.name)} (${ovr(o)})</b><span class="small mute">Week ${bk.wk} · purse ${money(bk.purse)} + ${money(bk.bonus)} win bonus · your cut ${f.ct.pct}%</span></div><button class="btn sm" data-a="prof" data-i="${o.id}">Scout</button></div>`;
    } else if (f.inj > 0) body = `<div class="empty small">Injured for ${f.inj} more week${f.inj > 1 ? "s" : ""}.</div>`;
    else {
      const list = G.offers.filter((o) => o.fid === f.id);
      body = list.length ? list.map((o) => offerRow(o, f)).join("") : `<button class="btn gold" data-a="seek" data-i="${f.id}">Ask the matchmaker</button>`;
    }
    return `<div class="card">${fighterCard(f)}<div style="margin-top:12px">${body}</div></div>`;
  });
  return shell(`<div class="card-h" style="margin-bottom:14px"><h1>Fights</h1>${any ? '<button class="btn gold" data-a="seekall">Ask for offers for everyone</button>' : ""}</div>
    <p class="mute" style="margin-top:-6px">Tougher opponents pay more and earn more reputation. Fights happen 2 weeks after booking. Top-3 fighters may get a title shot.</p>
    ${rows.join("") || '<div class="empty">Sign a fighter first.</div>'}`);
}
function offerRow(o, f) {
  const op = G.f[o.oid], i = G.offers.indexOf(o), cut = Math.round((o.purse + o.bonus) * f.ct.pct / 100);
  const col = o.title ? "gold" : o.lab === "Dangerous" ? "red" : o.lab === "Even" ? "gold" : "green";
  return `<div class="fc" style="cursor:default;margin-bottom:8px">${avatar(op, 52)}
    <div class="info"><div class="nm">${esc(op.name)} <span class="tag ${col}">${o.title ? "Title shot" : o.lab}</span></div>
      <div class="meta">${rec(op)} · ${rankLabel(rank(op))} · ${op.style} · week ${o.wk}</div>
      <div class="small" style="margin-top:3px">${money(o.purse)} + ${money(o.bonus)} win bonus · <span class="good">you take up to ${money(cut)}</span></div></div>
    ${ovrBadge(op)}
    <div class="stack" style="text-align:right"><button class="btn sm primary" data-a="acc" data-i="${i}">Accept</button><br>
      <button class="btn sm" data-a="push" data-i="${i}" ${o.push ? "disabled" : ""} title="30% chance they pull the offer">Ask +20%</button><br>
      <button class="btn sm ghost" data-a="prof" data-i="${op.id}">Scout</button></div></div>`;
}

// ---------- Gym ----------
export function vGym() {
  const m = mine();
  if (!m.length) return shell('<div class="empty">Sign a fighter first.</div>');
  if (!m.some((f) => f.id === UI.gym.fid)) UI.gym.fid = m[0].id;
  const f = G.f[UI.gym.fid], g = UI.gym, area = GYM_AREAS.find((a) => a.id === g.area);
  if (!area.keys.includes(g.key)) g.key = area.keys[0];
  const I = INTENSITY[g.int], can = !f.inj && f.sl > 0 && f.en >= I.energy && G.cash >= I.cost;
  const why = f.inj ? "Injured" : f.sl < 1 ? "No sessions left this week" : f.en < I.energy ? "Too tired for this intensity" : G.cash < I.cost ? "Not enough cash" : "";
  const bk = G.bk.find((b) => b.fid === f.id);
  return shell(`<div class="card-h" style="margin-bottom:12px"><h1>Gym</h1><button class="btn sm" data-a="autotrain" title="Each fresh fighter does a Normal session on his weakest skill">Auto-train everyone</button></div>
    <div class="pick">${m.map((x) => `<button class="pickf ${x.id === f.id ? "on" : ""}" data-a="gsel" data-i="${x.id}">${avatar(x, 38)}<div style="text-align:left"><b>${lastName(x)}</b><span class="small mute">${x.inj ? "Injured" : `${x.sl} session${x.sl === 1 ? "" : "s"} · ${x.en} energy`}</span></div></button>`).join("")}</div>
    <div class="grid g2" style="margin-top:14px;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)">
      <div class="card">${fighterCard(f)}
        <div class="grid g3 small" style="margin-top:14px;gap:10px">
          <div><span class="mute">Energy ${f.en}</span>${bar(f.en, f.en < 35 ? "var(--gold)" : "var(--green)")}</div>
          <div><span class="mute">Camp prep ${f.prep}%</span>${bar(f.prep, "var(--blue)")}</div>
          <div><span class="mute">Sessions left</span><div><b>${f.sl}</b> / 2</div></div></div>
        <p class="small mute">${bk ? `Fight in ${bk.wk - G.wk} week(s) vs ${esc(G.f[bk.oid].name)}. Camp prep boosts him on the night.` : "Camp prep gives a fight-night boost. It fades slowly each week."} Energy refills 30 a week. Training hard while tired risks injury.</p>
        ${radar(f)}
      </div>
      <div class="card"><h2>1 · Pick an area</h2>
        <div class="areas">${GYM_AREAS.map((a) => `<button class="area ${a.id === g.area ? "on" : ""}" data-a="garea" data-i="${a.id}">${icon(a.icon)}<b>${a.name}</b><span class="small mute">${a.keys.map((k) => ATTR_NAMES[ATTR_KEYS.indexOf(k)]).join(", ")}</span></button>`).join("")}</div>
        <h2 style="margin-top:18px">2 · Pick a skill</h2>
        <div class="grid" style="grid-template-columns:repeat(${area.keys.length},minmax(0,1fr));gap:10px;margin-top:10px">${area.keys.map((k) => `<button class="skillbtn ${g.key === k ? "on" : ""}" data-a="gkey" data-i="${k}"><div class="row"><span>${ATTR_NAMES[ATTR_KEYS.indexOf(k)]}</span><b style="color:${ovrCol(f.at[k])}">${f.at[k]}</b></div>${bar(f.at[k], ovrCol(f.at[k]))}</button>`).join("")}</div>
        <p class="small mute">${ATTR_DESC[g.key]}</p>
        <h2 style="margin-top:16px">3 · Intensity</h2>
        <div class="seg" style="margin-top:10px">${INTENSITY.map((x, i) => `<button class="${g.int === i ? "on" : ""}" data-a="gint" data-i="${i}">${x.name} · ${money(x.cost)}</button>`).join("")}</div>
        <p class="small mute">${I.risk}. Uses ${I.energy} energy, +${I.prep}% camp prep.</p>
        <button class="btn primary lg block" data-a="train" ${can ? "" : "disabled"}>${can ? `Train ${ATTR_NAMES[ATTR_KEYS.indexOf(g.key)]}` : why}</button>
      </div>
    </div>`);
}

// ---------- Market ----------
export function vMarket() {
  const k = UI.mk;
  const tabs = `<div class="seg">${[["free", "Free agents"], ["other", "Buy from rivals"], ["desk", `Transfer desk${G.bids.length ? ` (${G.bids.length})` : ""}`]].map(([t, n]) => `<button class="${k.tab === t ? "on" : ""}" data-a="mktab" data-i="${t}">${n}</button>`).join("")}</div>`;
  if (k.tab === "desk") return shell(`<div class="card-h" style="margin-bottom:14px"><h1>Market</h1>${tabs}</div>${vDesk()}`);
  let l = G.f.filter((f) => f.st === k.tab && !f.retired && (k.div < 0 || f.wc === k.div) && (!k.q || f.name.toLowerCase().includes(k.q.toLowerCase())));
  const sorts = { ovr: (a, b) => ovr(b) - ovr(a), value: (a, b) => value(b) - value(a), age: (a, b) => a.age - b.age, cheap: (a, b) => price(a) - price(b) };
  l.sort(sorts[k.sort]); l = l.slice(0, 40);
  const filt = `<div class="row" style="margin-bottom:14px"><div class="chips"><button class="chip ${k.div < 0 ? "on" : ""}" data-a="mkdiv" data-i="-1">All</button>${DIV_SHORT.map((d, i) => `<button class="chip ${k.div === i ? "on" : ""}" data-a="mkdiv" data-i="${i}">${d}</button>`).join("")}</div>
    <input class="search" id="mkq" type="search" placeholder="Search name" value="${esc(k.q)}">
    <div class="seg">${[["ovr", "Best"], ["value", "Value"], ["cheap", "Cheapest"], ["age", "Youngest"]].map(([s, n]) => `<button class="${k.sort === s ? "on" : ""}" data-a="mksort" data-i="${s}">${n}</button>`).join("")}</div></div>`;
  const items = l.map((f) => {
    const ok = G.rep >= repNeeded(f);
    return `<div class="card" style="margin:0;padding:14px">${fighterCard(f)}
      <div class="row spread" style="margin-top:10px"><div><div class="price">${kmoney(price(f))}</div><span class="small mute">${f.st === "other" ? "Transfer fee + bonus" : "Signing bonus ask"}</span></div>
      <span class="tag ${ok ? "green" : "red"}" title="Reputation this fighter wants">Rep ${repNeeded(f)}</span>
      <button class="btn sm primary" data-a="neg" data-i="${f.id}" ${f.lock > G.wk ? `disabled title="Won't talk until week ${f.lock}"` : ""}>${f.lock > G.wk ? "Wk " + f.lock : f.st === "other" ? "Make offer" : "Negotiate"}</button></div></div>`;
  });
  return shell(`<div class="card-h" style="margin-bottom:14px"><h1>Market</h1>${tabs}</div>
    <p class="mute" style="margin-top:-6px">${k.tab === "free" ? "Free agents just need a signing bonus and a cut of their purses." : "Fighters signed to rival agencies. You pay the agency a transfer fee, plus a signing bonus to the fighter."} Roster ${G.ro.length}/${ROSTER_MAX} · your reputation ${Math.round(G.rep)}.</p>
    ${filt}<div class="grid gauto" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">${items.join("") || '<div class="empty">Nobody matches.</div>'}</div>`);
}
export const price = (f) => (f.st === "other" ? transferFee(f) + askOf(f) * 0.5 : askOf(f));
function vDesk() {
  const m = mine();
  const rows = m.map((f) => {
    const l = listing(f), bids = bidsFor(f), sellable = canSell(f);
    return `<div class="card">${fighterCard(f, "", { value: 1 })}
      <div class="row spread" style="margin:12px 0 4px"><div class="small mute">${l ? `Listed at <b class="warn">${kmoney(l.ask)}</b> since week ${l.wk}` : sellable ? "Not listed. Rival agencies may still bid if he's hot." : `Just signed. Can be sold from week ${f.ct.signed + NO_SALE_WEEKS}.`}</div>
      <div class="row">${l ? `<button class="btn sm" data-a="list" data-i="${f.id}">Change price</button><button class="btn sm ghost" data-a="unlist" data-i="${f.id}">Take off market</button>` : `<button class="btn sm gold" data-a="list" data-i="${f.id}" ${sellable ? "" : "disabled"}>List for sale</button>`}</div></div>
      ${bids.map(bidRow).join("")}</div>`;
  });
  return `<p class="mute" style="margin-top:-6px">List fighters to attract bids from rival agencies. Bids arrive when you press Next week and expire after 3 weeks. Selling pays the full fee to you. Asking far above value scares buyers off.</p>${rows.join("") || '<div class="empty">No fighters to sell.</div>'}`;
}

// ---------- Rankings ----------
export function vRankings() {
  const l = ranks(UI.rk).slice(0, 16);
  return shell(`<h1 style="margin-bottom:14px">Rankings</h1>
    <div class="chips" style="margin-bottom:14px">${DIVISIONS.map((d, i) => `<button class="chip ${UI.rk === i ? "on" : ""}" data-a="rkdiv" data-i="${i}">${d}</button>`).join("")}</div>
    <div class="card"><h2>${DIVISIONS[UI.rk]}</h2><table class="tbl"><thead><tr><th>Rank</th><th></th><th>Fighter</th><th>Record</th><th>Agency</th><th style="text-align:right">OVR</th></tr></thead><tbody>
    ${l.map((f, i) => { const a = agencyOf(f); return `<tr class="click ${f.st === "mine" ? "me" : ""}" data-a="prof" data-i="${f.id}"><td class="rk ${i ? "" : "c"}">${i ? i : "C"}</td><td style="width:50px">${avatar(f, 38)}</td><td><b>${esc(f.name)}</b>${i === 0 ? ' <span class="tag gold">Champion</span>' : ""}</td><td class="num">${rec(f)}</td><td class="small">${f.st === "mine" ? `<span class="warn">${esc(G.ag.name)}</span>` : a ? `<span style="color:${a.col}">${a.short}</span>` : '<span class="good">Free</span>'}</td><td style="text-align:right"><b style="font:700 20px var(--display);color:${ovrCol(ovr(f))}">${ovr(f)}</b></td></tr>`; }).join("")}
    </tbody></table></div><p class="small dim">Starting order follows the UFC rankings of November 2026. Win fights to climb.</p>`);
}

// ---------- Office ----------
export function vOffice() {
  const t = UI.office;
  const tabs = `<div class="seg">${[["fin", "Finances"], ["hist", "History"], ["set", "Settings"], ["cred", "Credits"]].map(([k, n]) => `<button class="${t === k ? "on" : ""}" data-a="oftab" data-i="${k}">${n}</button>`).join("")}</div>`;
  let body = "";
  if (t === "fin") {
    const f = G.fin;
    body = `<div class="grid g2"><div class="card"><h2>Cash over time</h2>${sparkline(G.ch, "var(--green)", kmoney)}</div>
      <div class="card"><h2>Ledger</h2>
        <div class="kv"><span>Balance</span><b class="${G.cash < 0 ? "bad" : ""}">${money(G.cash)}</b></div>
        <div class="kv"><span>Commission from purses</span><b class="good">${money(f.inc)}</b></div>
        <div class="kv"><span>Fighter sales</span><b class="good">${money(f.sales)}</b></div>
        <div class="kv"><span>Transfer fees paid</span><b class="bad">${money(f.buys)}</b></div>
        <div class="kv"><span>All spending (bonuses, fees, gym, office)</span><b class="bad">${money(f.exp)}</b></div>
        <div class="kv"><span>Weekly office costs</span><b>${money(weeklyCost())}</b></div>
        <p class="small mute">Office costs are $1,200 plus $350 per fighter each week. If cash stays below zero for ${WEEKS_IN_RED_LIMIT} weeks in a row, the agency folds.</p></div></div>`;
  } else if (t === "hist") {
    body = `<div class="grid g2"><div class="card"><h2>Results</h2>${G.res.map((r) => `<div class="kv"><span>Wk ${r.wk} · ${esc(r.n)} vs ${esc(r.o)}</span><b class="${r.won ? "good" : "bad"}">${r.won ? "W" : "L"} · ${r.how}</b></div>`).join("") || '<div class="empty small">No fights yet.</div>'}</div>
      <div class="card"><h2>Activity</h2><div class="feed">${G.log.map(logItem).join("")}</div></div></div>`;
  } else if (t === "set") {
    body = `<div class="card" style="max-width:520px"><h2>Settings</h2>
      <label class="f">Volume <b>${Math.round(SND.vol * 100)}%</b></label><input type="range" id="vol" min="0" max="100" value="${SND.vol * 100}">
      <div class="row" style="margin-top:12px"><button class="btn" data-a="snd">Sound: ${SND.on ? "On" : "Muted"}</button></div>
      <div class="sep"></div><p class="small mute">Your career saves automatically after every action.</p>
      <div class="row"><button class="btn" data-a="menu">Main menu</button><button class="btn ghost bad" data-a="abandon">Abandon career</button></div></div>`;
  } else {
    const c = credits();
    body = `<div class="card"><h2>Photo credits</h2><p class="small mute">Fighter photos are from Wikimedia Commons under free licences, cropped to headshots. Fighters without a free photo get a drawn avatar. Fight Manager is an unofficial fan game and isn't affiliated with or endorsed by the UFC or any fighter.</p>
      <table class="tbl small"><tbody>${Object.entries(c).map(([n, p]) => `<tr><td>${esc(n)}</td><td class="mute">${esc(p.artist)}</td><td>${esc(p.license)}</td><td><a href="${p.source}" target="_blank" rel="noopener">Source</a></td></tr>`).join("")}</tbody></table></div>`;
  }
  return shell(`<div class="card-h" style="margin-bottom:14px"><h1>Office</h1>${tabs}</div>${body}`);
}

// ---------- Modals ----------
export function mNegotiate(f) {
  const buy = f.st === "other", fee = buy ? transferFee(f) : 0, ask = askOf(f), ag = agencyOf(f);
  const m = UI.modal; m.cut ??= 20; m.bonus ??= buy ? Math.round(ask * 0.5 / 500) * 500 : Math.round(ask / 500) * 500; m.years ??= 2; m.fee ??= Math.round(fee / 1000) * 1000;
  return modal(`${closeBtn()}<div class="row" style="gap:14px">${avatar(f, 84)}<div><h2 style="font-size:26px">${esc(f.name)}</h2><div class="mute small">${DIVISIONS[f.wc]} · ${rec(f)} · OVR ${ovr(f)} · ${f.pers}</div><div class="small mute">${PERSONALITIES[f.pers]}</div></div></div>
    ${buy ? `<div class="kv" style="margin-top:12px"><span>${ag.name} values him at</span><b>${money(fee)}</b></div>` : ""}
    <div class="kv" style="${buy ? "" : "margin-top:12px"}"><span>His bonus ask</span><b>${money(buy ? ask * 0.5 : ask)}</b></div>
    <div class="kv"><span>Reputation he wants</span><b class="${G.rep >= repNeeded(f) ? "good" : "bad"}">${repNeeded(f)} (you: ${Math.round(G.rep)})</b></div>
    ${buy ? `<label class="f">Transfer fee to ${ag.short} <b id="v-fee">${money(m.fee)}</b></label><input type="range" id="r-fee" min="${Math.round(fee * 0.5 / 1000) * 1000}" max="${Math.round(fee * 1.8 / 1000) * 1000}" step="1000" value="${m.fee}">` : ""}
    <label class="f">Signing bonus to fighter <b id="v-bonus">${money(m.bonus)}</b></label><input type="range" id="r-bonus" min="0" max="${Math.max(2000, Math.round(ask * 2 / 500) * 500)}" step="500" value="${m.bonus}">
    <label class="f">Your cut of his purses <b id="v-cut">${m.cut}%</b></label><input type="range" id="r-cut" min="10" max="35" value="${m.cut}">
    <label class="f">Contract length</label><div class="seg">${[1, 2, 3].map((y) => `<button class="${m.years === y ? "on" : ""}" data-a="nyears" data-i="${y}">${y} year${y > 1 ? "s" : ""}</button>`).join("")}</div>
    <div class="ring" id="ring"><div><b id="v-p">–</b></div></div><div class="small mute" style="text-align:center">chance he says yes</div>
    <div class="kv" style="margin-top:8px"><span>Total cost now</span><b id="v-total"></b></div>
    <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost" data-a="mclose">Walk away</button><button class="btn primary" data-a="offer" data-i="${f.id}">Make offer</button></div>`);
}
export function negUpdate() {
  const m = UI.modal, f = G.f[m.fid];
  const p = m.kind === "renew" ? renewChance(f, m.cut, m.bonus, m.years) : dealChance(f, m.cut, m.bonus, m.years, m.fee || 0);
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set("v-cut", m.cut + "%"); set("v-bonus", money(m.bonus)); set("v-fee", money(m.fee || 0)); set("v-p", Math.round(p * 100) + "%");
  set("v-total", money(m.bonus + (m.fee || 0)));
  const r = document.getElementById("ring");
  if (r) { r.style.setProperty("--p", Math.round(p * 100)); r.style.setProperty("--c", p > 0.65 ? "var(--green)" : p > 0.4 ? "var(--gold)" : "var(--red)"); }
}
export function mRenew(f) {
  const ask = renewalAsk(f), m = UI.modal;
  m.cut ??= f.ct.pct; m.bonus ??= Math.round(ask / 500) * 500; m.years ??= 2;
  return modal(`${closeBtn()}<div class="row" style="gap:14px">${avatar(f, 72)}<div><h2 style="font-size:24px">Renew ${esc(f.name)}</h2><div class="small mute">${f.ct.wks} weeks left · currently ${f.ct.pct}% · ${f.pers}</div></div></div>
    <div class="kv" style="margin-top:12px"><span>Renewal bonus ask</span><b>${money(ask)}</b></div>
    <label class="f">Renewal bonus <b id="v-bonus">${money(m.bonus)}</b></label><input type="range" id="r-bonus" min="0" max="${Math.max(2000, Math.round(ask * 2 / 500) * 500)}" step="500" value="${m.bonus}">
    <label class="f">Your cut <b id="v-cut">${m.cut}%</b></label><input type="range" id="r-cut" min="10" max="35" value="${m.cut}">
    <label class="f">New length</label><div class="seg">${[1, 2, 3].map((y) => `<button class="${m.years === y ? "on" : ""}" data-a="nyears" data-i="${y}">${y} year${y > 1 ? "s" : ""}</button>`).join("")}</div>
    <div class="ring" id="ring"><div><b id="v-p">–</b></div></div><div class="small mute" style="text-align:center">chance he signs</div>
    <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost" data-a="mclose">Not now</button><button class="btn gold" data-a="dorenew" data-i="${f.id}">Offer renewal</button></div>`);
}
export function mList(f) {
  const v = value(f), l = listing(f), m = UI.modal;
  m.ask ??= l ? l.ask : Math.round(v / 1000) * 1000;
  return modal(`${closeBtn()}<div class="row" style="gap:14px">${avatar(f, 72)}<div><h2 style="font-size:24px">Sell ${esc(f.name)}</h2><div class="small mute">OVR ${ovr(f)} · ${rec(f)} · ${f.age}y · ${f.ct.wks} weeks on contract</div></div></div>
    <div class="kv" style="margin-top:12px"><span>Market value</span><b>${money(v)}</b></div>
    <p class="small mute">Value rises with skill, wins, ranking, popularity, youth and contract length. A higher asking price attracts fewer bids.</p>
    <label class="f">Asking price <b id="v-ask">${money(m.ask)}</b></label><input type="range" id="r-ask" min="${Math.round(v * 0.5 / 1000) * 1000}" max="${Math.round(v * 2 / 1000) * 1000}" step="1000" value="${m.ask}">
    <div class="small" id="v-interest" style="margin-top:6px"></div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn ghost" data-a="mclose">Cancel</button><button class="btn gold" data-a="dolist" data-i="${f.id}">${l ? "Update listing" : "Put on transfer list"}</button></div>`);
}
export function listUpdate() {
  const m = UI.modal, f = G.f[m.fid], v = value(f), r = m.ask / v;
  const e = document.getElementById("v-ask"); if (e) e.textContent = money(m.ask);
  const i = document.getElementById("v-interest");
  if (i) i.innerHTML = r <= 0.9 ? '<span class="good">Bargain. Expect several bids quickly.</span>' : r <= 1.1 ? '<span class="good">Fair price. Expect bids within a few weeks.</span>' : r <= 1.4 ? '<span class="warn">Ambitious. Bids will be rare.</span>' : '<span class="bad">Way over value. Almost nobody will bid.</span>';
}
export function mCounter(b) {
  const f = G.f[b.fid], a = AGENCIES[b.ag], m = UI.modal;
  m.amt ??= Math.round(b.amount * 1.15 / 1000) * 1000;
  return modal(`${closeBtn()}<h2 style="font-size:24px">Counter ${a.name}</h2><p class="small mute">They offered ${money(b.amount)} for ${esc(f.name)} (value ${money(value(f))}). They're a ${a.style}. Push too hard and they may walk away.</p>
    <label class="f">Your price <b id="v-amt">${money(m.amt)}</b></label><input type="range" id="r-amt" min="${Math.round(b.amount / 1000) * 1000}" max="${Math.round(b.amount * 1.6 / 1000) * 1000}" step="1000" value="${m.amt}">
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn ghost" data-a="mclose">Cancel</button><button class="btn primary" data-a="docounter" data-i="${b.id}">Send counter</button></div>`);
}
export function mConfirm(title, text, action, id, btn = "Confirm") {
  return modal(`<h2 style="font-size:24px">${title}</h2><p class="mute">${text}</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-a="mclose">Cancel</button><button class="btn primary" data-a="${action}" data-i="${id}">${btn}</button></div>`);
}
export function mInbox() {
  return modal(`${closeBtn()}<h2 style="font-size:24px;margin-bottom:10px">News</h2><div class="feed">${G.log.slice(0, 20).map(logItem).join("")}</div>`, true);
}
export function mWeek(sum) {
  return modal(`<h2 style="font-size:26px">Week ${G.wk}</h2><div class="feed" style="margin-top:8px">${sum.map(logItem).join("") || '<div class="empty small">A quiet week.</div>'}</div>
    <div class="row" style="justify-content:flex-end;margin-top:12px">${G.bids.length ? '<button class="btn green" data-a="go" data-i="market" data-x="desk">See offers</button>' : ""}<button class="btn primary" data-a="mclose">Continue</button></div>`, true);
}
