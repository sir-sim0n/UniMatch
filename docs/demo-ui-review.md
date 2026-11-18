# Demo UI review — 18 November 2026

The owner requested demo-only UI iteration. Publish UI changes to the fictional demo for review; update the live cloud interface only after explicit promotion approval. This overrides the earlier shared-publication default in AGENTS.md.

## Home and discussion

Post cards show the title, optional attachment, then a brief body excerpt (up to 240 characters, visually limited to three lines). Text-only posts show title and excerpt. The full discussion retains the full body and attachment. Reposts show the available original's attachment and text. Deleted originals are not rendered as attachments.

A speech-bubble comment icon and numeric total sit beside the thumbs-up control. The total includes visible non-deleted replies, including nested replies. Opening it follows the same new-tab discussion link as the title. Existing likes, reposts and sharing remain available.

## Create and navigation

The demo category menu includes N/A. A title and either body text or an attachment are required. The category menu has a normal 44-pixel height and the anonymous checkbox is inline with its label instead of stretching across the form. Circles is directly below Create in desktop and mobile navigation.

One optional image or video can be selected, previewed, removed and published. Supported types are JPEG, PNG, GIF, WebP, AVIF, MP4, WebM and Ogg. Images are limited to 5 MB and videos to 20 MB. Files are stored as validated data URLs in the existing browser-local demo repository; they are never uploaded to Supabase or another service. Playback depends on browser codec support. Video has controls and does not autoplay. Browser storage quotas still apply and failed writes preserve the existing repository.

Reloading retains attachments on published posts. Text drafts retain their existing account isolation; attachment bytes are not placed in session draft storage, so the user must select the file again after reloading an unpublished draft. The composer explains this. Removing a post or simulating account deletion removes its attachment from the active demo records. Demo backups may contain fictional attachments just as they contain fictional post text.

## Freeze the live release

The Pages workflow separately checks out the approved source commit 162ec1906431eb90e93483673120784358ae2c75 and builds its pinned Supabase bundle. New demo assets go under demo-assets. The original cloud.html and original assets paths retain the approved live source byte-for-byte, including for cached HTML and already-open cloud tabs. No production database or Supabase configuration change is included. Shared demo module/CSS edits therefore do not change the cloud interface. The package script checks every frozen asset and cloud.html byte-for-byte and writes live-release.json with the source commit and SHA-256 digests.

Promotion requires an explicit owner decision to change the approved live source. Until then, the workflow pin keeps every new demo release separate from the cloud application, including browser-cached modules.

## Validation and publication

Local checks passed for attachment persistence, N/A, anonymous attachment storage, file-type/size/data validation, large-file validation, post/account deletion, student privacy and existing discussion/feed behaviour. JavaScript syntax checks passed. CI also checks image/video publication and reload, comment totals, ordering, compact controls, mobile overflow and navigation in Chromium, alongside the existing release/database checks. Publication and browser verification evidence will be appended after rollout.

Manual local browser preview confirmed Home excerpts/comment links, Circles immediately below Create, a 44-pixel category selector and compact inline anonymous control. The local Windows preview needed the standard JavaScript MIME mapping for .mjs files; GitHub Pages and the CI harness supply it. Media persistence browser checks reopen Home explicitly after navigating through a discussion, so an existing discussion URL does not select the earlier post on reload.

The first extended Chromium run reached all existing demo/cloud journeys, then found that its new navigation assertion read the page before initialization completed. The assertion now waits for Create to become visible before checking menu order.

The comment-link browser check opens a separate discussion page, matching the product's new-tab link behaviour; navigating only the hash of an already initialized Home page does not initialize a new discussion.

Superseded pull-request checks are cancelled when a newer review commit arrives; main publication runs retain their previous non-cancelling behaviour.
