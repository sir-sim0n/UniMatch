# Orbit

Orbit is a portfolio demonstration of university student discovery using fictional adult profiles. The project uses a portable C++17 core, Emscripten and Embind, and plain HTML, CSS, and JavaScript.

**Current release: Orbit 1.3.0 — Demo connections.**

Your campus. Your Interests. Your Connections

Recreated vector branding and a light Sea Glass theme. See [the changelog](CHANGELOG.md) and [brand/release notes](docs/orbit-brand.md). The original UniMatch release is preserved as `v1.0.0` (internal build 0.7.0).

[Live Demo](https://sir-sim0n.github.io/UniMatch/) · [Build and deployment status](https://github.com/sir-sim0n/UniMatch/actions/workflows/pages.yml)

Explore 45 fictional adult profiles across four South African universities, including all three North-West University campuses. Create a fictional profile, adjust discovery preferences, and bookmark profiles. Browser storage preserves your demo state when available.

## Local build on Windows

Open the project folder in VS Code. In a PowerShell terminal, run:

```powershell
# From the cloned repository, activate your Emscripten 4.0.15 environment first.
emcmake cmake --preset wasm-debug
cmake --build --preset wasm-debug
ctest --preset wasm-debug
```

Activate the tools once per new terminal. Configure downloads the exact pinned nlohmann/json source on the first run, so that first run needs Internet access. Later builds reuse it in `build/wasm/_deps/`.

Expected result: CTest reports eleven passing test groups. The website and production JSON files are assembled in `build/wasm/site/`. Generated files stay inside `build/`; do not edit or commit them.

## Open the local site

From the same project folder and activated terminal:

```powershell
python scripts/serve.py
```

Open [the local preview](http://127.0.0.1:8000/). Keep the terminal running while browsing; Ctrl+C stops the server. If port 8000 is occupied, use `python scripts/serve.py --port 8001` and open that port instead. Do not double-click `index.html`: JavaScript modules and WebAssembly must be served over HTTP. The helper explicitly sets JavaScript and WASM content types because Windows MIME settings can make the default Python server reject module loading.

Choose **Create Demo Profile** on the welcome screen. Use fictional details, then explore Discover and Saved. Refresh to verify restoration, or use Reset demo to remove only the saved UniMatch data. See [Stage 6 results](docs/stage-6.md) and [the persistence contract](docs/persistence.md).

## Source layout

| Folder or file | Responsibility |
| --- | --- |
| `core/` | Portable C++ logic and JSON; no browser or Embind imports |
| `wasm/` | Thin Embind layer exposing core functions to JavaScript |
| `web/` | HTML, CSS, browser events, module loading, and safe text rendering |
| `data/` | Fictional catalogues and profiles, starting in Stage 2 |
| `tests/` | C++ tests, a JavaScript bridge check, and future invalid fixtures |
| `.github/workflows/` | Test, release build, and GitHub Pages publishing |
| `docs/` | Architecture, decisions, and checkpoint notes |
| `scripts/` | A local HTTP server with explicit JavaScript and WASM content types |
| `CMakeLists.txt` | Dependencies, compilation, website assembly, and test registration |
| `CMakePresets.json` | Repeatable configure, build, and test commands |
| `toolchain-versions.json` | Exact dependency and tool versions |

## Tools and tests

Tested tool pins are Emscripten 4.0.15, CMake 3.31.6, Ninja Python package 1.11.1.4, and Node 22.16.0. The only application library is nlohmann/json 3.12.0, fetched at commit `55f93686c01528224f448c19128836e7df245f72`.

Tests use the same Emscripten toolchain as the website. The C++ test executable compiles to WebAssembly and runs through Node; it is a test harness, not a separate console application. The bridge test imports the actual generated ES module and calls its exported API. No additional native compiler or testing framework is required.

Stage 2 adds `data_production`, `data_invalid`, and `data_boundaries`: 236 checks, including 58 invalid-data fixtures. Production JSON and fixtures are embedded only in the test executable so it reads the exact files being tested. CMake tracks those inputs and relinks the test if they change. Only the two production JSON files are copied into the site; invalid fixtures stay in `tests/fixtures/`.

See [the data contract](docs/data-contract.md), [dataset notes](data/README.md), and [Stage 2 results](docs/stage-2.md). C++ trims Unicode whitespace and counts Unicode code points for text limits. The visitor ID is reserved as `visitor:local`; fictional profiles use their own stable IDs.

Stage 3 adds four behavior test groups with 166 checks: profile/preference updates, combined filters, deterministic ranking and explanations, and bookmark/reset behavior. Read [the core operation contract](docs/core-behavior.md) and [Stage 3 results](docs/stage-3.md). Changes are committed only after validation succeeds, and bookmarks survive filter changes. Together the data and behavior groups execute 402 checks, in addition to the metadata and generated-module smoke tests.

## Demo and privacy scope

Use fictional details only. The demonstration has no real accounts, shared student database, messages, or mutual matches. Saving a profile bookmarks it locally. State remains in the visitor's browser and does not sync across devices. The interface saves fictional input under `unimatch.demo.v1` when browser storage is available. Use Reset demo to remove it. Storage failures are explained on the page, and the app remains usable in memory. University labels provide South African context without institutional endorsement; the profiles are entirely invented.

Local builds do not publish anything. Pushes to `main` run the test suite, assemble and check the release site, and deploy through GitHub Actions. Pull requests run checks without publishing. See [deployment instructions](docs/deployment.md).

Stage 4 adds 181 JavaScript integration checks against the generated WebAssembly module, for 583 domain and bridge assertions plus two smoke groups. See [the bridge API](docs/bridge-api.md) and [Stage 4 results](docs/stage-4.md).



Stage 6 adds 147 persistence integration checks using the production WASM and storage controller. The complete suite has 11 groups with 730 domain/bridge/persistence assertions plus two smoke groups. See [the saved-state format and recovery policies](docs/persistence.md).

## Requested refresh before Stage 7

The demo now includes 45 fictional profiles with varied South African given names across four universities and nine campuses. North-West University includes Potchefstroom, Vanderbijlpark, and Mahikeng, with five profiles per campus. The interface uses a midnight navy canvas, cyan and magenta branding, neon gradients, rounded sans-serif typography, and local SVG wave artwork. Existing bookmark IDs remain compatible. See [refresh verification](docs/design-data-refresh.md).

## Release build

```sh
emcmake cmake --preset wasm-release
cmake --build --preset wasm-release
ctest --preset wasm-release
python scripts/check_site.py build/release/site
```

The release site is assembled in `build/release/site`. Historical stage notes retain the test counts recorded at each checkpoint; the current release suite contains 11 test groups.

## Real-account platform planning

The real-account plan is deferred. Follow the [active demo-first roadmap](docs/demo-roadmap.md). [Phase 1 foundation](docs/v2/phase-1-foundation.md), [v2 architecture and costs](docs/v2/architecture.md), and [Phase 2 implementation backlog](docs/v2/phase-2-backlog.md) define the next platform. The first release is campus connections only, without dating. No real accounts are enabled by these documents.

## Demo accounts

Use **Demo accounts** in the navigation to switch between your original demo and three fictional NWU students. Each account keeps its own profile, preferences and bookmarks. Reset affects only the selected account. These are local simulations, without passwords or cross-device sharing. [Roadmap and data behaviour](docs/demo-roadmap.md).

## Demo connections

Use **Connections** to send a request between switchable accounts, then switch accounts to accept or decline. Blocking removes the relationship; reports are local simulations, not messages to moderators. The 45 sample discovery profiles remain separate examples. [Rules and storage contract](docs/demo-connections.md).
