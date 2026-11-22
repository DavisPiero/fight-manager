// PULSE: the social and news network of the game's MMA world (owned by Cageside Media).
// Lines are templates; {placeholders} are filled by fill() in src/sim/phone.js. Lines keyed by personality
// fall back to "_". Pickers avoid repeating a line for several weeks, so add lines freely.

export const OUTLETS = {
  pulse: { name: "PULSE News", handle: "@PULSEnews", col: "#e01313", ini: "P", bio: "Breaking MMA news from Cageside Media." },
  report: { name: "Cageside Report", handle: "@CagesideReport", col: "#e8c46a", ini: "CR", bio: "Results, rankings and the stories behind them." },
  odds: { name: "Overtime Odds", handle: "@OvertimeOdds", col: "#ffb347", ini: "OT", bio: "Lines, picks and upsets. 18+. Gamble responsibly." },
};
export const FANS = ["octagon_oracle", "jabjabcross", "sprawl_n_brawl", "ringside_rita", "gnp_gary", "legkick_larry", "rnc_rachel", "thecountpunch", "cardio_king", "elbow_eddie", "kimura_kat", "southpaw_sam", "mma_dad_94", "clinchqueen", "spinning_steve", "judge_hater", "takedown_tina", "fightweek_fred", "liverkick_lou", "tapout_tara"];

// Fighters posting on their own. By personality.
export const FPOST = {
  training: {
    _: ["Camp mode. 🥊", "Two-a-days. No days off.", "Sparring went crazy today.", "New week, same grind.", "Recovery day. Ice bath and film.", "Early run before the city wakes up."],
    Hotheaded: ["Broke a pad today. Somebody's getting HURT.", "I'm in the best shape of my life and NOBODY wants it.", "Sparring partners keep quitting on me 😤"],
    Professional: ["Good session. Footwork, then two hours of film.", "Small details win fights. Back at it tomorrow.", "Weight on target. Body feels good."],
    Ambitious: ["Every rep is for the belt.", "Top 5 mindset. Every single day.", "They'll know my name by the end of the year."],
    Easygoing: ["Good vibes at the gym today 😎", "Sweat, laugh, repeat.", "Coach made us do burpees for being late. Worth it."],
    Loyal: ["Proud of this team. Same gym since day one.", "Grinding with my brothers. 🙏"],
    Demanding: ["Working harder than anyone in this division. Remember that at contract time.", "Trained 6 hours today. Others trained 2."],
    Inconsistent: ["Some days you're the hammer.", "Felt off today. Tomorrow will be better."],
  },
  styleLine: {
    Boxer: ["Pads with coach. Hands are fast this camp.", "1000 jabs before breakfast."], Kickboxer: ["Shins are ready. Kicking pads till my legs went numb.", "Head kick drills all morning."],
    Wrestler: ["Drilling doubles until I can't feel my arms.", "Chain wrestling. If you stand up, I take you down again."], "BJJ": ["Six rounds of rolling. Tapped everyone. 🙏", "New choke. Can't wait to show you."],
    "Muay Thai": ["Clinch work and elbows. Old school.", "Teeps, knees, elbows. Repeat."], _: ["Mixing it all up this camp.", "Strike, shoot, scramble. Repeat."],
  },
  personal: {
    _: ["Back home in {home} for a few days. Missed this place.", "Family day. Phone off after this. ❤️", "Birthday dinner with the team. Feeling blessed.", "Visited my old school today. Told the kids to stay hungry.", "Charity training session this weekend. Come say hi!", "Rest day = pizza day 🍕", "Thank you for all the messages this week."],
    Hotheaded: ["People online are brave. Say it to my face.", "Don't test me today."],
    Loyal: ["Shoutout {me}. Real ones."],
  },
  win: {
    _: ["Told you. {ol} wasn't ready. 🏆", "Hard work pays. Thank you {me} 🙏", "Next. Who's up?", "God is good. Back to the gym Monday.", "That's what happens when you train like I train."],
    Hotheaded: ["WHO'S NEXT?! Nobody in this division can stand with me!", "{ol} talked a lot. Where's the talk now?"],
    Professional: ["Good performance. Respect to {ol}. Lots to work on.", "Executed the game plan. Thank you to my team."],
    Ambitious: ["One step closer to the belt.", "Put me in with a ranked guy next. I'm ready."],
  },
  loss: {
    _: ["Not my night. I'll be back better.", "No excuses. Respect to {ol}.", "Losing teaches you more than winning. Back to work."],
    Hotheaded: ["Bad decision. Everyone saw it. Rematch.", "I'll see {ol} again. Count on it."],
    Professional: ["Back to the drawing board. Congratulations to {ol}.", "Learned a lot tonight. I'll be back."],
  },
  unhappy: { _: ["Sometimes you wonder who's in your corner...", "Been ready for months. Waiting on a phone call.", "Loyalty goes both ways.", "Not everyone who calls themselves your team acts like it."] },
};

// Beef between fighters. callout from one, answer from the other (by personality).
export const BEEF = {
  callout: {
    _: ["@{ol} you got lucky last time. Run it back?", "{ol} is all hype. Put me in front of him.", "I see {ol} talking. Sign the contract.", "{ol} doesn't want this smoke. Ask his manager.", "Somebody tell {ol} the division has a new problem."],
    Hotheaded: ["{ol} I will END your career. Sign it.", "Keep hiding {ol}. Everybody sees it."],
    Professional: ["Respectfully, {ol} is the fight that makes sense next.", "{ol} and I are both ranked and free. Let's make it."],
  },
  answer: {
    _: ["Keep my name out your mouth, {ol}. Book it.", "Get in line, {ol}.", "😂 Sure. Tell your manager to call mine.", "Who?", "I don't fight people from the prelims, {ol}."],
    Hotheaded: ["Say that to my face {ol}. ANY day.", "You're done, {ol}. Done."],
    Professional: ["If the promotion wants it, I'll be there.", "No need for the noise. Send the contract."],
    Easygoing: ["Haha OK {ol}. Sure, why not.", "Love the energy. Let's do it."],
  },
};

// Journalists and outlets.
export const NEWSP = {
  scoop: ["Sources: {f} vs {o} is being targeted for a card later this year.", "Hearing {f} has turned down an opponent this month.", "{f} is reportedly in talks to switch camps.", "{ag} is building a big push around {f}, per sources."],
  preview: ["Fight week: {f} vs {o}. My pick: {pick}.", "Breakdown: {fl}'s pressure vs {ol}'s counters. Should be a fun one.", "Keep an eye on {f} vs {o}. Sleeper fight of the night."],
  hot: ["Hot take: {f} is overrated and the next fight will prove it.", "Nobody is talking enough about {f}. Top 5 talent.", "{f}'s cardio is the most underrated weapon in the {div} division.", "Watched {fl}'s last three fights back to back. Trouble for the division."],
  agency: ["{me} is quietly building one of the better rosters out there.", "{me}'s matchmaking has been sharp this year.", "Is {me} moving too fast? Lots of fights, not many big ones."],
};

// Fans.
export const FANP = {
  hype: ["{fl} is the real deal", "{fl} looked SHARP", "Somebody give {fl} a ranked opponent already", "Can't wait for {fl} vs {ol} 🍿", "{fl} by KO. Book it.", "My money's on {ol}, sorry {fl} fans"],
  ko: ["DID YOU SEE THAT {fl} FINISH?!", "{ol} is still asleep", "KO of the year contender. {fl} is scary.", "Rewound it 10 times. Brutal."],
  win: ["{fl} looked good tonight", "{ol} got cooked 😭", "Clean performance from {fl}", "{fl} is climbing fast"],
  loss: ["{fl} needs a new game plan honestly", "Overrated. Said it before.", "Tough night for {fl}. He'll bounce back.", "{ol} exposed {fl}'s defence"],
  poll: ["Who wins: {fl} or {ol}? 👇", "{fl} vs {ol}. Pick one.", "Real ones know who wins {fl} vs {ol}"],
  reply: ["This 👆", "Facts", "Nah you're wrong", "😂😂😂", "Ratio", "Big if true", "Hold this L", "Respectfully, no", "Saying this since day one", "🔥🔥🔥", "Who asked", "Source?", "W", "Let him cook"],
  replyMine: ["Love this", "Let's gooo", "{me} doing big things", "Facts 🔥", "Bring it on", "This guy gets it", "Bold. I like it.", "Cringe ngl", "Someone's confident 😂"],
};

// Drama. Each kind: a headline, how fans react, and what it's called in messages ({txt}).
export const DRAMA = {
  weight: { txt: "missed weight", h: ["{f} misses weight by 2.5 lbs. Fight goes ahead at a catchweight.", "Scale fail: {f} comes in heavy."] },
  brawl: { txt: "hotel scuffle", h: ["{f} and {o} had to be separated in the hotel lobby. Security stepped in.", "Things got heated: {f} and {o} in a shoving match at the hotel."] },
  posts: { txt: "old posts", h: ["Old posts from {f} resurface. Fans are not happy.", "{f} under fire after years-old posts go viral."] },
  judges: { txt: "rant about the judges", h: ["{f} blasts the judges in a 10-minute live stream.", "{f}: 'The judges should be fired.' The commission is not amused."] },
  party: { txt: "night out", h: ["{f} spotted at a club at 4am, three weeks before fight night.", "Party pics of {f} go viral during camp."] },
};
// Ways to answer a controversy about your fighter. [label, line, pop change, mood change, sponsors at risk]
export const CONTRO_REPLY = [
  ["Apologise", "{fl} and the team apologise. We've talked about it and we'll do better.", 1, -3, 0],
  ["Defend him", "Leave {fl} alone. Context matters and he's a good man.", 0, 6, 1],
  ["Lean into it", "Love him or hate him, you're all watching {fl}. 🍿", 3, 3, 2],
];

// What you can post. Each has three tones: [label, line]. Picked by the composer in src/ui/pulse.js.
export const COMPOSE = {
  promote: {
    t: "Promote a fight", s: "Build hype for a booked fight",
    tones: [["Classy", ["{fl} vs {ol}, week {wk}. Two of the best. Don't miss it.", "Week {wk}: {fl} vs {ol}. Respect to {ol}. May the best man win."]], ["Bold", ["{fl} vs {ol}. Week {wk}. Somebody's going to sleep. 🍿", "Mark your calendars. {fl} vs {ol}, week {wk}. Our man is ready."]], ["Savage", ["{ol} signed the worst contract of his life. Week {wk}. 🪦", "Week {wk}, {fl} retires {ol}. You heard it here."]]],
  },
  callout: {
    t: "Call someone out", s: "Challenge a fighter for one of yours",
    tones: [["Classy", ["{fl} vs {ol} makes sense for everyone. Let's make it happen.", "Respectfully, {ol}: {fl} wants the fight. We're ready when you are."]], ["Bold", ["{ol} has been ducking {fl} for months. Sign it.", "{fl} is ready for {ol}. Is {ol} ready for {fl}? 👀"]], ["Savage", ["{ol} is scared of {fl} and everybody knows it. 🐔", "{fl} would finish {ol} in one round. Prove me wrong."]]],
  },
  hype: {
    t: "Hype a fighter", s: "Big up one of yours",
    tones: [["Classy", ["Proud to manage {f}. Hardest worker I know.", "{fl} has been putting in the work. Big things coming."]], ["Bold", ["{fl} is the most dangerous {div} in the world. Not a joke.", "Remember the name {f}. You'll be hearing it a lot."]], ["Savage", ["{fl} would beat half the top 10 tomorrow. The other half next week.", "The {div} division is scared of {fl}. As they should be."]]],
  },
  defend: {
    t: "Back a fighter", s: "Stand by one of yours after a loss",
    tones: [["Classy", ["One night doesn't define {fl}. We go again. 🙏", "Proud of {fl} win or lose. He'll be back."]], ["Bold", ["{fl} will be back and better. Mark my words.", "Write {fl} off at your own risk."]], ["Savage", ["Everyone dunking on {fl} has never been punched in their life.", "That decision was a joke and everyone saw it. {fl} won that fight."]]],
  },
  contro: { t: "Address the controversy", s: "Say something about {fl}'s {txt}" },
  agency: {
    t: "Shot at a rival agency", s: "Stir things up with another agency",
    tones: [["Classy", ["Congrats to {ag} on a good year. We're coming for that top spot though.", "Healthy competition with {ag}. Good for the sport."]], ["Bold", ["{ag} talks a lot about developing fighters. Look at their record.", "Fighters leaving {ag} keep calling us. Wonder why. 🤔"]], ["Savage", ["{ag} couldn't develop a photo.", "If your manager is {ag}, I'm sorry. DMs open."]]],
  },
  thanks: {
    t: "Thank the fans", s: "After a win",
    tones: [["Classy", ["Thank you to everyone who supported {fl} this week. This one's for you.", "Incredible support for {fl}. Thank you all."]], ["Bold", ["{fl} did what we said he would. Thanks for riding with us.", "Another W for {me}. Thank you fans 🔥"]], ["Savage", ["To everyone who doubted {fl}: we see you. 😘", "Receipts saved. Thanks to the real fans."]]],
  },
};
// Your reply options to someone else's post, by who wrote it. [label, line, kind]. kind decides the effect.
export const REPLY = {
  fighter: [["Respect", "Respect, {fl}. Great work.", "respect"], ["Banter", "{rival} would have something to say about that 😏", "banter"], ["Provoke", "Big words, {fl}. {rival} is waiting. Sign it.", "provoke"]],
  mine: [["Proud", "Proud of you, {fl}. 🙏", "proud"], ["Hype", "This man is HUNGRY. 🔥", "hype"], ["Tease", "Less posting, more training 😂", "tease"]],
  journalist: [["Thanks", "Thanks for the coverage, {n}. Always fair.", "thanks"], ["Correct", "Not quite how it happened, {n}. Happy to set the record straight.", "correct"], ["Tease", "Big news coming from {me} soon 👀 You'll hear it first.", "tease"]],
};
// What other fighters answer when you provoke them or call them out. By personality.
export const ANSWER = {
  _: ["Your manager talks more than you fight, {fl}.", "Tell {fl} to call me himself.", "Send the contract, {me}. I'll sign it today.", "I don't even know who {fl} is 😂"],
  Hotheaded: ["{fl} is DEAD when I see him. Book it NOW.", "Tell your little fighter I'm coming, {me}."],
  Professional: ["If it's offered, I'll take it. Simple.", "No need for this. Talk to the promotion."],
  Easygoing: ["Haha alright, let's do it 🤝", "Sure, why not. Send it."],
  Ambitious: ["{fl} isn't ranked high enough to say my name.", "Get some wins first, {fl}."],
};
