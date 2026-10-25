# Orbit 1.8.0 — Search, authorship and profiles

## Search
One Search Orbit box finds public feed post titles/text, interactive demo people (names, handles, bios, university/campus), circle names/descriptions, and hashtags. Search is case-insensitive substring matching, limited to 120 characters, with grouped results and a no-results state. Search is available to guests and from the Search menu. Sample catalogue profiles are still available through Discover's 45-profile browser; they are not interactive accounts. Private messages and member-only circle conversations are not indexed. Blocked authors/circle organisers and deleted contributions are excluded for the signed-in viewer.

## Author controls and deleted originals
Authors can edit their public posts/quotes and comments, preserving IDs, replies, votes and timestamps. Edits display an Edited label; new mentions notify once without repeating old mention alerts. Plain reposts cannot be edited, but can be deleted. Post title, body and flair can be changed; topic stays as published.

Delete requires explicit confirmation in the interface. Deleted text is replaced in persisted data with a tombstone; it is not merely hidden with CSS and cannot be restored through the app. A post's votes, saves and pin are removed. Existing replies remain readable through the post's link, but no new replies or engagement can be added to the deleted root. Deleted comments retain their place so replies survive. Authors may still edit/delete their own existing comments under a deleted post.

Existing reposts/quotes remain with an Original post deleted notice; quote authors keep their own commentary. A repost points to the live original record, so edits appear there too. The deleted source no longer contributes to search, Trending, profile activity or karma. Public deep links to deleted posts show the tombstone and existing replies. New reposts/quotes of a deleted source are rejected. Circle moderation remains separate from these public-feed author controls.

## Profiles
Public tabs: Posts (originals and quotes), Replies, Upvoted and Reposts. Upvoted activity and follower relations are public in this demo. Replies open their parent conversation. Public profiles show karma and an optional profile flair using the existing six flair choices. Only the owner can change their profile flair. Pins apply to the Posts tab. Deleted contributions are omitted.

## Who to follow
Shown in the feed rail and Discover (including mobile). Candidates exclude self, existing follows and blocked accounts. Explainable score: same university +4; same campus within that university +6; each shared visible circle +3; each shared hashtag in authored original/quote posts +1 (maximum +5). Names break ties. Guests see unpersonalised community suggestions. This is a local heuristic, not a production recommendation model.

## Followers, following and quick cards
Profile counts open follower/following lists. Author names offer quick cards with university/campus, bio, karma, flair, profile link and Follow/Unfollow. Cards open on hover or through a native disclosure for keyboard/touch; Escape dismisses them. Follow is independent of mutual connections and messaging permission. Blocked actors are excluded from the visible graph.

## Storage and verification
Payload schema 6 adds profile flair records. Migration preserves existing posts, relations, notifications and conversations, and is saved only with the next successful mutation. Revision validation rejects corrupted records and leaked text in deleted tombstones. Mutations use the existing stale-write protection and atomic persistence. No backend, real accounts or cross-device synchronisation is added.

Verification on 2026-10-25: all 18 CTest groups passed; the publication checker accepted 25 expected files; JavaScript syntax and Git whitespace checks passed. Tests cover search, combined campus/interest filters, author permissions, tombstones and retained quote/reply structure, edit mention deduplication, migration, stale-write rejection, rollback, ranking reasons, profile tabs, and private saved-list isolation.

Browser checks: grouped guest search; author edit dialog and saved Edited label; profile flair; Discover campus and interest/name filtering; guest messaging gate; profile connection request and acceptance; accepted profile Message opens the selected conversation; local report and block visible in Discover management; private Saved post under My profile; follower list and keyboard quick card. At phone width, the document's 375px scroll width matched its 375px client width. No console errors. Events remain paused.


## Navigation consolidation (2026-10-25)
Discover now includes student search plus combined campus/interest filters, and a Requests, connections & safety view retaining acceptance, cancellation, removal, blocks, reports, unblocking and shared-demo reset. Opening a student profile shows their posts and Follow, Message, Connect/accept/cancel, Block and Report controls. Messages still require a mutually accepted connection; the always-available Message button explains this when needed. Guests can browse profiles and are prompted to choose a demo account to participate. The separate Connections menu entry is removed.

My profile opens the owner's public profile with Edit profile and Posts / Replies / Upvoted / Reposts / Saved tabs. Saved is shown only on the active actor's own profile; it contains private saved posts and a Saved profiles link for existing catalogue bookmarks. The separate Saved menu entry is removed. Existing bookmarks, connections and conversations are retained. The 45 sample catalogue profiles remain a separately labelled, non-interactive catalogue.

## Live release verification
Verified on 2026-10-25 at https://sir-sim0n.github.io/UniMatch/. Source commit: 4ca23b9a9bbc11a4e4bcd036551935d635b95259. GitHub Actions run 40192901223 completed build and deployment successfully. Live checks confirmed the consolidated menu without separate Connections or Saved entries, Mahikeng filtering returning Naledi, and the public profile with posts, Follow, Message, Connect, Block and Report. Browser warning/error logs were empty. Local checks above cover private Saved and accepted-connection messaging. Release: v1.8.0.


## Account-focused My profile (v1.8.1)
The owner’s profile omits the global search form, discovery shortcuts, Who to follow, Trending, general feed sorting and campus/topic filters. Its single-column layout retains account details, editing, flair, follower/following lists, publishing and personal activity tabs including private Saved. Search and Discover remain separate main-menu destinations. Other students’ public profiles retain their existing browsing controls.
Verification: release build and 25-file publication check passed; local browser confirmed My profile has no search field or discovery panels and Saved remains accessible.
Release verification on 2026-10-25: all 18 CTest groups passed. GitHub Actions run 40196583387 built and deployed source b021ffc867f9e127ad30d96e39d3e8b7bda645be successfully; the live page loads v1.8.1 assets.
