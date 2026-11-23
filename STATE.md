# State — 2026-11-23

## Where we are
- Everything is on `main`; live at https://davispiero.github.io/fight-manager/ (updates when Pages rebuilds).
- Agenda "PULSE & Fight Night": **all 4 sessions built.** Sessions 1–2 (fight night) and the fighter/walk-out redraw were signed off earlier. Sessions 3 and 4 (the phone) were built together on 2026-11-22 from the owner's phone plan and merged on the owner's say-so ("when you are done merge and push"), not reviewed yet.
  - Phone = two apps. **PULSE**: X-style feed (fighters, journalists, PULSE News, rumours, brands, agencies, fans), profiles, replies, likes/reposts/views, your own account (3 picked posts a week), rivalries, controversies. **PULSE CONNECT**: chats, contacts earned through play (29 industry people + fighters), introductions, relationships, offer cards for every kind of deal.
  - The world moves while you play: posts, messages and offers arrive every 5–13 s across an in-game week clock.
- `npm test` passes. `npm run bot` re-baselined: win 62%, KO/sub/dec 28/14/58. The old baseline was already stale before this session (main gave win 60%, more sales).

- 2026-11-23 merged to main (signed off): unique fighter names (old saves fixed on load), phone no longer replays its animation on every update, fight night: heads stay in frame, hurt fighters look hurt, slow-motion beat on big shots, dressed cage (posts, mat ring, sponsors, light, haze). Bot re-baselined (win 57%, same rules, different dice).

## Next
- One new player tries it cold (overdue: recommended before sessions 3–4).
- Grow the content: more lines in `src/data/pulse-content.js`, `people.js`, `phone-content.js` (no code needed).

## Open with you
- New main menu and save screen (2026-11-22): open the game. Guesses: the ticker content, red spotlights, best fighter on each save card.
- Review the phone: `npm run phone` (screenshots in `test-results/phone/`), or play a few weeks and leave the phone open.
- Guesses this session: 3 posts a week; tones classy/bold/savage; rivalry fight offer at heat 55; controversy ignored for 2 weeks costs fans and maybe a sponsor; 29 people and who knows whom; start with one scout; new posts every 5–13 s; red ticks for verified people, gold for organisations; phone status bar shows game time, not real time.
- The fighters' redraw and walk-out (from earlier today) still want your look: `npm run poses`, `npm run shots`.
- Skin-tone sheet `test-results/skintones.png` (`npm run skin`): say which look wrong.
