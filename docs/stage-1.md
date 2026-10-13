# Stage 1 checkpoint

## Changes

Created the source folders, CMake configuration and presets, pinned JSON dependency, a portable C++ metadata function, thin Embind binding, automated core and bridge checks, and a responsive browser checkpoint page. Added root setup instructions, architecture notes, and a local HTTP server with explicit MIME types. Existing reference documents were preserved.

## Verification checklist

- [x] Configure with Emscripten 4.0.15, CMake 3.31.6, and Ninja.
- [x] Compile the core, browser module, and test harness.
- [x] Pass `core_smoke` and `bridge_smoke` through CTest: 2/2 passed.
- [x] Serve the generated site over HTTP and confirm the Codex in-app browser loads WebAssembly.
- [x] Click the connection button and observe successful checks increase from 1 to 2.
- [x] Load at `/repository-name/` using a local QA server to verify relative module and WASM paths.
- [x] Check a 390px viewport: one-column layout, no horizontal overflow, readable controls.
- [x] Activate the button with Enter: successful checks increase to 3 and its focus outline is visible.
- [x] Return 404 for the WASM file using the QA server: the page shows a readable error and an enabled retry control; retry returns safely to the same error while the file remains unavailable.
- [x] Run the documented `python scripts/serve.py` command and verify the browser displays the connected state at `http://127.0.0.1:8000/`.

Verified on 12 October 2026. The default Python HTTP server initially returned `text/plain` for `.mjs` on this Windows machine. The added server helper sets explicit content types and the repeated browser check passed. The local preview processes were stopped after verification; use the README command to start a new session.

These are smoke and browser checks for Stage 1, not tests of future profile features. Full screen-reader auditing, other browsers, and deployed GitHub Pages behavior remain unverified.

## Files created

- Root: `CMakeLists.txt`, `CMakePresets.json`, `toolchain-versions.json`, `.gitignore`, `README.md`.
- Core and bridge: `core/include/unimatch/application_info.hpp`, `core/src/application_info.cpp`, `wasm/bindings.cpp`.
- Browser: `web/index.html`, `web/app.js`, `web/styles.css`, `web/favicon.svg`.
- Tests: `tests/core_smoke.cpp`, `tests/bridge_smoke.mjs`, `tests/fixtures/README.md`.
- Other folders: `data/README.md`, `.github/workflows/README.md`, `scripts/serve.py`, `docs/architecture.md`, `docs/stage-1.md`.

Generated dependencies, CMake/Ninja files, compiled tests, and the website are inside the ignored `build/wasm/` directory.

## Commands and expected results

Run from the project root in PowerShell:

```powershell
& 'C:\Users\kgatl\unimatch-tools\Activate-UniMatch.ps1'
emcmake cmake --preset wasm-debug
cmake --build --preset wasm-debug
ctest --preset wasm-debug
python scripts/serve.py
```

Expect two passing tests, then open `http://127.0.0.1:8000/` and see **Connected to the C++ core**. Keep the terminal running while browsing and press Ctrl+C when finished.

## Next checkpoint

Stage 2 will add the data models, catalogues, approximately 30 fictional adult profiles, dataset validation, and tests. The supplied prompt requires explicit confirmation before advancing.
