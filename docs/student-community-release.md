# Student community implementation

Prepared 17 November 2026 for Orbit 1.16.0. Production migration approval and deployment are pending.

## Product direction

Orbit hosts student experiences, confessions, questions and advice under private usernames. Students can publish under their username or choose Anonymous OP for an individual discussion. Replies by that post's author retain the Anonymous OP label. Other commenters use their own usernames.

The initial pilot defaults to 50 adult students at NWU Vanderbijlpark. The accepted student mailbox domain is mynwu.ac.za, documented by NWU at https://services.nwu.ac.za/information-technology/student-email. Mailbox verification proves mailbox control. Current enrolment, campus and age are declarations.

The owner selected email setup for later. Pilot registration therefore starts closed in the database, and the live signup screen explains the pending email/moderator setup. The owner selected providing a moderator username but has not supplied the actual username. No real account has been granted moderation privileges.

An existing non-student-mailbox account can request a confirmed email change or delete its own account before enrollment. An explicitly assigned platform moderator can review the moderation queue without a student membership, while student-feed access continues to require membership.

## Implemented behaviour

| Area | Browser demo | Cloud application |
| --- | --- | --- |
| Identity | Private username settings, four symbolic avatars and stable fictional persona IDs | Username-only registration/profile updates and avatar settings |
| Confessions | Anonymous post display, Anonymous OP replies, exclusion from profile activity and public karma | Database projections remove the anonymous author's UUID, handle, name and identifying profile fields from posts, previews, replies and saved comments |
| Sharing | Post links omit the selected fictional persona | Cloud links use post/comment IDs |
| Communities | Seeded NWU Confessions, Questions and Across campuses groups; shared post composer opens from community pages | Platform-managed campus communities, automatic membership when joining the pilot |
| Categories | Seven student-life categories and feed filter | Same categories, filtered before pagination |
| Composer | Identity/audience preview, privacy reminder and session draft storage | Same controls, with drafts keyed by authenticated account UUID |
| Moderation | campusowl demonstrates report review, remove/restore, 24-hour restrictions, appeals and action history | Explicit private moderator roles, checked queue/actions, temporary restrictions, appeals and audit records |
| Student access | Fictional sample browsing remains available | Reading and participation require verified student membership |
| Account lifecycle | Simulated deletion removes authored text and disables the selected demo persona | Email recovery/reset screens and a recently authenticated deletion endpoint remove application records, revoke sessions and delete the Auth identity |

The demo's switchable personas and backups contain underlying fictional actor records. It demonstrates anonymous presentation and is unsuitable for real confessions. The cloud database is the privacy enforcement boundary for real accounts. Operators retain access needed to administer the system. Screenshots and identifying story details can reveal information outside Orbit.

Anonymous posts are excluded from author-filtered and follow-filtered cloud feeds. Raw identity-bearing tables and legacy helper functions are unavailable to browser roles. Ownership permissions are conveyed separately from public author labels. Moderator queues contain the limited author identifiers needed to restrict offending accounts.

The cloud removes a deleted account's authored discussions, including replies within those discussions. Other circle posts are detached from a deleted student's owned circle and retained in their campus feed. Deletion uses an idempotent application-data transaction followed by Auth identity deletion. A failed final Auth deletion produces a pending-deletion job for an operator retry. Database backups and provider logs follow provider retention and require review before recruitment.

## Validation

Local JavaScript checks cover anonymity/profile isolation, karma, share links, moderation permissions, reports, appeals, draft isolation, simulated deletion and version 9 to 10 migration. Existing messaging, circles, public feed, discovery, engagement, community, campus and performance tests pass locally.

An isolated PostgreSQL workflow builds the complete migration chain against a synthetic Auth schema. Its regression suite checks enrollment gates, anonymous API projection including previews, raw-table/legacy API denial, category filtering, profile isolation, report/moderator separation, restrictions, appeals and idempotent application deletion.

The release workflow exercises the demo and cloud composer in headless Chromium and retains screenshots and results. A local browser preview attempt was blocked by loopback connectivity. Actual verified-email delivery, recovery-mail delivery, Auth deletion and independent-device accounts still require end-to-end checks after email setup.

## Deployment sequence

1. Review the passing source, database and browser checks in the implementation pull request.
2. Obtain approval for the live schema/access-control migration. Automatic approval review rejected the initial attempt because its broad permission and API changes could cause an outage or account lockout. No live schema changes were applied by that attempt.
3. Apply only the new game-retirement and student migrations through the connected Supabase project. Its earlier migration history is incomplete, so a full database push is unsuitable until history is reconciled.
4. Deploy orbit-account and the retired orbit-games Edge Function with JWT verification enabled. Recheck database security advisors and execute the rollback-only student regression suite on the project.
5. Merge and publish the matching demo/cloud interfaces using the versioned 1.16.0 asset URLs. Verify both published entry points and record the workflow/commit evidence here.
6. Before opening the pilot, configure custom email delivery, confirm the sender domain, choose the actual moderator account and test two independent devices. Set pilot_settings.registration_open only after those steps. Recruit the pilot group and monitor posting, replies and report response times.

The paid-service budget, sender/domain credentials and recruitment of actual students remain owner decisions. No external invitations or messages have been sent.

The earlier game endpoint retirement was deployed separately to the existing project as orbit-games version 3, with JWT verification enabled. The student migrations and account-deletion function remain pending production approval.

## Checked implementation evidence

Tested code commit ae6b180964d00ea13732df6d53de0ec0e7197c71. Release workflow 44156518448 passed all 25 CTest groups, publication validation, account-function TypeScript syntax and Chromium browser journeys. Isolated PostgreSQL workflow 44156518444 passed fresh migrations and student privacy/permission regressions.

Browser evidence is available at https://github.com/sir-sim0n/UniMatch/actions/runs/44156518448/artifacts/14360678645 and includes anonymous composer/discussion, cloud composer/moderation screenshots and results.json. Mocked cloud account checks contact no real Auth users or email recipients.

Live baseline API anchors were inspected and match the migration's expected author filter, circle-owner guard and profile projection. Production migration approval is still required. Real email delivery, real-session deletion and cross-device user testing remain pending email setup and production rollout.
