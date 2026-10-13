# UniMatch architecture

The browser hosts the application. C++ owns the application rules, while JavaScript connects those rules to the page and browser storage. Emscripten compiles C++ into a `.wasm` file and a JavaScript loader; Embind exposes selected C++ functions on the loaded module.

## Stage 1 data flow

```text
index.html loads assets/app.js
    -> app.js imports assets/unimatch.mjs
    -> the module factory loads assets/unimatch.wasm
    -> JavaScript calls engine.getApplicationInfo()
    -> wasm/bindings.cpp forwards to the portable core function
    -> core serializes application metadata with nlohmann/json
    -> JavaScript parses the returned JSON and renders it as text
```

The core includes standard C++ and nlohmann/json only. It knows nothing about HTML, localStorage, networking, or Embind. The bridge has no domain decisions. This lets tests call the core directly without a browser and lets a separate integration test check the browser-facing module.

## Responsibility boundary for later stages

C++ will own models, validation, profile and preference updates, combined filtering, shared-interest counts, explanations, deterministic ranking, saved-profile operations, reset, and validated state import/export. JavaScript will read forms, forward requests, render responses, switch sections, load the dataset, and read/write only UniMatch's localStorage key. JavaScript will not duplicate matching or domain validation.

JSON strings at the bridge boundary keep ownership straightforward: callers receive ordinary JavaScript strings rather than C++ objects that need explicit deletion. Later operation responses will define validation errors before form features are added. Stage 1 has no mutable state or domain operations.

## Current browser API

After `await createUniMatch(...)` resolves, call `engine.getApplicationInfo()` with no arguments. It returns a JSON string:

```json
{
  "apiVersion": 1,
  "application": "UniMatch",
  "version": "0.3.0",
  "stage": 3,
  "demoOnly": true,
  "message": "UniMatch's C++ core is ready."
}
```

`apiVersion` describes this bootstrap response, not the future persistence schema. The call is read-only and repeatable. JSON object key order is not part of the contract. A failed module import, WebAssembly initialization, or unexpected bootstrap contract is caught in the page loader and shown as a readable error with a retry button. Reloading is suggested if a module import failure is cached by the browser. There is no state to recover in Stage 1.

## Build outputs and paths

`emcmake` selects the Emscripten compiler and CMake toolchain. CMake builds a static core library, links the bridge into the browser module, builds a separate test harness, and copies the web source files into `build/wasm/site/`. Ninja carries out the generated build steps. CTest invokes Node to run the checks.

The distributable folder contains `index.html`, `.nojekyll`, and `assets/` with CSS, JavaScript, an SVG favicon, `unimatch.mjs`, and `unimatch.wasm`. HTML paths start with `./`; JavaScript resolves the module and WASM relative to its own URL. This supports a Pages URL such as `/repository-name/` without hard-coding the repository name. Only the site folder will eventually be deployed, not tests, documents, dependencies, or reference files.

The dependency commit is pinned in CMake, the Emscripten version is checked at configure time, and tool versions are recorded at the root. The first configure downloads nlohmann/json; generated dependency files stay under the build directory. C++ exceptions are enabled consistently so future JSON parsing failures can become ordinary validation errors.

## Scope of this checkpoint

Stage 1 demonstrates the end-to-end connection and a minimal accessible page with responsive layout, loading feedback, safe text rendering, and retry behavior. It does not implement fictional data, profiles, discovery, ranking, bookmarks, persistence, or deployment. Those are intentionally assigned to later stages in the supplied prompt.

## Stage 2 data foundation

`models.hpp` defines plain C++ catalogue choices, universities and campuses, profiles, preferences, local application state, and a validated data bundle. Preferences and state are model declarations only; their operations arrive in Stage 3.

`data_validation.cpp` parses JSON with nlohmann/json and validates it before creating usable model values. `load_data(catalogueText, profileText)` first validates catalogues, then uses them to validate profile references. A failed load returns field errors and no partial bundle. `validate_profile` is shared infrastructure for dataset records and the future visitor editor.

The data flow currently runs in the C++ test harness: production JSON -> catalogue validation -> profile validation -> typed `DataBundle`. Browser loading and bridge operations for the dataset belong to later stages. The build copies production files into `site/data/` so that future JavaScript can fetch relative URLs; it does not embed the dataset in the browser module or store it in localStorage.

See [the data contract](data-contract.md) for Unicode rules, schemas, IDs, validation results, and ownership. Only the `tests/data_tests.cpp` harness uses file I/O. Core loaders accept strings and remain independent of browser and filesystem APIs.

Implementation references: [Emscripten modularized output](https://emscripten.org/docs/compiling/Modularized-Output.html), [Embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html), and [nlohmann/json CMake integration](https://json.nlohmann.me/integration/cmake/). The installed pinned toolchain is the authority for this build's verification.

## Stage 3 core operations

`Application::create` validates the input documents and owns the resulting catalogue/dataset bundle. The bundle is never mutated by application operations. Each application instance owns an independent visitor, preferences, and saved IDs. The state accessor is read-only; changes go through validated methods.

Profile edits reuse the Stage 2 validator. Preference validation also lives in `data_validation.cpp` so domain validation remains in one C++ layer. An update validates the complete proposed record before assigning it. Only the first profile creation sets discovery to the visitor's university and campus; later edits preserve existing filters.

Discovery applies every active preference, then generates shared IDs and explanations from the catalogue, then sorts by shared count descending, display name ascending, and stable ID ascending. The name/ID comparison uses unsigned UTF-8 bytes and does not depend on machine locale. Saved views are built from saved IDs independently of discovery filters. Every view is computed from current state, so bookmark flags and shared-interest explanations remain consistent.

`ProfileView` contains all fictional profile details needed by discovery and the full view, but only includes `visible_gender_id` when the profile permits it. Filtering uses the internally stored gender independently. Raw fictional `Profile` objects are not returned by the application API.

Confirmed reset replaces only mutable application state with its initial value. The immutable fictional data remains available for a new visitor. Browser confirmation dialogs, localStorage removal and welcome-screen navigation are integration tasks for later stages. See [core behavior](core-behavior.md) for method contracts and decisions.
