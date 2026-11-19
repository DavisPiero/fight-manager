# State — 2026-11-20

## Where we are
- Branch `rebuild` (not merged to `main`). Live from this branch: https://davispiero.github.io/fight-manager/
- v2 done: broadcast-style redesign, calm default screens + Analyst Mode, first-run tutorial, auto-train switch, new menu with 3 save slots, agency setup (manager, colour, emblem, home city, gym focus), random events, sponsorship deals, new sounds.
- Fighters: 126 of 128 real fighters have official UFC.com headshots, bios and career stats (stored in `public/fighters/`, `src/data/ufc.json`). Patricio Pitbull and Abdul Rakhman Yakhyaev had no headshot and are removed. Made-up prospects use a silhouette.
- `npm test` passes: setup, tutorial, fights, an event, a sponsor deal, a sale, Analyst Mode, save slot, phone width.

## Next
- Sign-off, then merge `rebuild` → `main`.
- One new player tries it cold; note where they first get stuck (the tutorial is untested on a real person).
- Balance check of events and sponsor income over a full season.

## Open with you
- Copyright: UFC.com images are in a public repo and public site, as you chose. A takedown is possible.
- Guess: prospects keep silhouettes rather than being removed. Confirm.
- Guess: 8 home cities and their perks, sponsor brand names, event list and odds (~40% of weeks).
- Guess: roster cap 8, 6-week no-sale window, 6 weeks in the red = game over.
- Old saves from the first version don't carry over (new save format).
