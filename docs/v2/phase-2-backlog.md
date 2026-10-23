# Phase 2 — implementation handoff

Phase 1 completed 2026-10-23. The following work is planned, not implemented. Phase 2 delivers accounts and profiles in staging, not a public student launch. Phases 3–6 and the Phase 7 readiness gate remain necessary.

| Order | Work item | Acceptance evidence |
| --- | --- | --- |
| 1 | Create isolated v2 app and environment configuration | Existing demo builds unchanged; no secret in Git/bundle; staging cannot access production |
| 2 | Create local DB migrations, catalogue seeds and permission tests | Fresh install and upgrade pass; only catalogue data seeded, no fake accounts in production |
| 3 | Configure Auth and transactional email | Verified sender, environment-specific redirects; real test mailbox receives verification/recovery; expired links fail safely |
| 4 | Implement invitation and eligibility gate | Uninvited, expired, reused and wrong-email invitations fail at API level; concurrent redemption succeeds once |
| 5 | Build signup, verification, login, sign-out and recovery screens | Tested success, invalid input, offline, expired session and retry states; generic account-enumeration-safe responses |
| 6 | Build campus-only onboarding | Mandatory 18+ and student declarations, policy versions, valid campus/degree/interests; gender/age matching absent |
| 7 | Profile editing and discovery opt-in settings | Owner can edit own fields; other account cannot write; changing campus cannot bypass eligibility; opt-in starts off |
| 8 | Account lifecycle and deletion | Recent authentication required; account immediately hidden/disabled; deletion job idempotent; sessions/caches handled; failure and purge status visible to operator |
| 9 | Accessibility, mobile and security checks | Keyboard flow, readable errors, labels, focus and mobile layouts; no raw HTML injection; protected APIs tested without the UI |
| 10 | Staging handoff and changelog | Two independent browsers demonstrate cross-device profile persistence; all tests pass; known limits and recovery steps documented |

## Required negative permission tests

Use accounts A and B plus unauthenticated, unverified, onboarding-incomplete and suspended users. Test direct API calls as well as screens. A cannot read B's private eligibility record, email, invitations or future bookmarks. A cannot alter B's profile or set staff/verified/active flags. Unauthenticated and incomplete accounts cannot enumerate profiles. Guessed UUIDs, altered payload ownership, replayed tokens and expired sessions do not bypass rules. Race tests cover invitation consumption and profile/eligibility activation.

Any public catalogue read is an explicit exception, not evidence that user tables may be public. Future phases add connections, block and chat access tests before enabling those features. Do not grant broad temporary permissions to make UI development easier.

## User-facing screens in Phase 2

Welcome / sign-in; invitation sign-up; check your email; confirmation outcome; password recovery and reset; eligibility; profile setup; discoverability choice; account home; edit profile; privacy/account settings; deletion confirmation/result. Account home links only to available features, with upcoming modules clearly labelled rather than nonfunctional controls.

## Dependencies to resolve during setup

Owner access to Supabase, Cloudflare and transactional-mail provider; available sender domain/DNS access; pilot campus selection before invitations; budget approval before paid provisioning. Do not ask for passwords or secret keys in chat. Use provider sign-in and secret stores when resources are created.

## Later phase gates

3: server-enforced connections, bookmarks, blocking and reporting, including race tests.
4: participant-only private text delivery, reconnect handling and moderation evidence.
5: membership-controlled circle discussions and staff moderation.
6: event time/venue, transactional RSVP capacity and cancellations.
7: invited usability pilot, restore/deletion drill, no critical defects, operational owner and launch decision.
8: choose expansion work using student feedback; no automatic feature commitments.
