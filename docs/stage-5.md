# Stage 5 — complete interface

Completed 12 October 2026. Version 0.5.0 replaces the connection checkpoint with the fictional visitor journey.

## Delivered

- Welcome screen with fictional-adult, fictional-input, and bookmarking notices; visible demo indicator throughout.
- Create/edit profile form, university-dependent campus options, optional year, gender visibility, bio, and catalogue interests.
- Discovery preferences for ages, genders (including Any), university, campus, and field of study. The C++ defaults remain the visitor's own university/campus.
- Ranked cards with preset letter avatars, visible gender only, academic details, bio preview, interests, C++ explanations, detail and bookmark actions.
- Full profile screen and separate saved screen. Returning from detail preserves applied preferences; bookmarks are independent of filters.
- Confirmed reset using a native modal dialog, with cancel and Escape support, followed by the welcome screen.
- Responsive layouts, labels, keyboard focus indicators, main-content focus on navigation, error summaries, live announcements, loading/retry and empty states.

## Implementation boundary

`web/app.js` reads form values, sends requests through the existing client, and renders returned C++ results. It does not filter, rank, validate domain rules, or calculate shared interests. Catalogue lookup is used only to display labels and populate dependent controls. Text is rendered through `textContent`/text nodes, including bios and error messages; no user-provided HTML is inserted.

Forms intentionally let C++ return authoritative validation errors. Failed submission preserves the entire form. Errors identify affected controls and move focus to the summary. Numeric inputs are converted to JSON numbers; blank inputs become null. Unicode limits are explained without HTML maxlength's UTF-16 counting mismatch.

State stays in memory at this stage. The visible banner explains that a refresh or closing the page loses the demo. Persistence, validated restoration, storage failure handling, and import/export belong to Stage 6. No storage keys are read or removed in Stage 5. No account, messaging, or public deployment was added.

## Verification

- JavaScript syntax check, Emscripten build, and all 10 existing CTest groups passed (583 domain/bridge assertions plus two smoke groups).
- Browser tested under `/repository-name/`, including loading the production WASM and both datasets.
- Created a fictional profile after an underage submission was rejected; other entries stayed intact. Discovery initially returned five profiles for UCT Upper Campus.
- Opened full details, saved Echo, narrowed discovery to age 100 (zero results), and verified Echo remained saved. Opened from Saved, returned, and removed the last bookmark to verify the empty state.
- Edited the profile with an emoji in its name; applied preferences remained unchanged. Rejected a reversed age range, then corrected it. Any university plus Woman returned six profiles; Any gender returned all 30.
- Checked desktop and 390 × 844 mobile rendering. Mobile document width stayed within the viewport; navigation, forms, and cards remained usable.
- Reset cancellation and Escape preserved the session; explicit confirmation returned to welcome and removed visitor navigation.
- Missing-WASM simulation displayed a readable loading error; retry remained usable. Empty form submission reported labelled field errors, and select controls had exact accessible names.

## Repeatable browser checklist

1. Build and run `python scripts/serve.py`; open the local preview.
2. Create Demo Profile. Use made-up details; try age 17, then correct to 22. Select a university/campus, degree, gender, bio, and 1–5 interests.
3. Confirm own-campus defaults. Open a card, bookmark it, and return.
4. Apply age 100–100. Confirm no results, then open Saved and confirm the bookmark remains.
5. Remove the bookmark and inspect the saved empty state. Edit your profile and confirm preferences survive.
6. Broaden filters and test Any gender. Test an invalid minimum/maximum pair and correct it.
7. Check the same screens on a narrow viewport and with keyboard navigation.
8. Cancel reset, dismiss with Escape, then confirm reset. Verify the welcome screen.

These are browser integration checks, not new duplicate implementations of core tests. Further storage and cross-session checks follow in Stage 6.
