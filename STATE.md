# State — 2026-11-21

## Where we are
- Branch `pulse-fightnight` (not merged). `main` is the last signed-off build; live at https://davispiero.github.io/fight-manager/.
- Agenda "PULSE & Fight Night", 4 sessions. **Sessions 1 and 2 done, both awaiting your sign-off.**
  - Session 1: broadcast intro, overall-led tale of the tape, quick icon corner calls.
  - Session 2: the octagon is now a drawn, animated arena (crowd, lights, fence, mat) with drawn, rigged fighters: build by division, skin tone from the headshot, looks fixed per fighter, stance and strikes by style. Strikes, takedowns, sprawls, ground positions, knockdowns, KO and the win pose are all animated.
- `npm test` passes. `npm run bot`: win 60%, KO/sub/dec 30/14/56, same as before session 2 (baseline not re-saved).

## Next
- One new player tries it cold (recommended now, before sessions 3–4).
- Session 3: PULSE CONNECT (contacts earned through play, messaging framework, offer cards).
- Session 4: PULSE (X-style feed through the week, your own account, consequences). Owner: "Cageside Media".

## Open with you
- Check the skin-tone contact sheet: `test-results/skintones.png` (run `npm run skin` to rebuild). Five were hand-fixed (Evloev, Shara Magomedov, Arnold Allen, Ankalaev, O'Malley). Say which others look wrong.
- Guesses this session: hair and beard are random-but-fixed per fighter, not matched to the real person; a white/black/gold trim on shorts; your corner wears your agency colour, the opponent blue.
- Painted parts: when you want to paint your own, the parts are torso, upper arm, forearm, glove, thigh, shin, foot, head, hair, beard, shorts. Tell me and I'll set up loading them.
- Older: rest after fights (no for now); phone guesses (6 contacts, mood effects, offer/rumour odds) — session 3 replaces most of them.
