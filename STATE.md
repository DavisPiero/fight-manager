# State — 2026-11-25

## Where we are
- Everything is on `main`; live at https://davispiero.github.io/fight-manager/ (updates when Pages rebuilds).
- Agenda "PULSE & Fight Night" built. Phone (sessions 3–4) merged 2026-11-22, not reviewed yet.
- 2026-11-25 merged on the owner's say-so ("when you're done, merge and push"), not reviewed yet:
  - Phone tidy: quieter PULSE feed rows, no repeated offer text, "Counter", offer cards in chats without the double frame, 9+ badges.
  - Fight night: moving broadcast camera (follows, cuts wide/mid/tight, punches in on big shots, pushes in for corner calls and the winner), fighters can't pass through each other, knockback, circling, footwork, feints.
  - Real fighters' hair and beard read from their headshots (`npm run hair`), bald fighters drawn bald.
  - More body detail (feet, knees, collarbone, open-glove fingers, necks, cauliflower ears).
- `npm test` passes. `npm run bot` unchanged (win 57%, KO/sub/dec 32/14/54): no rule changes.

## Next
- One new player tries it cold (overdue).
- Grow the content: more lines in `src/data/pulse-content.js`, `people.js`, `phone-content.js`.

## Open with you
- Watch a fight: does the camera cut too often, or not enough? (3–7 s between cuts; `SHOTS` in `src/ui/arena.js`.)
- Hair sheet `test-results/hair.png` (`npm run hair`): say which look wrong. Guessed by eye from the photos: who has long hair, curls, a bun or bleached hair.
- The phone: `npm run phone`. Guesses this session: dropped @handles and view counts from feed rows.
- Older: new main menu and save screen; skin-tone sheet `test-results/skintones.png`; the fighters' redraw (`npm run poses`, `npm run shots`).
