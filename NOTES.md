# Hand-off — 2026-11-23

## Done (merged to main, pushed)
- Names: `freshName`/`fixNames`/`surname` in `src/state.js`, bigger lists in `src/data/constants.js`. `load()` runs `fixNames`.
- Phone: `render()` in `src/main.js` adds `.redraw` to the phone when the same screen is redrawn; CSS turns its animations off (new bubbles get `.new`).
- Fight night (`src/ui/arena.js`): `arenaRock(i, on)` from `askMoment` for hurt moments; `S.rt` is real time (wobble shows in slow motion); `S.imp` slow-motion beat on bighit/kd; `drawCage` redrawn + `drawHaze`; mat sponsors in `S.brands`. Push-in in `styles.css` (`.arena.mo-on .cam`).

## Next

- Cold playtest still overdue.

## Key decisions
- Your own fighters are never renamed by the save fix.
- Bot shift is random-stream only (verified by running it without the fight changes).
