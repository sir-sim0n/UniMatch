# Stage 3 checkpoint

Completed on 12 October 2026: core profile editing, preference validation, filtering, shared-interest explanations, ranking, bookmarks, and confirmed reset.

## What changed

Added an `Application` class that owns validated fictional data and independent local visitor state. Updates validate before committing; rejected input leaves existing state intact. Profile and preference validation live in C++, including Unicode rules inherited from Stage 2.

Discovery combines all active preferences and ranks by shared-interest count, then deterministic name comparison, then ID. Full and saved views use the same current-state view builder. Hidden gender remains usable for filtering but is omitted from returned display details. Bookmarks survive preference changes, and cancellation leaves reset state untouched.

See [the core contract](core-behavior.md) for input shapes, outputs, validation errors, default filters, sorting rules, and reset responsibilities.

## Verification actually performed

The Emscripten/Ninja build completed. **9/9 CTest groups passed.** The new application test source compiled with `-Wall -Wextra -Wpedantic -Werror`; no warnings remained after fixing two temporary-result lifetimes in the test harness.

| New test group | Checks | Coverage |
| --- | --- | --- |
| `app_updates` | 81 | Required visitor, atomic invalid edits, initial campus defaults, preserved filters/bookmarks on profile edits, invalid age values and ranges, catalogue references, gender lists, and rejected source data |
| `app_filters` | 24 | All filters combined, age endpoints, OR gender choices, Any filters, hidden gender, zero-overlap inclusion, empty results, self exclusion, and unchanged filters when opening details |
| `app_ranking` | 11 | Counts, Unicode/name/ID tie-breaks, reversed input order, real explanations for 0–3 shared interests, repeated calls and refreshed ranking after an edit |
| `app_bookmarks_reset` | 50 | Duplicate prevention, same-name IDs, consistent saved flags, filter-independent bookmarks, refreshed saved explanations, invalid IDs, reset cancellation/confirmation, original data preservation and separate instance state |

The new groups contain **166 checks**. All earlier data groups (236 checks) and both core/bridge smoke tests also passed. That is **402 data/behavior checks plus the two smoke test groups**. No browser UI was changed or retested in this stage; the rebuilt browser module passed the existing Node bridge smoke test.

## Files created or modified

Created `core/include/unimatch/application.hpp`, `core/src/application.cpp`, `tests/application_tests.cpp`, `docs/core-behavior.md`, and this checkpoint.

Updated `core/include/unimatch/data_validation.hpp` and `core/src/data_validation.cpp` for preference validation; `CMakeLists.txt` for compilation/tests; `core/src/application_info.cpp` for version 0.3.0/stage 3; and `README.md` plus `docs/architecture.md` for current status and contracts. Production data, browser files, and reference documents were preserved.

## Run the checks

From the project folder in an activated PowerShell terminal:

```powershell
Set-Location -LiteralPath 'C:\Users\kgatl\Documents\Portfolio Website\Project 4 -- C++ Program'
& 'C:\Users\kgatl\unimatch-tools\Activate-UniMatch.ps1'
cmake --build --preset wasm-debug
ctest --preset wasm-debug --verbose
```

Expected: nine passing groups and the check counts above. For a fresh build directory, first run `emcmake cmake --preset wasm-debug`. Build output stays under `build/wasm/`.

## Progress and remaining work

- [x] Stages 0–2: verified tools, architecture and browser connection, models, catalogues, fictional data and validation.
- [x] Stage 3: complete core operations and tests.
- [ ] Stage 4: expose operations through Embind and verify calls from JavaScript.
- [ ] Stage 5: complete browser interface, forms, navigation, confirmation and empty states.
- [ ] Stage 6: validated state export/import, namespaced localStorage and persistence failure handling.
- [ ] Stages 7–8: GitHub deployment, final audit and documentation.

The current browser page only calls the metadata API. Stage 3 operations exist in the tested portable C++ core and will be connected in Stage 4. The supplied prompt requires confirmation before advancing.
