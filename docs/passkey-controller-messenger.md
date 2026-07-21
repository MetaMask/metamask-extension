# PasskeyController — Messenger Architecture & Migration

## Overview

`PasskeyController` (`@metamask/passkey-controller`, **v2.1.0-preview `eade524`+**) manages WebAuthn passkey enrollment, vault-key wrapping, passkey-based unlock, password change, and passkey-gated exports.

As of this version the controller is **fully messenger-oriented** and **already owns the orchestration**: each product flow is a controller method (and a messenger action) that performs its own cross-controller work via a `KeyringController` action allowlist and an internal operation mutex.

The remaining work is on the **extension side**: `MetaMaskController` still hand-orchestrates these flows and must be reduced to thin adapters that delegate to the controller.

**Last updated:** 2026-07-21.

---

## Table of Contents

1. [Migration progress](#migration-progress)
2. [Actions PasskeyController exposes](#actions-passkeycontroller-exposes)
3. [External controller actions PasskeyController calls](#external-controller-actions-passkeycontroller-calls)
4. [Initialization](#initialization)
5. [Key files](#key-files)

---

## Migration progress

### ✅ Done (committed)

- [x] Bump dependency to `@metamask/passkey-controller@2.1.0-preview-eade524` (`package.json`).
- [x] Pass the required `getIsOnboardingCompleted` constructor callback (`passkey-controller-init.ts`).
- [x] Delegate the six `KeyringController:*` actions to the controller messenger (`passkey-controller-messenger.ts`).
- [x] Add the `OnboardingController:getState` init-messenger and register it (`passkey-controller-messenger.ts`, `messengers/index.ts`).

### ✅ Phase 1 — Fully delegate the safe drop-ins (`MetaMaskController`) — DONE

Replaced the hand-orchestration with a 1:1 delegation. Also fixed the two flows that were **broken** against the new package (`protect` passed `vaultKey`; `removePasskey()` is no longer public).

- [x] `protectVaultKeyWithPasskey(reg, auth, password)` → `passkeyController.protectVaultKeyWithPasskey({ registrationResponse, authenticationResponse, password })`. Dropped the onboarding gate + `verifyPassword` + `exportEncryptionKey` (now in the controller).
- [x] `removePasskeyWithPasskeyVerification(auth)` → delegate 1:1.
- [x] `removePasskeyWithPasswordVerification(password)` → delegate 1:1.
- [x] `changePasswordWithPasskeyVerification(newPassword, auth, options)` → `passkeyController.changePasswordWithPasskeyVerification({ newPassword, authenticationResponse, options })`. Dropped the `seedlessOperationMutex` usage (controller has its own mutex) and the `removePasskey()` call.
- [x] `exportAccountsWithPasskey(auth, addresses)` → delegate 1:1 (returns `string[]`, identical).
- [x] **Coupled UI/error change:** the controller now throws `PasskeyControllerErrorCode.VaultKeyRenewalFailed` (`'vault_key_renewal_failed'`) instead of the extension's `ExtensionPasskeyErrorCode.VaultKeyRenewalFailed`. Updated `change-password.tsx`'s "treat renewal failure as success" check to the controller code, and added the controller code to the i18n map in `passkey-error.ts`.
- [x] Removed the now-unused `ExtensionPasskeyErrorCode` import from `metamask-controller.js`.
- [x] Updated `metamask-controller.actions.test.js` (protect / remove×2 / changePassword / exportAccounts) to assert delegation, `change-password.test.tsx` to simulate the controller code, and `passkey-controller-init.test.ts` for the `getIsOnboardingCompleted` wiring.

> Verified: `yarn lint:tsc`, affected unit suites, and `yarn lint:changed:fix` all pass.

### ✅ Phase 2 — Delegate with an encoding adapter — DONE

- [x] `exportSeedPhraseWithPasskey(auth, keyringId)` → delegates to the controller (which returns **raw wordlist-index bytes**, `Uint8Array`) and re-encodes with `convertEnglishWordlistIndicesToCodepoints(...)` so the UI return value is unchanged. Dropped the local `isPasskeyEnrolled` guard + `retrieveVaultKeyWithPasskey` + `keyringController.exportSeedPhrase`; updated its test block to assert delegation + conversion.

> Verified: `yarn lint:tsc`, `metamask-controller.actions.test.js`, and `yarn lint:changed:fix` all pass.

### ✅ Phase 3 — `unlockWithPasskey` fully delegated via `LegacyBackgroundApiService` — DONE

The controller's `PasskeyController:unlockWithPasskey` (verify assertion + `KeyringController:submitEncryptionKey`) does **not** run the extension's awaited post-unlock account init (`AccountsController:updateAccounts` → `MultichainAccountService:init` → `AccountTreeController:init`). Rather than keep bespoke orchestration in `MetaMaskController`, that sequence was moved into `LegacyBackgroundApiService`, which already owns it for `submitPasswordOrEncryptionKey`.

- [x] Added `LegacyBackgroundApiService.unlockWithPasskey(authenticationResponse)`: awaits the offscreen document, calls `PasskeyController:unlockWithPasskey`, then runs the shared post-unlock account init.
- [x] Extracted the account-init sequence into a private `#initAccountsAfterUnlock()` helper reused by both `submitPasswordOrEncryptionKey` and `unlockWithPasskey` (no behavioral change).
- [x] Exposed it as the `LegacyBackgroundApiService:unlockWithPasskey` messenger action (added to `MESSENGER_EXPOSED_METHODS`, regenerated action types) and delegated `PasskeyController:unlockWithPasskey` to the service messenger.
- [x] Thinned `MetaMaskController.unlockWithPasskey` to a 1-line delegation to that action, and removed the now-unused `MetaMaskController.submitEncryptionKey` helper.
- [x] Updated tests: `metamask-controller.actions.test.js` asserts the delegation; `legacy-background-api-service.test.ts` covers the new unlock method (success + error-skips-init) and the added messenger delegation.

> Verified: `yarn lint:tsc`, `legacy-background-api-service.test.ts`, `metamask-controller.actions.test.js`, and `yarn lint:changed:fix` all pass.

### ⏳ Error-file cleanup (follow-up)

- [ ] Once no code throws `ExtensionPasskeyErrorCode.VaultKeyRenewalFailed`, delete it from `shared/lib/passkey/passkey-error.ts` + `shared/lib/passkey/index.ts` and its map entry, and update the tests. The i18n/ceremony/transport helpers (`translatePasskeyError`, `getPasskeyErrorCode`, `getPasskeyControllerErrorCode`) **stay in the extension** — they depend on `messages.json`, WebAuthn DOM errors, and MetaRPC wrapping, which the platform-agnostic controller must not own.

### Open decisions

- **Locking scope:** passkey `changePassword` no longer shares `seedlessOperationMutex` with `LegacyBackgroundApiService.changePassword` (it uses the controller's internal mutex). Acceptable only if both cannot be triggered concurrently from the UI.
- **`NotEnrolled` guards:** the controller throws these itself, so the MMC pre-checks are redundant on delegated methods — remove for thinness (the only flow still assembled outside the controller is export SRP, which re-encodes the controller's raw bytes).

---

## Actions PasskeyController exposes

### Ceremony / low-level

| Action                                                            | Purpose                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `PasskeyController:getState`                                      | Read persisted `passkeyRecord`                               |
| `PasskeyController:isPasskeyEnrolled`                             | Whether a passkey is enrolled                                |
| `PasskeyController:generateRegistrationOptions`                   | WebAuthn `create()` options                                  |
| `PasskeyController:generatePostRegistrationAuthenticationOptions` | WebAuthn `get()` options after `create()`                    |
| `PasskeyController:generateAuthenticationOptions`                 | WebAuthn `get()` options for unlock / step-up                |
| `PasskeyController:retrieveVaultKeyWithPasskey`                   | Verify assertion + return vault key (used by kept MMC flows) |
| `PasskeyController:verifyPasskeyAuthentication`                   | Boolean assertion verification                               |
| `PasskeyController:renewVaultKeyProtection`                       | Re-wrap vault key after rotation                             |
| `PasskeyController:clearState`                                    | Reset state                                                  |
| `PasskeyController:destroy`                                       | Tear down messenger + ceremony state                         |

### Orchestrated product flows

| Action                                                    | Purpose                                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `PasskeyController:protectVaultKeyWithPasskey`            | Enroll: step-up gate + verify password + export vault key + wrap (no longer takes `vaultKey`) |
| `PasskeyController:unlockWithPasskey`                     | Verify assertion + `KeyringController:submitEncryptionKey`                                    |
| `PasskeyController:changePasswordWithPasskeyVerification` | Verify assertion + change password + re-wrap (or remove passkey)                              |
| `PasskeyController:exportSeedPhraseWithPasskey`           | Verify assertion + export SRP (returns raw bytes)                                             |
| `PasskeyController:exportAccountsWithPasskey`             | Verify assertion + export private keys                                                        |
| `PasskeyController:removePasskeyWithPasskeyVerification`  | Verify assertion + remove passkey                                                             |
| `PasskeyController:removePasskeyWithPasswordVerification` | Verify password + remove passkey                                                              |

> **Removed:** `removePasskey` / `PasskeyController:removePasskey` are no longer public — use the two `removePasskeyWith*` flows or `clearState`.

It also publishes `PasskeyController:stateChanged` (`PasskeyControllerState`).

---

## External controller actions PasskeyController calls

The controller performs its own cross-controller work. These `KeyringController` actions are delegated to the `PasskeyController` messenger at init (`PasskeyControllerAllowedActions`):

| Action                                  | Used in                                                 |
| --------------------------------------- | ------------------------------------------------------- |
| `KeyringController:verifyPassword`      | enroll step-up, `removePasskeyWithPasswordVerification` |
| `KeyringController:exportEncryptionKey` | enroll, change password                                 |
| `KeyringController:changePassword`      | change password                                         |
| `KeyringController:submitEncryptionKey` | unlock                                                  |
| `KeyringController:exportSeedPhrase`    | export SRP                                              |
| `KeyringController:exportAccount`       | export private key                                      |

The onboarding step-up gate is **not** a messenger action — it is the `getIsOnboardingCompleted: () => boolean` constructor callback, supplied from `OnboardingController:getState` via a dedicated init-messenger.

---

## Initialization

```typescript
// app/scripts/messenger-client-init/passkey-controller-init.ts
new PasskeyController({
  messenger: controllerMessenger,
  state: persistedState.PasskeyController,
  rpId: undefined,
  rpName: 'MetaMask',
  expectedRPID: extensionOrigin,
  expectedOrigin: extensionOrigin,
  userName: 'MetaMask Wallet',
  userDisplayName: 'MetaMask Wallet',
  getIsOnboardingCompleted: () =>
    initMessenger.call('OnboardingController:getState').completedOnboarding,
});
```

```typescript
// app/scripts/messenger-client-init/messengers/passkey-controller-messenger.ts
messenger.delegate({
  messenger: controllerMessenger,
  actions: [
    'KeyringController:verifyPassword',
    'KeyringController:exportEncryptionKey',
    'KeyringController:submitEncryptionKey',
    'KeyringController:changePassword',
    'KeyringController:exportSeedPhrase',
    'KeyringController:exportAccount',
  ],
});
```

---

## Key files

| File                                                                           | Role                                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `node_modules/@metamask/passkey-controller/dist/PasskeyController.d.mts`       | Controller API                                               |
| `node_modules/@metamask/passkey-controller/dist/constants.mjs`                 | `PasskeyControllerErrorCode` (incl. `VaultKeyRenewalFailed`) |
| `app/scripts/messenger-client-init/passkey-controller-init.ts`                 | Extension init (+ `getIsOnboardingCompleted`)                |
| `app/scripts/messenger-client-init/messengers/passkey-controller-messenger.ts` | KeyringController allowlist + Onboarding init-messenger      |
| `app/scripts/metamask-controller.js`                                           | Passkey API adapters (Phase 1–3)                             |
| `ui/components/app/change-password/change-password.tsx`                        | Consumes `VaultKeyRenewalFailed`                             |
| `shared/lib/passkey/passkey-error.ts`                                          | Extension i18n / ceremony / transport error helpers          |
| `ui/selectors/selectors.js`                                                    | `getIsPasskeyRegistered`, `getPasskeyDerivationMethod`       |
