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

Local syntax checks and media, student-community and discussion regression suites passed. Browser review covered anonymous preview/publication, category filtering, desktop dark mode and mobile overflow. Release CI passed all 25 test groups, the media regression suite, 45-file publication packaging and all 10 demo/cloud browser journeys in [run 44388440864](https://github.com/sir-sim0n/UniMatch/actions/runs/44388440864). The live snapshot check verified 38 files byte-for-byte. Isolated database checks passed in [run 44388440725](https://github.com/sir-sim0n/UniMatch/actions/runs/44388440725). Tested implementation commit: `9d37311592438f240245cd909bbd94d173b7759a`. Browser screenshots and results are retained as the student-browser-results artifact.

[Pull request #4](https://github.com/sir-sim0n/UniMatch/pull/4) is ready for review. Publication has not occurred: automatic approval review rejected merging because approval to publish this specific release is still required. Both published entry points remain unchanged.

The Pages workflow retains live source commit `162ec1906431eb90e93483673120784358ae2c75`. Demo files publish under `demo-assets`; approved cloud HTML and its original asset paths are restored byte-for-byte by `scripts/package_live_snapshot.py`. The live pin is unchanged. Browser module URLs use demo revision `1.18.0-demo`.
