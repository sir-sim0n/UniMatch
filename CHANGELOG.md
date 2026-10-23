# Changelog

## 1.5.0 — Interest circles — 2026-10-23

- Added three starter circles and circle creation, joining and leaving.
- Added member-only posts and replies, with organiser hide/restore controls.
- Applied block visibility and posting checks; preserved content when members leave.
- Migrated earlier shared social data to payload version 3 without dropping connections, reports or messages.
- Added circle lifecycle, moderation, permission, migration, conflict and failed-save tests.


## 1.4.0 — Demo messaging — 2026-10-23

- Added local conversations between accepted connections, unread counts and simulated read status.
- Added Messages navigation and direct conversation buttons on connected profiles.
- Recheck connection/block state before sending or marking read; failed saves preserve drafts.
- Preserve read-only history after disconnecting; hide blocked conversations.
- Migrate legacy social records without losing connections, blocks or reports. Shared social reset includes messages; profile reset preserves them.
- Added message lifecycle, isolation, migration, conflict and failed-write tests.


## 1.3.0 — Demo connections — 2026-10-23

- Added mutual requests, accept/decline/cancel/remove, directional blocking and local reports between switchable demo accounts.
- Added a shared, versioned social repository with validation, stale-tab protection, failed-write rollback and explicit all-account social reset.
- Removed gender/age discovery controls and public age/gender display for the campus-only direction.
- Profile resets preserve shared social records. Reports are not transmitted; messaging remains a later phase.
- Added transition, conflict and recovery tests, and versioned all changed browser dependencies.

## 1.2.0 — Demo accounts — 2026-10-23

- Adopted the demo-first roadmap; real-account hosting is deferred.
- Added original-account preservation and three ready-made fictional NWU accounts with switching and independent profiles, preferences and bookmarks.
- Added remembered active selection, scoped resets, storage recovery and isolation tests.
- No real authentication or cross-device sharing. Social features will follow in later phases.

## Unreleased — v2 planning — 2026-10-23

- Completed Phase 1 product scope, privacy defaults, architecture, conceptual data model, cost proposal, environment/migration plan and Phase 2 acceptance backlog.
- Confirmed campus connections only; dating and gender/age matching excluded from v2.
- Selected Supabase + Cloudflare Pages + custom SMTP as the planned real-account architecture. No resources provisioned or paid services purchased.
- Existing Orbit v1.1.0 demo and release tags remain unchanged.

## 1.1.0 — Orbit / Sea Glass — 2026-10-23

- Renamed the displayed product to Orbit with the slogan “Your campus. Your Interests. Your Connections”.
- Recreated the supplied reference designs as original scalable SVGs: transparent symbol, horizontal transparent logo, full stacked logo, and rounded app icon/favicon. Reference JPEGs are not shipped.
- Replaced midnight neon styling with the Sea Glass palette across welcome, profile forms, filters, cards, saved profiles, detail pages, errors, storage notices, and reset dialog.
- Updated browser titles, metadata, build version, release documentation, and publication asset checks.
- Kept existing profile IDs, browser storage format/key, C++ API/module identifiers, repository name, and public URL compatible. Existing saved demo profiles and bookmarks remain available at the same origin.
- Interpreted the incomplete blush hex `#F7E9E` as `#F7E9EE`; recorded as an explicit design assumption.

## 1.0.0 — Original UniMatch baseline

Original site deployed 2026-10-13. Baseline tag created 2026-10-23 at `fb6125b`; internal build metadata is 0.7.0. Includes 45 fictional adult profiles, four universities, all three NWU campuses, discovery, bookmarks, browser persistence, and tested GitHub Pages deployment.
