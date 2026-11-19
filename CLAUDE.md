# Fight Manager — project rules

Browser management game: run an MMA agency, sign/train/sell fighters, work the corner on fight night.

## Run
- `npm install` once, then `npm run dev` → http://localhost:5173 (add `?mute` to silence it).
- `npm test` → headless smoke test (Playwright). Plays weeks, a fight and a sale; screenshots in `test-results/`.
- `npm run photos` → refreshes fighter headshots from Wikimedia Commons (slow; rate-limited).
- `npm run build` → static site in `dist/` (relative paths, works on GitHub Pages).

## Hard rules
- No pixel art. Portraits are real free-licensed photos or the flat SVG avatar in `src/ui/avatar.js`.
- Only free-licensed photos (CC / public domain) and every one is credited (Office › Credits, profile footer).
- Rival agencies are fictional. No UFC logos or branding; keep the "unofficial fan game" notice.
- Plain JavaScript + Vite, no framework. Views return HTML strings; clicks are routed by `data-a` in `src/main.js`.
- Game rules live in `src/sim/` and must not touch the DOM.
- Test headlessly; never open the user's browser or play sound during tests.

## Layout
- `src/state.js` career state, value/ask formulas, save/load.
- `src/sim/world.js` weekly cycle, fight offers, training. `src/sim/market.js` signing, selling, bids, contracts. `src/sim/fight.js` fight engine.
- `src/ui/views.js` screens, `src/ui/fightview.js` fight night, `src/ui/components.js` shared pieces, `src/ui/styles.css` look.
- `src/data/` roster (Nov 2026), constants, photo credits.

## Out of scope (for now)
Women's divisions, multiplayer, real money, a backend, mobile app wrappers, licensed UFC content.

See SPEC.md for what makes it fun, STATE.md for where we are, DECISIONS.md for why.
