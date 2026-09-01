# QR Sync — Wallet Export Documentation

## Overview

QR Sync lets MetaMask Extension users pair with MetaMask Mobile over the Mobile Wallet Protocol (MWP) relay. After scanning a QR code and confirming an OTP, the user selects wallets to sync and enters their password. The extension sends a **`sync-ready`** message containing encrypted wallet secrets plus account metadata; mobile imports the selected accounts.

The extension is the **sender**; mobile is the **receiver**.

**User entry point:** Settings → **Sync with mobile** (`syncAccounts` locale key).

**Last updated:** 2026-09-01.

---

## Table of Contents

1. [End-to-end flow](#end-to-end-flow)
2. [Architecture](#architecture)
3. [Feature flag](#feature-flag)
4. [Payload contract](#payload-contract)
5. [Account tree mapping](#account-tree-mapping)
6. [Background implementation](#background-implementation)
7. [UI implementation](#ui-implementation)
8. [State management](#state-management)
9. [Product decisions](#product-decisions)
10. [Error handling & Sentry](#error-handling--sentry)
11. [Key files](#key-files)
12. [Testing](#testing)
13. [Known issues & future work](#known-issues--future-work)

---

## End-to-end flow

```mermaid
sequenceDiagram
    participant Ext as Extension
    participant Relay as MWP relay
    participant Mob as Mobile

    Ext->>Relay: createSession() (QR payload)
    Mob->>Relay: scans QR, connects
    Mob->>Relay: OTP shown
    Relay->>Ext: await OTP input
    Ext->>Relay: submitOtp()
    Mob->>Relay: validates OTP
    Mob->>Relay: sync-offer
    Relay->>Ext: sync-offer received
    Note over Ext: User picks wallets and enters password
    Ext->>Relay: syncAccounts() → sync-ready
    Mob->>Relay: imports wallets
    Mob->>Relay: sync-completed
    Relay->>Ext: sync-completed received
```

### UI phases (`QR_SYNC_PHASES`)

| Phase                      | User sees                | Trigger                                 |
| -------------------------- | ------------------------ | --------------------------------------- |
| `idle` / `displaying-qr`   | QR code to scan          | `createSession()`                       |
| `awaiting-otp-input`       | OTP entry                | Mobile scanned QR                       |
| `awaiting-sync-offer`      | Loading (“validating…”)  | OTP submitted                           |
| `reviewing-sync-offer`     | Password → wallet picker | Mobile sends `sync-offer`               |
| `awaiting-sync-completion` | Loading (“syncing…”)     | `syncAccounts()` sent `sync-ready`      |
| `completed`                | Success summary          | Mobile sends `sync-completed`           |
| `failed` / `cancelled`     | Error or peer cancel     | Timeout, disconnect, user/mobile cancel |

Phases are defined in `shared/constants/qr-sync.ts`. The UI maps them in `ui/pages/settings/sync-accounts/sync-accounts-settings.tsx`.

---

## Architecture

QR Sync has a single background layer: `QrSyncController` owns both MWP session
transport and wallet export assembly, delegating the actual account-tree/keyring
export work to `AccountTreeController` via `exportState`:

```
┌─────────────────────────────────────────────────────────────────┐
│  UI (sync-accounts)                                             │
│  QR → OTP → password → wallet picker → loading / success        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ messengerCall
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  QrSyncController                                               │
│  MWP connect, OTP, sync-offer                                   │
│  syncAccounts(): AccountTreeController:exportState               │
│    → snapshot.filterAllGroups(selected) → snapshot.serialize()  │
│  sync-ready send, completion wait                                │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                │ AccountTreeController:      │ MWP DappClient
                │ exportState                 │ (relay + encryption)
                ▼                             ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│  AccountTreeController    │         │  @metamask/mobile-wallet- │
│  (@metamask/account-tree- │         │  protocol-dapp-client     │
│  controller)              │         └───────────────────────────┘
│  → AccountTreeSnapshot    │
└───────────────────────────┘
```

Export assembly (account tree traversal, mnemonic/private-key encoding, ID
mapping) lives entirely in `AccountTreeController.exportState()` /
`AccountTreeSnapshot` — an external package, not code owned by this feature.
`QrSyncController` only selects which groups to keep (`filterAllGroups`) and
serializes the result before sending it as `sync-ready` data.

---

## Feature flag

QR Sync is gated at build time by `QR_SYNC_ENABLED`.

| Setting             | Location                                              | Default                                               |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Build flag          | `.metamaskrc` → `QR_SYNC_ENABLED='true'`              | `false` in `.metamaskrc.dist`                         |
| Runtime check       | `getIsQrSyncEnabled()` in `shared/lib/environment.ts` | Compile-time `process.env.QR_SYNC_ENABLED === 'true'` |
| Settings visibility | `ui/pages/settings/settings-registry.ts`              | Sync tab only when flag is on                         |

**Local development**

```bash
# In .metamaskrc
QR_SYNC_ENABLED='true'

yarn start   # or yarn build:test for E2E
```

Test builds force `QR_SYNC_ENABLED=true` automatically (`development/build/set-environment-variables.js`).

---

## Payload contract

> **Locked in with mobile.** Do not change field shapes or encoding without mobile alignment.

### MWP envelope (`sync-ready`)

Every MWP message uses `QrSyncMessageVersion.V1` (`'1.0.0'`) from `app/scripts/controllers/qr-sync/constants.ts`.

The `sync-ready` message carries the `AccountTreePayload` in `data`, with `deadline` at the envelope level:

```json
{
  "type": "sync-ready",
  "version": "1.0.0",
  "deadline": 1700000060000,
  "data": {
    "version": 1,
    "wallets": [
      {
        "id": "wallet:<entropySourceId>",
        "type": "mnemonic",
        "value": "<EncodedBytes -- BIP-39 mnemonic>",
        "metadata": { "name": "Wallet 1" },
        "groups": [
          { "id": "wallet:<entropySourceId>/0", "groupIndex": 0, "metadata": { "name": "Account 1", "pinned": true, "hidden": false } },
          { "id": "wallet:<entropySourceId>/2", "groupIndex": 2, "metadata": { "name": "Hidden Account", "pinned": false, "hidden": true } }
        ]
      },
      {
        "id": "wallet:private-key",
        "type": "private-key",
        "metadata": { "name": "Imported accounts" },
        "groups": [
          {
            "id": "wallet:private-key/<address>",
            "value": { "privateKey": "<EncodedBytes>", "encoding": "hexadecimal" },
            "metadata": { "name": "Imported Account", "pinned": false, "hidden": false }
          }
        ]
      }
    ]
  }
}
```

### Export entries (`QrSyncReadyData`)

`QrSyncReadyData = AccountTreePayload` (type alias in `app/scripts/controllers/qr-sync/types.ts`).
`AccountTreePayload` is defined in `@metamask/account-tree-controller` as `{ version: 1, wallets: AccountTreeWalletEntry[] }`.
It is produced by `AccountTreeSnapshot.serialize()` -- the extension does not construct it directly.

### Encoding rules

Encoding of secret material (`value` fields) is handled entirely by
`AccountTreeController.exportState()` / `AccountTreeSnapshot`
(`@metamask/account-tree-controller`), not by anything in this feature's own codebase.

### Design decisions (do not change without mobile alignment)

| Decision                                                    | Rationale                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No `sel` / selection bitmap in payload                      | User already chose accounts in extension UI; mobile imports exactly what is sent |
| No `address` fields on export entries                       | User verifies correctness manually on mobile                                     |
| First mnemonic wallet in `wallets[]` is primary             | Mobile uses position to determine the primary wallet, not a flag                 |
| `deadline` on MWP envelope, not nested                      | Same level as `type` and `version`                                               |
| One `mnemonic` entry per entropy source (SRP)               | Multiple HD keyrings -> multiple mnemonic entries, each with its own `groups[]`  |
| One `private-key` entry for all imported accounts           | All simple-keyring accounts are merged into one wallet entry with one group per account |

---

## Account tree mapping

The wallet picker reads from Redux account tree (`getAccountTree` selector).

| `AccountWalletType`                                 | Typical contents                   | Exportable?               | Shown in picker?       |
| --------------------------------------------------- | ---------------------------------- | ------------------------- | ---------------------- |
| `AccountWalletType.Entropy`                         | HD / SRP wallets (multichain tree) | **Yes** -> `"mnemonic"`   | **Yes** (whole wallet) |
| `AccountWalletType.Keyring` + `KeyringTypes.hd`     | HD keyring wallets                 | **Yes** -> `"mnemonic"`   | **Yes** (whole wallet) |
| `AccountWalletType.Keyring` + `KeyringTypes.simple` | Imported private-key accounts      | **Yes** -> `"private-key"`| **Yes** (whole wallet) |
| `Keyring` (hardware)                                | Ledger, Trezor, ...                | **No**                    | **Hidden**             |
| `Snap`                                              | Snap-managed wallets               | **No**                    | **Hidden**             |

Within an entropy wallet, each **account group** maps to one HD derivation index:

- `group.metadata.entropy.groupIndex` → `AccountGroupExport.groupIndex`
- `group.metadata.name` → `AccountGroupExport.name`
- `group.metadata.hidden` / `pinned` → export flags (omit when `false`)

Imported private-key accounts export via `KeyringController:exportAccount` → `PrivateKey` entry.

**Wallet ID format:** `entropy:<entropyId>` or `keyring:<name>` — use `extractWalletIdFromGroupId` (`ui/selectors/multichain-accounts/utils.ts`) to resolve wallet from group ID.

**Partial selection within one SRP wallet:** The export layer supports exporting a subset of account groups (one mnemonic entry with only selected `groups[]`). The current UI enforces whole-wallet selection, so users always export all groups in a selected wallet.

---

## Background implementation

### QrSyncController

**File:** `app/scripts/controllers/qr-sync/qr-sync-controller.ts`

| Method                                            | Responsibility                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `createSession()`                                 | Connect MWP client, show QR payload                                   |
| `submitOtp(otp)`                                  | Validate OTP, wait for `sync-offer`                                   |
| `syncAccounts(password, selectedAccountGroupIds)` | Build export via data service, send `sync-ready`, wait for completion |
| `cancelOtp()` / `cancelSync()`                    | User-initiated cancel                                                 |

`syncAccounts` exports and filters directly:

```typescript
try {
  let snapshot = await this.messenger.call('AccountTreeController:exportState', {
    includeSecrets: true,
    password,
  });

  const selectedPayloadIds = new Set(
    selectedAccountGroupIds.map((groupId) => snapshot.toPayloadId(groupId)),
  );
  snapshot = snapshot.filterAllGroups((payloadGroup) =>
    selectedPayloadIds.has(payloadGroup.id),
  );
  exportData = snapshot.serialize();
} catch (error) {
  this.#reportToSentry('Failed to export account tree for QR sync', error);
  throw error;
}
```

Then sends `sync-ready` with `deadline = now + SYNC_COMPLETION_TIMEOUT` and transitions to `awaiting-sync-completion`.

Export/password failures from `exportState` are reported to Sentry unconditionally
before being rethrown to the caller (see [Error handling & Sentry](#error-handling--sentry)),
matching the reporting behavior of the removed `QrSyncDataService`.

**Sync-offer validation:** `isQrSyncOffer()` requires `sessionId` (string) and `isOnboardingCompleted` (boolean). Invalid payloads (e.g. `{}`) are ignored; phase stays `awaiting-sync-offer`.

### AccountTreeController.exportState (external)

Wallet/account-group export assembly is implemented in `AccountTreeController`
(`@metamask/account-tree-controller`), not in this feature's own code. See that
package for the account-tree traversal, hardware/Snap exclusion,
mnemonic/private-key encoding, and primary-wallet logic. `QrSyncController`
only calls `exportState({ includeSecrets: true, password })` and filters the
resulting `AccountTreeSnapshot` down to the selected account groups
(`filterAllGroups`) before serializing it.

### Messenger delegation

| Messenger                         | Delegated actions                  |
| ---------------------------------- | ----------------------------------- |
| `qr-sync-controller-messenger.ts` | `AccountTreeController:exportState` |

---

## UI implementation

**Directory:** `ui/pages/settings/sync-accounts/` (replaces the earlier `add-device-tab` naming).

| Step            | Component                                                  | Notes                                             |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| QR scan         | `components/qr-code-scan.tsx`                              | Shown in `idle` / `displaying-qr`                 |
| OTP             | `components/enter-verification-code.tsx`                   | Calls `QrSyncController:submitOtp`                |
| Password        | `components/enter-password.tsx`                            | Required before wallet picker                     |
| Wallet picker   | `components/add-wallets.tsx` + `wallet-selection-list.tsx` | Filters syncable wallets; whole-wallet checkboxes |
| Syncing         | `components/loading-step.tsx`                              | After confirm                                     |
| Success / error | `components/success.tsx`, `sync-error.tsx`                 | Terminal states                                   |

**Wallet filtering** (`utils.ts`):

- `isSyncableWallet` / `filterSyncableWallets` — entropy, HD keyring, and imported (`simple`) wallets only.
- Hardware and Snap wallets are excluded from the picker.
- `getSyncSummaryCounts` — derives success-screen wallet vs imported-account counts from the selection (entropy/HD keyring → `syncedWalletCount`; imported private-key groups → `syncedAccountCount`).

**Selection model** (`wallet-selection-list.tsx`):

- Wallet-level checkbox selects or deselects **all** account groups in that wallet.
- Account rows are display-only (no per-account checkboxes).
- Continue is disabled when no wallets are selected.

**Sync request shape** (`types.ts`):

```typescript
type AddDeviceSyncRequest = {
  selectedAccountGroupIds: AccountGroupId[];
  syncedAccountCount: number;
  syncedWalletCount: number;
};
```

`sync-accounts-settings.tsx` calls `QrSyncController:syncAccounts` with `[password, selectedAccountGroupIds]`.

---

## State management

### Controller state (`QrSyncController`)

Persisted fields (see `metadata.ts`):

| Field                                 | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `qrSyncPhase`                         | Current UI step                  |
| `qrSyncConnectionStatus`              | MWP transport status             |
| `qrSyncError`                         | `{ code, message }` for failures |
| `qrSyncQrPayload`                     | QR content for display           |
| `syncOffer`                           | Parsed mobile `sync-offer`       |
| `qrSyncSelectedAccountGroupIds`       | Groups sent in last `sync-ready` |
| `qrSyncCreatedAt` / `qrSyncUpdatedAt` | Timestamps                       |

### UI selectors

`ui/selectors/qr-sync/qr-sync.ts` — `selectQrSyncPhase`, `selectQrSyncError`, `selectShouldCreateQrSyncSession`, etc.

### Error phase overrides

Some errors route the UI back to an earlier step instead of the generic error screen (`QR_SYNC_ERROR_PHASE_OVERRIDES` in `shared/constants/qr-sync.ts`):

- `QR_EXPIRED` → back to QR
- `OTP_EXPIRED` / `OTP_ATTEMPTS_EXCEEDED` → back to OTP

---

## Product decisions

### Whole-wallet selection only

Users sync entire wallets, not individual accounts within a wallet. This simplifies the picker UX and matches the expectation that secrets (SRP or private key) are wallet-scoped. The export layer still supports partial group lists for future UI changes.

### Hardware and Snap wallets are excluded

These wallet types cannot export portable secrets through the extension keyring APIs in a way mobile can import. They are hidden from the picker rather than shown as disabled — reduces confusion.

### No addresses in the export payload

Mobile derives addresses from mnemonic/group index or private key. Users verify accounts on mobile after import.

### Primary wallet flag

Exactly one mnemonic export should carry `isPrimary: true` (the first HD keyring’s entropy source). Mobile uses this for default wallet ordering.

### Dapp connection / Swaps interaction

Not applicable to QR Sync — this flow runs only in Settings and does not interleave with dapp connection modals.

---

## Error handling & Sentry

Unexpected failures are reported to Sentry via `messenger.captureException` and `createSentryError`. Expected user/peer outcomes (OTP expiry, QR timeout, disconnect, peer cancel) are **suppressed**.

**Full reference:** [`docs/qr-sync/SENTRY.md`](./SENTRY.md)

Summary for PMs:

- **Reported:** relay failures, mobile `sync-error`, export/password failures, message send failures.
- **Not reported:** expired QR, wrong OTP, timeouts, transport disconnect, user cancel.

---

## Key files

### Core implementation

| File                                                                                    | Purpose                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `app/scripts/controllers/qr-sync/qr-sync-controller.ts`                                | MWP session lifecycle, `syncAccounts` (calls `exportState`), messaging |
| `app/scripts/controllers/qr-sync/types.ts`                                             | Payload types, messenger types, controller state                       |
| `app/scripts/controllers/qr-sync/constants.ts`                                         | Message version, action types, error messages                          |
| `app/scripts/controllers/qr-sync/utils.ts`                                             | `isQrSyncOffer`, `parseMwpError`, timeouts                              |
| `app/scripts/controllers/qr-sync/metadata.ts`                                          | Controller state defaults + metadata                                   |
| `app/scripts/messenger-client-init/messengers/qr-sync/qr-sync-controller-messenger.ts` | Controller messenger — delegates `AccountTreeController:exportState`  |

### UI

| File                                                                   | Purpose                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------- |
| `ui/pages/settings/sync-accounts/sync-accounts-settings.tsx`           | Phase router, `syncAccounts` call               |
| `ui/pages/settings/sync-accounts/components/add-wallets.tsx`           | Wallet picker screen                            |
| `ui/pages/settings/sync-accounts/components/wallet-selection-list.tsx` | Whole-wallet selection list                     |
| `ui/pages/settings/sync-accounts/utils.ts`                             | `filterSyncableWallets`, `getSyncSummaryCounts` |
| `ui/selectors/qr-sync/qr-sync.ts`                                      | Redux selectors                                 |
| `ui/selectors/multichain-accounts/account-tree.ts`                     | Account tree for picker                         |

### Shared

| File                          | Purpose                       |
| ----------------------------- | ----------------------------- |
| `shared/constants/qr-sync.ts` | Phases, error codes, timeouts |
| `shared/lib/environment.ts`   | `getIsAddDeviceSyncEnabled()` |

### Documentation

| File                     | Purpose                |
| ------------------------ | ---------------------- |
| `docs/qr-sync/SENTRY.md` | Sentry reporting rules |

### Dependencies

- `@metamask/mobile-wallet-protocol-core`
- `@metamask/mobile-wallet-protocol-dapp-client`
- `eciesjs` (encrypted transport)

### Locale strings

`app/_locales/en/messages.json` — `syncAccounts`, `add_device_*`, `add_wallets_*`, `enter_verification_code_*`, `qrCode*`

---

## Testing

### Unit tests

```bash
yarn test:unit app/scripts/controllers/qr-sync/
yarn test:unit ui/pages/settings/sync-accounts/
```

**Controller** (`qr-sync-controller.test.ts`):

- Session lifecycle, `syncAccounts` → `AccountTreeController:exportState` → filter/serialize → `sync-ready` send
- Mnemonic export with `groups[]`, `isPrimary`; partial SRP group selection; mixed mnemonic + private-key exports (via mocked `exportState` snapshot)
- Invalid sync-offer rejection
- Sentry reporting (reported vs suppressed scenarios)

Account-tree export assembly itself (traversal, encoding, hardware/Snap exclusion) is covered by `@metamask/account-tree-controller`'s own test suite, not by this repo.

**UI** (`utils.test.ts`, `wallet-selection-list.test.tsx`, `add-wallets.test.tsx`):

- Syncable wallet filtering
- `getSyncSummaryCounts` wallet vs imported-account totals
- Whole-wallet checkbox behavior
- `selectedAccountGroupIds` passed to sync handler

### E2E tests

**Specs:**

- `test/e2e/tests/qr-sync/qr-sync.spec.ts` — happy-path wallet export scenarios
- `test/e2e/tests/qr-sync/qr-sync-phases.spec.ts` — phase transitions, timeouts, cancel/restart

**Flow helper:** `test/e2e/page-objects/flows/qr-sync.flow.ts` (`completeQrSyncFlow`, `completeQrSyncFromSyncPage`, `navigateToSyncAccountsSettings`, `openSyncAccountsFromSettings`, `qrSyncSimulate`)

Uses a mobile wallet simulator (`test/e2e/helpers/qr-sync/mobile-wallet-simulator.ts`) to drive MWP messages without a physical device.

**`qr-sync.spec.ts` coverage:**

- Single HD wallet happy path
- One HD wallet + one imported private-key account
- Two HD wallets + one imported private-key account (multi-SRP fixture)

**`qr-sync-phases.spec.ts` coverage:**

- Cancel session (back from sync page) and complete a new session
- QR not scanned before MWP session timeout → QR expired screen
- OTP not entered before MWP session timeout → OTP expired screen
- Sync offer not received before `SYNC_OFFER_TIMEOUT` → session expired error
- Restart from QR expired screen (`Generate new QR code`) and complete sync
- Restart from OTP expired screen (`Start with new QR code`) and complete sync

**Running E2E:**

```bash
yarn build:test   # QR_SYNC_ENABLED=true on test builds

# Happy-path export scenarios
yarn test:e2e:single test/e2e/tests/qr-sync/qr-sync.spec.ts --browser=chrome

# Phase, timeout, and restart scenarios
yarn test:e2e:single test/e2e/tests/qr-sync/qr-sync-phases.spec.ts --browser=chrome

# All QR sync E2E tests
yarn test:e2e:single test/e2e/tests/qr-sync/ --browser=chrome
```

Follow `test/e2e/AGENTS.md` and `.agents/skills/mms-e2e-testing/SKILL.md` when adding scenarios.

| File                                                  | Purpose                                  |
| ----------------------------------------------------- | ---------------------------------------- |
| `test/e2e/tests/qr-sync/qr-sync.spec.ts`              | Wallet export happy paths                |
| `test/e2e/tests/qr-sync/qr-sync-phases.spec.ts`       | Phase UI, timeouts, cancel/restart       |
| `test/e2e/page-objects/flows/qr-sync.flow.ts`         | Shared navigation and completion helpers |
| `test/e2e/helpers/qr-sync/mobile-wallet-simulator.ts` | Simulates mobile MWP messages in tests   |

### Manual QA (pending sign-off)

1. Enable `QR_SYNC_ENABLED=true` in `.metamaskrc` and rebuild.
2. Settings → Sync with mobile.
3. Complete QR + OTP flow with MetaMask Mobile.
4. Select wallets with mixed account types (SRP + imported); enter password.
5. Verify loading → success screens on extension.
6. On mobile, confirm imported accounts match names, primary wallet, hidden/pinned state.

---

## Known issues & future work

- ~ OTP display grant — P2; `QrSyncController` TODO ~line 510; MWP SDK not wired
