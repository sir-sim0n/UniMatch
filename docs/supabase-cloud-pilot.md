# Orbit 1.13.0 — Supabase cloud pilot

Live entry: https://sir-sim0n.github.io/UniMatch/cloud.html
The full fictional demo remains at the original URL. Demo personas and their local data are not uploaded to Supabase.

## Scope
The cloud pilot supports email/password accounts, public profiles and campus search, posts, comments and votes, following and accepted connections, block/report, public/private circles with join approvals and moderators, private messages, notifications, Four in a Row and Dots and Boxes. Home is public; participation requires a confirmed account. Popular uses Hot ranking. Campus details are self-declared.

This is the core shared pilot, not full demo parity. Polls, reposts/quotes, awards/flair/karma, advanced hashtags/trending, saved activity and the richer threaded interface still belong to the fictional demo and need cloud migration. Messages/games refresh when opened or using Refresh conversation; Realtime subscriptions and push delivery are not implemented. No media upload is provided.

## Deployment and security
Supabase project Orbit: vzybbarxknofzegdubgq, eu-west-1, Free, Postgres 17.11. Public URL and publishable key are intentionally shipped in cloud-config.mjs. No service/secret key is bundled. The game function uses built-in server secrets and verifies the user with Auth; JWT verification remains enabled.

All 14 public tables have RLS, explicit SELECT grants and restricted writes through a checked transactional gateway. Actor identity comes from the verified session, not supplied payloads or editable metadata. Private circles, messages, blocks, and game participants are scoped server-side. Game rules run in the Edge Function; the service-only commit uses pair locks and version checks. Moderators come from the private role table; no platform moderator is assigned yet. Writes have a per-actor minute limit; auth rate limits remain enabled.

Canonical migrations were generated with CLI filenames and applied through the dashboard SQL Editor because connected Supabase tools/CLI authentication were unavailable. Remote migration-history entries have not been reconciled: do not blindly replay the foundation against this existing project. Reconcile history with the CLI before future db push. The second migration restricts the dashboard-created automatic-RLS helper. Default table exposure was disabled and automatic RLS enabled at project creation.

Auth Site URL is https://sir-sim0n.github.io/UniMatch/cloud.html (also the confirmation redirect fallback). Confirmation remains enabled. Supabase's default email service restricts recipients to project-team addresses; connect custom SMTP before opening registration to students. Password creation requires 12 characters in the client. The first account/confirmation and two-device gameplay still need human testing; no owner credentials were entered by the agent. Add recovery/change-email/account-deletion flows and moderation operations before a general launch.

Pinned packages: supabase-js 2.118.0, CLI 2.122.0, esbuild 0.28.2. npm ci and npm run build:cloud rebuild the local browser bundle. Game deployment source is supabase/functions/orbit-games/index.ts; run node scripts/build-cloud-games.mjs to regenerate it from the shared handler, runtime and game core when changing game rules. Deploy it separately with the authenticated Supabase CLI or dashboard. GitHub Pages deploys only the frontend, not SQL or Edge Functions.

## Verification
24 automated CTest groups passed, plus publication validation for 37 files. npm audit reported zero vulnerabilities at release preparation. The rollback-only SQL suite passed in the actual project: actor spoofing, author ownership, private circles, messaging RLS, blocks, moderator isolation, anonymous/unverified write denial, service-only game commits, stale versions, and third-party game privacy. Fixtures use .invalid emails, no passwords, and roll back. Handler tests cover identity, accepted connections, turns, blocks and duplicate competing moves. Public RPC and unauthenticated Edge smoke tests passed. Guest browser navigation checked Home, Account, Discover and Circles.

These checks are not a production load certification. Capacity, account email delivery, actual user sessions and two-device interaction need a controlled human pilot. Free-plan quotas and backups should be reviewed before broader onboarding.

Advisor review: Security and Performance each reported zero errors and zero warnings after fixes. The missing circles.owner index was added. Unused-index suggestions on the empty project are retained until real query traffic justifies changes; private internal RLS tables intentionally have no client policies.

Release verification (2026-10-27): initial GitHub build and Pages deployment succeeded (run 40515670029, e8f7361). The final frontend source is 7b2f44d; its live cloud-ui file includes the navigation guard. Run 40516391170 completed the test/build/upload steps but its overall GitHub status was still waiting when checked. Live guest browsing, signup gating and the unchanged demo were verified; the user chose to test the first confirmed account later. No real account or two-device gameplay success is claimed.
