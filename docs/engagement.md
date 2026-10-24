# Orbit 1.7.0 — Campus engagement

This release implements the five requested additions in order. All activity remains fictional and local to one browser. Existing menu destinations remain available; Notifications is added. Guest reading remains open. Participation requires choosing a demo account.

## 1. Notifications and mentions
An account-specific inbox and unread navigation badge cover mentions, replies, follows, upvotes, reposts, quotes, connection requests/acceptances and messages. Open an item or explicitly mark one/all as read. Follow/upvote toggling cannot repeatedly notify the same recipient. Self-actions do not notify. Existing activity is not backfilled on upgrade.

Stable demo handles: @personal, @naledi, @sipho, @ayesha, case-insensitive. Use in public post titles/text, quote text and comments. Repeated mentions in one contribution notify once. A mention takes precedence over a reply notification to the same recipient for that comment. Handles link to profiles in body text. No email, push, operating-system alerts or background delivery. Refresh or revisit Notifications after activity in another tab. Blocked accounts and inaccessible quoted content are excluded.

## 2. Reposts and quote posts
More actions offers Repost and a quote composer. Both create a public profile/feed entry with explicit original-author attribution and a View original link. A repost of a repost resolves to its source. A quote adds up to 4,000 characters. Repeated plain reposts of the same source by one actor are rejected. Reposts cannot currently be undone and posts cannot be edited or deleted. Blocking applies through the complete original-post chain.

## 3. Hot / Top and comments
Latest retains date ordering; For you prioritises followed authors. Hot ranks (1 + other-account upvotes + other-account visible replies) / (age in hours + 2)^1.5. Top ranks other-account upvotes, with All time, This week (7 days), Today (24 hours). Ties use newest first. These are transparent local-demo formulas, not a production recommendation service. Every comment branch has a keyboard-operable disclosure; collapsing hides that comment body and descendants. Disclosure state resets when the feed rerenders.

## 4. Hashtags and Trending
Case-normalised hashtags in post titles and text are clickable and filter the feed. Trending counts distinct tags per non-repost contribution in the last 7 days, ranks by unique authors, then post count, then alphabetically, and displays at most five. University/campus filters apply to Trending. Quotes count as their own contribution. Empty state appears when there is no recent tagged activity; no fabricated popularity.

## 5. Flair, pins and karma
Optional post flair: Question, Discussion, Study help, Campus tip, Opportunity, Creative. Authors select it when publishing. One of your own posts can be pinned at the top of your public profile, replacing the previous pin; no global moderator pin. A pin can be removed. Karma is the sum of upvotes from other accounts on the author's visible original/quote posts; removing a vote removes the point. Plain reposts and self-votes do not earn karma. It is a demo feedback count, not a trust or identity rating.

## Persistence and verification
Shared payload version 5 migrates version 4 with empty notifications and pins, preserving posts, conversations and connections. Migration writes only on a successful mutation. All changes and their notifications commit atomically. Invalid saved data is left untouched; stale writes and storage failures are rejected. Reset shared demo clears the new records too.

Verification on 2026-10-24:
- Release build succeeded; all 17 CTest groups passed, including the new engagement tests.
- Publication checker accepted all 24 expected files; JavaScript syntax checks passed.
- Browser: guest inbox gate; publish a mention with flair and hashtag; switch actors; unread badge and correct inbox; open notification, mark read and reply; collapse comment; repost and quote attribution; Top time range and ordering; earned karma; author-only pin; persistence after reload.
- Mobile: Trending disclosure and hashtag filtering, preserved menu, no horizontal overflow (375px document/client width); no browser console errors.
- Fixed navigation/title after opening an inbox conversation and kept deep comment descendants inside their parent disclosure.

Events remain paused. Live deployment verification follows publication.
