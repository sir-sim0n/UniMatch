# Stage 2 checkpoint

Completed on 12 October 2026: C++ data models, predefined catalogues, 30 fictional adult profiles, catalogue/dataset validation, and automated tests.

## What changed and why

- Added plain C++ models for catalogues, profiles, preferences, application state, and a data bundle so later behavior has one shared representation.
- Added C++ loaders and reusable profile validation. A bad record rejects the complete import and returns field errors, preventing partially accepted application data.
- Created 3 university choices with 6 campuses, 10 fields of study, 15 interests, 7 gender options, and 7 year choices.
- Created 30 original fictional profiles, including repeated display aliases, hidden genders, optional years, mature students, and varied interest overlap.
- Defined and tested Unicode code-point counting and a reserved visitor ID.
- Added CMake test targets and production JSON copying. Invalid fixtures are excluded from the website artifact.
- Updated application metadata to version 0.2.0, stage 2. The browser remains the Stage 1 connection preview; data display and interactive profile features belong to later stages.

## Results actually verified

The WebAssembly build completed and **5/5 CTest groups passed**:

| Test group | Result |
| --- | --- |
| `core_smoke` | Core metadata JSON accepted |
| `bridge_smoke` | Generated ES module loads and calls C++ through Embind |
| `data_production` | 71 checks; all 30 profiles and catalogue coverage verified |
| `data_invalid` | 126 checks; all 58 invalid fixtures rejected with expected field errors, plus malformed roots and combined errors |
| `data_boundaries` | 39 checks; adult age boundaries, Unicode limits/encoding, trimming, optional years, visibility, and reserved IDs |

The data groups performed **236 checks**. The first link attempt exposed CMake's deduplication of repeated `--embed-file` options; grouping each flag with its path fixed it, and the rebuilt tests passed. Production file hashes were checked against the assembled site, and no test fixture was included in that artifact.

## Files created or updated

New files: `core/include/unimatch/models.hpp`, `core/include/unimatch/data_validation.hpp`, `core/src/data_validation.cpp`, `data/catalogues.json`, `data/profiles.json`, `tests/data_tests.cpp`, `tests/fixtures/invalid_data_cases.json`, `tests/fixtures/malformed.json`, `docs/data-contract.md`, and this checkpoint.

Updated: `CMakeLists.txt`, `core/src/application_info.cpp`, `README.md`, `data/README.md`, `tests/fixtures/README.md`, and `docs/architecture.md`. Existing reference documents and browser source files were preserved. Generated build files remain inside the ignored build directory.

## Repeat the checks

In VS Code's PowerShell terminal, run from the project root:

```powershell
Set-Location -LiteralPath 'C:\Users\kgatl\Documents\Portfolio Website\Project 4 -- C++ Program'
& 'C:\Users\kgatl\unimatch-tools\Activate-UniMatch.ps1'
emcmake cmake --preset wasm-debug
cmake --build --preset wasm-debug
ctest --preset wasm-debug --verbose
```

Expected: five passing groups, including the three data groups and their check counts. Use `python scripts/serve.py` if you want to view the existing browser connection checkpoint.

## Progress and remaining work

- [x] Stage 0: tools and test approach verified.
- [x] Stage 1: architecture, skeleton, and browser WebAssembly connection.
- [x] Stage 2: models, catalogues, fictional data, validation, and tests.
- [ ] Stage 3: profile editing, preference validation, combined filtering, shared-interest explanations, ranking, saved-profile operations, and reset.
- [ ] Stages 4–8: full browser API, interface, persistence, deployment, and final audit.

The dataset is validated by C++ through automated tests; browser dataset import has not been implemented or tested. Preference models have no operations yet. No additional browser UI checks were needed for this data/core change; the updated generated module passed its Node bridge test. The supplied prompt requires confirmation before advancing to Stage 3.
