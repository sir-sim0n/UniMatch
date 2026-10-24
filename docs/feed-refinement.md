# Orbit v1.6.1 — Feed design refinement

Date: 2026-10-24. Refines the user-approved public-feed direction while events remain paused.

The desktop reading column is more focused, with lighter navigation labels, restrained headings, clearer author metadata and consistent action spacing. Local inline SVG icons replace mixed Unicode symbols in navigation and post actions. Every icon is decorative and retains its visible or accessible text label. No external fonts, icon libraries or media requests were introduced.

Optional campus/topic filters now sit behind a native details disclosure. Active filters remain expanded. On phones the selectors become full-width so campus names are readable. The full menu is retained behind Explore Orbit; its button exposes aria-expanded/aria-controls, and navigating closes it. Desktop navigation stays visible. Upvote, replies, save and share still have accessible labels and retain their existing behaviour.

This release changes presentation only: no shared data schema migration, new authentication, follow rules or event functionality. Existing posts, comments, follows, messages and circles remain intact. Browser asset URLs and build metadata advance to 1.6.1. Validation results follow below.

Local verification: all 16 CTest groups passed and the publication checker accepted 23 files. Desktop reading layout and icons were visually checked. Filters expanded, retained active selections, and correctly narrowed the feed. At a 390px viewport the complete menu opened and closed after navigation; guest upvote prompts remained functional. DOM measurements confirmed cards stayed inside their margins with no horizontal overflow. Browser console errors: none.
