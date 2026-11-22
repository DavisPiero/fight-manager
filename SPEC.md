# Fight Manager — spec

## What makes it fun
1. **Buy low, build up, cash in.** Sign cheap prospects, raise their value through training and wins, then choose: sell at the peak, or keep them and chase a belt.
2. **Fight night is yours.** You see the fight unfold, change tactics live, and make a corner call between rounds. Good calls swing close fights.
3. **Every week has a decision.** The dashboard's To-do list always shows what needs attention: offers, bookings, expiring contracts, training.
4. **Real names, real stakes.** The real UFC roster (Nov 2026) fills the rankings; beating a ranked star or taking a title feels big.
5. **Pressure.** Weekly costs, injuries, contracts running out, and a bankruptcy clock (6 weeks in the red) force trade-offs.
6. **Calm by default, deep on demand.** Plain grades and one line of commentary for most players; Analyst Mode for the numbers.
7. **Surprises.** Random events with choices, sponsorship offers, and short-notice fights keep weeks from feeling the same.

## Core loop (one week)
Check To-do → book fights / answer bids → train → Next week → fight night if booked → results, value changes.

## Systems
- **Fighters:** 9 skills, overall = average. Real fighters ~73 (#15) to ~89 (champion), from ranking, win rate and UFC.com stats. Free agents ~40–60; prospects are bought for potential. Age, personality, potential, popularity, win streak.
- **Value:** skill^2.3, popularity, ranking (champ/top 5/top 15), youth, streak, contract length, injury.
- **Signing:** free agents ask a bonus (60% of value). Buy-outs: transfer fee to the rival agency + bonus. Acceptance depends on reputation, bonus, cut, contract length and personality.
- **Selling:** list at an asking price; rival agencies bid weekly (style affects price). Accept, counter or reject. Hot unlisted fighters draw unsolicited bids. No selling within 6 weeks of signing.
- **Contracts:** 1–3 years, count down weekly, warning at 8 weeks, fighter walks for free at 0. Renew via negotiation.
- **Fight night:** broadcast intro (title card; each fighter slides in with a light sweep and a name plate led by a big overall rating; face-off and VS over a slow-turning octagon and light streaks), tale of the tape (overall biggest at the top, then record, wins, losses, style, rank, reach, grades; no age), then 3 rounds × 12 exchanges in a drawn octagon (crowd that sways and flashes on big moments, sweeping lights, fence, mat with your agency name). Fighters are drawn, not photos: build by division, skin tone from the UFC.com headshot (or by country for prospects), hair, beard and shorts fixed per fighter, stance by style. Every strike, takedown, sprawl, ground position, knockdown and KO is animated; strikes follow style (Muay Thai knees and elbows, boxers hooks and uppercuts) without changing the odds. Impact bursts, camera shake and zoom. Knockdowns can end it.
- **Corner calls:** up to 2 a round. The fight slows, the camera pushes in on the key fighter, a gold ring marks the target (head, body, lead leg), and 2–3 icon buttons with one- or two-word labels appear (keys 1–3). Situations: incoming (Block / Slip / Counter), he backs off (Pressure / Cut off / Body), he's hurt (Pursue / Head / Takedown), you're rocked (Clinch / Fire back / Circle out), on top (Pound / Submit / Hold), on bottom (Get up / Submit / Tie up), close round (Flurry / Takedown / Stay safe), hands low (Overhand / Shoot / Stay tight), lead leg hurt (Leg kick / Head kick / Box). A soft gold glow and a small tag ("Boxer", "Wrestling") mark the choice that clearly suits your fighter in this matchup. 5 seconds; no call and the fighter goes on instinct (personality, or his best option). Between rounds: water / cutman / fire up, and a new plan. Speed 1–4× and skip.
- **Finishes (bot):** ~28% KO, ~14% submission, ~57% decision.
- **Money:** commission (your % of purse + win bonus), sales; costs are bonuses, fees, gym sessions, $1,200 + $350/fighter weekly.
- **Roster:** max 8.
- **Agency setup:** name, manager, colour, emblem, home city (cost, starting rep, local prospects, faster-training skills), gym focus (+15% in an area). 3 save slots.
- **Events:** ~40% of weeks from week 3: short-notice fight, contract talk, viral clip, night out, sparring scare, rival poaching, media day, local sponsor, scout's tip, gym repairs, fan meet.
- **Sponsors:** fictional brands offer weekly pay to fighters with popularity 25+; you take your cut. Some deals end after two straight losses. Pitching costs $2,500.
- **Auto-train:** a Gym switch; each Next week, fighters with 55+ energy train their weakest skill at Normal (paused under $5k cash). One news line reports what it did.
- **Auto book:** one button on Fights books the Even match for every free fighter.
- **Reputation:** 0–100. Each fighter wants a minimum (better fighters more, real UFC names +15); below it they rarely sign. Shown on the Market and explained in a pop-up.
- **Settings:** gear button on every screen and the main menu: Analyst Mode, sound, tutorial, exit, delete.
- **Analyst Mode:** Settings switch, off by default. Shows exact skills, radar, UFC stats, stamina, momentum, judges, value maths.
- **Tutorial:** 9-step spotlight tour on a new career; replay from Settings.
- **Feel:** left sidebar nav; loading sting; Next week plays a fast-forward and a summary with the cash change.

## Phone
Opens from the top bar (or P). Two apps, PULSE and PULSE CONNECT, plus Settings. Home shows the latest notifications.
- **The world moves while you play.** Every 5–13 seconds on a game screen something arrives: a post, a message, an offer. They're spread over the in-game week (the phone clock shows the day and time); whatever hasn't arrived when you press Next week lands with its own timestamp.
- **Notifications:** critical (always pops up), important (pops up if allowed), ordinary (never). Max 3 banners at a time; none while the phone is open.

### PULSE (news and social, owned by Cageside Media)
- X-style feed: For you / Following / News. Profiles, verified ticks, timestamps, replies, reposts, likes and views that grow over the hours after a post.
- Who posts: fighters (training clips, personal updates, wins and losses, by personality), journalists (hot takes, scoops, previews), PULSE News (results, bookings, signings, transfers, injuries, drama), rumour accounts (credibility, later confirmed or denied), brands, agencies, fans (hype, polls, replies).
- Beef: fighters call each other out and answer days later. Rivalry heat (0–100) raises purses, draws a rivalry fight offer at 55+, and pays extra popularity when the fight happens.
- Controversy: missed weight, scuffles, old posts, rants, nights out. If it's your fighter, a journalist asks for a statement; ignore it for 2 weeks and he loses fans and maybe a sponsor.
- Your account: 3 posts a week, picked not typed (three tones: classy / bold / savage). Promote a fight (purse up), call someone out (rivalry), hype a fighter, back him after a loss, thank the fans, take a shot at a rival agency, answer a controversy. Reply to fighters and journalists: respect, banter, provoke; thanks, correct, tease. Bolder posts reach more people and make enemies.

### PULSE CONNECT (chats, contacts, offers)
- You start with your fighters and one scout. People reach out when something happens (first win, first KO, a ranked fighter, a champion, an injury, a bad loss, reputation 25, a sponsor offer, a rival agency bid). Some need reputation; some only come through an introduction from someone who likes you. Add contacts from "Add contact" or a PULSE profile; remove them (they remember).
- 29 industry people (matchmakers, promoters, journalists, a podcast host, coaches, a doctor, nine brand reps, six agency managers), each with a voice (warm, blunt, formal, loud, sly) and a relationship score that changes what they offer.
- Chats: day separators, times, read ticks, unread counts, delete chat. Fighters write by personality, mood and situation; you pick replies. Ask people for things (a fight, a card spot, a story, a camp, rehab, a sponsor pitch, a transfer).
- Offers arrive as gold cards in the chat and on the Offers tab: fight offers, main-card and rivalry fights, sponsorships, transfer bids, fighters for sale, podcasts, interviews, commercials, camps, rehab, gym deals, fighters wanting to sign. Accept, ask for more once, or decline. Sponsor offers and bids are the same ones the Office and Sell desk show.
- Fighter mood (0–100) changes renewals and fight form.

## Not building
Women's divisions, 5-round main events, managers' staff/coaches, multiplayer, online saves, UFC branding.
