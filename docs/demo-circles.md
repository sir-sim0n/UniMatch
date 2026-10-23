# Orbit v1.5.0 — Interest circles

Date: 2026-10-23. Demo-first Phase 4. All activity remains local to one browser; no real moderation, remote accounts or paid services.

## Try it

Open Circles as Sipho and join Campus Coding Circle. Publish a fictional post. Switch to Naledi, the circle organiser, open the circle and reply. Hide the post, switch back to Sipho to see that it is absent, then switch to Naledi to restore it. Start a circle creates a new circle owned by the current persona.

The starter circles are Campus Coding Circle (Naledi), Fresh Air & Football (Sipho), and Creative Campus (Ayesha). They are cross-campus and do not require a one-to-one connection. All starter content is empty so student actions are never fabricated.

## Membership, content and moderation

Available circle descriptions are visible to all demo personas. Only members see the feed or publish posts/replies. Joining twice is rejected. Leaving retains authored content for other members and removes feed access; rejoining restores access. Organisers cannot leave their own circles in this phase. Circle creation accepts a unique case-insensitive name up to 60 characters and a description up to 240 characters. Posts/replies accept 1–2,000 Unicode code points; browser fields conservatively limit UTF-16 units. Whitespace-only text is rejected and text renders literally, never as HTML.

Replies belong to a top-level post in the same circle; nested replies are not supported. Only the organiser can hide or restore content. Hidden top-level posts and all their replies disappear for ordinary members, while organisers can review and restore them. Hidden replies remain individually hidden when a parent is restored. Hidden posts cannot receive new replies. Moderation is reversible and labelled a local simulation. There is no automatic moderation, notification, escalation or real moderator.

Blocking a circle organiser makes that circle unavailable to the blocking pair, including posting. Blocking another member hides their posts/replies and the replies beneath their hidden parent posts, and prevents replying to their posts. It does not remove membership or erase content. Unblocking restores visibility and prior membership; unlike one-to-one connections, circle membership is not ended by blocking. Member totals include blocked members. This is demo presentation behaviour, not secure access control.

## Persistence, failure and resets

Shared social payload version 3 adds circles and posts under the existing orbit.demo.social.v1 key. Earlier version 1/2 payloads migrate in memory, preserving connections, blocks, reports and messages and adding starter circles. The next successful mutation saves version 3. Older app versions reject the newer payload. Validation checks circle IDs, unique members, organiser membership, known actors, field lengths, ordered unique post IDs and valid same-circle reply parents.

All circle changes use the existing shared Web Lock and expected-value stale-write protection. Validation and saving complete before in-memory changes are committed. Failed writes leave data unchanged and keep form drafts available. Invalid saved data is preserved and mutations disabled. Reload saved circles imports the current browser state. Without Web Locks, coordination remains best-effort localStorage handling, not server transaction isolation.

Profile resets keep circles, membership and content. Explicit shared social reset removes custom circles and posts, restores the three starter circles with organiser-only membership, and clears all other shared social data. Profiles/bookmarks remain unchanged. Switching screens/accounts, reloading or completing another circle action discards unsaved form drafts; save posts first. Account switching is not authentication: anyone using this browser can inspect all personas and stored data.

## Verification

The demo_circles suite covers creation, duplicate names, member-only posting/reading, joining/leaving, organiser restrictions, post/reply relationships, reversible moderation, parent visibility, blocks, field validation, persistence, storage-write rollback, stale writes, migration, corrupt data and scoped reset. Existing account, connection, messaging and C++/WASM tests remain enabled. Browser and deployment results follow below.

## Next phase

Events and RSVPs. Circle editing/deletion, organiser transfer, member bans, attachments, nested replies and real moderation are outside this release.

Local verification: all 15 CTest groups passed and the publication checker accepted 20 files. Browser testing confirmed joining, posting, switching personas, replying, organiser hide, member visibility, restore and refresh persistence. Custom circle creation worked. A 390px mobile layout had no horizontal overflow. No browser console errors were recorded.

Live verification: GitHub Actions run 40021581222 passed build and deployment for 7498eff3cbcb681e5a48bce48d7cbf48ac2b7a9f. The public site loaded the starter circles, accepted an explicitly labelled fictional test post, and preserved the existing Naledi/Sipho messages after saving the migrated payload. The test post remains in this browser as a demonstration. No browser console errors were recorded. Release tagged v1.5.0.
