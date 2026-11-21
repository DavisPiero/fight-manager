# Fight Manager — project rules

Browser management game: run an MMA agency, sign/train/sell fighters, work the corner on fight night.

## Run
- `npm install` once, then `npm run dev` → http://localhost:5173 (add `?mute` to silence it).
- `npm test` → headless smoke test (Playwright). Plays weeks, a fight and a sale; screenshots in `test-results/`.
- `npm run ufc` → fetches fighter headshots + bio/stats from UFC.com athlete pages (15 s between requests, ~1.5 h; skips ones already fetched).
- `npm run bot` → balance bot: 20 seeded one-year careers, compared with `scripts/bot-baseline.json` (`-- --save` to re-baseline). Run it after any rule or data change.
- `npm run shots` → headless fight-night screenshots (intro stages, tale of the tape, each corner call) in `test-results/fight/`. Add `-- <dir> 390 844` for phone size.
- `npm run poses` → headless arena pose sheet (stance, strikes, takedown, ground, KO) in `test-results/arena/`. `npm run skin` → re-samples skin tones from headshots into `src/data/skintones.json` + contact sheet `test-results/skintones.png` (hand fixes start with `!` and are kept).
- `npm run build` → static site in `dist/` (relative paths, works on GitHub Pages).

## Hard rules
- No pixel art. Real fighters use their UFC.com cut-out headshot; made-up prospects use the dark silhouette.
- Real fighters without a UFC.com headshot are left out of the game (filtered in `newGame`).
- UFC.com images are stored in `public/fighters/` at the user's request (2026-11-20), knowing they're UFC's copyright in a public repo.
- Rival agencies and sponsors are fictional. Broadcast-style look is fine; no UFC logos; keep the "unofficial fan game" notice.
- Default screens stay uncluttered. Extra numbers go behind Analyst Mode (`SETTINGS.analyst`).
- **Screen rule:** each screen (and each card or pop-up) has one main action (red or gold) and at most two secondary ones. Everything else goes in a pop-up or the "More" menu. Three text sizes only: page title, section/number, body. Check every new screen against this before adding a button.
- Plain JavaScript + Vite, no framework. Views return HTML strings; clicks are routed by `data-a` in `src/main.js`.
- Game rules live in `src/sim/` and must not touch the DOM.
- Test headlessly; never open the user's browser or play sound during tests.

## Layout
- `src/sim/phone.js` phone: contacts, moods, messages, offers, news/social/rumours, notifications. `src/ui/phone.js` phone screens. Content in `src/data/phone-content.js` (starter set — add lines there).
- `src/state.js` career state, value/ask formulas, save/load.
- `src/sim/world.js` weekly cycle, fight offers, training, auto-train. `src/sim/market.js` signing, selling, bids, contracts. `src/sim/fight.js` fight engine. `src/sim/events.js` random events. `src/sim/sponsors.js` brand deals.
- `src/ui/views.js` screens, `src/ui/fightview.js` fight night, `src/ui/arena.js` the octagon canvas and drawn fighters (parts in `PARTS`, poses in `STANCE`/`STRIKE`/`ACT`), `src/ui/tour.js` first-run tutorial, `src/ui/components.js` shared pieces, `src/ui/styles.css` look.
- `src/data/` roster (Nov 2026), constants (cities, emblems, brands), `ufc.json` (scraped bio/stats).
- Saves: 3 slots in localStorage (`fightmanager_slot_N`); settings shared across slots.

## Out of scope (for now)
Women's divisions, multiplayer, real money, a backend, mobile app wrappers, licensed UFC content.

See SPEC.md for what makes it fun, STATE.md for where we are, DECISIONS.md for why.
