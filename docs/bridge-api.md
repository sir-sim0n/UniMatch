# Browser bridge API (version 1)

The generated ES module exports a factory. Await the factory, then construct `new engine.Session()`. Each session owns independent C++ application state. Call `session.delete()` when finished; never use a deleted handle. The browser helper `Client` owns this handle, exposes `call(operation, payload = {})`, and provides an idempotent `dispose()`.

`Session.request(jsonText)` accepts a JSON string and synchronously returns a JSON string. Requests contain exactly `operation` (string) and `payload` (object). Unknown keys in the envelope or operation payload are rejected. Domain validation, filtering, ordering, explanations, bookmarks, and reset remain in C++.

```json
{"operation":"discover","payload":{}}
```

Every response contains exactly `apiVersion`, `ok`, `data`, and `errors`:

```json
{"apiVersion":1,"ok":false,"data":null,"errors":[{"path":"/operation","code":"not_initialized","message":"Load the fictional data first."}]}
```

Success has `ok: true`, operation-specific `data`, and `errors: []`. Failure has `ok: false`, `data: null`, and structured errors. Error messages are for display; use codes and paths for UI decisions. Bridge shape paths start at `/payload`; forwarded domain paths use their original roots such as `/profile` and `/preferences` (see [core behavior](core-behavior.md) and [data contract](data-contract.md)). Render messages and profile text as text, never HTML.

| Operation | Exact payload | Success data |
| --- | --- | --- |
| `initialize` | `{catalogueJson, profilesJson}`: both raw JSON text strings | `{initialized: true}` |
| `getCatalogues` | `{}` | Universities with nested campuses, degrees, interests, genders, years; choice entries contain `id` and `label` |
| `getState` | `{}` | `{visitor, preferences, savedIds}` |
| `updateProfile` | `{profile}` | `{changed: true}` on accepted update |
| `updatePreferences` | `{preferences}` | `{changed: true}` on accepted update |
| `discover` | `{}` | Ranked array of public profile views |
| `viewProfile` | `{id}`: string | One public profile view, independent of current filters |
| `savedProfiles` | `{}` | Public views in bookmark insertion order, independent of filters |
| `save` / `unsave` | `{id}`: string | `{changed: boolean}`; repeated action returns false |
| `reset` | `{confirmed}`: boolean | `{changed: true}` after confirmed reset |

Initialize once per session before other calls. Invalid initialization leaves the session available for a corrected attempt. Reinitialization returns `already_initialized` without losing state. Pass source JSON as text so C++ parses and validates its original numeric types. Catalogue responses contain choices only, not the source schema version.

Profile fields: `displayName`, `age`, `universityId`, `campusId`, `degreeId`, optional/null `yearId`, `genderId`, `showGender`, `bio`, `interestIds`. Omitted `id` becomes `visitor:local`; a supplied ID must be that reserved ID. Updates replace the complete profile, not a partial patch. Preferences require `minAge`, `maxAge`, `genderIds`; optional/null `universityId`, `campusId`, and `degreeId` mean Any. An empty gender array means Any. See the domain contracts for limits and reference rules.

Public views contain `id`, `displayName`, `age`, `universityId`, `campusId`, `degreeId`, nullable `yearId`, nullable `genderId`, `bio`, `interestIds`, `sharedInterestIds`, `sharedInterestCount`, `explanation`, and `saved`. Hidden gender is serialized as null. The visitor's own state includes its gender and visibility setting. Public views never include raw hidden gender or a compatibility percentage.

`getState` returns visitor null before profile creation and after reset. It is an in-memory UI snapshot, not a versioned persistence/export format. Stage 6 adds versioned import/export through the operations below. `changed: true` for profile/preferences means an update was accepted, even if equal to the existing value. Save/unsave report whether membership actually changed.

Bridge error codes: `json` (malformed JSON), `request_shape` (wrong keys/types), `unknown_operation`, `not_initialized`, `already_initialized`, and `internal_error` (unexpected C++ exception, generic message). Domain errors are passed through, including profile-required, invalid references/fields, and `confirmation_required`. Reset requires literal boolean true; false is rejected by the core and strings/numbers are rejected by the bridge. Failed validation does not commit updates.

## Browser client

```js
import { loadClient, ApiError } from './api-client.mjs';
const client = await loadClient();
try {
  const choices = client.call('getCatalogues');
  // Submit complete form values, then render C++ results.
} catch (error) {
  if (error instanceof ApiError) console.log(error.errors);
  else throw error;
} finally {
  client.dispose();
}
```

`loadClient()` locates the module, WASM, and both datasets relative to the deployed files, allowing repository subpaths. It checks HTTP success and passes dataset text into C++. It disposes a session if data loading or initialization fails. `Client.call` returns success data or throws `ApiError` with `.errors`; calls after disposal throw an ordinary Error. Network/module failures also throw ordinary errors and should present a retry action. The checkpoint disables its button while loading, announces status, retains its in-memory session during back/forward-cache suspension and checks for storage changes on restoration. The Stage 6 persistence controller manages localStorage around accepted updates; no network write is used.

All data is shipped publicly as a fictional demo; hiding a gender in a view is a presentation preference, not a secrecy guarantee for downloadable source data.

## Stage 6 persistence additions

`exportState` with an empty payload returns `{stateJson: "..."}` containing schema version 1. `importState` accepts exactly `{stateJson: "..."}` and returns `{changed: true}` only after C++ validates the complete document. Both require initialization. See [the full persistence contract](persistence.md) for format, error codes, recovery, and storage behavior.
