# UniMatch core operations

Stage 3 implements browser-independent behavior in `Application`, declared in `core/include/unimatch/application.hpp`. It uses the validated models and Unicode rules from [the data contract](data-contract.md). No JavaScript matching algorithm, browser storage, or network service is involved.

## Construction and ownership

`Application::create(catalogueText, datasetText)` returns `ValidationResult<Application>`. It accepts only a complete, validated data bundle. Each instance has its own mutable application state and exposes it through a read-only `state()` accessor. Fictional data is private and has no mutation operation. `catalogues()` exposes choices read-only.

All methods return a `ValidationResult<T>` with either a value and no errors, or field errors and no value. Always check `ok()`. In particular, successful save/unsave calls may contain boolean `false`, meaning the requested state was already present; that is not an error.

## Profile updates

`update_profile(profileJson)` accepts a complete profile record using the Stage 2 schema, including the reserved ID `visitor:local`. The future browser bridge will construct that reserved identity rather than ask the visitor to enter it. C++ validates all fields and trims text before committing. On failure it returns field errors and preserves the entire prior profile, preferences, and bookmark list. A form must retain the visitor's draft values while displaying those errors in Stage 5.

First profile creation uses ages 18–100, Any gender, the visitor's university and campus, and no degree filter. Later profile edits preserve the visitor's current filters and saved IDs, even when their own university/campus changes. They can change discovery location explicitly through preferences. The update returns `true` when accepted, including an identical valid replacement.

## Preferences

`update_preferences(preferencesJson)` requires an existing visitor and replaces the current preferences only after validation. The input is:

```json
{
  "minAge": 18,
  "maxAge": 100,
  "genderIds": [],
  "universityId": null,
  "campusId": null,
  "degreeId": null
}
```

The age fields and gender list are required. Ages must be JSON integers from 18 through 100, with minimum at most maximum. Floats (including `20.0`), strings, booleans, null, and oversized integers are rejected. An empty gender list means Any gender. A non-empty list must contain unique, existing gender IDs; its entries combine with OR. A literal `"any"` ID is not valid.

Each optional university/campus/degree filter may be omitted or null to mean Any; empty strings are rejected. A selected campus requires its owning university. To broaden to any university, clear both university and campus. Unknown fields and invalid catalogue references return errors. All active age, gender, university, campus, and degree filters combine with AND.

## Discovery and full profiles

`discover()` returns a vector of `ProfileView` objects and requires a visitor. No eligible profiles is a successful empty vector. The fictional dataset cannot contain the visitor's reserved ID, and discovery also explicitly excludes it.

Each view contains ID, display name, age, university, campus, field of study, optional year, complete bio, all interest IDs, optional visible gender ID, shared-interest IDs, explanation, and saved flag. `visible_gender_id` is absent for hidden gender; filtering still uses the stored value. The future UI can create a safe text preview of the bio without changing the underlying complete detail.

`view_profile(id)` returns the same view for an existing fictional profile, even if it is outside the active filters. It never changes preferences. Unknown IDs and the visitor's ID return `unknown_profile` errors. Calls without a visitor return `profile_required`.

## Ranking and explanations

The core counts the intersection of stable interest IDs. Validated profiles contain unique interests, and shared IDs are emitted once in catalogue order. It sorts eligible profiles by:

1. Shared-interest count, descending.
2. Display name, ascending using case-sensitive lexicographic comparison of unsigned UTF-8 bytes.
3. Profile ID, ascending with the same comparison.

This ordering is deterministic across input order, platforms and locales. It intentionally does not case-fold, normalise Unicode, or use a language-specific alphabetical collation. For example, ASCII capital letters sort before ASCII lowercase letters; accented names follow their UTF-8 order. Duplicate display names remain separate profiles, distinguished by ID. Zero-overlap profiles remain eligible and sort below candidates with shared interests.

Explanations use only the labels of actual shared interests, in catalogue order:

- `You both selected Coding.`
- `You both selected Coding and Music.`
- `You both selected Coding, Football, and Music.`
- `No shared interests selected.`

There are no compatibility percentages, invented overlaps, reciprocal preference checks, or mutual matches. Views are recomputed after changes so explanations and ranking do not become stale.

## Saved profiles

`save(id)` adds an existing fictional ID once. `unsave(id)` removes it if present. Both require a visitor, reject unknown/self IDs, and are idempotent: `true` means the saved set changed and `false` means it already had the requested state.

`saved_profiles()` returns views in bookmark insertion order, independently of discovery filters. Removing and later saving a profile places it at the end. Profile edits and filter changes preserve the bookmark IDs. Opening a saved profile returns its current explanation and saved flag. Bookmarking does not notify anyone or imply mutual interest.

## Reset

`reset(false)` returns `confirmation_required` and changes nothing. `reset(true)` clears the visitor, restores empty/default preferences, and clears all saved IDs. The original fictional dataset is retained unchanged. Discovery becomes `profile_required`, which the future interface will render as the welcome state. A repeated confirmed reset is safe; creating a new profile afterwards reapplies its own campus defaults.

In Stage 5 the interface must obtain explicit confirmation before calling reset with `true`. Stage 6 must also remove only the namespaced UniMatch localStorage key. Core reset does not access storage.

## Later integration

Stage 4 will expose these typed operations through a thin Embind/JSON layer with parsing and error envelopes. Stage 5 will add forms, sections and empty-state messages. State export/import and browser persistence are Stage 6. The current browser page still demonstrates the metadata connection only.
