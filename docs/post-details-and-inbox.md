# Orbit 1.15.0 — Post details and conversations

Release date: 28 October 2026. Applies to the fictional demo and the separate Supabase cloud pilot. The original v1.0.0 release and subsequent release history remain preserved.

## Browse, then open a conversation

Home tiles show the author, Follow (for another account) and a three-dot menu at the top. The title links to a new tab. Its lower row contains the post date, like count, repost toggle and share icon. Body text, comment previews, award buttons and save buttons no longer clutter the home tile. The menu contains Save/Unsave post, Copy link to post, Report post and Award post. Authors manage their posts inside the full view. Deleted demo posts retain their discussion but disable voting and reposting.

The new tab contains the same post header and lower row, followed by full text, existing purpose/topic/event details and the conversation. Ordinary links preserve the feed tab and support browser link actions. Demo links may carry a fictional persona identifier; this only selects a local simulation, never authenticates a cloud account. Cloud access always uses the existing verified session.

## Comments

A comment's visible header contains only the student's profile name and reply date. Clicking it collapses its content and nested replies. The footer contains Reply, Like with the positive total, Dislike without a total, and a three-dot menu: Share comment, Save/Unsave comment, Block account (other students only), Report comment. An owner-only disclosure retains edit/delete tools. Accepted-answer selection is kept above the discussion for question authors.

Each account has at most one reaction per comment. Liking and disliking replace one another; pressing the active reaction removes it. Best uses net reactions, with accepted answers first. New orders recent replies first within their parent thread. Controversial favours replies receiving a balanced mixture of reactions. Dislike totals are not displayed. Reply links focus the requested comment, including a cloud lookup when it lies outside the first batch.

**Chosen cloud limit:** Best/New/Controversial sorts the comments loaded into the page, initially 50. Load older comments expands that set. Global database ranking before pagination was deliberately deferred at the owner's request. The demo ranks its locally available discussion, initially rendering 30 comments with a Load more control.

Saved comments live in My profile. Cloud saves are account-scoped; demo saves stay on the device. Content reports enter the cloud moderator queue; demo reports are local simulations and appear in the reporting account's safety history. Cloud post awards and reposts retain original authorship; private-circle posts cannot be reposted. Deleted cloud originals become unavailable to repost/profile queries rather than exposing a retained copy. Awards are symbolic and do not involve payments. Existing richer demo karma/badge behaviour remains separate from cloud pilot parity.

## Circles and messages

Circle directory cards contain exactly the name, description and member count. The name opens a new tab with an Orbit cover, community introduction, conversation area and About/rules/moderator panel. Existing join requests, private membership, circle settings, pins and moderator tools remain available to their permitted roles. Public demo circle discussions can now be read by guests and non-members; posting still requires membership. Private posts remain member-only. The demo's older circle conversation model remains separate from its public-feed post model; the cloud uses shared posts scoped to circles.

Notifications has no search field. Search remains in the main navigation.

Messages opens a conversation list with student names, recent message previews, dates and unread badges. New conversation chooses connected students. Opening a row shows its history, composer and existing Four in a Row / Dots and Boxes controls. Ended connections keep read-only history; blocks hide the conversation. Mobile shows either the list or the selected chat, with a Conversations return control. Cloud messages and games still require an accepted connection; viewing a list or changing a read marker cannot grant one.

## Storage and database changes

Demo schema 8 upgrades in memory to 9 while preserving existing posts, requests, messages, games and circle data. Reading an old backup does not overwrite it; a successful mutation persists the upgraded state. New arrays hold comment reactions, comment saves and local content reports.

Supabase migration `20261027232046_post_details_inbox.sql` adds a reaction value to existing positive comment votes, message read markers, private comment saves, reposts, awards and content reports. Existing positive votes retain value 1. New tables have RLS; direct browser writes are revoked. Checked server operations obtain the actor from the verified session and enforce readable content, blocks, memberships and moderator rights. No accounts, posts or messages were removed. Existing messages start unread until their recipient opens the chat.

This migration is recorded in Supabase's migration history. Earlier project migrations had been applied manually and are not recorded there. Do not blindly replay old migrations or run a full database push until that historical mismatch is deliberately reconciled. The declined broader ranking migration was not applied and is not included in this release.

## Validation

- 26 release CTest groups passed, including reaction switching, private saves, report validation, old-state preservation, ranking, guest/private circles, deep links and inbox ordering. Existing game, backend and C++ groups passed.
- Publication check passed with exactly 44 expected files, including the shared discussion components and responsive stylesheet.
- `supabase/tests/discussion-inbox.sql` passed against the actual project: reactions, ranking metadata, report deduplication and moderator isolation, private-circle repost denial, profile reposts, awards, focused reply lookup, contact filters, inbox/read markers, direct-write denial, blocks and guest restrictions. All synthetic records rolled back.
- Existing `supabase/tests/campus-experience.sql` also passed after the migration, with its fixtures rolled back.
- Browser checks cover guest browsing, actual new-tab post and circle links, demo comment participation, menus, collapse behaviour, sorting, Notifications without search, profile saved comments, message previews, both game entry points and responsive layouts. Cloud discussion controls use a local fictional fixture; signed-in cloud interactions are covered by database regression tests, not a claim of a real browser account test.

Security/performance advisors found no new public-table RLS or missing-foreign-key-index issues. Existing intentionally policy-free private moderator/rate-limit tables remain inaccessible to clients. The pre-existing leaked-password protection warning remains: [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No paid upgrade or Auth setting change was made. Indexes newly reported as unused were retained because a small pilot has not accumulated representative traffic.

The cloud pilot's existing restricted email delivery and other feature-parity limits still apply; see [cloud pilot scope](supabase-cloud-pilot.md).
