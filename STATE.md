# State — 2026-11-21

## Where we are
- `main` has everything (rebuild merged). Live: https://davispiero.github.io/fight-manager/ (deploys on push).
- Notes round 1 done (6 sessions in 4): sidebar, Settings, Play/Settings menu, loading sting, week fast-forward, Auto book, auto-train report; screen rule, market rebuild, reputation explained, Office sponsors; balance bot + rescale; fight night rebuilt (intro, moving fighters, knockdowns, corner calls); in-game phone.
- `npm test` passes. `npm run bot` baseline in `scripts/bot-baseline.json`.

## Next
- **Add more phone content** (TODO, deliberately small for now): aim ~100 news, 150 rumours, 200 social, 100 messages, 50 business offers. Add lines in `src/data/phone-content.js`.
- One new player tries it cold; note where they first get stuck.

## Open with you
- Rest after fights: not added. The bot plays ~90 fights a year; reputation hits ~95 and cash grows ~6× in a year. Revisit if it feels too easy.
- Fight visuals use headshots (no kicks or full bodies). Full-body cut-out art (yours) would be the next big upgrade.
- Guesses to confirm: phone contacts (6 fictional people), mood effects, offer odds, rumour odds; prospects keep silhouettes; roster cap 8; 6-week no-sale window; cities, brands, events.
- Copyright: UFC.com images are in a public repo and public site, as you chose.
