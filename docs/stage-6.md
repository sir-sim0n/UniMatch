# Stage 6 — persistence and robustness

Completed 13 October 2026. Version 0.6.0 adds versioned browser saving, C++-validated restoration, safe recovery, and reset integration.

## Completed checklist

- C++ owns state serialization, schema validation, and all-or-nothing import.
- Browser saves accepted profile/preference/bookmark changes under one namespaced key.
- Refresh restores profile, applied preferences, and saved IDs.
- Missing data, malformed JSON, unsupported versions, invalid fields, and obsolete IDs are handled explicitly.
- Unavailable storage and write failures keep the application usable in memory with visible warnings.
- Reset deletes only UniMatch's stored key and reports removal failure honestly.
- Cross-tab changes pause saves to reduce accidental overwrites.
- API, format, recovery policy, and practical limitations are documented in [the persistence contract](persistence.md).

## Verification

All 11 CTest groups pass. The new persistence integration group contains 147 checks using the actual generated WASM and production browser controller. Together with existing tests there are 730 domain/bridge/persistence assertions plus two smoke groups. The production build and JavaScript syntax check also pass.

Browser checks used an isolated localhost origin and a repository-style subpath:

1. Created a fictional profile through the form, saved Echo, changed minimum age to 20, refreshed, and verified the restored preference, bookmark count, and card save state.
2. Injected malformed test data through a local QA page. The active app detected the external change; reload displayed recovery. Continue without saving preserved the exact damaged string.
3. Cancelled reset and verified storage was unchanged. Confirmed reset removed the UniMatch key while preserving an unrelated test key. Reload stayed at welcome.
4. Simulated blocked access to localStorage: the page displayed a temporary-session warning and retained the normal welcome/profile entry point.
5. Simulated failed writes: a new bookmark remained usable in memory, the old stored data remained intact, and Retry saving continued to report failure honestly.
6. An unsupported-version document displayed the recovery screen. Mobile warning layout was checked at an actual 390 × 844 viewport with no horizontal overflow.

Fault injection lived only in a local QA server/page outside the production site. It is not copied into the website or used by normal visitors. Reproducible automated storage failures are in `tests/persistence_tests.mjs`; they do not depend on browser settings or modify a user's localStorage.

## Repeat manually

Build and run the local preview as described in the README. Create a fictional profile, change preferences, save a profile, and refresh. Confirm everything returns. Reset and refresh again; the welcome screen should remain. To exercise denied storage without changing browser settings, run the automated persistence integration group.

Stage 7 remains GitHub repository setup, Actions, and Pages deployment. No repository, public site, or account setting was created or changed in Stage 6.
