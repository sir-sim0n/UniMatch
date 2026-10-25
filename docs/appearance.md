# Appearance — v1.8.2

My profile includes an Appearance selector: System, Light and Dark. System is the default and follows prefers-color-scheme changes while Orbit is open. Explicit Light or Dark overrides the device setting.

The preference is stored under orbit.appearance.v1 in this browser, shared across demo accounts and guest browsing. It does not sync across devices. Other open tabs update when storage changes. Invalid stored values fall back to System. Storage failures leave the selected appearance active for the current visit and show an explanatory status.

A small synchronous head script applies the preference before the stylesheet and app load, reducing a wrong-theme flash. The original Sea Glass light palette is preserved; dark mode uses deep teal surfaces, pale text and bright sea-glass accents. Native form controls and dialogs follow the selected color scheme. No social-data migration is needed.

Verification: theme tests exercise system changes, explicit overrides, restoring saved choices, invalid values, cross-tab changes and unavailable storage. Browser checks cover the My profile control, dark rendering, Light switching and persistence after reload.

Release verification (2026-10-25): 19 CTest groups and the 26-file publication check passed. GitHub Actions run 40208107053 successfully built and deployed source fb817e09a91ec2faf523ed544dc6fc14f2cdc2cb. Live My profile showed System, Light and Dark options; selecting Dark applied and saved the theme. No browser console errors.
