# Orbit v1.3.0 — Demo connections

Date: 2026-10-23. Demo-first Phase 2. No real authentication, remote service, paid backend or messages to other people.

## What students can test

Open Connections while using a demo profile. Send a request to another switchable account, switch accounts, and accept or decline it. The sender can cancel pending requests; either participant can remove an accepted connection. Pending/accepted duplicates and self-requests are rejected. A decline starts a seven-day local demo cooldown for the pair. Accepted connections are mutual.

Block hides both accounts from each other's connection directory and removes their pending/accepted relationship. Only the blocker sees/manages their own block list. Unblocking never restores relationships, and a block in the other direction still applies. Blocking a pending request prevents later acceptance. Report offers Spam, Harassment, Impersonation or Other plus optional details (1,000 Unicode code points). Reports appear only in the reporting account's view and explicitly say they are recorded locally, not sent to a moderator or university. This is simulated privacy, not secure isolation from someone with browser access.

The directory uses personal, naledi, sipho and ayesha as stable actor IDs. It displays each account's editable profile; a blank or corrupt profile is omitted. Cross-campus interaction is intentionally enabled for this demonstration. The separate 45 fictional catalogue profiles remain bookmarkable examples, not interactive accounts. No fabricated acceptance or moderation actions occur automatically.

## Campus-only presentation

Removed gender entry/visibility controls, gender filters, age-range discovery filters and age/gender display on cards/detail screens. Age is retained privately in the legacy profile form to enforce the fictional-adult dataset contract; gender remains an internal legacy-schema field and is not displayed. Legacy discovery preferences are neutralised in memory when an account activates; the stored record is updated only on the next normal save. Public profiles and bookmarks remain compatible.

## Storage and rules

`web/demo-social.mjs` is the new local social repository and owns state transitions. `web/social-ui.mjs` handles presentation only. Existing catalogue/profile logic remains in C++/WASM. This explicitly extends the original C++-only domain architecture for the demo social layer; a future backend must reimplement/enforce these operations server-side rather than trusting this module.

Shared key: orbit.demo.social.v1. Version 1 contains requests (from/to/status/at), directed blocks, and reports (id/from/to/reason/details/at). One request record per unordered pair. Read validation rejects unknown actors, duplicates, invalid states, malformed timestamps, unsupported versions, invalid report fields and active blocked relationships. Data is never silently overwritten on failed restore.

Each operation clones state, checks transition rules, then persists before committing to memory. A storage-write failure leaves the operation unapplied and shows an error. Web Locks serialise same-origin operations where available; expected-value comparison rejects stale-tab writes. Without Web Locks this remains best-effort and not transactional database isolation. Reload saved connections explicitly imports another tab's changes; invalid or unavailable storage disables mutation. The UI guards against late async profile responses overwriting a newly selected screen/account.

Profile Reset demo keeps shared connections, blocks and reports. A separate explicit confirmation in Connections resets shared social data for ALL demo accounts and preserves profiles, bookmarks and unrelated browser storage. Reports therefore survive ordinary profile resets. Shared reset is a deliberate test-tool action, not account deletion.

## Verification

The demo_social Node suite tests real repository behaviour: self/unknown actors, duplicate requests, recipient-only acceptance, repeated acceptance, decline/cooldown, cancellation/removal, blocking both directions, unblocking, report ownership/validation, storage failure rollback, refresh, concurrent stale-tab operations, corrupt-state recovery, version rejection and scoped shared reset. It joins the existing account-isolation and WASM tests. Browser and deployment results are recorded at release.

## Next phase

Messaging uses these actor IDs and accepted relationships. It must recheck blocks and connection state on send and restore. There is no chat UI, read receipt, realtime delivery or unread-message counter in v1.3.0.

Local release verification: all 13 CTest groups and the 17-file publication check passed. Browser checks confirmed blank-profile startup, account switching, request receipt, acceptance surviving reload, bidirectional blocking, non-restoring unblock, local report confirmation and account-scoped report visibility. The 390px phone layout was checked visually. Live deployment verification follows publication.

Published verification (2026-10-23): GitHub Actions run 39994865109 completed successfully for e5da14581a5f61d5a33b6598f1fa36c85dfc50ee. The public GitHub Pages site loaded the updated demo account navigation and Connections screen with existing profiles restored and no browser console errors. Release tagged v1.3.0.
