# Orbit shared local pilot

Requires Node.js 24. Start from the repository root after building the frontend:

```powershell
node backend/server.mjs
```

Open http://127.0.0.1:8030/pilot/ . The existing demo frontend is available at http://127.0.0.1:8030/ . These are separate datasets and account systems. The pilot binds loopback by default. It does not change GitHub Pages into a backend.

## Implemented

- Username/password registration, login/logout, salted scrypt password hashes, expiring opaque sessions stored as hashes, HttpOnly/SameSite cookies, origin and CSRF checks. Authentication concurrency and request rates are bounded. Accounts are unverified; campus details are self-declared.
- Durable SQLite records with WAL, foreign keys, prepared queries and indexes. Posts, comments, follows, votes, connections, messages, notifications, reports, circles/memberships and games use separate tables. Feed/message/notification/game APIs return at most 50 records.
- Author-only content changes; accepted connections for sending messages and games; participant-only histories; blocking; private-circle membership, join approvals and owner-controlled moderator roles; server-only report review permissions.
- Server-side Four in a Row and Dots and Boxes rules reuse the tested game core. Transactional version checks reject stale and concurrent duplicate moves. Removing a connection or blocking cancels unfinished matches.
- A pilot browser interface for registration, profiles, public posts, replies, follows/connections, private circles, messages, both games and reports.

The pilot is a testable foundation, not complete feature parity with the demo. Polls, awards, flair, reposts, saved items, full search and richer notification UX still belong to the existing demo; they have not been migrated into this server API. No email delivery, account verification, password recovery or public-user operations are claimed. It is not load-certified for a production launch.

## Data and operation

The default database is `backend/orbit.sqlite` and is ignored by Git, including WAL/journal files. Set `ORBIT_DATABASE` to a persistent path when deploying. Back up the database through SQLite's supported backup tooling or while the server is stopped; copying only the main file during live WAL writes is unsafe.

`PORT` changes the port. `ORBIT_MODERATORS` is a comma-separated list of registered handles allowed to review reports; there is no client-side role grant. A public bind using `HOST` requires an HTTPS `ORBIT_ORIGIN` and a TLS reverse proxy. Keep the database outside static assets. The server does not enable cross-origin cookie access; the pilot and API are served from the same origin. Do not point GitHub Pages at a different API origin and assume authentication will work without integration.

Run `node tests/backend.mjs` to test isolated accounts, database restart durability, CSRF/origin checks, author ownership, private circles, report permissions, private messages, blocking and competing moves. Test databases are temporary and removed after tests.

## Hosting decision

No hosting account or paid service was created. The five demo improvements deploy to GitHub Pages. The shared pilot remains local until a provider is chosen and deployment/integration is completed.

Supabase Free is recommended for the first cloud pilot because it supplies managed authentication and PostgreSQL. As checked on 27 October 2026, it advertises 500 MB database space, 1 GB storage and 50,000 monthly active users; those allowances do not guarantee application throughput, and projects pause after a week of inactivity. Adopting it requires porting this SQLite schema/permissions to PostgreSQL RLS and server functions and replacing local authentication with Supabase Auth. This repository does not claim that work is already deployed.

Cloudflare Workers/D1 is another free-tier option with a different runtime/auth integration. Render supports conventional Node services, but its free filesystem is temporary and idle services sleep; this SQLite server must not store durable user data on that ephemeral filesystem.

Sources: https://supabase.com/pricing · https://developers.cloudflare.com/d1/platform/pricing/ · https://render.com/docs/free
