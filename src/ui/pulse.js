// PULSE screens: the feed (For you / Following / News), a post with its replies, profiles and the composer.
import { G, rank } from "../state.js";
import { esc, last } from "../util.js";
import { avatar } from "./avatar.js";
import { UI } from "./uistate.js";
import { DIVISIONS } from "../data/constants.js";
import { P, now } from "../sim/phone.js";
import * as PU from "../sim/pulse.js";
import { isContact, reach } from "../sim/connect.js";
import { ic, ago, num, face, fullTime, backBar } from "./phone.js";

const tick = (a) => (a.ver ? `<i class="ver ${a.ver === "gold" ? "gold" : ""}" title="Verified"></i>` : "");
const mineF = (fid) => G.f[fid]?.st === "mine";
const visible = () => P().feed.filter((p) => p.t <= now());

// ---------- Media ----------
const fc = (id, s = 44) => avatar(G.f[id], s, "round");
function media(m) {
  if (!m) return "";
  const f = (id) => G.f[id];
  switch (m.k) {
    case "clip": return `<div class="pm clip"><span class="pm-ph">${avatar(f(m.fid), 120)}</span><span class="pm-play">${ic("play")}</span><span class="pm-d">${m.long ? "48:" : "0:"}${String(m.d).padStart(2, "0")}</span></div>`;
    case "vs": return `<div class="pm vs"><span>${fc(m.a, 54)}<b>${esc(last(f(m.a).name))}</b></span><em>VS</em><span>${fc(m.b, 54)}<b>${esc(last(f(m.b).name))}</b></span><small>${DIVISIONS[f(m.a).wc]} · Week ${m.wk}</small></div>`;
    case "res": return `<div class="pm res"><span class="w">${fc(m.w, 54)}<b>${esc(last(f(m.w).name))}</b><i>WIN</i></span><span class="mid"><small>def.</small><b>${m.how}</b><small>R${m.rd}</small></span><span class="l">${fc(m.l, 54)}<b>${esc(last(f(m.l).name))}</b></span></div>`;
    case "poll": { const done = false; return `<div class="pm poll"><div style="--p:${m.pa}%"><b>${esc(last(f(m.a).name))}</b><span>${m.pa}%</span></div><div style="--p:${100 - m.pa}%"><b>${esc(last(f(m.b).name))}</b><span>${100 - m.pa}%</span></div>${done ? "" : ""}</div>`; }
    case "brand": return `<div class="pm brand" style="--c:${(PU.author("br:" + m.brand).col)}"><b>${esc(m.brand)}</b><span>${fc(m.fid, 46)}<small>× ${esc(last(f(m.fid).name))}</small></span></div>`;
  }
  return "";
}

// ---------- Post ----------
function head(p, a) { return `<div class="pp-h"><button class="pp-n" data-a="pprof" data-i="${p.a}"><b>${esc(a.name)}</b>${tick(a)}</button><small class="tm">· ${ago(p.t)}</small></div>`; }
function body(p, big) {
  const a = PU.author(p.a), q = p.q && PU.post(p.q), r = p.kind === "rumour" && PU.rumourOf(p);
  const lbl = p.kind === "news" ? `<span class="pp-lab news">${esc(a.name)} · News</span>` : r ? `<span class="pp-lab rum">Rumour <span class="cred c${r.cred}"><i></i><i></i><i></i></span>${r.out ? `<span class="pill ${r.out === "true" ? "good" : r.out === "false" ? "bad" : "warn"}">${r.out === "true" ? "Confirmed" : r.out === "false" ? "Denied" : "Partly true"}</span>` : ""}</span>` : "";
  return `${q ? `<small class="pp-re">Replying to ${esc(PU.author(q.a).handle)}</small>` : ""}${lbl}<p class="${p.kind === "news" ? "hl" : ""}${big ? " big" : ""}">${esc(p.text)}</p>${media(p.media)}`;
}
const acts = (p) => `<div class="pp-a"><button data-a="ppost" data-i="${p.id}">${ic("reply")}<span>${num(PU.replyCount(p))}</span></button><button class="${p.rt ? "on rt" : ""}" data-a="prt" data-i="${p.id}">${ic("rt")}<span>${num(PU.reposts(p))}</span></button><button class="${p.lk ? "on lk" : ""}" data-a="plike" data-i="${p.id}">${ic("like")}<span>${num(PU.likes(p))}</span></button></div>`;
const row = (p) => { const a = PU.author(p.a); return `<article class="pp ${p.kind} ${p.about.some(mineF) || p.a === "me" ? "mine" : ""}" data-a="ppost" data-i="${p.id}"><button class="pp-av" data-a="pprof" data-i="${p.a}">${face(a, 40)}</button><div class="pp-c">${head(p, a)}${body(p)}${acts(p)}</div></article>`; };

// ---------- Screens ----------
function feed(v) {
  const ph = P(), tab = v.tab || "for", all = visible(), seen = UI.phone.seen ?? 0;
  const follow = (p) => p.a === "me" || p.about.some(mineF) || (p.a.startsWith("f:") && mineF(+p.a.slice(2))) || isContact(p.a);
  const list = all.filter((p) => p.id <= seen && (tab === "for" || (tab === "following" ? follow(p) : ["news", "rumour"].includes(p.kind))));
  const fresh = all.filter((p) => p.id > seen).length;
  const left = PU.postsLeft();
  const bar = `<div class="pu-top"><button class="pu-me" data-a="pprof" data-i="me">${face(PU.author("me"), 30)}</button><b class="pu-logo">PULSE</b><span></span></div>
    <div class="pu-tabs">${[["for", "For you"], ["following", "Following"], ["news", "News"]].map(([k, t]) => `<button class="${tab === k ? "on" : ""}" data-a="ptab" data-i="${k}">${t}</button>`).join("")}</div>`;
  return { bar, body: `${fresh ? `<button class="pu-new" data-a="pnew">↑ ${fresh} new post${fresh > 1 ? "s" : ""}</button>` : ""}${list.slice(0, 60).map(row).join("") || '<div class="ph-empty">Nothing here yet.</div>'}
    <button class="pu-fab" data-a="pcomp" aria-label="New post" title="${left} posts left this week">${ic("plus")}<i>${left}</i></button>` };
}
function thread(id) {
  const p = PU.post(id); if (!p) return { bar: backBar("Post"), body: '<div class="ph-empty">This post was removed.</div>' };
  const a = PU.author(p.a), opts = PU.replyOpts(p), rs = PU.replies(p);
  return {
    bar: backBar("Post"),
    body: `<article class="pp big ${p.kind}"><div class="pp-top"><button class="pp-av" data-a="pprof" data-i="${p.a}">${face(a, 44)}</button><div><button class="pp-n" data-a="pprof" data-i="${p.a}"><b>${esc(a.name)}</b>${tick(a)}</button><small>${esc(a.handle)}</small></div></div>
      ${body(p, true)}<small class="pp-time">${fullTime(p.t)} · <b>${num(PU.likes(p) * 14 + 9)}</b> views</small>${acts(p)}</article>
      ${opts.length ? `<div class="pu-reply"><small>Reply as ${esc(G.ag.name)}</small>${opts.map((o, i) => `<button data-a="prp" data-i="${i}"><b>${esc(o.label)}</b><span>${esc(o.text)}</span></button>`).join("")}</div>` : ""}
      ${rs.map((r) => { const ra = PU.author(r.a); return `<div class="pp rep ${r.a === "me" ? "mine" : ""}"><button class="pp-av" data-a="pprof" data-i="${r.a}">${face(ra, 34)}</button><div class="pp-c"><div class="pp-h"><button class="pp-n" data-a="pprof" data-i="${r.a}"><b>${esc(ra.name)}</b>${tick(ra)}</button><small class="tm">· ${ago(r.t)}</small></div><p>${esc(r.text)}</p></div></div>`; }).join("") || '<div class="ph-empty">No replies yet.</div>'}`,
  };
}
function profile(key) {
  const a = PU.author(key), posts = PU.postsBy(key).slice(0, 25), f = a.f;
  let main = "";
  if (key === "me") main = `<span class="pu-left">${PU.postsLeft()} of ${PU.POSTS_A_WEEK} posts left this week</span>`;
  else if (key.startsWith("f:") || key.startsWith("n:")) {
    if (isContact(key)) main = `<button class="btn gold sm" data-a="pthread" data-i="${key}">Message</button>`;
    else { const r = reach(key); main = r.ok ? `<button class="btn gold sm" data-a="padd" data-i="${key}">Add to CONNECT</button>` : `<span class="pu-lock">${esc(r.why)}</span>`; }
  }
  const stats = f ? `<span><b>${f.w}-${f.l}</b> Record</span><span><b>${rank(f) === 0 ? "C" : rank(f) > 0 && rank(f) <= 15 ? "#" + rank(f) : "NR"}</b> ${DIVISIONS[f.wc]}</span>` : "";
  return {
    bar: backBar(esc(a.name), posts.length + (posts.length === 1 ? " post" : " posts")),
    body: `<div class="pu-prof"><div class="pu-banner" style="--c:${a.col || "#333"}"></div><div class="pu-pav">${face(a, 74)}</div><div class="pu-pact">${main}</div>
      <b class="pu-pn">${esc(a.name)}${tick(a)}</b><small>${esc(a.handle)}</small><p>${esc(a.bio || "")}</p>
      <div class="pu-stats">${stats}<span><b>${num(a.fol || 0)}</b> Followers</span></div></div>
      ${posts.map(row).join("") || '<div class="ph-empty">No posts yet.</div>'}`,
  };
}
function composer(c) {
  const left = PU.postsLeft(), bar = backBar("New post", `${left} of ${PU.POSTS_A_WEEK} left this week`);
  if (left <= 0) return { bar, body: '<div class="ph-empty">You\'ve posted enough this week. Followers get tired of agencies that never stop talking. More next week.</div>' };
  if (!c.k) return { bar, body: `<div class="ph-sub">What do you want to say?</div>${PU.composeKinds().map((k) => `<button class="pu-kind ${k.ok ? "" : "off"} ${k.k === "contro" ? "hot" : ""}" ${k.ok ? `data-a="pck" data-i="${k.k}"` : "disabled"}><b>${esc(k.t)}</b><small>${esc(k.ok ? k.s : k.why)}</small></button>`).join("")}` };
  const need = PU.needs(c.k).find((n) => c.sel[n] == null);
  if (need) {
    const q = { fid: "Which fighter?", oid: "Call out who?", b: "Which fight?", ag: "Which agency?", cid: "Which story?" }[need];
    return { bar, body: `<div class="ph-sub">${q}</div><div class="pu-chips">${PU.targets(c.k, c.sel).map((t) => `<button data-a="ptg" data-i="${t.v}"><b>${esc(t.label)}</b><small>${esc(t.sub)}</small></button>`).join("") || '<div class="ph-empty">Nobody fits right now.</div>'}</div>` };
  }
  const me = PU.author("me");
  return { bar, body: `<div class="ph-sub">Pick the one you'll post. Bolder posts travel further, and make more enemies.</div>${PU.drafts(c.k, c.sel).map((d, i) => `<button class="pu-draft t${i}" data-a="pcpub" data-i="${i}"><span class="pu-dh">${face(me, 26)}<b>${esc(me.name)}</b><em>${esc(d.tone)}</em></span><span>${esc(d.text)}</span></button>`).join("")}` };
}
export function pulseScreen(v) {
  if (v.post != null) return thread(v.post);
  if (v.prof) return profile(v.prof);
  if (v.cmp) return composer(v.cmp);
  return feed(v);
}
