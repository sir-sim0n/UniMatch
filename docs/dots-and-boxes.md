# Dots and Boxes — Orbit v1.11.0

Open Messages with an accepted connection and choose Challenge to Dots and Boxes. The other demo account accepts the invitation. Select an undrawn line between adjacent dots on a 4-by-4 dot grid. Completing a box claims it and grants another turn; one line can claim two boxes. Once all nine boxes are claimed, the highest score wins.

Scores, ownership, turns and results are derived from the saved move history. Used edges cannot be replayed. Keyboard-accessible line buttons have direction, row and column labels; claimed boxes use player symbols as well as colours. The board supports light/dark themes and mobile widths.

Games share invitation acceptance, decline/cancel, notifications, seven-day inactivity expiry, resignation, saved history and rematches with Four in a Row. One unfinished game per conversation is allowed. Rematches preserve the game type and swap starting order. Blocking or removing a connection cancels unfinished games. Old Four in a Row records without a kind field remain compatible.

This release remains a browser-local demo. Switch demo accounts on the same browser to play both sides. No real accounts or cross-device multiplayer are introduced.

Validation covers single and double box completion, extra turns, duplicate/out-of-range edges, all 24 moves, final scoring, persistence, rematch type and blocking, plus the existing Four in a Row and application suites.

Release verification (26 October 2026): all 21 CTest groups and the 30-file publication check passed. Browser testing covered invitation, acceptance, moves by both players, reload persistence, box ownership and the extra turn. Mobile scroll/client width was 375px with no overflow; no console errors. GitHub Actions run 40383513639 built and deployed commit c445bd20dbb2dbf2b00eef26e1b72818cb97138d successfully. The live site loaded v1.11.0 and a Dots and Boxes invitation was accepted in Messages.
