# Hand-off — 2026-11-22

## Done (merged to main, pushed)
- Fighters redrawn + walk-out rebuilt (earlier in the day).
- Phone overhaul: PULSE (`src/sim/pulse.js`, `src/ui/pulse.js`, `src/data/pulse-content.js`) and PULSE CONNECT (`src/sim/connect.js`, `src/ui/connect.js`, `src/data/people.js`). Core clock/queue/chats in `src/sim/phone.js`. Old saves migrate (`migrate()` in phone.js).
- `npm run phone` = headless phone screenshots. Smoke test covers the new phone.

## Next
- Owner reviews the phone (open questions in STATE.md). Then a cold playtest.

## Key decisions
- Activity is queued across an in-game week and drips in on a real-time ticker in main.js (`UI.still` stops it for tests).
- Posts and replies are picked, not typed; 3 posts a week.
- Sponsor offers and bids from the old systems are wrapped as CONNECT offer cards (`CN.scan`).
