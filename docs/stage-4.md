# Stage 4 — browser bridge

Completed 12 October 2026. The Embind `Session` API exposes initialization, catalogues, state, profile and preference updates, discovery, detail views, bookmarks, and confirmed reset. A shared JavaScript client handles transport and lifecycle while C++ retains the application rules. The browser checkpoint now loads and validates both fictional JSON files before reporting a successful connection.

## Verification

- Configured and built with the pinned Emscripten 4.0.15 toolchain; bridge compiles with warnings treated as errors.
- All 10 CTest groups pass: the previous 402 domain checks and two smoke groups, plus 181 JavaScript bridge assertions against the actual generated WebAssembly module.
- Bridge tests cover every operation, malformed envelopes, invalid initialization and retry, reinitialization protection, atomic validation failure, Unicode round trips, hidden gender, bookmark idempotency, filter-independent saved results, strict reset confirmation, session isolation, and handle disposal.
- Browser loaded successfully at `/repository-name/`, demonstrating module, WASM, and JSON paths work under a repository subpath. The connection button completed a second C++ call.
- An intentional missing-WASM route displayed a readable error and an enabled retry action. Retrying with the file still missing returned to the same usable error state.

See [API requests, responses, and errors](bridge-api.md). The complete forms, discovery cards, detail and saved screens are Stage 5. Persistence/import/export remain Stage 6, and publication remains Stage 7. No repository or public deployment was created.
