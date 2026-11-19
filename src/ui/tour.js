// First-career guided tour: spotlights one part of the screen at a time.
import { G } from "../state.js";
import { UI } from "./uistate.js";

export const STEPS = [
  { view: "home", title: "Welcome to Fight Manager", text: "You run a fight agency. Sign fighters, get them fights, train them, and sell them when the price is right. This quick tour shows you where everything is." },
  { view: "home", sel: '[data-tut="todo"]', title: "This week", text: "Everything that needs you shows up here: fights to book, offers to answer, contracts running out. Work down the list." },
  { view: "home", sel: '[data-tut="cash"]', title: "Cash and reputation", text: "Your agency pays office costs every week. Stay above $0. Reputation goes up when you win and decides which fighters will sign with you." },
  { view: "fighters", sel: '[data-tut="roster"]', title: "Your fighters", text: "You start with three young prospects. Click any fighter to see his profile, sponsors and contract." },
  { view: "fights", sel: '[data-tut="seek"]', title: "Book fights", text: "Fights earn you a cut of the purse. Ask for opponents, then accept the one you like. Harder opponents pay more." },
  { view: "gym", sel: '[data-tut="autotrain"]', title: "Training", text: "Pick a skill and train it, or switch on auto-train and the gym works each fighter's weakest skill every week." },
  { view: "market", sel: '[data-tut="market-tabs"]', title: "The market", text: "Sign free agents, buy fighters from rival agencies, and under Sell, list your own fighters. Rivals send offers each week." },
  { view: "office", office: "set", sel: '[data-tut="analyst"]', title: "Analyst Mode", text: "Want every number? Switch on Analyst Mode here for exact skills, UFC stats, stamina, momentum and market maths." },
  { view: "home", sel: '[data-tut="next"]', title: "Next week", text: "When you're done for the week, press Next week (or the N key). Fights happen on their booked week. Good luck." },
];

export const tourActive = () => G && G.tour >= 0 && G.tour < STEPS.length && !UI.modal && !["menu", "setup", "fight"].includes(UI.view);

export function drawTour() {
  document.querySelectorAll(".tour-hole,.tour-tip").forEach((e) => e.remove());
  if (!tourActive()) return;
  const s = STEPS[G.tour];
  if (UI.view !== s.view) return;
  const tgt = s.sel && document.querySelector(s.sel);
  const tip = document.createElement("div");
  tip.className = "tour-tip";
  tip.innerHTML = `<h3>${s.title}</h3><p>${s.text}</p><div class="row"><span class="dots">${G.tour + 1} / ${STEPS.length}</span><div class="row"><button class="btn link" data-a="tourskip">Skip tour</button><button class="btn red sm" data-a="tournext">${G.tour === STEPS.length - 1 ? "Let's go" : "Next"}</button></div></div>`;
  document.body.appendChild(tip);
  if (!tgt) { tip.style.left = "50%"; tip.style.top = "50%"; tip.style.transform = "translate(-50%,-50%)"; return; }
  tgt.scrollIntoView({ block: "center", behavior: "instant" });
  const r = tgt.getBoundingClientRect(), pad = 6;
  const hole = document.createElement("div");
  hole.className = "tour-hole";
  Object.assign(hole.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
  document.body.appendChild(hole);
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let top = r.bottom + 16;
  if (top + th > innerHeight - 10) top = Math.max(10, r.top - th - 16);
  const left = Math.min(Math.max(12, r.left + r.width / 2 - tw / 2), innerWidth - tw - 12);
  Object.assign(tip.style, { left: left + "px", top: top + "px" });
}
