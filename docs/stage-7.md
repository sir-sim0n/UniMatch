# Stage 7: GitHub Actions and Pages

## Delivery

- Repository: https://github.com/sir-sim0n/UniMatch
- Live Demo: https://sir-sim0n.github.io/UniMatch/
- First release source commit: `7879e78147e0c8773c3e53f17ee0ef024107ccd4`
- Workflow: https://github.com/sir-sim0n/UniMatch/actions/runs/38416137832

The user's initial README commit was preserved. Application source, tests, and project documentation are tracked; local reference documents and generated builds are excluded. The local main branch tracks origin/main. Commit identity uses the account's GitHub noreply address.

## Implementation

Added a separate `wasm-release` preset, version 0.7.0 metadata, a pinned build/test/deploy workflow, an exact website artifact check, consistent source line endings, and deployment documentation. Pull requests run the release checks; only main or a manual run on main can publish. Pages uses the GitHub Actions source and the github-pages environment. See [deployment instructions](deployment.md).

## Verification

- Local Release configuration and build succeeded with the pinned Emscripten toolchain.
- All 11 CTest groups passed locally.
- Publication check passed for all 12 expected site files.

- GitHub Actions run 38416137832 passed both build and deploy jobs on 13 October 2026.
- The public HTTPS site loaded the generated C++ WebAssembly engine successfully at its project subpath.
- A fictional NWU Mahikeng visitor profile was created successfully; discovery displayed five Mahikeng profiles.
- All three NWU campus choices were present. Removing the university filter displayed all 45 fictional profiles.
- Saving Dineo, refreshing, opening Saved, and viewing Dineo's details worked; profile, preferences, and bookmark restoration were confirmed.
- The temporary test profile was reset and the welcome screen remained after another refresh.
- Browser console check returned no errors or warnings.

Stage 7 is complete. Stage 8 has not started.
