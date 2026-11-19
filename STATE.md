# State — 2026-11-20

## Where we are
- Fight Camp prototype (`original/FIGHT CAMP.html`) rebuilt as **Fight Manager**: Vite + plain JS, on branch `rebuild` (not merged to `main` yet).
- New look: dark broadcast style, no pixel art. Real fighter photos from Wikimedia Commons, drawn SVG avatars for everyone else.
- New loop: transfer list, rival agency bids (accept/counter/reject), unsolicited bids, buy-outs from rivals, contracts that expire, renewals, release.
- Fight night: tale of the tape, live tactics, corner calls between rounds, speed/skip, title shots.
- Smoke test (`npm test`) passes: plays a fight, gets a bid, sells a fighter, checks phone width.
- Repo: https://github.com/DavisPiero/fight-manager (public).

## Next
- Get sign-off on the rebuild, then merge `rebuild` → `main`.
- Put a build in front of one new player and note where they get stuck.
- Balance: one simulated year ends at roughly $450k by keeping fighters and $750k by flipping them (start $250k). Nobody went bankrupt, so Normal may be too easy.

## Open with you
- Guess: roster cap 8, 6-week no-sale window, 6 weeks in the red = game over. Confirm or change.
- Guess: rival agency names are invented (Apex Sports Group, Iron Circle, etc.).
- Do you want it hosted on GitHub Pages so a tester can play from a link?
- 84 of 128 real fighters have a free photo; the other 44 (e.g. Volkanovski, O'Malley, Aspinall) use drawn avatars.
