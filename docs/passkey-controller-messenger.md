# PasskeyController — Messenger Architecture

## Overview

`PasskeyController` (`@metamask/passkey-controller`, **v2.1.0+**) manages WebAuthn passkey enrollment, vault-key wrapping, and passkey-based unlock.

The goal is to make `PasskeyController` fully messenger-oriented:

- **Already done (v2.1.0):** every public method is exposed as a messenger action, so callers no longer need a direct `this.passkeyController` reference.
- **The goal:** move the flows currently hand-orchestrated in `MetaMaskController` (verify password, export/submit vault key, change password, etc.) into `PasskeyController`, replacing its direct `this.keyringController.*` / `this.onboardingController.*` references with messenger calls.

**Last updated:** 2026-07-17.

---

## Table of Contents

1. [Actions PasskeyController exposes](#actions-passkeycontroller-exposes)
2. [External controller actions PasskeyController must call](#external-controller-actions-passkeycontroller-must-call)
3. [Initialization](#initialization)
4. [Key files](#key-files)

---

## Actions PasskeyController exposes

Other code can call these on the messenger (available as of v2.1.0):

| Action | Purpose |
| ------ | ------- |
| `PasskeyController:getState` | Read persisted `passkeyRecord` |
| `PasskeyController:isPasskeyEnrolled` | Whether a passkey is enrolled |
| `PasskeyController:generateRegistrationOptions` | WebAuthn `create()` options |
| `PasskeyController:generatePostRegistrationAuthenticationOptions` | WebAuthn `get()` options after `create()` |
| `PasskeyController:generateAuthenticationOptions` | WebAuthn `get()` options for unlock / step-up |
| `PasskeyController:protectVaultKeyWithPasskey` | Enroll: verify ceremony + wrap vault key |
| `PasskeyController:retrieveVaultKeyWithPasskey` | Verify assertion + return vault key |
| `PasskeyController:verifyPasskeyAuthentication` | Boolean assertion verification |
| `PasskeyController:renewVaultKeyProtection` | Re-wrap vault key after password change |
| `PasskeyController:removePasskey` | Clear enrollment |
| `PasskeyController:clearState` | Reset state |
| `PasskeyController:destroy` | Tear down messenger + ceremony state |

It also publishes `PasskeyController:stateChanged` (`PasskeyControllerState`).

---

## External controller actions PasskeyController must call

These are the **only** external controller actions `PasskeyController` needs. Each row shows what `MetaMaskController` does **today** (a direct reference) and the **messenger action** that should replace it.

| Flow | Today (direct call in `MetaMaskController`) | Goal (messenger action) |
| ---- | ------------------------------------------- | ----------------------- |
| Enroll step-up gate (`completedOnboarding`) | `this.onboardingController.state` | `OnboardingController:getState` |
| Enroll / remove (password path) | `this.keyringController.verifyPassword` | `KeyringController:verifyPassword` |
| Enroll / change password | `this.keyringController.exportEncryptionKey` | `KeyringController:exportEncryptionKey` |
| Change password | `this.keyringController.changePassword` | `KeyringController:changePassword` |
| Unlock | `this.submitEncryptionKey` | `KeyringController:submitEncryptionKey` |
| Export SRP with passkey | `this.keyringController.exportSeedPhrase` | `KeyringController:exportSeedPhrase` |
| Export private key with passkey | `this.keyringController.exportAccount` | `KeyringController:exportAccount` |

> Post-unlock account sync (`AccountsController:updateAccounts`, `MultichainAccountService:init`, `AccountTreeController:init`) happens as a side effect of `KeyringController:submitEncryptionKey`.

Each goal action must be added to the `PasskeyController` messenger's **allowed actions** at init (see below).

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
});
```

The restricted messenger (`getPasskeyControllerMessenger`) must **allow** the external actions above:

```typescript
// app/scripts/messenger-client-init/messengers/passkey-controller-messenger.ts
new Messenger({
  namespace: 'PasskeyController',
  parent: messenger,
  // allowedActions:
  //   OnboardingController:getState,
  //   KeyringController:verifyPassword,
  //   KeyringController:exportEncryptionKey,
  //   KeyringController:changePassword,
  //   KeyringController:submitEncryptionKey,
  //   KeyringController:exportSeedPhrase,
  //   KeyringController:exportAccount,
});
```

---

## Key files

| File | Role |
| ---- | ---- |
| `node_modules/@metamask/passkey-controller/dist/PasskeyController.d.mts` | Controller API + messenger action types |
| `app/scripts/messenger-client-init/passkey-controller-init.ts` | Extension init |
| `app/scripts/messenger-client-init/messengers/passkey-controller-messenger.ts` | Messenger wiring (exposed actions + allowed external actions) |
| `ui/selectors/selectors.js` | `getIsPasskeyRegistered`, `getPasskeyDerivationMethod` |
| `shared/lib/passkey/` | Extension-specific passkey helpers |
