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
- **Fight night:** walk-out intro (title card, both fighters with name plates, face-off), tale of the tape, then 3 rounds × 12 exchanges in a live arena: fighters move, lunge, get rocked, drop, go to the ground; impact bursts, camera shake and zoom. Knockdowns can end it.
- **Corner calls:** up to 2 key moments a round (he is hurt / you are rocked / on top / on bottom / an opening / close round). Three choices, 8 seconds; no call and the fighter follows his personality. Outcomes come from skills. Between rounds: water / cutman / fire up, and a new plan. Speed 1–4× and skip.
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

## Not building
Women's divisions, 5-round main events, managers' staff/coaches, multiplayer, online saves, UFC branding.
