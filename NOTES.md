# Hand-off — 2026-11-25

## Done (merged to main, pushed)
- Phone: `src/ui/pulse.js` (feed rows), `src/ui/connect.js` (offer card, chat preview, 9+), `src/ui/phone.js` (9+), CSS in `styles.css` (`.pp.mine`, `.bub.deal`).
- Arena (`src/ui/arena.js`): `camUpdate`/`camT`/`camApply`/`camPt` (canvas camera; `arenaHitPt` and `#p0/#p1` go through it), `drawFrontFence`, `separate()` (collision, then `contact(..., again=true)` re-aims), knockback `kb` on ACT reactions (`F.kb/F.kbv`), circling `S.orb` (depth via `place()`), footwork `F.dn`, feints (`ACT.feint/level`). `arenaFocus(i)` from `askMoment` replaces the CSS push-in.
- Hair: `scripts/hair.mjs` → `src/data/hair.json`, used in `lookOf`. New styles shaved/tall/long.

## Next
- Cold playtest still overdue.

## Key decisions
- Camera moves now (owner's ask), reversing the 2026-11-23 fixed camera.
