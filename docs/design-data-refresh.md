# Dataset and visual refresh

Completed 13 October 2026, before Stage 7.

- Replaced all 30 original generic display aliases with varied South African given names. The original fictional identities retain their IDs, bios, and other fields.
- Added 15 fictional adult profiles, for 45 total. North-West University has five profiles at each of Potchefstroom, Vanderbijlpark, and Mahikeng.
- Preserved two duplicate given names to exercise deterministic ID-based tie breaking. All names belong to invented demo characters, not real student records.
- Added a midnight navy (#0b0d2a) visual system with cyan, magenta, purple gradients, dark cards and forms, visible focus styles, and local decorative SVG waves. The cyan UniMatch wordmark includes the requested magenta “Meet your soulmate” subtitle. Fictional-demo and bookmarking notices remain visible.
- Typography uses rounded/sans-serif system font fallbacks; no external font or image services are required.

## Verification

The build, JavaScript syntax check, and all 11 test groups passed. Tests now expect 45 profiles, four universities, and nine campuses. Bridge checks verify exactly five results for each NWU campus; persistence checks restore a bookmark exported with the previous 30-profile dataset and verify its renamed display value.

In the browser, created a fictional NWU Mahikeng profile, verified all three campus options and five Mahikeng discovery results, saved Siyabonga, and refreshed successfully. Desktop and 390-pixel mobile layouts were inspected; mobile content stayed within the viewport. Existing user-entered visitor names are not renamed by a data update.

Stage 7 repository setup and publication have not started. Earlier stage documents record their historical dataset and check counts.

