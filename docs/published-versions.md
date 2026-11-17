# Changes across published Orbit versions

Every project change must cover the published demo and cloud pilot wherever the feature exists. Include a changelog entry and update affected behaviour, validation and deployment notes in the same change. Completion requires checking the published result for both versions.

## Search bars - 17 November 2026

Discover and Popular no longer display inline search bars. Discover retains campus filters, and the demo retains its interest filter. The dedicated Search navigation remains available.

The demo uses web/feed-ui.mjs. The cloud pilot uses web/cloud-ui.mjs and web/cloud-campus.mjs. Cloud Popular already has no inline search form. Both entry points are included in the same GitHub Pages deployment.

The prior search change was committed to a pull request but had not been deployed, so the published demo continued to show the old form. Merge and successful Pages deployment are required before the published interfaces reflect these changes.

## Validation and deployment

The earlier CI run for the removal changes passed. Syntax validation covers the final demo and cloud UI changes. Browser verification of both published versions follows deployment. The separate Supabase migration and Edge Function retirement for message games also require cloud deployment.
