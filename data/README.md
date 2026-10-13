# Fictional data

`catalogues.json` contains 4 universities, 9 campuses, 10 fields of study, 15 interests, 7 gender options, and 7 year-of-study options. Stable IDs are used in records; labels are for display. These lists are deliberately small demonstration choices, not comprehensive university or course directories.

`profiles.json` contains 45 entirely fictional adult profiles, ages 18–44. South African given names are used for invented demo characters; their biographies were written for this project; they are not real student records or scraped content. There are no photographs, surnames, contact details, addresses, or residence information. Coincidental resemblance to an actual person's chosen name is unintended.

Lerato and Thando each appear twice to retain duplicate-name test coverage. Each record has a different stable ID, `fictional-001` through `fictional-045`. The reserved visitor ID is `visitor:local`. The dataset exercises all nine campuses, all gender options, all fields of study, visible and hidden gender, optional years, and the 1–5 interest limits. It includes pairs with at least three shared interests and pairs with none. Sharing interests makes no claim about romantic compatibility.

University and campus names provide South African context without implying endorsement, attendance, or a real academic record. Fields of study are broad demonstration labels; their profile combinations are not an authoritative statement about courses offered at a particular campus.

Campus labels were checked against official sources on 12 October 2026:

- [UCT campus maps](https://uct.ac.za/students/campus-maps): Upper and Middle campuses.
- [University of Pretoria campuses](https://www.up.ac.za/campuses-maps-directions): Hatfield and Groenkloof campuses.
- [Wits virtual campus tours](https://www.wits.ac.za/alumni/campus-tours/virtual-tours/): East and West campuses.

C++ validates schema versions, catalogue uniqueness, required fields, age types and limits, Unicode text lengths, all references, campus ownership, profile IDs, visibility flags, and unique interest selections. Run `cmake --build --preset wasm-debug`, then `ctest --preset wasm-debug` after editing data. Invalid examples belong only in `tests/fixtures/`.

The build copies only `catalogues.json` and `profiles.json` into the website's `data/` directory. C++ validates these files during testing and again when the browser initializes. See [the data contract](../docs/data-contract.md).

## Dataset refresh — 13 October 2026

North-West University and its Potchefstroom, Vanderbijlpark, and Mahikeng campus labels were added as requested by the user. Each campus has five new fictional profiles. The original 30 profile IDs remain unchanged, preserving existing bookmarks. All original display names were replaced with varied South African given names. No real student identities or records were used.
