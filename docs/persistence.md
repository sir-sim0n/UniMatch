# Saved demo contract

Stage 6 stores one C++-generated JSON string under `unimatch.demo.v1` in localStorage. The key is scoped to the browser origin. Only the fictional visitor profile, preferences, and ordered bookmark IDs are saved. Catalogues, fictional discovery profiles, computed rankings, and UI navigation are not duplicated in storage.

## Version 1

The document contains exactly four keys:

```json
{
  "schemaVersion": 1,
  "visitor": null,
  "preferences": {
    "minAge": 18,
    "maxAge": 100,
    "genderIds": [],
    "universityId": null,
    "campusId": null,
    "degreeId": null
  },
  "savedIds": []
}
```

When present, `visitor` uses the complete profile shape from the [data contract](data-contract.md), including reserved ID `visitor:local`, nullable year, and the visitor's own gender and visibility setting. Preferences use the existing [core behavior contract](core-behavior.md). Bookmark IDs must exist in the current fictional dataset, be unique, and retain their saved order. A null visitor is valid only with default preferences and no bookmarks.

`Application::export_state()` serializes validated state with integer schema version 1. `Application::import_state(text)` parses the original JSON text in C++, checks the version and complete state, and commits only after every check succeeds. Any failure leaves existing in-memory state unchanged. No migration, coercion of unsupported versions, partial restoration, or removal of obsolete bookmark IDs is performed. Restoring unknown bookmark IDs rejects the document and offers recovery. The parser rejects documents above 65,536 UTF-8 bytes; ordinary state for this 45-profile demo is far smaller.

`state_json()` supplies both the UI snapshot and the export serializer, so these representations share one C++ implementation. Source dataset parsing is still separate. New C++ errors include `size`, `state_shape`, `schema_version`, and bookmark `unknown_profile`/`duplicate`; existing profile/preference errors are reused. Paths begin with `/state`.

## Bridge operations

| Operation | Exact payload | Success data |
| --- | --- | --- |
| `exportState` | `{}` | `{stateJson: "..."}` containing the versioned JSON text |
| `importState` | `{stateJson: "..."}` | `{changed: true}` when the whole document is accepted |

Both require an initialized session. The browser passes the stored string unchanged to C++; it does not parse or validate the schema. These operations implement browser persistence; a separate file upload/download interface is outside the agreed visitor journey.

## Browser behavior

`web/persistence.mjs` owns storage transport. Its lazy storage provider catches failures when accessing localStorage itself as well as read/write/remove failures. A test provider can simulate denied access and quota errors without changing production logic.

- Missing key: show welcome and wait for the first accepted change; do not write an empty document on startup.
- Valid stored state: restore it, then open discovery. Applied preferences and bookmarks survive refreshes.
- Invalid stored state: show recovery and leave the original string untouched. Start fresh requires the reset confirmation. Continue without saving uses temporary memory state and does not overwrite the rejected document.
- Read denied: allow the demo in memory with an explicit warning. Reload retries restoration; automatic writes remain disabled for that session.
- Write denied/full storage: keep the successful C++ update in memory, show a warning and Retry saving. A later accepted edit also retries. The old stored string remains intact.
- Reset: clear C++ state, remove only `unimatch.demo.v1`, and return to welcome. If removal fails, explain that old state may return on refresh, disable saving, and offer a confirmed removal retry. Never call `localStorage.clear()`.
- Another tab changes the key: pause writes and offer reload. Before every save, compare stored text with the last known value, including changes missed while the page was suspended. Back/forward-cache restoration also checks for external changes.

The cross-tab comparison is a best-effort overwrite guard, not a transactional lock: localStorage has no atomic compare-and-swap. Avoid editing the same demo simultaneously in multiple tabs; no merge is attempted. Storage availability and retention depend on browser settings, clearing site data, private browsing, and the origin used. This is a fictional local demo with no server synchronization.

## Test coverage

`persistence_integration` imports the production generated WASM module and uses the real C++ import/export API together with the production persistence controller. It covers state round trips and observable discovery results, strict version types, field validation, duplicate/obsolete IDs, failed-import atomicity, empty-state invariants, malformed and oversized input, read/write/remove errors, lazy-provider denial, retry, conflicting tabs, recovery choices, and unrelated-key preservation.
