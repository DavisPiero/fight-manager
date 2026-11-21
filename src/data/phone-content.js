// Phone content: news, social posts, rumours, messages and business offers.
// STARTER SET (2026-11-21): deliberately small. TODO: grow towards ~100 news, 150 rumours, 200 social,
// 100 messages, 50 business offers. To add content, add a line to the right list; {placeholders} are filled
// from the game (see fill() in src/sim/phone.js). Pickers avoid repeating a line for several weeks.
//
// Placeholders: {f} fighter, {fl} his surname, {o} opponent, {ol} surname, {div} division, {how} result,
// {rd} round, {rk} rank label, {ag} rival agency, {me} your agency, {n} contact name, {amt} money, {brand} brand.

// People you can meet. They join Contacts when the condition is first met.
export const NPCS = {
  promo: { name: "Marco Vitale", role: "Matchmaker", col: "#d20a0a", ini: "MV" },
  press: { name: "Kate Ruiz", role: "Reporter, Cageside Report", col: "#e8c46a", ini: "KR" },
  media: { name: "Tom Hale", role: "Host, Fight Talk podcast", col: "#9b6cff", ini: "TH" },
  gym: { name: "Sasha Ivanova", role: "Owner, Northside Combat Club", col: "#2fbf71", ini: "SI" },
  brand: { name: "Dev Mehta", role: "Partnerships, Redline Energy", col: "#ff8a3d", ini: "DM" },
  scout: { name: "Luis Ortega", role: "Talent scout", col: "#4c8dff", ini: "LO" },
};
export const JOURNALISTS = [["Kate Ruiz", "@CagesideKate"], ["Ben Okafor", "@BenOnTheBeat"], ["Mia Lindqvist", "@MiaMMA"], ["Raj Sood", "@SoodScoops"]];
export const FANS = ["@octagon_oracle", "@jabjabcross", "@sprawl_n_brawl", "@ringside_rita", "@gnp_gary", "@legkick_larry", "@rnc_rachel", "@thecountpunch"];

export const NEWS = {
  myWin: [
    "{f} beats {o} by {how}", "{f} gets past {o} ({how})", "{me} fighter {fl} too good for {ol}", "{fl} stays busy with {how} win over {ol}",
  ],
  myKO: ["{f} flattens {o} in round {rd}", "Lights out: {fl} stops {ol} in round {rd}", "{fl} produces knockout of the night against {ol}"],
  mySub: ["{f} taps {o} in round {rd}", "{fl} submits {ol}, calls for a step up"],
  myLoss: ["{o} hands {f} a {how} loss", "Setback for {me} as {fl} falls to {ol}", "{ol} spoils {fl}'s night"],
  title: ["NEW CHAMPION: {f} takes the {div} belt", "{f} is the {div} champion", "{me} has a champion: {fl} dethrones {ol}"],
  aiKO: ["{f} stops {o} in a {div} thriller", "{fl} knocks out {ol}", "Brutal finish: {fl} over {ol}"],
  aiWin: ["{f} edges {o} on the scorecards", "{fl} outworks {ol} over three rounds"],
  aiTitle: ["{f} wins the {div} title from {o}", "Changing of the guard: {fl} is the new {div} champ"],
  injury: ["{f} out for {amt} weeks after injury", "{fl} sidelined with an injury"],
  signing: ["{me} signs {f}", "{f} joins {me}"],
  booking: ["Official: {f} vs {o} is set", "{fl} vs {ol} confirmed for week {amt}"],
  retire: ["{f} announces his retirement", "End of an era: {fl} hangs up the gloves"],
  released: ["{ag} releases {f}", "{f} becomes a free agent"],
  rumourTrue: ["Confirmed: {txt}", "It's true: {txt}"],
  rumourFalse: ["Denied: {txt}", "Nothing to it: {txt}"],
};

export const SOCIAL = {
  winSelf: ["Told you. {ol} wasn't ready. 🏆", "Hard work pays. Thank you {me} 🙏", "Next. Who's up?", "That's what happens when you train like I train.", "God is good. Back to the gym Monday."],
  lossSelf: ["Not my night. I'll be back better.", "No excuses. Respect to {ol}.", "Losing teaches you more than winning. Back to work."],
  fanWin: ["{fl} is the real deal", "{fl} looked SHARP tonight", "Somebody give {fl} a ranked opponent already", "{ol} got cooked 😭"],
  fanKO: ["DID YOU SEE THAT {fl} FINISH?!", "{ol} is still asleep", "KO of the year contender. {fl} is scary."],
  fanLoss: ["{fl} needs a new game plan honestly", "Overrated. Said it before.", "Tough night for {fl}. He'll bounce back."],
  journalist: ["{fl} is quietly building something at {me}.", "Scouts I've spoken to love {fl}'s pace.", "Hearing {ol}'s camp wants an immediate rematch with {fl}."],
  callout: ["@{fl} you got lucky. Run it back? I'm not going anywhere.", "{fl} is all hype. Put me in front of him.", "I see {fl} talking. Sign the contract.", "{fl} doesn't want this smoke. Ask his manager."],
  reply: ["Keep my name out your mouth, {ol}. Book it.", "Get in line, {ol}.", "😂 Sure. Tell your manager to call mine."],
  training: ["Camp mode. 🥊", "Two-a-days. No days off.", "New coach, new tricks.", "Sparring went crazy today", "Cutting weight is the real fight."],
  agency: ["Proud to represent {f}. Big things coming.", "{ag} welcomes {f} to the family.", "Our roster is stacked this year."],
  unhappy: ["Sometimes you wonder who's in your corner...", "Been ready for months. Waiting on a phone call.", "Loyalty goes both ways."],
};

// Rumours: kind decides what happens if it comes true. cred: 0 low, 1 medium, 2 high.
export const RUMOURS = {
  poach: ["{ag} is said to be preparing an offer for {f}", "Word is {ag} has made contact with {fl}'s camp"],
  injury: ["{f} reportedly hurt in camp", "Sources say {fl} has been training through an injury"],
  matchup: ["The promotion wants {f} vs {o} next", "{fl} vs {ol} is being discussed"],
  released: ["{ag} may cut {f} loose", "{f}'s time at {ag} could be over"],
  retire: ["{f} is thinking about retirement", "Friends say {fl} is close to walking away"],
  unhappy: ["{f} is unhappy with his management", "{fl} has complained about a lack of fights"],
};
export const SOURCES = [["an anonymous forum post", 0], ["a fan account", 0], ["a gym source", 1], ["a podcast guest", 1], ["@SoodScoops", 2], ["@CagesideKate", 2]];

// Fighter messages. Lines can vary by personality; "_" is the default.
export const MSG = {
  injured: { _: ["Doc says {amt} weeks out. Gutted.", "Bad news boss. Picked up an injury, {amt} weeks."], Hotheaded: ["This injury is killing me. {amt} weeks?! I want to fight NOW."], Professional: ["Injury, {amt} weeks. I'll follow the rehab plan to the letter."] },
  idle: { _: ["Any news on my next fight?", "Been a while since I fought. What's the plan?"], Hotheaded: ["I'm going crazy here. GET ME A FIGHT."], Ambitious: ["I didn't sign to sit around. I want ranked guys."], Easygoing: ["No rush, but a fight would be nice soon 🙂"] },
  contract: { _: ["My contract's up in {amt} weeks. Are we doing this again?"], Loyal: ["Contract's nearly done. I want to stay, just say the word."], Ambitious: ["Contract's almost up. Other agencies are calling. Make it worth my while."] },
  win: { _: ["WE DID IT 🔥", "Told you I'd get it done!", "Thanks for the corner tonight boss."], Professional: ["Good win. I saw things to fix already."] },
  loss: { _: ["Sorry boss. I let you down.", "That one hurts. I'll be back."], Hotheaded: ["I was robbed. I want a rematch."], Professional: ["I'll study the tape tonight."] },
  payrise: { _: ["I'm winning. I think I deserve a bigger share."], Demanding: ["Let's be real: I'm carrying this agency. I want a better cut."] },
  personal: { _: ["Family stuff at home. Can I take a week off?", "Need a few days. Personal things."] },
  recruit: { _: ["Heads up: {ag} called me. Said they'd treat me better.", "{ag} reached out. Just so you know."] },
  title: { _: ["CHAMPION!!! We did it. I'll never forget this."] },
};
// Replies to fighter messages: [label, mood change, effect key]. Effects are applied in src/sim/phone.js.
export const REPLIES = {
  injured: [["Rest up, no rush", 6, ""], ["I'll pay for the best physio ($3k)", 8, "physio"], ["We need you back fast", -8, ""]],
  idle: [["Booking you this week", 6, "promise"], ["Be patient, the right fight is coming", 0, ""], ["You need to earn it", -6, ""]],
  contract: [["Let's talk renewal", 4, "renew"], ["Prove yourself first", -8, ""]],
  win: [["Proud of you. Enjoy it.", 6, ""], ["Celebrate tonight, back Monday", 4, "party"], ["Good. Back to work.", 1, "prep"]],
  loss: [["Head up. We go again.", 7, ""], ["Let's fix it in camp", 3, "prep"], ["That wasn't good enough", -7, ""]],
  payrise: [["OK, my cut drops 5%", 14, "cut"], ["Here's a $5k bonus", 9, "bonus"], ["Not right now", -12, ""]],
  personal: [["Take the week", 8, "rest"], ["We need you in the gym", -9, ""]],
  recruit: [["You're worth more here. I'll prove it.", 5, ""], ["Listen if you want", -5, "listen"]],
  title: [["You earned every second of it", 8, ""], ["Now we defend it", 3, "prep"]],
};
// What fighters say when you message them. Picked by topic and mood (low / ok / high).
export const ASK = {
  training: { low: ["It's fine.", "Same as always."], ok: ["Camp's going well. Cardio's up.", "Working on my wrestling."], high: ["Best camp of my life! 💪", "I feel unstoppable right now."] },
  fight: { low: ["You tell me. You're the manager.", "Still waiting."], ok: ["Ready when you are.", "Whoever. Just book it."], high: ["Get me someone ranked!", "I'll fight anyone you put in front of me."] },
  goals: { low: ["Honestly? Not sure I'm in the right place.", "Getting paid. That's it."], ok: ["Top 15 by next year.", "Build my record, then go for a run."], high: ["The belt. Nothing less.", "I want to be the best in the world."] },
  money: { low: ["I'm not happy with the money.", "Other guys earn more than me."], ok: ["Money's fine for now.", "Could be better, could be worse."], high: ["You've looked after me. All good.", "No complaints!"] },
};
export const TOPICS = [["training", "How's training?"], ["fight", "Ready for a fight?"], ["goals", "What are your goals?"], ["money", "Happy with the money?"]];

// Business offers. npc: who sends it. Each has its own effect in src/sim/phone.js.
export const BUSINESS = {
  media: { npc: "media", title: "Podcast appearance", text: ["Want {fl} on Fight Talk this week? We pay {amt}.", "Big episode coming. {fl} would be perfect. {amt} for an hour."] },
  commercial: { npc: "brand", title: "Commercial shoot", text: ["We'd love {fl} in our next ad. {amt}, one day of filming.", "Shoot a commercial with {fl}? {amt}."] },
  promoter: { npc: "promo", title: "Fight offer", text: ["I can put {fl} against {ol} in week {wk}. Purse {amt}.", "Short notice: {fl} vs {ol}, week {wk}, {amt} purse. Fans want it."] },
  gym: { npc: "gym", title: "Gym partnership", text: ["Train your team at Northside for a season. {amt}, and every fighter gets sharper.", "Partnership offer: {amt} up front, my coaches work with all your guys."] },
  request: { npc: "scout", title: "Fighter wants to sign", text: ["{f} ({div}) wants to join {me}. He'd sign for {amt}.", "I found {f}. He's heard good things and would sign for {amt}."] },
  buyout: { npc: "", title: "Buy-out offer", text: ["{ag} offers {amt} for {f}'s management contract.", "{ag} wants {f}. Their offer: {amt}."] },
};
