// Phone content: news, social posts, rumours, messages and business offers.
// STARTER SET (2026-11-21): deliberately small. TODO: grow towards ~100 news, 150 rumours, 200 social,
// 100 messages, 50 business offers. To add content, add a line to the right list; {placeholders} are filled
// from the game (see fill() in src/sim/phone.js). Pickers avoid repeating a line for several weeks.
//
// Placeholders: {f} fighter, {fl} his surname, {o} opponent, {ol} surname, {div} division, {how} result,
// {rd} round, {rk} rank label, {ag} rival agency, {me} your agency, {n} contact name, {amt} money, {brand} brand.

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
  signing: ["{me} signs {f}", "{f} joins {me}", "Signed: {f} picks {me} as his new management"],
  bought: ["{me} buys {f} from {ag}", "Transfer: {f} leaves {ag} for {me}"],
  sold: ["{f} joins {ag} from {me}", "Transfer: {ag} lands {f}"],
  booking: ["Official: {f} vs {o} is set", "{fl} vs {ol} confirmed for week {amt}"],
  retire: ["{f} announces his retirement", "End of an era: {fl} hangs up the gloves"],
  released: ["{ag} releases {f}", "{f} becomes a free agent"],
  rumourTrue: ["Confirmed: {txt}", "It's true: {txt}"],
  rumourFalse: ["Denied: {txt}", "Nothing to it: {txt}"],
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
  broken: { _: ["You said you'd book me. Nothing. 👎", "Two weeks, you said. Still waiting."], Hotheaded: ["You LIED to me. No fight. Nothing."], Loyal: ["I know you're busy. But you promised."] },
  fightweek: { _: ["Fight week. Weight's on track. Let's go.", "{ol} is in trouble. I feel sharp.", "Couple of days out. Nerves are good nerves."], Hotheaded: ["Can't wait to shut {ol} up. Can't WAIT."], Professional: ["On weight, game plan locked in. Ready."], Easygoing: ["Fight week vibes 😎 Feeling loose."], Inconsistent: ["Some days I feel unbeatable, some days... ready either way."] },
  unfair: { _: ["Can we talk about my contract? Doesn't feel fair anymore.", "I've been thinking. My deal isn't right for where I am now."], Demanding: ["Let's be honest: I'm underpaid. Fix it."], Loyal: ["Not trying to be difficult, but the contract's been bugging me."] },
  checkin: { _: ["Training's good. Just saying hi 👊", "Watched some tape of the division. Lot of guys I can beat.", "Coach says I'm moving better than ever."], Easygoing: ["Yo boss 😎 all good this side.", "Just had the best burrito of my life. That's the update."], Ambitious: ["Who's ranked above me that's free? Asking for me.", "When do I get a ranked guy? Not complaining. Yet."], Professional: ["Weekly update: weight good, cardio up, no knocks.", "Sparring went well. Ready when you need me."], Hotheaded: ["Somebody at the gym said I'm overrated. He's not saying it anymore."] },
  teammate: { _: ["Huge win for {amt}! Team's on fire 🔥", "{amt} looked great. I'm next."], Ambitious: ["Nice one for {amt}. Now get ME a fight like that."], Loyal: ["So proud of {amt}. Best team in the sport."] },
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
  broken: [["You're right. I'm sorry.", 4, ""], ["It's harder than it looks", -2, ""]],
  fightweek: [["You've got this", 4, ""], ["Stick to the game plan", 2, "prep"], ["Make some noise online", 1, "hype"]],
  unfair: [["OK, my cut drops 5%", 12, "cut"], ["Let's talk renewal", 3, "renew"], ["A deal is a deal", -10, ""]],
  checkin: [["Keep it up 💪", 3, ""], ["Good. Stay ready.", 1, "prep"]],
  teammate: [["You're next. Promise.", 3, "promise"], ["Great team 🙌", 2, ""]],
};
// How fighters answer your replies. good / ok / bad by how it landed; again = you asked twice this week.
export const ACK = {
  good: { _: ["🙏", "Appreciate it boss.", "Thanks. Means a lot.", "👍"], Hotheaded: ["LET'S GO 🔥", "That's what I'm talking about!"], Professional: ["Thank you. Noted.", "Appreciated."], Easygoing: ["Legend 😎", "Love that 🙌"], Demanding: ["About time.", "Good. That's more like it."] },
  ok: { _: ["Got it.", "OK boss.", "Understood."], Hotheaded: ["Fine.", "Whatever you say."], Easygoing: ["Cool cool 👍", "No worries."] },
  bad: { _: ["...", "OK.", "Right.", "If you say so."], Hotheaded: ["Are you serious right now?", "Unbelievable."], Loyal: ["OK. That hurts a bit.", "I thought we were a team."], Demanding: ["We'll see about that.", "Noted. And remembered."] },
  again: { _: ["We just talked about this 😅", "Same as I said earlier, boss."], Hotheaded: ["You asked me that already!"] },
};
// What fighters say when you message them. Picked by topic and mood (low / ok / high).
export const ASK = {
  training: { low: ["It's fine.", "Same as always."], ok: ["Camp's going well. Cardio's up.", "Working on my wrestling."], high: ["Best camp of my life! 💪", "I feel unstoppable right now."] },
  fight: { low: ["You tell me. You're the manager.", "Still waiting."], ok: ["Ready when you are.", "Whoever. Just book it."], high: ["Get me someone ranked!", "I'll fight anyone you put in front of me."] },
  goals: { low: ["Honestly? Not sure I'm in the right place.", "Getting paid. That's it."], ok: ["Top 15 by next year.", "Build my record, then go for a run."], high: ["The belt. Nothing less.", "I want to be the best in the world."] },
  money: { low: ["I'm not happy with the money.", "Other guys earn more than me."], ok: ["Money's fine for now.", "Could be better, could be worse."], high: ["You've looked after me. All good.", "No complaints!"] },
};
export const TOPICS = [["training", "How's training?"], ["fight", "Ready for a fight?"], ["goals", "What are your goals?"], ["money", "Happy with the money?"]];

