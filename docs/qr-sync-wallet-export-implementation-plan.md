# QR Sync — Wallet Export Implementation Plan

> **Feature:** Extension → Mobile device pairing via MWP relay (“Sync with mobile” in Settings).
> **Scope of this doc:** Building the `sync-ready` wallet export payload and wiring it end-to-end.
> **Last updated:** 2026-06-26 (after Phase 1 types/contracts).

Use this document to resume work after context loss. Each phase has explicit acceptance criteria and file touch-points.

---

## 1. Goal

When the user completes the QR sync flow and confirms which wallets/accounts to sync, the extension must send a **`sync-ready`** MWP message containing encrypted wallet secrets plus UI metadata so MetaMask Mobile can import the same accounts.

The extension is the **sender**; mobile is the **receiver**.

---

## 2. End-to-end flow (context)

```
Extension                          MWP relay                         Mobile
─────────                          ─────────                         ──────
createSession()  ──QR scan────────► connects
submitOtp()      ◄──OTP shown──────  validates
                   ◄──sync-offer────  offers sync window
User picks wallets + password
syncAccounts()   ──sync-ready──────►  imports wallets
                   ◄──sync-completed─  done
```

**Controller:** `app/scripts/controllers/qr-sync/qr-sync-controller.ts`
**UI:** `ui/pages/settings/add-device-tab/`
**Phases constant:** `shared/constants/qr-sync.ts` → `QR_SYNC_PHASES`

---

## 3. Payload contract (locked in)

### 3.1 MWP envelope (`sync-ready`)

Every MWP message uses `QrSyncMessageVersion.V1` (`'1.0.0'`) from `app/scripts/controllers/qr-sync/constants.ts`.

The `sync-ready` message carries the wallet export entries directly in `data`, with `deadline` at the envelope level:

```json
{
  "type": "sync-ready",
  "version": "1.0.0",
  "deadline": 1700000060000,
  "data": [
    {
      "type": "Mnemonic",
      "mnemonic": "<base64(utf8 space-separated BIP-39 words)>",
      "name": "Wallet 1",
      "isPrimary": true,
      "groups": [
        { "groupIndex": 0, "name": "Account 1", "pinned": true },
        { "groupIndex": 2, "name": "Hidden Account", "hidden": true }
      ]
    },
    {
      "type": "PrivateKey",
      "privateKey": "<base64(utf8 hex string, e.g. \"0xabc…\")>",
      "name": "Imported Account"
    }
  ]
}
```

### 3.2 Export entries (`QrSyncReadyData`)

Defined in `app/scripts/controllers/qr-sync/types.ts` as `WalletExportEntry[]` (alias `QrSyncReadyData`).

### 3.3 Encoding rules

| Field        | Encoding                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- |
| `mnemonic`   | Wordlist indices → UTF-8 space-separated words → base64 (`encodeMnemonicForWalletExport`) |
| `privateKey` | UTF-8 hex string (`0x…`) → base64 (`encodePrivateKeyForWalletExport`)                     |

Helpers live in `app/scripts/controllers/qr-sync/wallet-export-encoding.ts`.

### 3.4 Design decisions (do not change without mobile alignment)

| Decision                                      | Rationale                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| No `sel` / selection bitmap in payload        | User already chose accounts in extension UI; mobile imports exactly what is sent |
| No `address` fields on export entries         | User verifies correctness manually on mobile                                     |
| Omit `hidden` / `pinned` when `false`         | Smaller payload; document in types, apply when building entries in Phase 2       |
| Omit `isPrimary` when not primary             | Only one wallet should have `isPrimary: true`                                    |
| `deadline` on MWP envelope, not nested        | Same level as `type` and `version`; avoids redundant wrapper object              |
| One `Mnemonic` entry per entropy source (SRP) | Multiple HD keyrings → multiple mnemonic entries, each with its own `groups[]`   |
| One `PrivateKey` entry per imported account   | Each simple-key-pair account is its own top-level entry                          |

---

## 4. Account tree concepts (for export mapping)

The wallet picker reads from Redux account tree (`getAccountTree` selector).

| `AccountWalletType`                                 | Typical contents                   | Exportable?                  | Shown in picker?       |
| --------------------------------------------------- | ---------------------------------- | ---------------------------- | ---------------------- |
| `AccountWalletType.Entropy`                         | HD / SRP wallets (multichain tree) | **Yes** → `Mnemonic` entry   | **Yes** (whole wallet) |
| `AccountWalletType.Keyring` + `KeyringTypes.hd`     | HD keyring wallets                 | **Yes** → `Mnemonic` entry   | **Yes** (whole wallet) |
| `AccountWalletType.Keyring` + `KeyringTypes.simple` | Imported private-key accounts      | **Yes** → `PrivateKey` entry | **Yes** (whole wallet) |
| `Keyring` (hardware)                                | Ledger, Trezor, …                  | **No**                       | **Hidden**             |
| `Snap`                                              | Snap-managed wallets               | **No**                       | **Hidden**             |

Within an entropy wallet, each **account group** maps to one HD derivation index:

- `group.metadata.entropy.groupIndex` → `AccountGroupExport.groupIndex`
- `group.metadata.name` → `AccountGroupExport.name`
- `group.metadata.hidden` / `pinned` → export flags (omit when `false`)

Imported private-key accounts (`KeyringTypes.simple` / `InternalKeyringType.imported`) appear under non-entropy wallets. Export via `KeyringController:exportAccount` → `PrivateKey` entry.

**Wallet ID format:** `entropy:<entropyId>` or `keyring:<name>` — use `extractWalletIdFromGroupId` (`ui/selectors/multichain-accounts/utils.ts`) to resolve wallet from group ID.

---

## 5. Current state (Phase 1 — DONE)

### 5.1 Completed

- [x] Export types: `AccountGroupExport`, `MnemonicWalletExport`, `PrivateKeyAccountExport`, `WalletExportEntry`, `QrSyncReadyData`
- [x] State field `selectedAccountGroupIds: AccountGroupId[]` (replacing legacy `selectedAccountIds` + `selectedSyncDataType`)
- [x] Encoding helpers for mnemonic and private key
- [x] `syncAccounts()` builds `sync-ready` payload with `WalletExportEntry[]` in `data`
- [x] `isPrimary` flag for first HD keyring
- [x] Controller + encoding unit tests updated for `version: '1.0.0'`
- [x] Removed duplicate `QR_SYNC_WALLET_EXPORT_BUNDLE_VERSION` and unused `omitFalseBooleanFlags` helper

### 5.2 Intentionally incomplete (Phase 2+)

| Gap                                                                                             | Location                                                 |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `syncAccounts(password, selectedEntropyIds)` still takes **entropy IDs**, not account group IDs | `qr-sync-controller.ts:171`                              |
| `groups: []` placeholder — no account group metadata                                            | `qr-sync-controller.ts:230`                              |
| `selectedAccountGroupIds` stores entropy IDs cast as `AccountGroupId[]`                         | `qr-sync-controller.ts:240`                              |
| UI collapses selection to `entropyIds` before calling controller                                | `add-wallets.tsx:48-64`, `add-device-settings.tsx:91-94` |
| `AddDeviceSyncRequest` only has `entropyIds`                                                    | `add-device-tab/types.ts`                                |
| Messenger lacks `AccountTreeController` / `AccountsController` actions                          | `qr-sync-controller-messenger.ts`                        |
| Private-key accounts not exported                                                               | controller                                               |
| `#isQrSyncOffer` accepts any object (including `{}`) — test expects rejection                   | `qr-sync-controller.ts`                                  |

---

## 6. Implementation phases

### Phase 2 — Wire selection + build real export payload

**Objective:** `syncAccounts` receives the exact account groups the user selected and produces a complete `sync-ready` payload.

#### Step 2.1 — Extend messenger

**File:** `app/scripts/messenger-client-init/messengers/qr-sync-controller-messenger.ts`

Delegate these actions to `QrSyncController`:

```
AccountTreeController:getAccountGroupObject
AccountTreeController:getAccountWalletObject   // if needed for wallet names
AccountsController:getAccount                  // resolve account → keyring for private-key export
```

Update `QrSyncAllowedActions` in `types.ts` accordingly.

#### Step 2.2 — Change `syncAccounts` signature

```typescript
async syncAccounts(
  password: string,
  selectedAccountGroupIds: AccountGroupId[],
): Promise<void>
```

Partition `selectedAccountGroupIds` by wallet type:

1. **Entropy groups** → group by `entropyId` (from wallet metadata) → one `Mnemonic` entry per entropy source with `groups[]` for only the selected account groups in that wallet.
2. **Private-key groups** → one `PrivateKey` entry per selected group/account.

Reject or skip non-exportable selections (hardware, snap) with a clear error.

#### Step 2.3 — Build `MnemonicWalletExport`

For each entropy ID in the selection:

1. `KeyringController:exportSeedPhrase({ password }, entropyId)`
2. `encodeMnemonicForWalletExport(seedPhrase)`
3. For each selected group in that wallet, call `AccountTreeController:getAccountGroupObject(groupId)` and map:
   - `groupIndex` ← `metadata.entropy.groupIndex`
   - `name` ← `metadata.name`
   - `hidden` / `pinned` ← only include when `true`
4. Wallet `name` ← wallet `metadata.name`
5. `isPrimary` ← compare entropy ID to first HD keyring (`KeyringController:withKeyringV2({ type: Hd, index: 0 })`)

#### Step 2.4 — Build `PrivateKeyAccountExport`

For each selected private-key account group:

1. Resolve internal account ID from group (`group.accounts[0]` or via `AccountsController:getAccount`)
2. `KeyringController:exportAccount(address, { password })` (confirm exact messenger signature)
3. `encodePrivateKeyForWalletExport(hexKey)`
4. Map `name`, `hidden`, `pinned` from group metadata

#### Step 2.5 — Update UI to pass account group IDs

| File                                                          | Change                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ui/pages/settings/add-device-tab/types.ts`                   | Replace `entropyIds` with `selectedAccountGroupIds: AccountGroupId[]`; keep summary counts |
| `ui/pages/settings/add-device-tab/components/add-wallets.tsx` | Pass `selectedAccountGroups` directly (stop collapsing to entropy IDs)                     |
| `ui/pages/settings/add-device-tab/add-device-settings.tsx`    | `syncAccounts(password, selectedAccountGroupIds)`                                          |
| `add-wallets.test.tsx`                                        | Update expected payload                                                                    |

#### Step 2.6 — Fix sync-offer validation

**File:** `qr-sync-controller.ts` → `#isQrSyncOffer`

Require `deadline` to be a positive number (matches `QrSyncOffer` type). This fixes the failing test _“ignores sync offers with an invalid payload”_.

#### Phase 2 acceptance criteria

- [ ] `syncAccounts` accepts `AccountGroupId[]`
- [ ] `sync-ready` payload includes populated `groups[]` with correct `groupIndex` and names
- [ ] Selected subset of accounts within an SRP wallet exports only those groups (not all accounts)
- [ ] Private-key accounts export as `PrivateKey` entries
- [ ] Hardware/Snap selections throw or are blocked before export
- [ ] `selectedAccountGroupIds` in controller state matches UI selection
- [ ] Unit tests cover mnemonic groups, private key, multi-wallet `isPrimary`, invalid sync offer
- [ ] `yarn test:unit app/scripts/controllers/qr-sync/` passes
- [ ] `yarn lint:changed:fix` on touched files

---

### Phase 3 — Syncable wallet picker

**Objective:** Only show wallets that can be synced; selection is all-or-nothing per wallet.

#### Step 3.1 — Hide non-exportable wallets

**Files:** `utils.ts`, `add-wallets.tsx`

- Filter account tree to **Entropy** (SRP) and **Keyring + `KeyringTypes.simple`** (imported private-key) wallets only
- **Do not show** hardware (`Keyring` with Ledger/Trezor/etc.) or **Snap** wallets in the picker

#### Step 3.2 — Whole-wallet selection only

**File:** `wallet-selection-list.tsx`

- Wallet-level checkbox selects or deselects **all** account groups in that wallet
- Account rows are display-only (no per-account checkboxes)
- No partial / indeterminate wallet selection

#### Phase 3 acceptance criteria

- [ ] Hardware and Snap wallets are not shown in the picker
- [ ] SRP and imported private-key wallets are shown
- [ ] User can only sync entire wallets (all account groups per wallet)
- [ ] Continue button disabled when no wallets are selected
- [ ] Unit tests updated for filtering and whole-wallet selection

---

### Phase 4 — Integration verification

#### Manual test steps

1. Enable `QR_SYNC_ENABLED=true` in `.metamaskrc` and rebuild.
2. Settings → Sync with mobile.
3. Complete QR + OTP flow with MetaMask Mobile.
4. Select wallets with mixed account types; enter password.
5. Verify loading → success screens.
6. On mobile, confirm imported accounts match names, primary wallet, hidden/pinned state.

#### Automated tests

```bash
yarn test:unit app/scripts/controllers/qr-sync/
yarn test:unit ui/pages/settings/add-device-tab/
```

E2E (if added later): follow `test/e2e/AGENTS.md` and `.agents/skills/mms-e2e-testing/SKILL.md`.

---

## 7. File reference

| Path                                                                           | Role                                                 |
| ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `app/scripts/controllers/qr-sync/types.ts`                                     | Payload types, messenger types, controller state     |
| `app/scripts/controllers/qr-sync/constants.ts`                                 | `QrSyncMessageVersion`, action types, error messages |
| `app/scripts/controllers/qr-sync/qr-sync-controller.ts`                        | Session lifecycle, `syncAccounts`, MWP messaging     |
| `app/scripts/controllers/qr-sync/wallet-export-encoding.ts`                    | Mnemonic / private-key base64 encoding               |
| `app/scripts/controllers/qr-sync/metadata.ts`                                  | Controller state defaults + metadata                 |
| `app/scripts/messenger-client-init/messengers/qr-sync-controller-messenger.ts` | Messenger delegation                                 |
| `ui/pages/settings/add-device-tab/`                                            | Full sync UI flow                                    |
| `ui/selectors/qr-sync/qr-sync.ts`                                              | Redux selectors for controller state                 |
| `ui/selectors/multichain-accounts/account-tree.ts`                             | Account tree data for wallet picker                  |
| `shared/constants/qr-sync.ts`                                                  | Phase enum shared by UI + controller                 |

---

## 8. Testing notes

### Controller test helpers

`qr-sync-controller.test.ts` provides:

- `setupController()` — mocks KeyringController messenger actions
- `mockStartSession()` / `mockSetReviewingSyncOffer()` — drive happy path
- Phase 2 tests will need additional messenger mocks for `AccountTreeController:getAccountGroupObject`

### Example test cases to add in Phase 2

1. **Partial SRP selection** — two account groups from same entropy ID → one mnemonic entry with `groups.length === 2`
2. **Private key export** — mock `exportAccount`, expect `PrivateKey` entry in payload
3. **Mixed export** — one mnemonic + one private key in same `sync-ready`
4. **Non-exportable rejection** — selecting only a hardware wallet group throws

---

## 9. Known issues / tech debt

| Issue                                          | Priority            | Notes                                               |
| ---------------------------------------------- | ------------------- | --------------------------------------------------- |
| `#isQrSyncOffer` too permissive                | P0 — fix in Phase 2 | `{}` passes validation; breaks invalid-payload test |
| OTP display grant not implemented              | P2                  | `qr-sync-controller.ts` TODO ~line 571              |
| `importedAccountIds` always `[]` on completion | P2                  | Mobile may send imported IDs later                  |

---

## 10. Resume checklist

When picking this up after a break:

1. Read this doc and skim `types.ts` for the payload contract.
2. Run `git diff main -- app/scripts/controllers/qr-sync ui/pages/settings/add-device-tab` to see current branch state.
3. Run unit tests: `yarn test:unit app/scripts/controllers/qr-sync/`
4. Check which phase acceptance criteria are still unchecked in **Section 6**.
5. Start with **Phase 2, Step 2.1** (messenger) unless UI work is parallelizable.

**Next action after this doc:** Implement Phase 2.

---

## 11. Related PR / feature context

- Feature flag: `QR_SYNC_ENABLED` in `.metamaskrc.dist`
- Locale strings under `add_device_*`, `add_wallets_*`, `enter_verification_code_*`, `qrCode*` in `app/_locales/en/messages.json`
- Dependencies: `@metamask/mobile-wallet-protocol-core`, `@metamask/mobile-wallet-protocol-dapp-client`, `eciesjs` (encrypted transport)
