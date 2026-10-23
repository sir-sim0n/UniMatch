# Orbit v1.4.0 — Demo messaging

Date: 2026-10-23. Demo-first Phase 3. No backend, real accounts, paid service or messages transmitted to other people.

## Try it

Use Naledi, connect with Sipho in Connections, then switch to Sipho and accept. Open Messages, choose Naledi, and send fictional text. Switch back to Naledi to see the unread count, open the conversation to mark it read, and reply. Connected profile cards also open conversations directly.

## Behaviour

Only accepted connections can send or mark messages read. Self/unknown actors, blank text and text longer than 2,000 Unicode code points are rejected. The browser textarea conservatively limits 2,000 UTF-16 units. Text is rendered literally via textContent, never HTML. Local timestamps and stable sequence IDs preserve message order. Each recipient opening a conversation marks incoming messages read; outgoing status says Saved locally or Read in demo. This is simulated read state, not real delivery tracking.

An account sees only conversations in which it participates. Unread counts appear on conversation choices. Blocking hides the conversation in both account views and prevents sending/read mutations. Removing a connection preserves read-only history. Unblocking does not reconnect accounts; history returns read-only until a new connection is accepted. History and unread flags survive reconnection. Profile reset retains shared messages. The explicit shared social reset clears messages, connections, blocks and reports for every demo account, preserving profiles and bookmarks.

Unsaved drafts are discarded on leaving the screen, switching account, refreshing or explicitly reloading saved messages. Failed sends keep the draft in place and display an error; they do not append a pretend message. Switching accounts is simulation, not authentication or secure privacy. Anyone with browser access can switch personas and inspect storage.

## Storage and compatibility

Messages extend the shared DemoSocial repository under the existing orbit.demo.social.v1 key. Payload version 2 adds messages with id/from/to/text/at/read. Version 1 records migrate in memory and are persisted as version 2 on the next successful mutation. Existing requests, blocks and reports are retained. Version 2 validation rejects malformed messages, duplicate/out-of-order IDs, unknown actors and invalid types. Older v1.3 clients reject the newer payload; stale tabs cannot overwrite it through normal operations. Explicit shared reset remains an all-data recovery action.

Connections and messages use one repository instance and one Web Lock, so sends cannot bypass a concurrently saved block or removal. Expected-value checks reject stale writes; users reload saved messages to import another tab's state. Without Web Locks this is best-effort localStorage coordination, not server transaction isolation. Storage failure leaves the operation unapplied. Invalid state is preserved and mutation is disabled. Screens reload authoritative social state on entry and guard asynchronous rendering against account changes.

## Verification

The demo_messages suite covers unconnected/pending sends, input validation, participant isolation, reply/unread/read state, refresh persistence, failed-write rollback, stale sends after blocking, hidden blocked history, read-only disconnected history, reconnection, version-1 migration, invalid records and scoped shared reset. Existing social/account and C++/WASM suites remain enabled. Build, browser and live results are recorded below after verification.

## Next phase

Interest circles, membership and local posts/replies. Attachments, realtime delivery, push notifications, real moderation and cross-device sync are outside this release.

Local verification: all 14 CTest groups passed; publication check accepted 18 files. Browser tests confirmed connection-to-chat navigation, sending, recipient unread count, account switching, replies and refresh persistence. Blocking hid the conversation; unblocking restored read-only history without a send form. A 390px mobile viewport had no horizontal overflow. No browser console errors were recorded.
