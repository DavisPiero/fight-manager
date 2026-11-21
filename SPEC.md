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
- Opens from the top bar (or P). Apps: Messages, Contacts, Deals, News, Social, Rumours, Alerts, Settings.
- Contacts are earned: your fighters, plus people you meet (matchmaker, reporter, podcast host, gym owner, brand rep, scout).
- Fighters have a mood (0–100). They message you about injuries, idle spells, contracts, wins, losses, pay and personal things; you pick a reply. Mood changes renewals and fight form. You can message them about training, fights, goals and money.
- Business offers (podcast, commercial, promoter fight, gym partnership, fighter wants to sign, buy-out): accept, counter once, or decline. Deadlines, real money and bookings.
- News, Social and Rumours come from real game events. Rumours carry credibility and resolve 2–3 weeks later: true, partly true or false, and change the world when true (bids, injuries, releases, retirements).
- Rivalry chain: a win draws a callout, a reply, a rumour, then a promoter offer.
- Alerts: critical (always pops up), important (pops up if allowed), ordinary (never pops up). Max 3 banners at a time.
- Content is a small starter set; add more later (see phone-content.js header).

## Not building
Women's divisions, 5-round main events, managers' staff/coaches, multiplayer, online saves, UFC branding.
