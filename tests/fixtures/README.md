# Test fixtures

`invalid_data_cases.json` defines 58 deliberately invalid variants as JSON Patch operations against the production baseline. Every case names the expected field path and error code. The C++ test applies each patch using nlohmann/json, then requires rejection without a partially returned dataset. This keeps the reason for each failure visible without duplicating the entire production data file.

`malformed.json` is intentionally not valid JSON. Boundary and Unicode cases are also constructed in `tests/data_tests.cpp`, including UTF-8 sequences that cannot be represented in a valid JSON fixture file.

These fixtures are embedded only in the automated test harness. They are not copied into the website's data directory. Production records stay in `data/`; later saved-state fixtures will also belong here.
