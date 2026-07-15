# QR Sync Sentry Reporting

QR Sync reports unexpected failures to Sentry through `messenger.captureException`.
Both `QrSyncController` and `QrSyncDataService` use `createSentryError(message, cause)`
so the Sentry event message is stable while the original thrown value is preserved on
`error.cause`.

## Error handling vs Sentry

Controller terminal failures go through `#setError`, which separates **UI state**
from **Sentry payload**:

| Concern | Source | Notes |
| --- | --- | --- |
| `state.qrSyncError` (UI) | `qrSyncError` when provided, otherwise `parseMwpError(error)` | Masks non-MWP errors to `{ code: UNKNOWN, message: 'Unknown error' }` |
| Sentry `cause` | Original `error` when provided, otherwise `new Error(stateError.message)` | Preserves raw `SessionError` / `Error` instances for debugging |

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

| Scenario | Trigger | Sentry message | UI `qrSyncError` | Example cause |
| --- | --- | --- | --- | --- |
| Relay connect failure | `createSession` → `#setError({ error })` | `QR sync session failed (UNKNOWN)` | `{ code: UNKNOWN, message: 'Unknown error' }` | `Error('Relay unavailable')` |
| Unmapped MWP client error | MWP client `error` event → `#setError({ error })` | `QR sync session failed (UNKNOWN)` | `{ code: UNKNOWN, message: <SessionError message> }` | `SessionError(UNKNOWN, 'Something went wrong.')` |
| Mobile sync failure | Mobile sends `sync-error` → `#setError({ error, qrSyncError })` | `QR sync session failed (SYNC_FAILED)` | `{ code: SYNC_FAILED, message: <peer message> }` | `Error('Mobile could not complete the sync')` |
| Sync offer handling failure | `#failAwaitingSyncOffer` → `#setError({ error, qrSyncError })` | `QR sync session failed (SYNC_FAILED)` | `{ code: SYNC_FAILED, message: ... }` | `Error('Sync offer failed')` |
| Sync completion failure | `#failAwaitingSyncCompletion` → `#setError({ error, qrSyncError })` | `QR sync session failed (SYNC_FAILED)` | `{ code: SYNC_FAILED, message: ... }` | `Error('Sync completion failed')` |
| Message send failure | `sendRequest` rejects in `#sendMessage` | `QR sync failed to send message (<type>)` | _(error propagates; phase unchanged)_ | `Error('Relay write failed')` while sending `sync-ready` |
| Cleanup failure | Session teardown throws in `#performCleanupSession` | `QR sync session cleanup failed` | _(cleanup continues)_ | `Error('Failed to unregister handlers')` |

### Suppressed scenarios

These resolve to user-facing `QrSyncErrorCodes` and are intentionally **not**
reported because they are expected flow outcomes rather than extension defects.

| Scenario | Error code | `#setError` shape | Example |
| --- | --- | --- | --- |
| QR not scanned in time | `QR_EXPIRED` | `{ error }` → `parseMwpError` | MWP `REQUEST_EXPIRED` during `connect` |
| OTP expired | `OTP_EXPIRED` | `{ qrSyncError }` | MWP session timeout while awaiting OTP input |
| Invalid OTP | `OTP_INVALID` | `{ error, qrSyncError }` or MWP `error` event | User submits an incorrect OTP |
| OTP attempts exceeded | `OTP_ATTEMPTS_EXCEEDED` | `{ error }` → `parseMwpError` | MWP `OTP_MAX_ATTEMPTS_REACHED` |
| Sync offer timeout | `SESSION_EXPIRED` | `{ error, qrSyncError }` | No `sync-offer` within `SYNC_OFFER_TIMEOUT` |
| Sync completion timeout | `SESSION_EXPIRED` | `{ error, qrSyncError }` | No `sync-completed` before `deadline` |
| Transport disconnect | `CHANNEL_DISCONNECTED` | `{ qrSyncError }` or `{ error }` → `parseMwpError` | Relay/WebSocket disconnect or `SESSION_NOT_FOUND` |
| Peer cancellation | `SYNC_REJECTED` | _(not via `#setError`)_ | Mobile sends `sync-cancel` |
| User cancellation | _(none — phase becomes `cancelled`)_ | _(not via `#setError`)_ | `cancelOtp` / `cancelSync` |

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

## QrSyncDataService

`buildWalletExportEntries` reports any failure while assembling the wallet export
payload, then rethrows the original error.

### Reported scenarios

| Scenario | Trigger | Sentry message | Example cause |
| --- | --- | --- | --- |
| Export assembly failure | Any throw inside `buildWalletExportEntries` | `Failed to build QR sync wallet export entries` | `Error('Invalid password')` from `KeyringController:exportSeedPhrase` |
| Missing account group | Selected group id is not in account tree state | `Failed to build QR sync wallet export entries` | `Error('Account group "wallet/0" not found.')` |
| Unsupported wallet type | Group references a wallet that cannot be synced | `Failed to build QR sync wallet export entries` | `Error('Account group "wallet/0" cannot be synced.')` |

Validation errors such as an empty selection (`At least one account group must be
selected.`) are also reported because they indicate a controller/UI contract bug
rather than an explicit user action.

### Examples

**Reported — seed phrase export failure**

```ts
await messenger.call('KeyringController:exportSeedPhrase', { password }, entropyId);
// throws Error('Invalid password')
// Sentry: "Failed to build QR sync wallet export entries" with cause Error('Invalid password')
// Error is rethrown to QrSyncController/UI
```

**Reported — unsupported account group**

```ts
// Wallet type cannot be represented in the sync-ready payload
throw new Error('Account group "imported-wallet/0" cannot be synced.');
// Sentry: "Failed to build QR sync wallet export entries" with cause <thrown error>
```

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
