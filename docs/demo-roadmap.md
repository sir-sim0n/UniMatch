# Orbit demo-first roadmap

Decision: 2026-10-23. Real-account infrastructure is deferred to control launch cost. Campus connections only remains the product direction; no dating mode is planned. The existing v2 foundation documents remain a future production reference, not the active implementation plan.

## Phases

1. Demo account system: original account plus ready-made fictional personas, separate profiles/preferences/bookmarks, switching, persistence and account-scoped reset.
2. Local shared connections, blocking and reports; remove legacy dating-oriented gender/age discovery controls as part of the campus-connection flow.
3. Locally simulated conversations with stable sender/recipient identities and unread state.
4. Interest circles, membership, posts, replies and simulated moderation.
5. Events, RSVP capacity, cancellations and reminders within the demo.
6. End-to-end demo testing, accessibility and student feedback.
7. Optional real-account backend: revisit docs/v2, security, provider accounts and budget before any real-user rollout.

Each phase ships independently with a changelog, test evidence and a release tag. The current demo series continues as v1.x; v2 stays reserved for the future real-account platform.

## Phase 1 — v1.2.0

The Demo accounts screen offers Your original demo, Naledi Demo (Mahikeng), Sipho Demo (Potchefstroom), and Ayesha Demo (Vanderbijlpark). Ready-made personas are fictional adults. Their titles are stable account labels; their editable display names are stored inside their profiles. The current account label is always shown in the page banner.

Each persona has an independent C++ application session. The demo repository coordinates sessions and persists each to its own key. The original key unimatch.demo.v1 remains unchanged, so existing data requires no destructive migration. Active selection is remembered separately when storage allows it. Switching is explicit, not authentication; anyone using the browser can switch accounts.

Save profile before switching: unsaved form inputs are not submitted automatically. Accepted in-memory changes survive switching even when storage writes fail, but cannot survive closing/reloading the page. Conflict detection prevents an active or newly reselected cached persona from silently overwriting another tab's saved state. This remains best-effort localStorage coordination, not multi-user transaction isolation.

Reset demo affects only the selected account. The original account becomes blank; ready-made personas return to their starter profile with preferences/bookmarks reset. Corrupt saved accounts are isolated and show recovery options. Other personas and unrelated browser data are not removed. If storage is unavailable, clearly labelled memory-only operation remains possible.

## Data boundary for later phases

DemoAccounts is the local persona repository; stable actor IDs are personal, naledi, sipho and ayesha. visitor:local is internal to each isolated C++ core and must never be used as the sender ID in shared social data. Add a versioned shared social repository in Phase 2 for relationships and later messages/circles/events; scope every operation by stable actor ID. Do not add separate copies of shared conversations into individual account records.

The 45 discovery profiles are still a static fictional catalogue. Switched personas do not yet appear in each other's discovery results. Connections, messaging, reports, circles and events are not implemented by this release. Future social phases must define actor/profile mapping and how account resets affect shared records before enabling them.

The UI uses a data adapter so future backend work can replace persistence and operations. Client-side demo permissions are simulation only and cannot protect real personal data. No password entry, email delivery, remote database or paid service is introduced. Separate browsers/devices do not share state. GitHub Pages continues hosting the fictional demo.

## Verification

The new demo_accounts test uses the real WebAssembly engine to check account isolation, legacy restoration, per-account bookmarks, refresh, seed resets, failed-save memory retention, corrupt-account recovery, invalid IDs and cross-tab conflict handling. It runs alongside all existing tests. All 12 release test groups passed locally, and the publication check accepted 15 files. Desktop and 390px mobile account selection were visually checked. Browser testing confirmed separate Naledi/Sipho bookmarks, remembered selection after refresh, and selected-account reset. No browser errors or warnings were reported. GitHub Actions run 39992753594 passed build and deployment for ae189b0. Live-site verification confirmed account switching, separate Naledi/Sipho bookmarks and persistence after refresh. The temporary test bookmark was removed; no browser errors or warnings were recorded.

Release asset URLs carry a version for the page entrypoint, stylesheet, account module and persistence dependency to prevent old cached scripts from mixing with the new storage adapter. Increment these versions when these files change.
