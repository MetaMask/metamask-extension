# QR Sync Sentry Reporting

QR Sync reports unexpected failures to Sentry through `messenger.captureException`.
`QrSyncController` uses `createSentryError(message, cause)` so the Sentry event
message is stable while the original thrown value is preserved on `error.cause`.

## Error handling vs Sentry

Controller terminal failures go through `#setError`, which separates **UI state**
from **Sentry payload**:

| Concern                  | Source                                                                    | Notes                                                                 |
| ------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `state.qrSyncError` (UI) | `qrSyncError` when provided, otherwise `parseMwpError(error)`             | Masks non-MWP errors to `{ code: UNKNOWN, message: 'Unknown error' }` |
| Sentry `cause`           | Original `error` when provided, otherwise `new Error(stateError.message)` | Preserves raw `SessionError` / `Error` instances for debugging        |

`#setError` call shapes:

```ts
// MWP transport/session errors — UI is derived via parseMwpError
await this.#setError({ error });

// Controller-derived outcomes (timeouts, disconnect, peer messages)
await this.#setError({ qrSyncError: { code, message } });

// Both — explicit UI mapping plus original error for Sentry
await this.#setError({ error, qrSyncError });
```

`parseMwpError` maps MWP `SessionError` codes to `QrSyncErrorCodes`. Non-MWP
errors always resolve to `UNKNOWN` so the UI does not surface raw relay/transport
messages.

## QrSyncController

Reporting is centralized in `#reportToSentry` and invoked from:

- `#setError` for terminal session failures
- `#sendMessage` when relay writes fail
- `#performCleanupSession` when session teardown throws

`#setError` only reports when `shouldReportQrSyncErrorToSentry(stateError.code)`
returns `true`. Expected user, peer, or transport outcomes are suppressed.

### Reported scenarios

| Scenario                    | Trigger                                                             | Sentry message                            | UI `qrSyncError`                                     | Example cause                                            |
| --------------------------- | ------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Relay connect failure       | `createSession` → `#setError({ error })`                            | `QR sync session failed (UNKNOWN)`        | `{ code: UNKNOWN, message: 'Unknown error' }`        | `Error('Relay unavailable')`                             |
| Unmapped MWP client error   | MWP client `error` event → `#setError({ error })`                   | `QR sync session failed (UNKNOWN)`        | `{ code: UNKNOWN, message: <SessionError message> }` | `SessionError(UNKNOWN, 'Something went wrong.')`         |
| Mobile sync failure         | Mobile sends `sync-error` → `#setError({ error, qrSyncError })`     | `QR sync session failed (SYNC_FAILED)`    | `{ code: SYNC_FAILED, message: <peer message> }`     | `Error('Mobile could not complete the sync')`            |
| Sync offer handling failure | `#failAwaitingSyncOffer` → `#setError({ error, qrSyncError })`      | `QR sync session failed (SYNC_FAILED)`    | `{ code: SYNC_FAILED, message: ... }`                | `Error('Sync offer failed')`                             |
| Sync completion failure     | `#failAwaitingSyncCompletion` → `#setError({ error, qrSyncError })` | `QR sync session failed (SYNC_FAILED)`    | `{ code: SYNC_FAILED, message: ... }`                | `Error('Sync completion failed')`                        |
| Message send failure        | `sendRequest` rejects in `#sendMessage`                             | `QR sync failed to send message (<type>)` | _(error propagates; phase unchanged)_                | `Error('Relay write failed')` while sending `sync-ready` |
| Cleanup failure             | Session teardown throws in `#performCleanupSession`                 | `QR sync session cleanup failed`          | _(cleanup continues)_                                | `Error('Failed to unregister handlers')`                 |
| Account tree export failure | `syncAccounts()` → `AccountTreeController:exportState` throws       | `Failed to export account tree for QR sync` | _(error propagates to caller; phase unchanged)_    | `Error('Invalid password')`                              |

### Suppressed scenarios

These resolve to user-facing `QrSyncErrorCodes` and are intentionally **not**
reported because they are expected flow outcomes rather than extension defects.

| Scenario                | Error code                           | `#setError` shape                                  | Example                                           |
| ----------------------- | ------------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| QR not scanned in time  | `QR_EXPIRED`                         | `{ error }` → `parseMwpError`                      | MWP `REQUEST_EXPIRED` during `connect`            |
| OTP expired             | `OTP_EXPIRED`                        | `{ qrSyncError }`                                  | MWP session timeout while awaiting OTP input      |
| Invalid OTP             | `OTP_INVALID`                        | `{ error, qrSyncError }` or MWP `error` event      | User submits an incorrect OTP                     |
| OTP attempts exceeded   | `OTP_ATTEMPTS_EXCEEDED`              | `{ error }` → `parseMwpError`                      | MWP `OTP_MAX_ATTEMPTS_REACHED`                    |
| Sync offer timeout      | `SESSION_EXPIRED`                    | `{ error, qrSyncError }`                           | No `sync-offer` within `SYNC_OFFER_TIMEOUT`       |
| Sync completion timeout | `SESSION_EXPIRED`                    | `{ error, qrSyncError }`                           | No `sync-completed` before `deadline`             |
| Transport disconnect    | `CHANNEL_DISCONNECTED`               | `{ qrSyncError }` or `{ error }` → `parseMwpError` | Relay/WebSocket disconnect or `SESSION_NOT_FOUND` |
| Peer cancellation       | `SYNC_REJECTED`                      | _(not via `#setError`)_                            | Mobile sends `sync-cancel`                        |
| User cancellation       | _(none — phase becomes `cancelled`)_ | _(not via `#setError`)_                            | `cancelOtp` / `cancelSync`                        |

### Examples

**Reported — relay connect failure (masked UI, raw Sentry cause)**

```ts
// createSession()
await mwpDappClient.connect({ ... });
// throws Error('Relay unavailable')
await this.#setError({ error });

// UI state:  { code: 'UNKNOWN', message: 'Unknown error' }
// Sentry:     "QR sync session failed (UNKNOWN)" with cause Error('Relay unavailable')
```

**Suppressed — QR expiry**

```ts
// createSession()
await mwpDappClient.connect({ ... });
// throws SessionError(REQUEST_EXPIRED, 'Did not receive handshake offer from wallet in time.')
await this.#setError({ error });

// UI state:  { code: 'QR_EXPIRED', message: 'Did not receive handshake offer...' }
// Sentry:     not called
```

**Reported — failed to send sync-ready payload**

```ts
// syncAccounts() -> #sendSyncData() -> #sendMessage({ type: 'sync-ready', ... })
await mwpDappClient.sendRequest({ ... });
// throws Error('Relay write failed')

// Sentry: "QR sync failed to send message (sync-ready)" with cause Error('Relay write failed')
// UI:     error propagates to caller; session phase is not moved to failed by #sendMessage alone
```

## Account tree export failures

`syncAccounts()` wraps the `AccountTreeController:exportState` call (plus the
subsequent `filterAllGroups`/`serialize`) in its own try/catch and reports
unconditionally before rethrowing, mirroring how the removed `QrSyncDataService`
used to report `buildWalletExportEntries` failures:

```ts
try {
  let snapshot = await this.messenger.call('AccountTreeController:exportState', {
    includeSecrets: true,
    password,
  });
  // ...filter and serialize...
} catch (error) {
  this.#reportToSentry('Failed to export account tree for QR sync', error);
  throw error;
}
```

Every failure here — wrong password, unsupported wallet type, or any other
`exportState` rejection — is reported with the same static message and
rethrown to the caller. There's no code-based suppression for this path (unlike
`#setError`'s `shouldReportQrSyncErrorToSentry` filtering), matching the old
service's unconditional behavior.

## Adding new reports

1. Prefer routing terminal session failures through `#setError` so suppression rules
   stay centralized.
2. For MWP errors, pass `{ error }` and extend `parseMwpError` when a new
   `SessionError` code needs a UI mapping.
3. For controller-derived outcomes (timeouts, peer protocol messages), pass an
   explicit `{ qrSyncError }` (and `{ error }` when Sentry should retain the
   original throwable).
4. Add new suppressible codes to `shouldReportQrSyncErrorToSentry` in
   `app/scripts/controllers/qr-sync/utils.ts` when the outcome is an expected user
   or transport result.
5. Update this document and the colocated unit tests when reporting behavior changes.
