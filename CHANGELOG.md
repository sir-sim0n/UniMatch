# v1.14.0 — 2026-10-27

- Refined feed cards, six student post purposes, reply previews and threaded discussion reading.
- Added campus shortcuts and a responsive Around campus panel while retaining Create/Search navigation.
- Added optional event dates/venues to posts and upcoming public campus events with time and privacy filters.
- Added circle cover presets, introductions and clearer rules/moderator/pin controls.
- Added account-scoped device reading preferences and return-to-feed position; cloud saved posts sync with the account.
- Added cloud comment voting, accepted-answer permissions/deletion handling, private-safe Popular filtering and new RLS-backed save/vote tables.
- Added regression coverage and documented persistence, feature-parity and pilot limits. See docs/campus-conversations.md.

# v1.13.0 — 2026-10-27

- Added a separate Supabase cloud pilot for shared accounts, profiles, posts, connections, circles, messages and both games.
- Added scoped database access, verified-email participation, authoritative game commits and rollback-only cloud security tests.
- Preserved the full fictional demo; richer feature migration and public email delivery remain pending.
- Pinned and bundled the Supabase client; expanded release checks. See docs/supabase-cloud-pilot.md for scope, setup and validation limits.

# v1.12.0 — 2026-10-27

- Paginated feeds, search, comments and histories; incremental vote/save/follow controls.
- Indexed ranking/counts/karma and iterative deep-comment traversal.
- Transactional IndexedDB social migration with backup/restore and stale-write protection.
- Lazy feature modules, cached profiles/catalogues and on-demand completed game boards.
- Added a separate authenticated SQLite local pilot with protected messages/circles and authoritative games; cloud hosting remains pending.
- Added backend and performance regression groups, a repeatable browser storage harness, and CSP-compatible WebAssembly bindings. See docs/scale-improvements.md.

# v1.11.0 — 2026-10-26

- Added Dots and Boxes challenges in Messages with a 3-by-3 box board, scores, extra turns and saved matches.
- Shared invitations, notifications, resignation, expiry and rematches; preserved existing Four in a Row games.
- Added game-rule and persistence regression coverage. See docs/dots-and-boxes.md.

# Changelog

## 1.10.0 — Four in a Row in Messages (2026-10-26)
- Added connection-only challenges, accept/decline/cancel controls and saved turn-based boards.
- Added horizontal, vertical and diagonal wins, draws, resignation and rematches with alternating starters.
- Added in-app game notifications, seven-day inactivity expiry and cancellation on block/disconnect.
- Added keyboard-accessible column controls, distinct player symbols and mobile/dark styling.
- Migrated shared demo state to schema 8. All gameplay remains local; see docs/four-in-a-row.md.

## 1.9.1 — Create navigation and streamlined posts (2026-10-26)
- Moved the public post/poll composer to Create in the main menu; removed Home search.
- Placed Repost beside Save and Share, and Give an award beside Follow.
- Removed circle crossposting controls from posts; existing attributed crossposts remain readable.
- Preserved author thread continuation and account-gated participation.

## 1.9.0 — Depth and community (2026-10-26)
- Added timed polls with one vote per account, live closing and visible results.
- Added author-selected best answers (+5 karma) and student-given awards (+2 karma).
- Added attributed circle crossposts and ordered author post threads.
- Added circle rules, pins, multiple moderators, private membership requests and per-circle flair.
- Added a global Popular feed powered by Hot ranking.
- Migrated shared demo data to schema 7 while retaining existing content. See docs/community.md for rules, permissions and limits.

## 1.8.2 — Light, dark and system appearance (2026-10-25)
- Added Appearance under My profile with System, Light and Dark choices.
- Default System follows live device appearance changes; explicit choices persist across visits and browser tabs.
- Added a Sea Glass dark palette throughout the app.
- Preference is browser-wide and reports unavailable persistence without blocking use.

## 1.8.1 — Account-focused My profile (2026-10-25)
- Removed global search, discovery shortcuts, recommendations, Trending and campus-feed filters from the owner’s profile.
- Kept profile editing, flair, follower lists, publishing and Posts / Replies / Upvoted / Reposts / Saved activity.
- Search and Discover remain available through the main navigation.

## 1.8.0 — Discover, search and profiles (2026-10-25)
- Merged Connections into Discover, with campus/interest search and profile-level social actions.
- Moved Saved into My profile; preserved existing private bookmarks.
- Added unified public search for posts, people, circles and hashtags.
- Added author edit/delete controls, edited labels and deletion tombstones preserving repost attribution and conversations.
- Added Posts / Replies / Upvoted / Reposts profile tabs and profile flair.
- Added explainable Who to follow recommendations and public follower/following lists with quick-follow cards.
- Migrated shared demo state to schema 6. See docs/discovery-and-profiles.md.


## 1.7.0 — Campus engagement demo (2026-10-24)
- Added account-specific notifications and stable @mentions.
- Added attributed reposts and quote posts.
- Added Hot/Top with time ranges and collapsible comment branches.
- Added hashtags, filtering and seven-day Trending.
- Added optional post flair, own-profile pinning and vote-derived karma.
- Migrated shared demo data to schema 5; preserved guest browsing and existing menu options.
- See docs/engagement.md for exact behaviour, limits and verification.


## 1.6.1 — Feed design refinement — 2026-10-24

- Refined typography, post spacing, metadata, composer and community cards.
- Replaced mixed text symbols with consistent local vector icons.
- Made optional campus/topic filters collapsible and mobile filters full-width.
- Added an accessible mobile menu that retains every existing destination and closes after navigation.
- Preserved guest permissions, social data and feed behaviour; events remain paused.


## 1.6.0 — Public campus feed — 2026-10-24

- Replaced the profile-first landing with a guest-readable discussion feed and Sea Glass sidebar layout inspired by the supplied reference.
- Preserved all existing menu options and added Home, For you / Following / Latest, public profiles, optional topics and university/campus filters.
- Added independent one-way follows, public profile posts, nested comments, upvote toggles, saved posts and gated copy-link sharing.
- Require an explicitly selected demo account for participation; no automatic sign-in on page load. Browse as guest returns to read-only browsing.
- Preserved connections, private demo messages, circle membership and legacy profile bookmarks; migrated shared storage to version 4.
- Added guest permission, feed lifecycle, block, thread, failure and migration tests.


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
