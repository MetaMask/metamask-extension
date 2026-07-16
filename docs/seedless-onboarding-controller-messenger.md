# SeedlessOnboardingController — Messenger Architecture

## Overview

`SeedlessOnboardingController` (`@metamask/seedless-onboarding-controller`, **v10.0.3+**) manages social-login (OAuth) authentication, TOPRF key derivation, and encrypted backup/restore of SRPs and private keys.

The goal is to make `SeedlessOnboardingController` fully messenger-oriented:

- **Already done:** every public method is exposed as a messenger action (28 actions + `:getState`), so callers no longer need a direct `this.seedlessOnboardingController` reference.
- **The goal:**
  1. Move the flows still hand-orchestrated in `MetaMaskController` (`this.seedlessOnboardingController.*`) onto the messenger.
  2. Let the controller call `OAuthService` through the messenger instead of the constructor callbacks (`refreshJWTToken` / `revokeRefreshToken` / `renewRefreshToken`) it uses today.

> **⚠️ Unlike `PasskeyController`, this migration is hard.** The passkey wrappers were self-contained (a password check + a vault-key export). Seedless backup/restore is deeply woven into the **vault/keyring lifecycle**: the backup state is bound to the `KeyringController` keyring identity and encryption key, and vault creation happens through **`MultichainAccountService`** — not `KeyringController` directly. Swapping `this.seedlessOnboardingController.*` for messenger calls is the easy part; the multi-controller, mutex-guarded orchestration around it is the real work. See [Tight coupling](#tight-coupling-keyringcontroller-via-multichainaccountservice).

**Last updated:** 2026-07-17.

---

## Table of Contents

1. [Actions SeedlessOnboardingController exposes](#actions-seedlessonboardingcontroller-exposes)
2. [External services SeedlessOnboardingController calls](#external-services-seedlessonboardingcontroller-calls)
3. [Replacing direct orchestration](#replacing-direct-orchestration)
4. [Tight coupling: KeyringController via MultichainAccountService](#tight-coupling-keyringcontroller-via-multichainaccountservice)
5. [Cross-controller flows](#cross-controller-flows)
6. [Initialization](#initialization)
7. [Key files](#key-files)

---

## Actions SeedlessOnboardingController exposes

Other code can call these on the messenger (grouped for readability).

### Auth & OAuth tokens

| Action | Purpose |
| ------ | ------- |
| `SeedlessOnboardingController:authenticate` | OAuth/social authenticate; registered vs new user |
| `SeedlessOnboardingController:getIsUserAuthenticated` | Whether OAuth state indicates an authenticated user |
| `SeedlessOnboardingController:getAccessToken` | Return access token, refreshing if needed |
| `SeedlessOnboardingController:refreshAuthTokens` | Refresh node/auth/metadata tokens |
| `SeedlessOnboardingController:rotateRefreshToken` | Rotate refresh/revoke token pair after JWT refresh |
| `SeedlessOnboardingController:revokePendingRefreshTokens` | Revoke pending refresh tokens after auth |
| `SeedlessOnboardingController:checkNodeAuthTokenExpired` | Whether node auth token is expired |
| `SeedlessOnboardingController:checkMetadataAccessTokenExpired` | Whether metadata access token needs refresh |
| `SeedlessOnboardingController:checkAccessTokenExpired` | Whether access token needs refresh |
| `SeedlessOnboardingController:fetchMetadataAccessCreds` | Fetch metadata service access credentials |
| `SeedlessOnboardingController:preloadToprfNodeDetails` | Fetch/cache TOPRF node endpoints, indexes, pubkeys |

### Backup & secret data

| Action | Purpose |
| ------ | ------- |
| `SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase` | Derive TOPRF key from password + back up initial SRP |
| `SeedlessOnboardingController:addNewSecretData` | Encrypt and upload a new secret (SRP/PK) |
| `SeedlessOnboardingController:fetchAllSecretData` | Download and decrypt all backed-up secrets |
| `SeedlessOnboardingController:getSecretDataBackupState` | Read backup metadata for a secret from state |
| `SeedlessOnboardingController:updateBackupMetadataState` | Update local backup metadata for one or more secrets |

### Password & unlock

| Action | Purpose |
| ------ | ------- |
| `SeedlessOnboardingController:submitPassword` | Verify password, derive key, unlock controller |
| `SeedlessOnboardingController:submitGlobalPassword` | Unlock with latest global password (multi-device) |
| `SeedlessOnboardingController:verifyVaultPassword` | Verify password by decrypting vault |
| `SeedlessOnboardingController:changePassword` | Change seedless password + re-encrypt vault/metadata |
| `SeedlessOnboardingController:checkIsPasswordOutdated` | Compare local password to global password on backend |
| `SeedlessOnboardingController:syncLatestGlobalPassword` | Reset vault to latest global password |
| `SeedlessOnboardingController:setLocked` | Lock controller and clear in-memory secrets |
| `SeedlessOnboardingController:storeKeyringEncryptionKey` | Store keyring encryption key under seedless key |
| `SeedlessOnboardingController:loadKeyringEncryptionKey` | Load/decrypt keyring encryption key from state |

### State & lifecycle

| Action | Purpose |
| ------ | ------- |
| `SeedlessOnboardingController:getState` | Read persisted controller state |
| `SeedlessOnboardingController:runMigrations` | Run idempotent seedless migrations after unlock |
| `SeedlessOnboardingController:clearState` | Reset controller state |

It also publishes `SeedlessOnboardingController:stateChanged` (`[state, patches]`).

---

## External services SeedlessOnboardingController calls

The controller messenger currently allows **no** external actions (`AllowedActions = never`). Its only outbound dependency is `OAuthService`, wired today via **constructor callbacks** delegated through an init-messenger — not through the controller messenger.

| Need | Today (constructor callback via init-messenger) | Goal (controller-messenger action) |
| ---- | ----------------------------------------------- | ---------------------------------- |
| Get a new refresh token | `refreshJWTToken` → `OAuthService:getNewRefreshToken` | `OAuthService:getNewRefreshToken` |
| Revoke a refresh token | `revokeRefreshToken` → `OAuthService:revokeRefreshToken` | `OAuthService:revokeRefreshToken` |
| Renew a refresh token | `renewRefreshToken` → `OAuthService:renewRefreshToken` | `OAuthService:renewRefreshToken` |

> The init file itself notes this is temporary: *"Ideally the controller calls the service directly using the messenger system, but that requires some further refactoring in the controller."* The goal is to add these three actions to the controller messenger's **allowed actions** and drop the callbacks.

---

## Replacing direct orchestration

`MetaMaskController` still calls the controller directly for these flows. Each row shows what it does **today** and the **messenger action** that should replace it.

| Flow | Today (direct call in `MetaMaskController`) | Goal (messenger action) |
| ---- | ------------------------------------------- | ----------------------- |
| OAuth node preload | `this.seedlessOnboardingController.preloadToprfNodeDetails` | `SeedlessOnboardingController:preloadToprfNodeDetails` |
| Social authenticate | `this.seedlessOnboardingController.authenticate` | `SeedlessOnboardingController:authenticate` |
| Reset OAuth state | `this.seedlessOnboardingController.clearState` | `SeedlessOnboardingController:clearState` |
| Back up primary SRP | `this.seedlessOnboardingController.createToprfKeyAndBackupSeedPhrase` | `SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase` |
| Fetch all backups | `this.seedlessOnboardingController.fetchAllSecretData` | `SeedlessOnboardingController:fetchAllSecretData` |
| Read a backup's state | `this.seedlessOnboardingController.getSecretDataBackupState` | `SeedlessOnboardingController:getSecretDataBackupState` |
| Add an SRP backup | `this.seedlessOnboardingController.addNewSecretData` / `updateBackupMetadataState` | `SeedlessOnboardingController:addNewSecretData` / `:updateBackupMetadataState` |
| Check auth (UI) | `this.seedlessOnboardingController.getIsUserAuthenticated` | `SeedlessOnboardingController:getIsUserAuthenticated` |
| Store keyring enc key | `this.seedlessOnboardingController.storeKeyringEncryptionKey` | `SeedlessOnboardingController:storeKeyringEncryptionKey` |

> **Gap:** `MetaMaskController` also calls `setMigrationVersion(...)`, which has **no messenger action in v10.0.3**. It needs a new action, or the behavior should be folded into `createToprfKeyAndBackupSeedPhrase`.
>
> Unlock, password change, and outdated-password sync already run through the messenger via `LegacyBackgroundApiService`, not direct `MetaMaskController` calls.

---

## Tight coupling: KeyringController via MultichainAccountService

Seedless backup/restore does **not** operate on `KeyringController` directly for vault creation. The vault (keyring) is created through **`MultichainAccountService.createMultichainAccountWallet(...)`**, and the seedless backup state is then bound to that keyring's identity and encryption key. Three bindings make the controller hard to decouple:

1. **Vault creation is indirect.** `createNewVaultAndRestore` and `importMnemonicToVault` create the keyring via `MultichainAccountService.createMultichainAccountWallet({ type: 'restore' | 'import', password?, mnemonic })` — which internally drives `KeyringController`. Seedless code never calls `KeyringController:createNewVaultAndRestore` itself.

2. **Backup state is keyed by keyring identity.** After restore, `MetaMaskController` reads `this.keyringController.state.keyrings[0].metadata.id` and passes it to `SeedlessOnboardingController.updateBackupMetadataState({ keyringId, ... })`. The seedless backup metadata is meaningless without the `KeyringController` keyring id.

3. **The keyring encryption key is stored inside seedless state.** `LegacyBackgroundApiService.syncKeyringEncryptionKey()` calls `KeyringController:exportEncryptionKey` and hands the result to `SeedlessOnboardingController:storeKeyringEncryptionKey`. So the seedless vault holds the keyring's encryption key.

```text
MultichainAccountService.createMultichainAccountWallet
        │  (creates / restores)
        ▼
   KeyringController vault ──exportEncryptionKey──▶ SeedlessOnboardingController.storeKeyringEncryptionKey
        │                                                   ▲
        └── keyrings[0].metadata.id ──updateBackupMetadataState({ keyringId })
```

### Why the migration is hard

- **Ordering is load-bearing.** Restore must run: clear state → create vault (via MultichainAccountService) → `AccountsController.updateAccounts` → `MultichainAccountService.init` → `AccountTreeController.reinit` → discover accounts → seedless `updateBackupMetadataState` + `syncKeyringEncryptionKey`. Reordering breaks account derivation.
- **Guarded by mutexes.** `createVaultMutex` (`importMnemonicToVault`, `createNewVaultAndRestore`) and `seedlessOperationMutex` (`addNewSeedPhraseBackup`, password change) serialize these flows. A messenger-only design must preserve the same locking.
- **Rollback is manual.** `importMnemonicToVault` calls `MultichainAccountService.removeMultichainAccountWallet(...)` if the seedless backup fails — a cross-controller compensating action.
- **`setMigrationVersion` has no messenger action** (see gap above), so `createSeedPhraseBackup` cannot be fully migrated as-is.

---

## Cross-controller flows

The flows below live in `MetaMaskController` and each stitches several controllers together. This is the orchestration that must be redesigned (not just re-pointed at the messenger). `MAS` = `MultichainAccountService`, `KC` = `KeyringController`, `SOC` = `SeedlessOnboardingController`, `LBG` = `LegacyBackgroundApiService`.

| Flow (method) | Controllers touched (in order) | Seedless steps |
| ------------- | ------------------------------ | -------------- |
| `createSeedPhraseBackup` | `SOC` → `LBG` (`syncKeyringEncryptionKey`) → `KC` | `createToprfKeyAndBackupSeedPhrase`, `setMigrationVersion` (no action), `storeKeyringEncryptionKey` |
| `addNewSeedPhraseBackup` | `SOC` (`runMigrations`) → `SOC` | `runMigrations`, `addNewSecretData` / `updateBackupMetadataState` |
| `importMnemonicToVault` | `MAS` (create) → `KC` (`withKeyringV2`) → `Onboarding` → `SOC` (backup) → `MAS` (rollback on error) → `AccountsController` → `AccountTreeController` → discover | `addNewSecretData` (via `addNewSeedPhraseBackup`) |
| `createNewVaultAndRestore` | `Permission`/`Snap`/`AccountTree`/`AccountOrder`/`Tx`/`TokenDetection` (clear) → `MAS` (create vault) → `AppState` → `AccountsController` → `MAS.init` → `AccountTree.reinit` → `Preferences` → discover → `KC` (read keyring id) → `SOC` → `LBG` | `updateBackupMetadataState({ keyringId })`, `syncKeyringEncryptionKey` |
| `restoreSocialBackupAndGetSeedPhrase` | `SOC` (`fetchAllSecretData`) → `createNewVaultAndRestore` → `restoreSeedPhrasesToVault` | `fetchAllSecretData` |
| `restoreSeedPhrasesToVault` | `Onboarding` → `SOC` (`getSecretDataBackupState`) → `LBG` (`importAccountWithStrategy`) / `importMnemonicToVault` | `getSecretDataBackupState` |
| `syncSeedPhrases` | `Onboarding` → `SOC` (`fetchAllSecretData`, `getSecretDataBackupState`) → `LBG` / `importMnemonicToVault` | `fetchAllSecretData`, `getSecretDataBackupState` |

---

## Initialization

```typescript
// app/scripts/messenger-client-init/seedless-onboarding/seedless-onboarding-controller-init.ts
new SeedlessOnboardingController({
  messenger: controllerMessenger,
  state: persistedState.SeedlessOnboardingController,
  network, // Devnet on dev/test builds, otherwise Mainnet
  passwordOutdatedCacheTTL: 15_000,
  encryptor: encryptorFactory(600_000),

  // Temporary: OAuth wired via callbacks, not the controller messenger (see above).
  refreshJWTToken: (...args) => initMessenger.call('OAuthService:getNewRefreshToken', ...args),
  revokeRefreshToken: (...args) => initMessenger.call('OAuthService:revokeRefreshToken', ...args),
  renewRefreshToken: (...args) => initMessenger.call('OAuthService:renewRefreshToken', ...args),
});
```

The init-messenger (`getSeedlessOnboardingControllerInitMessenger`) delegates the three `OAuthService:*` actions. The controller messenger (`getSeedlessOnboardingControllerMessenger`) currently delegates nothing — the goal is to move those `OAuthService:*` actions onto it as **allowed actions**.

---

## Key files

| File | Role |
| ---- | ---- |
| `node_modules/@metamask/seedless-onboarding-controller/dist/SeedlessOnboardingController-method-action-types.d.mts` | Messenger action types |
| `node_modules/@metamask/seedless-onboarding-controller/dist/SeedlessOnboardingController.d.mts` | Controller API + messenger types (`AllowedActions = never`) |
| `app/scripts/messenger-client-init/seedless-onboarding/seedless-onboarding-controller-init.ts` | Extension init (OAuth callbacks) |
| `app/scripts/messenger-client-init/messengers/seedless-onboarding/seedless-onboarding-controller-messenger.ts` | Controller messenger + init-messenger (OAuth delegate) |
| `app/scripts/messenger-client-init/messengers/seedless-onboarding/oauth-service-messenger.ts` | OAuthService → seedless allowlist |
| `app/scripts/services/legacy-background-api-service.ts` | Unlock / password flows via messenger; `syncKeyringEncryptionKey` (KC ↔ SOC bridge, ~1416) |
| `app/scripts/metamask-controller.js` | Orchestration hub: `createSeedPhraseBackup` (~4302), `importMnemonicToVault` (~4952), `restoreSeedPhrasesToVault` (~5044), `restoreSocialBackupAndGetSeedPhrase` (~5105), `createNewVaultAndRestore` (~5151) |
| `MultichainAccountService` (`createMultichainAccountWallet`) | Creates/restores the `KeyringController` vault used by seedless restore/import |
| `app/scripts/lib/seedless-onboarding/run-migrations.ts` | `runSeedlessOnboardingMigrations` → `SeedlessOnboardingController:runMigrations` |
| `ui/selectors/onboarding/onboarding.ts`, `ui/selectors/first-time-flow.js` | `authConnection`, `socialLoginEmail`, `isSeedlessOnboardingUserAuthenticated`, `getIsSocialLoginFlow` |
