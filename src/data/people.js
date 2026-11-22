// Industry people you can meet on PULSE CONNECT. All fictional.
// kind: what they do (decides what you can ask them and what they offer).
// voice: how they write (lines in VOICE below). tier: 0 = anyone can add them once they've heard of you,
// 1 = needs reputation `rep`, 2 = only through an introduction from someone in `by`.
// meet: the moment they reach out to you first (checked in src/sim/connect.js). Empty = you have to find them.
// brand: for brand reps, the sponsor they work for (must match BRANDS in constants.js). ag: rival agency id.
export const PEOPLE = {
  scout: { name: "Luis Ortega", kind: "scout", role: "Talent scout", org: "Freelance", voice: "warm", tier: 0, meet: "start", col: "#4c8dff", bio: "Twenty years finding fighters in garages and church halls." },
  promo: { name: "Marco Vitale", kind: "matchmaker", role: "Matchmaker", org: "Cageside Media", voice: "blunt", tier: 0, meet: "wk2", col: "#d20a0a", bio: "Books the prelims. Answers in four words or fewer." },
  dana: { name: "Dana Kurz", kind: "matchmaker", role: "Senior matchmaker", org: "Cageside Media", voice: "formal", tier: 1, rep: 35, meet: "ranked", col: "#ff5a5a", bio: "Builds the main cards. If Dana calls, it matters." },
  jules: { name: "Jules Becker", kind: "promoter", role: "Event promoter", org: "Fight Night Series", voice: "hype", tier: 1, rep: 25, meet: "rep25", col: "#ff3d8b", bio: "Sells out arenas. Sells out anything, really." },
  crane: { name: "Victor Crane", kind: "promoter", role: "Head of events", org: "Cageside Media", voice: "formal", tier: 2, by: ["dana", "jules", "kate"], meet: "champ", col: "#b8b8c0", bio: "Decides which fights get the pay-per-view." },
  kate: { name: "Kate Ruiz", kind: "journalist", role: "Reporter", org: "Cageside Report", voice: "warm", tier: 0, meet: "win1", col: "#e8c46a", handle: "@CagesideKate", bio: "Fight-week reporter. Fair, thorough, never off the record by accident." },
  ben: { name: "Ben Okafor", kind: "journalist", role: "Columnist", org: "PULSE News", voice: "sly", tier: 0, meet: "wins3", col: "#f0a35e", handle: "@BenOnTheBeat", bio: "Opinions first, sources second." },
  mia: { name: "Mia Lindqvist", kind: "journalist", role: "Analyst", org: "Octagon Weekly", voice: "formal", tier: 1, rep: 30, meet: "", col: "#7ad0c8", handle: "@MiaMMA", bio: "Breaks down tape frame by frame." },
  raj: { name: "Raj Sood", kind: "journalist", role: "Insider", org: "PULSE News", voice: "sly", tier: 2, by: ["kate", "ben", "promo"], meet: "", col: "#ffd23f", handle: "@SoodScoops", bio: "If it's happening, he knew last week." },
  media: { name: "Tom Hale", kind: "media", role: "Host", org: "Fight Talk podcast", voice: "hype", tier: 0, meet: "ko", col: "#9b6cff", handle: "@FightTalkTom", bio: "Two million listeners. Three microphones. One opinion." },
  gym: { name: "Sasha Ivanova", kind: "coach", role: "Owner", org: "Northside Combat Club", voice: "blunt", tier: 0, meet: "roster4", col: "#2fbf71", bio: "Runs the hardest gym in the city. Doesn't do compliments." },
  eddie: { name: "Eddie Marsh", kind: "coach", role: "Boxing coach", org: "Marsh Boxing", voice: "blunt", tier: 1, rep: 20, meet: "loss", col: "#c9a46a", bio: "Old school. Fixed more chins than a surgeon." },
  paulo: { name: "Paulo Reis", kind: "coach", role: "BJJ black belt", org: "Reis Jiu-Jitsu", voice: "warm", tier: 1, rep: 20, meet: "", col: "#5aa0ff", bio: "Calm voice, terrifying guard." },
  nong: { name: "Nong Sakda", kind: "coach", role: "Muay Thai kru", org: "Sakda Muay Thai", voice: "formal", tier: 2, by: ["gym", "eddie", "paulo"], meet: "", col: "#ff8a3d", bio: "Three hundred fights in Bangkok. Speaks softly." },
  doc: { name: "Dr. Lena Brandt", kind: "medic", role: "Sports physician", org: "Brandt Performance", voice: "formal", tier: 0, meet: "inj", col: "#60d6ff", bio: "Gets fighters back fast and in one piece." },
  // Brand reps: one per sponsor brand.
  b_iron: { name: "Nora Kim", kind: "brand", brand: "Ironclad Nutrition", role: "Partnerships", org: "Ironclad Nutrition", voice: "warm", tier: 0, meet: "sponsor", col: "#8b9bb4", bio: "Signs athletes who look like they eat their vegetables." },
  b_red: { name: "Dev Mehta", kind: "brand", brand: "Redline Energy", role: "Partnerships", org: "Redline Energy", voice: "hype", tier: 0, meet: "sponsor", col: "#ff3b3b", bio: "Wants loud fighters. Loud fighters only." },
  b_kod: { name: "Hanna Berg", kind: "brand", brand: "Kodiak Apparel", role: "Athlete marketing", org: "Kodiak Apparel", voice: "warm", tier: 0, meet: "sponsor", col: "#c08a4a", bio: "Outdoor brand, indoor fighters." },
  b_north: { name: "Claire Dubois", kind: "brand", brand: "Northgate Watches", role: "Ambassador programme", org: "Northgate Watches", voice: "formal", tier: 1, rep: 40, meet: "sponsor", col: "#d8c48a", bio: "Only champions wear Northgate. Her words." },
  b_titan: { name: "Jamal Price", kind: "brand", brand: "Titan Fightwear", role: "Fighter relations", org: "Titan Fightwear", voice: "hype", tier: 0, meet: "sponsor", col: "#9aa7ff", bio: "Outfits half the prelims. Wants the other half." },
  b_bolt: { name: "Ava Chen", kind: "brand", brand: "Bolt Hydration", role: "Sponsorships", org: "Bolt Hydration", voice: "warm", tier: 0, meet: "sponsor", col: "#43d6ff", bio: "Sweat is the brand." },
  b_bank: { name: "Peter Lowe", kind: "brand", brand: "Summit Bank", role: "Sponsorship director", org: "Summit Bank", voice: "formal", tier: 1, rep: 35, meet: "sponsor", col: "#5fd39a", bio: "Conservative money for respectable fighters." },
  b_bet: { name: "Sam Ortiz", kind: "brand", brand: "Overtime Sportsbook", role: "Partnerships", org: "Overtime Sportsbook", voice: "sly", tier: 0, meet: "sponsor", col: "#ffb347", bio: "Likes favourites. Loves underdogs." },
  b_night: { name: "Rosa Vega", kind: "brand", brand: "Nightjar Headphones", role: "Talent", org: "Nightjar Headphones", voice: "hype", tier: 0, meet: "sponsor", col: "#c784ff", bio: "Walk-out songs are her whole job." },
  // Rival agency managers: one per agency (ids match AGENCIES).
  a0: { name: "Grant Holloway", kind: "agent", ag: 0, role: "Managing partner", org: "Apex Sports Group", voice: "formal", tier: 1, rep: 30, meet: "bid", col: "#4c8dff", bio: "Pays top dollar and reminds you of it." },
  a1: { name: "Vic Moreno", kind: "agent", ag: 1, role: "Agent", org: "Iron Circle Management", voice: "sly", tier: 0, meet: "bid", col: "#9b6cff", bio: "Never paid full price for anything." },
  a2: { name: "Ruth Adair", kind: "agent", ag: 2, role: "Director", org: "Blackline MMA", voice: "blunt", tier: 0, meet: "bid", col: "#8b92a0", bio: "Steady roster, steady hands." },
  a3: { name: "Kenji Mori", kind: "agent", ag: 3, role: "Head of talent", org: "Summit Fight Partners", voice: "warm", tier: 0, meet: "bid", col: "#3ecf8e", bio: "Collects prospects like stamps." },
  a4: { name: "Delia Stone", kind: "agent", ag: 4, role: "Agent to champions", org: "Northstar Athletes", voice: "formal", tier: 1, rep: 40, meet: "bid", col: "#f2b33d", bio: "If you're not top five, she won't remember your name." },
  a5: { name: "Billy Kingsway", kind: "agent", ag: 5, role: "Founder", org: "Kingsway Combat", voice: "hype", tier: 0, meet: "bid", col: "#ff7a45", bio: "Former welterweight. Current loudmouth." },
};
export const BRAND_REP = Object.fromEntries(Object.entries(PEOPLE).filter(([, p]) => p.brand).map(([k, p]) => [p.brand, k]));
export const AGENT_OF = Object.fromEntries(Object.entries(PEOPLE).filter(([, p]) => p.kind === "agent").map(([k, p]) => [p.ag, k]));

// What you can ask each kind of person. [topic, label]. Effects in src/sim/connect.js.
export const ASKS = {
  scout: [["scout", "Anyone worth signing?"], ["catch", "Catch up"]],
  matchmaker: [["fight", "Got a fight for one of mine?"], ["catch", "Catch up"]],
  promoter: [["card", "Put one of mine on a big card"], ["catch", "Catch up"]],
  journalist: [["story", "Pitch a story"], ["catch", "Catch up"]],
  media: [["story", "Get one of mine on the show"], ["catch", "Catch up"]],
  coach: [["camp", "Run a camp for one of mine"], ["catch", "Catch up"]],
  medic: [["rehab", "Help an injured fighter"], ["catch", "Catch up"]],
  brand: [["pitch", "Pitch one of my fighters"], ["catch", "Catch up"]],
  agent: [["buy", "Selling anyone?"], ["shop", "Interested in my fighters?"]],
};

// How each voice writes. Keys are situations; {placeholders} are filled by fill() in src/sim/phone.js.
// Extra placeholders here: {n} their first name, {org} their company, {who} a person being introduced.
export const VOICE = {
  hello: {
    warm: ["Hi! {n} from {org}. Been following {me}. Save my number, we should talk.", "Hey, it's {n} ({org}). Love what you're building. Door's open any time.", "Hello from {org}! I'm {n}. Thought it was time we connected."],
    blunt: ["{n}, {org}. Save the number.", "It's {n}. {org}. We'll be working together.", "{n} here. Heard about you. Don't waste my time and I won't waste yours."],
    formal: ["Good afternoon. This is {n}, {org}. I'd like to open a line of communication with {me}.", "Hello. {n} from {org}. Please keep this number for future business.", "{n}, {org}. Your agency has come to our attention."],
    hype: ["YO! {n} from {org} 🔥 {me} is making noise. Let's link up!!", "What's good!! {n} here, {org}. We gotta do something together 💥", "{n} from {org}! Huge fan of the work. Let's make some money 🤝"],
    sly: ["{n}, {org}. Got your number from a friend. Don't ask which one 😉", "Hello hello. {n} at {org}. I hear things. Now I hear about you.", "{n} here, {org}. Let's be useful to each other."],
  },
  catch: {
    warm: ["Always good to hear from you! How's the team?", "All good this side. Your guys looking sharp?", "Ha, was just thinking about you. All well?"],
    blunt: ["Busy. What do you need?", "Fine. You?", "Still here. Talk soon."],
    formal: ["Thank you for checking in. Things are well on our side.", "Kind of you to reach out. Let's stay in touch.", "All in order here. Regards to the team."],
    hype: ["Bro!! Crazy week. We gotta catch up properly 🙌", "Always love hearing from you 🔥", "We're BOTH busy, that's how you know we're winning 😤"],
    sly: ["Funny timing. I was just talking about you.", "All good. Heard some things about your guys... good things. Mostly.", "Busy, busy. You'd love the gossip."],
  },
  congrats: {
    warm: ["Huge win for {fl}! So happy for you all.", "{fl} was brilliant tonight. Congrats to the whole team!", "What a night for {me}. Well deserved."],
    blunt: ["Good win. {fl} looked ready.", "{fl} did the job. Keep him busy.", "Solid. Next."],
    formal: ["Congratulations on {fl}'s victory over {ol}. An impressive performance.", "A fine result for {me}. Well done.", "Please pass my congratulations to {fl}."],
    hype: ["{fl} IS DIFFERENT 🔥🔥", "WHAT A PERFORMANCE!! {fl} is a problem!", "Told everyone {fl} was the real deal 😤"],
    sly: ["Nice win. Some people lost money on {ol} tonight 😅", "{fl} just made a few phones ring. Mine included.", "Congrats. Watch out, others noticed too."],
  },
  sorry: {
    warm: ["Tough night for {fl}. He'll come back stronger.", "Sorry about tonight. Give {fl} my best.", "Rough one. Tell {fl} people still believe in him."],
    blunt: ["Bad night. Fix it.", "{fl} got outworked. It happens.", "Losses happen. Don't let it become two."],
    formal: ["My condolences on the result. {fl} will learn from it.", "A difficult evening. I'm sure the team will regroup.", "Unfortunate result. Please pass on my regards to {fl}."],
    hype: ["Rough one 😬 Comeback story starts now!", "Ugh. {fl} will bounce back, I KNOW it.", "Not his night. Next one's the one 💪"],
    sly: ["Ouch. Phones are quiet about {fl} tonight.", "That'll cost him on the market. Just saying.", "Unlucky. Or was it? 😉"],
  },
  yes: {
    warm: ["Absolutely, leave it with me.", "Happy to! Sending something over.", "Of course. Here's what I've got."],
    blunt: ["Fine. Here.", "Got one. Take it or don't.", "Done. Look at this."],
    formal: ["Certainly. Please see the proposal below.", "I can arrange that. Details attached.", "Very well. Here are the terms."],
    hype: ["SAY LESS 🔥 Check this out!", "Oh I've got something BIG for you 💥", "Funny you ask!! Look 👇"],
    sly: ["I might have something. Don't tell anyone where it came from.", "For you? Sure. This one's fresh.", "Lucky timing. Look at this."],
  },
  no: {
    warm: ["Nothing right now, sorry! I'll keep you in mind.", "Not this week, but soon, promise.", "Bit quiet at the moment. I'll call you first."],
    blunt: ["Nothing.", "No. Ask again later.", "Not right now."],
    formal: ["Unfortunately there's nothing suitable at present.", "Regrettably I can't help with that at the moment.", "I'm afraid not at this time."],
    hype: ["Dry week bro 😩 Hit me again soon!", "Nothing yet but it's COMING", "Ahh not right now! Soon 🙏"],
    sly: ["Nothing I can share. Yet.", "Hmm. Not today.", "Ask me next week. Things are moving."],
  },
  soon: {
    warm: ["Already asked me this week! Give me a few days 😊", "Still working on it, hang tight."],
    blunt: ["You asked already.", "Patience."],
    formal: ["We discussed this earlier this week.", "I'll come back to you in due course."],
    hype: ["Haha relax, I'm on it!!", "Bro you JUST asked 😂"],
    sly: ["Eager. I like it. Still no.", "Same answer as earlier. For now."],
  },
  thanks: {
    warm: ["Great doing business with you!", "Perfect, thank you!", "Lovely. Talk soon."],
    blunt: ["Good.", "Done.", "Pleasure."],
    formal: ["Thank you. A pleasure doing business.", "Excellent. We'll be in touch.", "Confirmed. Thank you."],
    hype: ["LET'S GOOO 🔥", "Deal!! 🤝", "Huge. You won't regret it!"],
    sly: ["Smart choice.", "Knew you'd see it my way.", "Pleasure. Truly."],
  },
  declined: {
    warm: ["No worries at all, maybe next time.", "Understood! Door's still open."],
    blunt: ["Your loss.", "Fine. Moving on."],
    formal: ["Understood. Perhaps another time.", "Noted. Thank you for considering it."],
    hype: ["Aww 😩 OK, next one then!", "Damn. Alright, I'll find something better!"],
    sly: ["Interesting choice.", "Someone else will take it. They always do."],
  },
  intro: {
    warm: ["You should know {who}. Want me to introduce you?", "I'm close with {who}. Happy to make an intro if you like."],
    blunt: ["You need to meet {who}. Want the number?", "{who} could help you. Say the word."],
    formal: ["I'd be glad to introduce you to {who}, if that would be useful.", "May I put you in touch with {who}?"],
    hype: ["Yo you HAVE to meet {who} 🔥 Want an intro?", "{who} would LOVE your guys. Intro?"],
    sly: ["I know {who}. Owes me one. Want it?", "I could get you {who}'s number. Interested?"],
  },
  removed: {
    warm: ["Oh. OK then.", "Didn't expect that. Take care."],
    blunt: ["Noted.", "Fine."],
    formal: ["I see. Best of luck.", "Understood."],
    hype: ["Wow. Cold 🥶", "Seriously?"],
    sly: ["Burning bridges. Bold.", "I'll remember that."],
  },
  contro: {
    warm: ["Hi, I'm writing about {fl} and the {txt}. Would you like to give a statement?", "Sorry to bother you. People are asking about {fl}'s {txt}. Anything to say?"],
    blunt: ["{fl}. The {txt}. Comment?", "Need a quote on {fl}'s {txt}. Today."],
    formal: ["I'm preparing a piece on {fl}'s {txt}. Would {me} care to comment?", "Could I have a statement on the {txt} involving {fl}?"],
    hype: ["The internet is ON FIRE about {fl}'s {txt} 😳 Statement??", "Everyone's talking about {fl}!! You saying anything?"],
    sly: ["So... {fl}'s {txt}. Off the record, what happened?", "I'm running the {txt} story either way. Want your side in it?"],
  },
};

// What each kind of person says when they bring a deal (opening line before the offer card).
export const PITCH = {
  promoter: ["I can put {fl} against {ol} in week {wk}. Purse {amt}.", "{fl} vs {ol}, week {wk}, {amt}. Fans want it."],
  card: ["Co-main slot opened up: {fl} vs {ol}, week {wk}. {amt}.", "Big card in week {wk}. {fl} vs {ol}. {amt} and a lot of eyeballs."],
  rivalry: ["The whole internet wants {fl} vs {ol}. Week {wk}, {amt}. Let's give it to them.", "{fl} and {ol} won't shut up about each other. Settle it in week {wk}. {amt}."],
  media: ["Want {fl} on the show this week? {amt} for an hour.", "Big episode coming. {fl} would be perfect. {amt}."],
  interview: ["Can I get {fl} for a sit-down interview? Good exposure, I'll make him look great.", "I'd like a long-form interview with {fl} this week."],
  commercial: ["We'd love {fl} in our next ad. {amt}, one day of filming.", "Shoot a commercial with {fl}? {amt}."],
  gym: ["Train your team here for a season. {amt}, and every fighter gets sharper.", "My coaches, your fighters, one season. {amt}."],
  camp: ["Send {fl} to me for a week. I'll fix his {skill}. {amt}.", "One week with me and {fl}'s {skill} gets better. {amt}."],
  rehab: ["I can get {fl} back a week sooner. {amt}.", "Proper rehab for {fl}. {amt}, and he's back faster."],
  request: ["{f} ({div}) wants to join {me}. He'd sign for {amt}.", "Found one: {f}. Hungry, cheap. He'd sign for {amt}."],
  sponsor: ["We want {fl} in {brand} kit. {amt} a week for {wks} weeks.", "{brand} would like to sponsor {fl}: {amt}/week, {wks} weeks."],
  bid: ["We'd like {f}. Our offer: {amt}.", "{amt} for {f}'s contract. Fair price."],
  sale: ["We'd let {f} go. Fee around {amt}. Interested?", "{f} could use a new home. We'd take {amt}."],
};
