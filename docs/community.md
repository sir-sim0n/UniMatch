# Depth and community — Orbit v1.9.0

Released functionality remains fictional and browser-local. Private circles simulate access rules in application views; they are not a security boundary against someone inspecting this device’s local storage. No backend, real accounts, payments or external moderation were added. Events remain paused.

## Polls
Expand Add a poll in the post composer. Use 2–4 unique options, up to 100 characters each, with a 1-hour, 1-day or 1-week duration. The deadline starts when the post is published and uses this device’s clock. Each account can vote once, including the author; votes cannot be changed. Guests can read results but need a demo account to vote. Results show anonymous counts and percentages plus the active account’s own choice. Closing is shown without a reload; the mutation also rejects votes at or beyond the deadline. Options and deadline cannot be edited after publishing. Deleting a poll post removes its options and votes.

## Questions and best answers
Posts with the Questions topic or Question flair allow their author to mark one available reply from another student as the best answer. The author can change or remove the selection. The answer earns 5 karma while the question and reply remain available; deleted questions or replies no longer count. Self-selection and selection of blocked or unrelated replies are rejected.

## Awards
Choose Helpful, Insightful or Campus spirit under Awards, crosspost & thread. One award per account per post; the giver can replace it or remove it by choosing No award. No self-awards and no payments. Each award contributes 2 karma to the post author; deleting the post removes its awards. Profile karma combines existing non-self upvotes with award and best-answer bonuses. Visibility and blocks can affect the contributions visible to an account.

## Author threads
An author can publish a next post from their own original or quote post. Each post has at most one next post, belongs to the same author and links to an older post, preventing branches and cycles. Continue from the current tail. Previous/Next controls open the corresponding post. Each part remains independently visible in feeds, with its own engagement. Deletion leaves a tombstone and preserves links between parts.

## Crossposting
Members can crosspost public posts into their circles. The crosspost stores a reference, credits the original author and links back to the original. Edits appear in the referenced preview; deletion shows an unavailable/deleted-original notice. Only one crosspost of a given original is allowed per circle. Blocked source authors remain unavailable. Circle replies belong to the circle and do not become public-feed replies. Crossposting a public post into a private circle does not make the original public post private.

## Circle roles and privacy
| Capability | Organiser | Moderator | Member | Non-member |
| --- | --- | --- | --- | --- |
| Read member posts, post and reply | Yes | Yes | Yes | No |
| Set own circle flair (40 characters) | Yes | Yes | Yes | No |
| Pin one root post; hide/restore posts and replies | Yes | Yes | No | No |
| Approve/decline join requests | Yes | Yes | No | No |
| Set rules (2,000 characters) and privacy | Yes | No | No | No |
| Appoint/remove moderators | Yes | No | No | No |
| Request private membership/cancel request | — | — | — | Yes |

New circles may be public or private. Existing circles migrate as public, with their organiser as initial moderator. Public circles join immediately; private circles require approval. Names, descriptions, rules and member counts are discoverable, but member posts, flair and membership lists are hidden from non-members. The global feed, search, Trending and Popular never include circle-only posts. Only moderators see all pending join requests; other accounts see only their own. Changing a private circle to public clears pending requests so students can join immediately. Leaving removes moderator status and personal flair; organisers must remain. Hiding a pinned post also clears its pin. Pins appear first and are not visible to non-members.

## Popular
The main menu includes Popular. It clears campus, topic, author and Following restrictions and uses existing Hot ranking across visible public posts: (non-self upvotes + non-self, undeleted replies + 1) / (age in hours + 2)^1.5. Awards and best-answer bonuses affect karma, not this ranking. Re-enter Popular to refresh its ranking. The feed is still limited to this browser’s demo data.

## Persistence and verification
Schema 7 adds polls, poll votes, best answers and awards, plus circle privacy, requests, moderators, rules, flair and pin metadata. Existing profile, message, feed and circle data is preserved. Mutation validation, cloned writes, Web Locks, stale-write rejection and rollback remain in force. An old payload is migrated in memory and written only on the next successful mutation.

20 CTest groups and the 28-file publication check passed. New tests cover poll deadlines and duplicate voting, invalid polls, best-answer permissions and replacement, award limits and karma, thread ownership, private joins, approvals, moderator permissions, pins, circle flair, crosspost attribution, deletion, blocked visibility, migration, stale writes and failed-save rollback.

Browser verification covered publishing a timed poll, voting under another account, awards, a reply marked best answer and +5 profile karma, author continuation, credited crossposting, circle rules and privacy, pending-request content protection, approval, moderator appointment, pinned posts and circle flair.

Responsive browser check: at phone width, document scroll width and client width both measured 375px. Thread navigation scrolled to the requested part. Public search metadata excludes circle request lists and internal moderation settings.

Live verification on 2026-10-26: source e6f058ab27ddbf2adc200c8d2018bbc866c05c8b passed GitHub Actions run 40296322621 (build and deploy). The live page loaded v1.9.0 assets, exposed Popular, and successfully published a local demo poll with a closing time. Browser console errors: none. Popular retains its view when opening replies.
