# Orbit v1.12.0 — scale improvements, 27 October 2026

## Delivery status

1. **Bounded browsing:** first 25 feed/profile/search cards; Load more with scroll preservation; 30 notifications/comments, 40 messages, 10 completed games at a time; circle conversations paginated. Opening a post shows that conversation without mounting the surrounding full feed. Voting, saving and following update controls in place.
2. **Indexed calculations:** snapshot maps for posts, replies, votes, scores, awards and author karma; Hot/Top rank computed once per post, with the previous tie-breaking, period, follow and pin behavior preserved. Readability checks reuse an ID map. Immutable projected snapshots make cached counts safe.
3. **Transactional storage:** shared social state migrates from `orbit.demo.social.v1` to IndexedDB `orbit-social-v2`. The old localStorage payload is retained as a recovery copy and is no longer the active source. IndexedDB stores individual collection records and revision metadata; one read/write transaction applies changed records and rejects stale revisions. Common activity clones only affected collections, does not serialize the whole social dataset, and rolls back in-memory state if commit fails. Complex operations still validate the complete state; this is a remaining optimization opportunity. Profiles/preferences continue using the existing per-account persistence adapter.
4. **Deep threads:** iterative traversal, parent/children map, capped visual nesting and 30-comment batches. No recursive DOM construction over the complete comment history.
5. **Lazy features/history:** Messages, Circles and Connections modules load on first navigation. Catalogue responses and inactive profile snapshots are cached with storage-key invalidation. Completed boards are constructed only on expansion, history is bounded and completed matches have no running status interval. Timer cleanup runs on leaving/rebuilding the section. The WebAssembly build disables dynamic JavaScript evaluation so it can run under the pilot server's strict CSP.
6. **Shared backend:** an authenticated, durable, server-authoritative local pilot is implemented and tested. See `backend/README.md`. Public hosting is pending; it is not connected to the live GitHub Pages demo. The pilot implements the account/feed/connection/circle/message/game/report foundation, not all demo feature parity. No paid service or cloud account was provisioned.

## Migration and recovery

Close older Orbit tabs before upgrading. On first load, legacy social data is validated and imported atomically. A failed import leaves the legacy value untouched. Existing IndexedDB data wins on subsequent loads. Shared reset affects the active IndexedDB dataset; the retained legacy copy is not silently re-imported. No retention rule deletes old content.

My Profile offers **Export social backup** and **Restore social backup**. Export first before restore or shared reset. Restore validates the format/schema before committing and requires a replacement confirmation. It replaces all demo accounts' shared social data; it does not change account profiles/preferences. Invalid backups and failed commits leave current data intact. Other tabs receive a change notice and must refresh before writing.

IndexedDB availability is required for the new social adapter. A browser that prevents database access may fail to load the social demo; the legacy payload is preserved. No silent fallback writes to an older source.

## Verification

- 23 automated CTest groups, including new ranking-parity/content-growth and shared-backend security/rules tests.
- Publication checker expects 31 files; backend code and data are not part of the public static artifact.
- Real-browser IndexedDB regression: legacy migration/preservation, record persistence, stale-tab rejection, reload, reset, backup restore, invalid-backup rollback and simulated failed-commit rollback; unrelated collections keep their references on simple saves. Re-run with `python scripts/serve_browser_tests.py`, then open http://127.0.0.1:8031/ . The page uses an isolated temporary database and deletes it afterwards.
- Full frontend: account activation, in-place upvote, refresh persistence, backup controls, lazy Circles/Messages and a Dots and Boxes invitation.
- A browser fixture with 10,000 posts/20,000 replies/20,000 messages mounted **25 posts and 1,312 elements**, with **2,723 ms** through two animation frames in one local sample. This includes full backing-state processing and is not a Web Vital or phone measurement. Load more mounted 50 cards. A separate 20,000-deep reply fixture displayed 30, then 60 comments without recursion or console errors.
- Shared pilot: browser registration with fictional QA details, post publication, logout and guest visibility. Automated tests additionally cover persistence across server restart, private circle restrictions, private messages, report authorization, CSRF/origin checks, author ownership and two competing moves (one success, one conflict).

## Before/after diagnostic benchmark

Same synthetic shape as the audit: N posts, 2N replies/messages/votes; three samples and memory-backed legacy storage. Current snapshots are frozen to exercise the cache used by the UI. Runs occurred separately on the same machine under varying load, so these are diagnostic comparisons, not throughput guarantees. The save-mutation column in raw results measures the retained legacy adapter, not IndexedDB disk performance.

| Posts | Previous Hot sort median | New Hot sort median |
| --- | ---: | ---: |
| 100 | 26.56 ms | 0.60 ms |
| 1,000 | 791.48 ms | 9.50 ms |
| 5,000 | 28,230.93 ms | 12.69 ms |

The separate automated test sorted 10,000 posts in approximately 100 ms in one run and compares the new order against the legacy algorithm for all sort modes/time ranges, pins and karma. Raw new benchmark results are in `docs/audits/2026-10-27/optimized-results.json`.

## Remaining boundaries

The browser still reads/project-processes the full local social snapshot; pagination bounds DOM work, not the initial dataset load. Complex mutations may still copy/validate multiple collections. Keep profiling on actual phones and larger interaction histories. Do not claim a concurrent-user capacity or production readiness from these tests. The backend needs hosting, cloud identity integration, feature migration, recovery/verification flows and deployment monitoring before a real-user launch.

## Live release verification

GitHub Actions run 40481508414 built and deployed product commit 3cb1581c0401c397357b810cb5d383f26c510d52 successfully. The live site loaded v1.12.0 assets. Four pre-existing posts and the active Dots and Boxes match plus resigned Four in a Row history remained available after migration. My Profile exposed Export social backup and Restore social backup. The live mobile profile had matching client/scroll widths of 375px. No console errors were captured on the fresh live verification tab. Screenshot: orbit-v1.12.0-live.png in the task workspace. The shared backend remains a separate local pilot pending hosting and integration.
