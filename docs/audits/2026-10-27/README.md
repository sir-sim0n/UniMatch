# Orbit scale audit — 27 October 2026

Audited release: **v1.11.0**, product source `c445bd20dbb2dbf2b00eef26e1b72818cb97138d`. Live site: https://sir-sim0n.github.io/UniMatch/ . No application behavior changed during this audit.

## Verdict

The deployed demo is healthy at its current tiny content volume. It is **not ready for a growing social platform or real-user concurrency**. Static delivery is working; browser data processing, unbounded rendering and the local-only account/storage architecture are the constraints. A visitor count capacity cannot be inferred from these tests.

The immediate priority is to make the demo tolerate growing content. Real users additionally require authenticated identity, shared durable storage and server-authoritative permissions/game moves. Four hard-coded actors and browser-local state do not provide that foundation.

## Evidence and method

- All **21 CTest groups passed**; the **30-file publication check passed**.
- Six ordinary live GET requests, at most two simultaneous, all returned **HTTP 200**, gzip and CDN cache HIT. TTFB ranged **65–577 ms** in this small sample. A separate curl HTML request returned 200 with 291 ms TTFB. These are resource requests, not page-load or user-capacity measurements.
- Live assets used `v=1.11.0`, with correct JavaScript and WASM MIME types. Cache-Control was `max-age=600` on sampled resources.
- Generated site files total **577,964 bytes** uncompressed. WASM is **301,712 bytes** on disk and **100,025 bytes** gzip in the sampled request. This asset size is not the principal bottleneck in the current audit.
- Live guest feed: four posts, 342 elements, no captured console warnings/errors. Mobile test requested 390px viewport; content client and scroll widths were both 375px, with no horizontal overflow. Hot sorting returned the expected feed view.
- Local content benchmark used production JS modules and synthetic records: N posts, 2N replies, 2N votes, 2N messages. Four fixed demo actors; not N users. Three serial measurements per operation, reported as median and maximum. Memory-backed storage excludes disk-backed localStorage costs and browser DOM work. Existing functional tests overlapped part of the run. This is a diagnostic benchmark, not a controlled device certification. Host: Intel Core i5-8265U, Node v24.22.1.
- The 10,000-post benchmark was stopped after the 5,000-post result exceeded acceptable latency; no 10,000-post performance result is asserted.

| Dataset | JSON size (UTF-8) | Reload/validation median | Feed projection median | Hot sort median (max) | Save mutation median |
| --- | ---: | ---: | ---: | ---: | ---: |
| 100 posts + associated records | 0.107 MB | 6.7 ms | 3.6 ms | 26.6 ms (41.6 ms) | 9.4 ms |
| 1,000 posts + associated records | 1.069 MB | 55.5 ms | 51.4 ms | 791.5 ms (2,162.8 ms) | 55.3 ms |
| 5,000 posts + associated records | 5.374 MB | 140.0 ms | 167.1 ms | 28,230.9 ms (43,040.4 ms) | 350.9 ms |

UTF-8 size is not a measurement of browser quota accounting. The corresponding JavaScript string character storage estimates were 0.214, 2.137 and 10.748 MB using two bytes per code unit; actual accounting is browser-specific. No live browser storage was filled or cleared.

## Findings, in priority order

### P1 — Render bounded pages, not every post

`web/feed-ui.mjs:107` builds every matching post. Voting, saving and opening replies regenerate the entire feed (`render`/`run` at lines 19–27). Per-post hover cards also recompute karma over the whole dataset. Messages, search results, notifications and finished game histories are likewise unbounded.

An isolated page using the actual production feed renderer, synthetic in-memory data and stub profiles rendered 100 posts into **4,846 elements**, taking **1,935.5 ms** through two animation frames (one sample). This bypasses WASM profile-loading overhead. The 1,000-post attempt made browser-control click/read operations time out; the isolated tab was closed. That is a responsiveness warning, not a measured completion time or proof of a browser crash.

**Action:** start with 20–30 posts per page and an explicit Load more control. Add bounded message/notification/history pages and incremental post updates. Create reply subtrees only when opened. Test the first page against a 10,000-record backing dataset without mounting all records.

### P1 — Index counts and compute rank once per post

`web/engagement-core.mjs:37–38` filters vote/reply arrays inside the sort comparator. `karma`, post action counts and `readablePost` also repeat scans. Work multiplies as related arrays grow; Hot/Top, feed projection and hover cards pay these costs repeatedly.

A standalone candidate computes author/post maps, vote counts, reply counts and Hot scores once. In a separate 1,000-post experiment, production sorting took **1,963.16 ms median** versus **6.13 ms** for the indexed candidate; complete ordering matched on that fixture. This is a proof of the approach, not a product speedup claim. The candidate is not deployed and needs parity tests for every sort mode, pins, deleted content, blocks and time ranges.

**Action:** create Maps for posts/replies and aggregate counts once per snapshot; cache per-author karma and per-post Hot/Top scores. Recompute affected entries when activity changes.

### P1 — Replace the single synchronous storage payload

`web/demo-social.mjs:39,57,95–97` parses/validates all social state on reload, clones it on each write, validates everything, serializes everything and saves one localStorage value. Messages, posts, notifications and games all share the cost. A single bookmark change at the 5,000-post fixture cost about 351 ms even with an in-memory storage adapter, before UI re-rendering or disk cost.

The 5,000-post fixture contains 5.374 MB of JSON before accounting for other keys. MDN documents limited Web Storage quotas and synchronous behavior. This makes quota failures and main-thread stalls a concrete growth risk; the exact failure boundary was not measured here.

**Action for demo:** IndexedDB stores by entity with indexes, transactional record updates, bounded caches and an export/restore path before retention policies. Do not silently delete student content to stay below limits. IndexedDB improves local scale but does not introduce cross-device sharing.

### P1 before real users — Shared accounts, permissions and game authority

`ACTORS` is hard-coded to four accounts in `web/demo-social.mjs:9`. Profile discovery creates temporary WASM clients for those accounts (`web/demo-accounts.mjs:61`). Reports are saved locally, messages and notifications never reach another device, and privacy/game rules are client-side simulations.

**Action:** introduce authenticated identity, durable database records, server-enforced read/write permissions, private-circle membership checks, blocking enforcement, moderation workflows, and transactional game moves with version checks. Start with one university pilot, then run authenticated concurrent-user tests against a staging backend. There is no shared API to stress-test today.

### P2 — Make large comment threads bounded and iterative

The recursive `add` function at `web/feed-ui.mjs:120` filters all replies per node and continues recursion after applying the depth-three visual class. The class does not cap traversal depth.

A standalone reproduction of that exact traversal pattern completed 1,000 and 5,000 nested replies; a 10,000-reply chain raised **Maximum call stack size exceeded** after 5,223 visited nodes in Node. Browser stack limits differ; the actual browser DOM path was not run at that depth.

**Action:** build a parent-to-children map, use iterative traversal, cap visible nesting and expand descendants in batches. Keep deep replies accessible without recursively mounting everything.

### P2 — Load game history and startup modules on demand

`web/games-ui.mjs:9–27` creates boards even for collapsed finished matches and installs per-match status intervals. Many completed games would add hidden elements and timers. `web/app.js:274–284` imports feature UIs before the first guest feed, and `accounts.profiles()` may create temporary WASM clients on each render.

**Action:** render finished boards only when expanded, use one timer for unfinished matches, and load Messages/Circles UI on navigation. Cache catalogue/profile snapshots safely with invalidation when a profile changes. Measure cold start before changing the C++ engine design.

### P2 — Add performance budgets and operational evidence

The existing suite proves selected functional rules, not responsiveness, user capacity, uptime or recovery at scale. No LCP/INP/CLS or throttled mobile measurements were available from this browser interface; no Lighthouse score is claimed.

**Suggested acceptance targets:** 20–30 first-page cards; no page work proportional to all historical records; no full-history localStorage write for a single interaction; controlled 10,000-record tests for sorting and first-page render; no repeated main-thread tasks above 50 ms from our own data processing in target-device traces. Before launch, set explicit API latency/error and concurrent-user targets, instrument them, then test against staging. These are proposed engineering targets, not results achieved today.

## Recommended sequence

1. Demo performance release: pagination, indexed counts/ranking/karma, incremental updates and bounded threads/history.
2. Local persistence release: IndexedDB migration and recoverable data export, with interrupted-write/migration tests.
3. Real-user pilot: backend identity, database and authoritative permissions/game moves; monitor a small campus cohort.
4. Scale validation: agreed concurrent-user scenarios for browsing, writes, messages and games; test staging with controlled datasets and latency/error budgets.

No infrastructure spending is needed to address the first two categories of demo bottlenecks. Static hosting is already returning cached compressed assets. GitHub Pages documents service quotas; serving the demo successfully does not certify a future dynamic social service.

## Supporting files and references

Raw results: `scale-results.json`, `http-results.json`, `browser-results.json`, `improvement-experiment.json`. The manual benchmark is in `scripts/benchmark-scale.mjs`; it is intentionally outside CTest because large fixtures can take substantial time.

- [MDN: Web Storage API — synchronous behavior and asynchronous alternatives](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
