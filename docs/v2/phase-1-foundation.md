# Orbit v2 — Phase 1 foundation

Date: 2026-10-23. Status: planning deliverables complete; implementation not started.
Live product remains Orbit v1.1.0. This is a specification, not a claim that real accounts exist.

## Product decision

Orbit helps adult university students find people and activities around shared campus life. Slogan: Your campus. Your Interests. Your Connections. Preserve the Sea Glass visual identity.

The owner explicitly selected **campus connections only** on 2026-10-23. No dating mode, romantic matching, attractiveness ratings, gender filters, or age-based discovery in v2. Connection intentions: friendship, study, activities, networking; students may choose several. Gender is not needed for this release and will not be requested or migrated.

## First real-user release

Build in Phases 2–6: accounts and profiles; discovery and mutual connections; private text chat; interest circles and discussions; campus events and RSVPs. Phase 7 is the invited pilot and launch-readiness review. Phase 8 adds study-module matching, spontaneous invitations, skill swaps, and optional challenges after feedback.

Study is an initial connection intention; the specialised study-buddy/session feature comes later. Basic in-app notifications for requests, replies and event changes belong to their respective feature phases. Email is initially for account verification, recovery and essential account notices, not marketing. Push notifications and media attachments are deferred.

The first release excludes payments, marketplace, precise location, contact-book uploads, AI matchmaking, video calls, public popularity scores, public profile indexing, image uploads, institutional SSO, and claims of verified enrolment. Use initials avatars for the pilot; photos require a later media and moderation design.

## Pilot assumptions

Planning target: 50–100 invited adults at one campus. Select the campus with the owner before recruiting; NWU is a candidate, not a confirmed partner. Retain all four current universities and nine campuses as catalogues. Only pilot-enabled campuses admit members initially. No institutional endorsement is implied.

Eligibility: 18+ self-attestation, self-declared current student status, verified email, valid invitation, and completion of onboarding. This checks email control and declared eligibility, not identity, age documents, or university enrolment. Never label it “verified student”. No identity-document upload is planned.

Each invitation is random, single-use, email-bound, expires after 7 days, and is stored hashed. Its consumption and membership activation must be atomic and server-enforced. Changing campus cannot bypass the pilot gate. Staff use separately granted roles, never profile fields.

## Account journey

Invitation → email/password sign-up → email confirmation → eligibility and policy acknowledgement → profile → explicit discovery opt-in → campus home.

Unconfirmed or incomplete accounts cannot browse members or send requests. Email changes require reconfirmation; recovery must not disclose whether an address has an account. Sign-out clears app caches; sessions expire/revoke according to the auth provider. Account recovery and deletion require recent authentication. Admin/moderator accounts require MFA before real-user access.

Profile fields: display name (1–50 Unicode code points), university, campus, field of study, optional year, bio (1–300 code points), 1–5 interests, and connection intentions. No phone number, private email, date of birth, public age, gender, residence address, or live location is displayed. Do not copy fictional demo details into real accounts.

## Privacy and interaction defaults

- Profiles are undiscoverable until onboarding completes and the member explicitly enables discovery. Initial audience is eligible members on the same campus. Cross-campus discovery is deferred.
- Pausing discovery hides the member from new discovery/request flows; existing accepted connections remain until removed or blocked. Explain this distinction in settings.
- Both sides must accept a connection before private chat. One pending request per unordered pair; declines cannot be immediately resent (initial cooldown 7 days). No self-requests.
- Blocking suppresses discovery, new requests, private delivery and realtime access in both directions immediately. Existing chat history may remain read-only for participants and reports. Shared group content needs separate hiding/moderation rules; blocking does not promise removal of every shared-space reference.
- Saved profiles are private bookmarks, distinct from connections. No public follower counts, read receipts, last-seen or presence in the first release.
- Reports are private to the reporter and authorised moderation staff. Staff see only relevant evidence, with access/actions audited. No general staff browsing of private conversations.
- Text chat is access-controlled, not described as end-to-end encrypted. Escape user text; do not render arbitrary HTML.
- Account deletion immediately disables access/discovery; propose primary-data purge within 30 days. Shared content is removed or anonymised according to a published policy. Backups and retained abuse evidence need separate expiry rules.

Proposed retention (must be reflected in the launch policy): operational logs 30 days; resolved report evidence 90 days unless a documented hold; expired invitations purged within 30 days. Message history remains while accounts/conversations are active, subject to deletion policy. Restore procedures must reapply deletion requests. These are product proposals, not a legal compliance certification.

## Acceptance and rollout

See [architecture](architecture.md) and [implementation backlog](phase-2-backlog.md). Definition of Phase 1 done: first-release scope, confirmed connection purpose, account/privacy rules, stack decision, conceptual data model, costs, migration boundary and Phase 2 acceptance tests are written and version-controlled.

Phase 1 creates no paid subscriptions, vendor accounts, database resources, migrations or real-user collection. Before hosted Phase 2 setup, the owner supplies/accesses provider accounts and chooses an available sending domain; production spending needs explicit approval. These are provisioning dependencies, not missing product-scope decisions.

Before pilot recruitment: choose campus and moderator/support owner; approve recurring budget; select data region after latency and data-processing review; finalise policies and retention with appropriate South African privacy review; verify restore, deletion, reporting and incident-response procedures. Do not treat a region choice alone as compliance.

Track pilot activation, accepted connections, circle participation, event RSVPs and report-resolution time using minimal aggregate counts. Proposed targets: no unresolved critical security/data-loss defects, all access-control tests passing, and at least 80% of invited usability testers completing onboarding unaided. Engagement targets will be set after the pilot baseline.

## Delivery history

Phase 1 is documentation only. v1.0.0 and v1.1.0 tags remain intact. v2 work goes on feature branches with staging data; no merge of unfinished authentication into the demo deployment. Use v2.0.0-alpha.N for internal checkpoints, beta.N for the invited pilot, and v2.0.0 after the Phase 7 launch gate. Keep CHANGELOG.md current at each checkpoint.
