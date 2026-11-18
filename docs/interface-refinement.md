# Demo interface refinement

This is a presentation update for the fictional demo. The Sea Glass identity and existing features remain in place. No Supabase migration, account provisioning or live UI promotion is included.

## Behavior

- Home keeps For you, Following, Latest, Hot and Top in a single sort row. Campus shortcuts, university/campus/topic/category selectors and reading preferences sit inside Filters. Selected filters show an Active indicator and remain available when the panel is reopened.
- Navigation groups Explore, Conversations, Account and Demo tools. Circles stays immediately after Create. Mobile uses the existing expandable menu.
- Post cards use consistent compact spacing, readable excerpts, restrained borders and clearer title/metadata contrast. Image/video ordering and comment counts remain unchanged.
- The right rail starts with circles, followed by people and campus activity. Its introductory marketing panel and generic repeated recommendation copy are removed. On smaller screens Around campus follows the feed.
- Create orders title, optional image/video, text, category, community and anonymous identity before optional settings. Topic, purpose, event and poll controls remain available in More options; preview and privacy guidance use separate disclosures. Post and Discard draft appear at the bottom. Community rules follow the composer.
- Existing account-scoped draft text/identity restoration, media limits, anonymous profile exclusion and local published-media persistence are preserved. Draft attachments still require reselection after reload.

## Verification and rollout

Local syntax checks and media, student-community and discussion regression suites passed. Browser review covered anonymous preview/publication, category filtering, desktop dark mode and mobile overflow. CI additionally checks the release build, both application journeys and the immutable live snapshot before publication. Record the final CI and publication result here when available.

The Pages workflow retains live source commit `162ec1906431eb90e93483673120784358ae2c75`. Demo files publish under `demo-assets`; approved cloud HTML and its original asset paths are restored byte-for-byte by `scripts/package_live_snapshot.py`. The live pin is unchanged. Browser module URLs use demo revision `1.18.0-demo`.
