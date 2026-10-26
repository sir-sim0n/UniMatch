# Create and post actions — v1.9.1

Create in the main navigation is the dedicated public post and poll composer. It retains title, body, topic, flair and optional timed polls. Guests see an account prompt. Successful publishing opens Home sorted by Latest; failed validation or persistence leaves the draft available. Home is for browsing and has neither a composer nor a global search field. My profile retains personal activity and settings; its public composer also moves to Create. Search remains a menu destination.

Every available post has Repost beside Save and Share. Give an award sits beside Follow on other authors’ posts and opens an accessible dialog with save/cancel and inline errors. Existing awards can be changed or removed. Self-awards remain unavailable. Guests are prompted to choose a demo account.

Posts no longer offer crossposting into circles. Historical crossposts and their attribution are retained. Authors can still continue threads; awards and crossposting no longer occupy that disclosure.
Verification: browser checks confirmed Home has no global search or composer, Create publishes successfully and opens Home, header awards save, direct Repost publishes, and crosspost controls are absent. At mobile width, scroll and client widths both measured 375px. Save/Repost/Share use accessible icon buttons on narrow screens.
Live verification on 2026-10-26: all 20 test groups and the 28-file publication check passed. Source bfb0912e2c6a3bc46bc9fc4d2faa7b556091e21b built and deployed successfully in GitHub Actions run 40333881925. Live Home loaded v1.9.1, had zero search/composer fields, and showed Create navigation, header awards and Repost beside Save/Share.
