# State — 2026-11-21

## Where we are
- Branch `rebuild` (not merged to `main`). Live site still shows the 2026-11-20 build until it is redeployed.
- v2 done (broadcast look, save slots, agency setup, events, sponsors, Analyst Mode, tutorial, UFC.com headshots for 126 fighters).
- Notes round 1, sessions 1–2 done. Session 2: screen rule in CLAUDE.md, Market rebuilt (big tabs, one list, quick-look pop-up, reputation bar + "?" explainer, "will talk" filter), Office Sponsors tab, More pop-up for fighter actions, sold fighters no longer keep sponsor offers.
- Session 1: left sidebar, Settings pop-up, clickable agency mark, Play/Settings first screen with faces in view, loading sting, Next-week fast-forward + cash summary, auto-train news line, Auto book, big opponent overall on offers.
- `npm test` passes and now also checks: menu faces at 3 sizes, agency click, Auto book, auto-train lines, Sponsors tab, no sideways scroll on the phone Market.

## Next (plan from the notes triage, one session each)
3. Balance: a season-simulation bot as the baseline, then free agents ~45–62 and real stars 72–90 from UFC.com stats, prices re-checked.
4. Fight night rework: fewer, bigger moments (4–5 per round, each a choice or reaction) with big visual hits (knockdown, cut, round card, injury stamp).
5. Phone core: shell, notifications (critical / important / ordinary), earned contacts, messaging with picked replies, business offers.
6. Phone media: News, Social, Rumours from one world-events feed; ~150 content items first, then grow.

## Open with you
- Placeholder art I'll make unless you'd rather: phone app icons, notification sounds, fight-night hit effects.
- Copyright: UFC.com images are in a public repo and public site, as you chose. A takedown is possible.
- Guesses still unconfirmed: prospects keep silhouettes; roster cap 8; 6-week no-sale window; the 8 home cities, sponsor brands, event list and odds.
- Guess: Auto book falls back to the closest non-title match when there is no "Even" opponent.
- Seen in testing: top real fighters all show 92 OVR (the cap) and free agents reach 76. Session 3 (balance) fixes this.
