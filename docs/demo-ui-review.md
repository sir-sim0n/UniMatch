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

The Pages workflow separately checks out the approved source commit 162ec1906431eb90e93483673120784358ae2c75, builds its pinned Supabase bundle and packages its complete web assets under live-assets. cloud.html uses those frozen assets. No production database or Supabase configuration change is included. Shared demo module/CSS edits therefore do not change the cloud interface. The package script checks every copied asset byte-for-byte and writes live-release.json with the source commit and SHA-256 digests.

Promotion requires an explicit owner decision to change the approved live source. Until then, the workflow pin keeps every new demo release separate from the cloud application, including browser-cached modules.

## Validation and publication

Local checks passed for attachment persistence, N/A, anonymous attachment storage, file-type/size/data validation, large-file validation, post/account deletion, student privacy and existing discussion/feed behaviour. JavaScript syntax checks passed. CI also checks image/video publication and reload, comment totals, ordering, compact controls, mobile overflow and navigation in Chromium, alongside the existing release/database checks. Publication and browser verification evidence will be appended after rollout.
