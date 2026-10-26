# Four in a Row — Orbit v1.10.0

## How to play
Choose a demo account and accept a connection with another account through Discover. Open Messages, choose that conversation and select Challenge to Four in a Row. Switch to the other demo account, open the same conversation, and accept or decline. The challenger can cancel an unanswered invitation.

The first player uses ● and the second uses ◆. Select a numbered column to drop a piece into the lowest empty cell of a 7-column, 6-row board. Connect four horizontally, vertically or diagonally to win. A full board without a winner is a draw. Controls are disabled when it is not your turn, a column is full or the match is over. Column controls support keyboard input; every cell has a row/column/player label, and symbols distinguish players without relying on colour alone.

## Match lifecycle
One pending or active match is allowed per pair. Boards and moves survive reloads. Completed games stay in the conversation’s game history. Resignation requires a confirmation dialog and awards the win to the opponent. Rematch sends a fresh invitation, retains the previous result and swaps the starting order. Games do not affect community karma.

Invitations and active games expire after seven days without activity, using this device’s clock. Turn actions enforce the deadline; the visible status updates every 30 seconds. Reload saved messages refreshes the full conversation and available actions, including after another browser tab changes a match. Removing a connection or blocking a player cancels unfinished matches. Blocked conversations and games are hidden; disconnected history is read-only. Reconnecting does not resume cancelled matches.

## Notifications
Challenges, responses, moves, resignations and cancellations generate in-app game activity notifications for the other participant. Open Messages from a notification selects the relevant conversation. These are local demo notifications, not push notifications or messages delivered to another device.

## Data and limits
Shared payload schema 8 adds games with unique IDs, two players, inviter, timestamps, lifecycle status and ordered column moves. Board state and results are derived by replaying legal moves, rather than trusting a stored winner. Each move verifies accepted connection, membership, turn, deadline, legal column and expected move count. Existing atomic persistence and stale-write protection prevent accidental duplicate/stale writes; failed saves roll back. Invalid move histories are rejected. Old data migrates in memory and is written on the next successful change. Account-only reset leaves games intact; shared social reset clears them.

This is a two-account game simulation on one browser, not cross-device multiplayer. There is no AI opponent, external game server, paid currency, matchmaking or background push service. Real multiplayer requires authenticated users and server-side authoritative rules. Do not treat client-side demo checks as production security.

## Verification
All 21 CTest groups and the 30-file publication check passed. Game tests cover wins in all four directions, legal draws, full columns, post-win rejection, invitation permissions, duplicate challenges, turns, expected move counts, restore, alternating rematches, resignation, expiry, blocking, failed-save rollback, stale writes, migration and malformed stored moves.

Browser tests covered making a connection, sending and accepting a challenge, notification navigation, disabled opponent controls, moves by both accounts, resignation and the resulting winner, rematch invitation, reload persistence and alternating first player. No console errors. Mobile scroll/client widths both measured 375px. Dark mode and player symbols were visually checked.

Live verification (26 October 2026): GitHub Actions run 40336526036 built and deployed source commit 72255112b1c3a448f5ad36a452c9ce85fb13bbc8 successfully. The public site loaded v1.10.0 assets. Naledi challenged Sipho in Messages, Sipho accepted, and Naledi's first disc saved in column 4 with the turn passed to Sipho. No browser console errors. Screenshot: orbit-four-in-a-row-live.png in the Portfolio Website task workspace.
