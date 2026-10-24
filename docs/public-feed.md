# Orbit v1.6.0 — Public campus conversation

Date: 2026-10-24. User-directed redesign inspired by the supplied sidebar/feed reference. Sea Glass branding remains. This is still a fictional local demo, not a real-account launch.

## Navigation and browsing

Home is the default and opens in guest mode on every page load, including for browsers with saved demo accounts. No profile is created or selected to browse. Home has readable post cards, author identity and campus, optional topics, discussion threads, and real local interaction counts (no invented upvote/reply totals). The three initial fictional posts are clearly within the demo and use fixed dates, not fabricated relative timestamps.

All existing menu entries remain: Discover, Connections, Messages, Circles, Saved, My profile, Demo accounts and Reset demo; Home is added. Desktop uses a left sidebar, central discussion column and optional community rail. Smaller screens wrap the full menu and stack content. Discover exposes the public profiles of switchable demo students. Signed-in personas retain access to the original 45 static sample profiles through the discovery screen; these are reference characters, not followable accounts.

Guests can browse public posts, author profiles, comments, campus/topic filters, the student directory and circle descriptions. Connections, Messages, Saved and My profile remain account-scoped. Existing circle feeds remain members-only; public feed posts do not require a circle. Existing private messages are not made public.

## Participation and people graph

An explicit demo-account choice plus an existing/created profile is required to post, follow, upvote, save, copy a share link or comment. Guest action buttons open a dismissible account prompt without performing the action. Browse as guest leaves saved data intact. This is simulated gating, not secure authentication; real signup is still deferred.

Students publish to their own public profile and Home. Post titles allow 180 characters, body 4,000; optional topics come from a fixed set. Comments allow 2,000 characters and nested replies. Browser inputs conservatively limit UTF-16 units while repository rules count Unicode code points. All content renders literally through textContent. Whitespace-only content, invalid topics, invalid parents, cross-thread replies and unknown actors are rejected.

Following is one-way and independent from mutual connections. It does not grant messaging access. Following shows followed authors only; Latest sorts by timestamp/ID descending; For you puts followed authors first then sorts newest first. Campus/university filters use author profiles, so editing a profile changes where that author’s posts appear. Topic filters apply to post topics. Author pages show only that author’s posts. Upvotes and post saves toggle once per actor/post. Saved includes a Saved posts entry alongside retained legacy profile bookmarks.

Share checks the selected account, current state and block restrictions before copying a #post=ID link. A shared URL opens the thread in the same browser; user-created demo content does not travel to another browser/device. Clipboard failure displays a copyable URL. No social network integration, remote publication or pretend share count is included. Media uploads are not included in this text-first redesign.

Blocks hide the blocked author’s public content in the signed-in view and reject follow/comment/vote/share operations. Replies under a blocked comment are hidden with that branch. Guest public viewing remains possible; blocking is not a confidentiality mechanism for public posts. Existing follow records survive blocking but are filtered until unblocked. No follow grants a mutual connection.

## Data, failure and migration

Shared social version 4 adds feedPosts, feedReplies, follows, votes and postSaves under orbit.demo.social.v1. Versions 1–3 migrate in memory, preserving prior connections, reports, messages, circles and posts. First successful mutation persists the newer schema. Older app versions reject it instead of overwriting. Public reading does not save a social record. Three starter posts are supplied in memory until a mutation saves the state. Version 4 validation checks ordered unique IDs, known authors, valid parent-before-child references and unique actor/target relations.

Feed changes use the shared lock and expected-value stale-write checks. Failed saves preserve the old state and form draft. Corrupt storage disables interaction and preserves the data; recovery uses the existing explicit shared reset in Connections. Guest rendering cannot provide secure isolation against someone inspecting localStorage. Profile resets preserve public activity. Shared social reset resets feed activity to three starter posts and clears other shared data according to the existing contract. Drafts are not preserved when navigating, filtering, switching accounts or refreshing.

## Verification

The public_feed suite covers guest reads without writes, guest mutation rejection, independent follows, self-follow rejection, public posting, vote toggles, private saved lists, nested/cross-thread comments, blocked visibility/actions, stale writes, failure rollback, schema migration and invalid reply cycles. Existing account, connection, messaging, circle and C++ tests remain enabled. Browser and deployment results are recorded below.

## Deferred

Real authentication, remote publishing, image/video upload, production moderation and cross-device sharing remain future work. Events are deliberately paused for this redesign.

Local verification: 16 CTest groups and the 22-file publication check passed. Browser checks covered guest landing with all menus present, reading threads without an account, upvote/share/comment gates, account selection, public profile publishing, independent Following feed, vote/save toggles, nested comments, Saved posts, own public posts, copying a link and university/campus filters. Reload returned to guest mode while preserving public content. The 390px mobile layout had no horizontal overflow. No browser console errors were recorded.
