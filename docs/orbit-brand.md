# Orbit 1.1.0 — Sea Glass

Brand: **Orbit**. Wordmark: lowercase **orbit.**

Slogan: **Your campus. Your Interests. Your Connections**

| Role | Colour |
| --- | --- |
| Primary | #266B73 |
| Background | #F6FAF8 |
| Text | #253A3B |
| Secondary text | #536B6D |
| Soft green | #DDEDE7 |
| Soft blue | #E6F0F5 |
| Soft blush | #F7E9EE |

The supplied blush value (#F7E9E) was incomplete. #F7E9EE is the documented interpretation. The symbol also uses reference-inspired sea glass (#86B5AC) and coral (#DFAAAA) accent fills.

## Recreated assets

Original SVG geometry recreates the tilted teal elliptical orbit, central two-tone planet, coral satellite, and lowercase wordmark. No reference JPEG is embedded. `web/orbit-mark.svg` and `web/orbit-logo.svg` have transparent backgrounds; `web/orbit-logo-stacked.svg` is the full logo on a soft-green panel; `web/favicon.svg` is the rounded app icon. Wordmark text uses a local Arial/Helvetica fallback; no external font requests are made.

## Version and compatibility

The first shipped UniMatch site is tagged v1.0.0, retaining its historical 0.7.0 internal build metadata. This visual rebrand is v1.1.0 because functionality and saved data remain compatible. Future releases update CHANGELOG.md and build metadata together. Major incompatible changes increment the major version.

The GitHub repository and Pages path remain UniMatch to preserve shared links and the existing storage origin. Legacy C++ namespaces, module names and the unimatch.demo.v1 storage key remain internal compatibility identifiers. Historical checkpoint documents retain their original product name. No real account, messaging, matching, or backend features were introduced.

## Verification

Release build and all 11 test groups passed locally. The publication check accepted all 14 required files. Desktop and 390px mobile layouts were visually reviewed. A fictional NWU profile was created, a profile bookmarked, and refresh restored the visitor and bookmark. The saved-profile view displayed correctly. No browser errors or warnings were reported. GitHub Actions run [39962543694](https://github.com/sir-sim0n/UniMatch/actions/runs/39962543694) passed build and deploy for source commit `7dc958d`. The public HTTPS page loaded Orbit branding and its WebAssembly-backed welcome screen successfully, with no browser errors or warnings. Release verified on 2026-10-23.
