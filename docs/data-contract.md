# UniMatch data contract

Stage 2 defines the data used by the core. The authoritative implementation is in `core/include/unimatch/models.hpp` and `core/src/data_validation.cpp`; no JavaScript validation or matching rules have been added.

## Catalogue document

The root has integer `schemaVersion: 1`, `universities`, `degrees`, `interests`, `genders`, and `years`. Each catalogue list must be non-empty. An ordinary choice is `{ "id": "coding", "label": "Coding" }`. A university has `id`, `label`, and a non-empty `campuses` array of choices.

Choice IDs must contain 1–64 lowercase ASCII letters, digits, underscores, or hyphens, starting with a letter. They are exact identifiers and are not trimmed. IDs must be unique within a catalogue, university IDs must be unique, and campus IDs must be unique across all universities. Labels are required, trimmed, and limited to 100 Unicode code points. Unknown object fields are rejected to expose misspellings and accidental extra data.

The year catalogue describes available choices; selecting a year on a profile is optional. “Any gender” is a future preference choice represented by an empty list of gender IDs, not a profile gender. “Prefer not to say” is an actual catalogue option (`not-specified`); it is independent of `showGender`.

## Dataset document

The root has integer `schemaVersion: 1`, boolean `fictional: true`, a non-blank `notice` of at most 500 code points, and a non-empty `profiles` array. Version 1 is the only accepted dataset/catalogue schema. A persistence schema will be specified separately in Stage 6.

| Profile field | Accepted value |
| --- | --- |
| `id` | Stable ID, unique across the dataset; `visitor:local` is forbidden for fictional profiles |
| `displayName` | Required, trimmed, 1–50 Unicode code points; duplicate names are allowed |
| `age` | JSON integer from 18 through 100 inclusive; strings, booleans, null, and even `20.0` are rejected |
| `universityId` | Existing university ID |
| `campusId` | Existing campus belonging to that university |
| `degreeId` | Existing field-of-study ID |
| `yearId` | Existing year ID, null, or omitted; an empty string is invalid |
| `genderId` | Existing gender ID, retained even when hidden |
| `showGender` | Required JSON boolean |
| `bio` | Required, trimmed, 1–300 Unicode code points |
| `interestIds` | Array of 1–5 distinct, existing interest IDs |

The reusable profile validator has an explicit `ProfileKind`. Fictional profiles use normal IDs; a visitor must use exactly `visitor:local`. This guarantees the visitor identity cannot collide with the dataset. The future profile editor must call this same C++ validator.

## Text counting and normalisation

Lengths count Unicode scalar values (code points), not UTF-8 bytes or user-perceived grapheme clusters. For example, `é` counts as one code point, `e` followed by a combining acute accent counts as two, and a single graduation-cap emoji counts as one. Emoji sequences joined by zero-width joiners can count as several. The implementation validates UTF-8, rejects overlong encodings, surrogate values and code points above U+10FFFF, and does not perform NFC/NFD normalisation.

Leading and trailing Unicode White_Space values are removed before required and length checks: U+0009–U+000D, U+0020, U+0085, U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F, U+3000. Internal whitespace is preserved. Names and catalogue labels reject internal C0/C1 control characters; bios allow internal LF and tab but reject the other C0/C1 controls. U+200B zero-width space and U+FEFF are not treated as whitespace. Identifiers are never normalised or silently repaired.

Forms in later stages must explain code-point limits rather than relying solely on HTML `maxlength`, which counts UTF-16 code units. C++ remains authoritative.

## C++ results and error handling

`parse_catalogues(text)` returns `ValidationResult<Catalogues>`. `parse_dataset(text, catalogues)` requires catalogues already accepted by the catalogue validator. `load_data(catalogueText, datasetText)` enforces that order and returns `ValidationResult<DataBundle>`. `validate_profile(json, catalogues, kind, path)` validates one record and returns `ValidationResult<Profile>`.

Each result has an optional `value`, an `errors` vector, and `ok()`. Success contains a typed value with trimmed text and no errors. Failure contains no value and one or more `{path, code, message}` errors. Paths identify the field, such as `/dataset/profiles/0/age`. Independent profile errors are collected together. Malformed JSON is handled with a `json` error; invalid catalogues stop bundle loading before profiles are interpreted. No invalid records are silently skipped and no partial dataset is returned.

Codes currently include `json`, `type`, `unknown_field`, `array`, `required`, `length`, `utf8`, `control_character`, `id`, `integer`, `range`, `duplicate`, `reference`, `campus`, `boolean`, `interest_count`, `reserved_id`, and `fictional`.

## Models reserved for Stage 3

`Preferences` declares age bounds, gender IDs, and optional university/campus/degree IDs. Empty gender IDs mean any gender; absent optional filters mean any. Stage 3 will validate preferences and apply the visitor's university/campus defaults after profile creation. These model defaults are not an implemented discovery flow.

`ApplicationState` holds an optional visitor, preferences, and saved fictional IDs. There is no saved-state import/export, persistence, or bookmark operation yet. The catalogue and fictional dataset are separate from this local state and will not be duplicated in browser storage.
