# Seedless password-change recovery: extension integration checklist

- Status: implementation plan
- Target: Option A from MetaMask/core PR [#10148](https://github.com/MetaMask/core/pull/10148)
- Scope: social-login / Seedless wallets in the browser extension
- Last reviewed: 2026-09-10

This document translates the controller changes and ADRs in PR #10148 into
extension work. The extension remains responsible for coordinating
`SeedlessOnboardingController`, `KeyringController`, wallet locking, and UI.

The plan targets Option A. The future Option B plan, in which the core
controller also owns the KeyringController side, is listed separately at the
end and should not block this integration.

## Source contract

Read these documents before implementation:

- [PR #10148](https://github.com/MetaMask/core/pull/10148)
- [ADR 0001: Recovering server-first Seedless password changes](https://github.com/MetaMask/core/blob/abca9bceacbc27108e1b5714e53b3fcbeb4e2cf1/packages/seedless-onboarding-controller/docs/0001-seedless-password-change-recovery.md)
- [Password-change recovery flow](https://github.com/MetaMask/core/blob/abca9bceacbc27108e1b5714e53b3fcbeb4e2cf1/packages/seedless-onboarding-controller/docs/0002-password-change-recovery-flow.md)
- [Option B plan](https://github.com/MetaMask/core/blob/abca9bceacbc27108e1b5714e53b3fcbeb4e2cf1/packages/seedless-onboarding-controller/docs/0003-controller-owned-password-change-recovery-plan.md)

The important contract is:

- The remote Seedless password change happens before the local Keyring
  password change. Recovery moves local state forward; it does not roll back a
  committed remote change.
- `passwordChangePhase` is a persisted, non-sensitive recovery signal. It is
  not proof of what actually happened.
- Recovery must re-check authoritative remote state and cryptographically
  classify the local Keyring.
- Any ambiguous result remains `unknown`; the wallet stays locked.
- The wallet must be locked before surfacing a password-change or recovery
  error.
- A second password change must not start while the previous lifecycle is
  unfinished.

The new controller actions to consume are:

- `resolvePasswordSyncState({ skipCache? })`
- `reconcilePassword({ globalPassword })`
- `markPasswordChangeKeySyncPending()`
- `clearPasswordChangePhase()`

The public `checkIsPasswordOutdated`, `submitGlobalPassword`, and
`syncLatestGlobalPassword` actions are removed by the PR. The extension must
not continue calling them after upgrading the package. Their recovery
sequencing is internal to `reconcilePassword`.

## Latest PR updates to account for

The current PR head is
[`abca9bc`](https://github.com/MetaMask/core/commit/abca9bceacbc27108e1b5714e53b3fcbeb4e2cf1).
The two high-severity review findings from the earlier commit were addressed
by subsequent PR commits:

- [`e8fc3c4`](https://github.com/MetaMask/core/commit/e8fc3c4dc5985bf6d9a73e69e0f9b069c0d16560)
  updated `reconcilePassword` to re-wrap `encryptedKeyringEncryptionKey` while
  rewriting the local Seedless vault, so the old-Keyring branch can call
  `loadKeyringEncryptionKey` with the new password. It also makes a no-phase /
  another-device password change advance to `LOCAL_KEYRING_PENDING` and return
  `reconcile-keyring`.
- [`e8a502b`](https://github.com/MetaMask/core/commit/e8a502b7edd9c8eec423955d1971c78c929c576b)
  fixed Keyring-key synchronization after remote and local commitment.

Also confirm the following before coding:

- The core package release containing the current API and exported
  `PasswordChangeRecoveryStatus` / phase types. The PR head is not itself a
  published extension dependency.
- Whether `storeKeyringEncryptionKey` is sufficient to durably synchronize the
  current Keyring encryption key to the remote backup in this extension, or
  whether another existing backup operation must be called.
- The migration behavior for wallets whose state predates
  `passwordChangePhase`. Missing phase means no change is in progress.
- The final behavior for rate limits and unrecoverable `unknown` states.

The PR says lifecycle writes use the ordinary debounced controller state path
and do not expose an awaitable durability hook. Treat the phase as a hint and
re-verify actual state; do not clear the lifecycle merely because an in-memory
state update succeeded.

## Current extension behavior to replace

The current flow is local-first:

- `LegacyBackgroundApiService.changePassword` changes the local Keyring first,
  changes Seedless second, and attempts to roll the Keyring back on failure.
- `syncPasswordAndUnlockWallet` combines outdated detection, Seedless password
  synchronization, Keyring unlocking, local password change, and key
  synchronization.
- `checkIsSeedlessPasswordOutdated` exposes the old boolean contract through
  `ui/store/actions.ts` and
  `app/scripts/messenger-client-init/messengers/legacy-background-api-service-messenger.ts`.
- `syncPasswordAndUnlockWallet` still calls the controller's public
  `submitGlobalPassword` and `syncLatestGlobalPassword` actions; those calls
  must move behind `reconcilePassword`.
- `UnlockPage` checks the old boolean on mount and otherwise treats the
  submitted password as a normal unlock attempt.
- `ui/index.js` periodically runs the old outdated check, and
  `PasswordOutdatedModal` presents the result from `passwordOutdatedCache`.

Relevant implementation locations:

- `app/scripts/services/legacy-background-api-service.ts`
- `app/scripts/services/legacy-background-api-service.test.ts`
- `app/scripts/messenger-client-init/messengers/legacy-background-api-service-messenger.ts`
- `ui/store/actions.ts` and `ui/store/actions.test.js`
- `ui/pages/unlock-page/unlock-page.container.ts`
- `ui/pages/unlock-page/unlock-page.component.tsx`
- `ui/pages/unlock-page/unlock-page.component.test.tsx`
- `ui/index.js` and `ui/index.test.js`
- `ui/components/app/password-outdated-modal/`
- `ui/pages/home/home.tsx`
- `ui/pages/multi-srp/import-srp/import-srp.tsx`

## Implementation checklist

### 1. Adopt the controller contract

- [x] Wire the patched `@metamask/seedless-onboarding-controller` package
  containing PR #10148. Replace the local `.tgz` with the published release
  before merging.
- [x] Update `package.json` and `yarn.lock`.
- [x] Verify the new actions and status/phase types are exported by the
  package.
- [x] Remove all extension calls and messenger delegation for
  `SeedlessOnboardingController:checkIsPasswordOutdated`,
  `SeedlessOnboardingController:submitGlobalPassword`, and
  `SeedlessOnboardingController:syncLatestGlobalPassword`.
- [x] Add delegation for:
  `resolvePasswordSyncState`, `reconcilePassword`,
  `markPasswordChangeKeySyncPending`, and `clearPasswordChangePhase`.
- [x] No regeneration was needed for
  `app/scripts/services/legacy-background-api-service-method-action-types.ts`;
  no new public background-service methods were added in this step.
- [x] Confirmed the local package update did not add generated policy or
  attribution changes; dependency follow-up is deferred until the published
  package is available.

### 2. Refactor the background password-change coordinator

Update `LegacyBackgroundApiService` so the Seedless path follows this order:

1. Acquire the existing extension-level Seedless operation mutex.
2. Call the lifecycle-aware
   `SeedlessOnboardingController:changePassword(newPassword, oldPassword)`.
3. Only after the remote Seedless operation succeeds, change the local
   Keyring password.
4. Export and store the current Keyring encryption key.
5. Mark `KEY_SYNC_PENDING`.
6. Perform and verify the Keyring-key synchronization.
7. Call `clearPasswordChangePhase`.

Specific work:

- [ ] Remove the compensating Keyring rollback. A rejected Promise is not
  proof that the remote operation did not commit.
- [ ] Preserve the existing non-Seedless password-change behavior.
- [ ] Reuse or extend `syncKeyringEncryptionKey`, but make the remote
  synchronization and verification step explicit.
- [ ] Lock the wallet before rethrowing any error from the remote operation,
  local Keyring operation, key export/storage, synchronization, lifecycle
  advance, or persistence-related step.
- [ ] When already inside `#seedlessOperationMutex`, call the lock path with
  the equivalent of `skipSeedlessOperationLock: true` to avoid deadlock.
- [ ] Do not clear the phase in a catch block. Preserve the last known phase so
  the next unlock can recover it.
- [ ] Map `PasswordChangeInProgress` to a recovery-blocked state rather than
  starting another transaction.
- [ ] Keep passkey password changes serialized with this coordinator where they
  can touch the same Keyring or Seedless state.

### 3. Add the Option A recovery orchestration

The extension's background service is the client-side coordinator. It should
own the cross-controller sequence while the UI supplies the password and
renders the status.

#### Resolve before normal unlock

- [ ] Add a status-returning background-service method that calls
  `SeedlessOnboardingController:resolvePasswordSyncState`.
- [ ] Use `skipCache: false` when checking on unlock-page render.
- [ ] Use `skipCache: true` when the user submits a password.
- [ ] Force an authoritative remote check for
  `SEEDLESS_CHANGE_PENDING`, regardless of the cache option.
- [ ] Treat `in-sync` as the normal unlock path.
- [ ] Route `password-outdated` and `enter-new-password` to the new-password
  recovery step.
- [ ] Call `SeedlessOnboardingController:reconcilePassword` with the submitted
  new password. For a no-phase / another-device change, expect
  `reconcile-keyring` after the internal Seedless reconciliation.
- [ ] Route `reconcile-keyring` and `sync-key` to Keyring reconciliation.
- [ ] Route `sync-key` through key synchronization and then
  `clearPasswordChangePhase` before normal unlock.
- [ ] Return or preserve `unknown` without attempting a normal unlock.

#### Reconcile an old local Keyring

After Seedless reconciliation and a new-password submission:

1. `loadKeyringEncryptionKey()`.
2. `KeyringController:submitEncryptionKey`.
3. `KeyringController:changePassword(newPassword)`.
4. `KeyringController:exportEncryptionKey`.
5. `storeKeyringEncryptionKey()`.
6. `markPasswordChangeKeySyncPending()`.
7. Synchronize and verify the current Keyring encryption key remotely.
8. `clearPasswordChangePhase()`.

- [ ] Detect the old-Keyring branch with
  `KeyringController:verifyPassword(newPassword)`; do not infer it from the
  lifecycle phase.
- [ ] Regression-test that `loadKeyringEncryptionKey` succeeds after
  `reconcilePassword` re-wraps the stored key.
- [ ] Do not ask the user for the old Keyring password when the stored
  encryption key can unlock it.

#### Reconcile a local Keyring already using the new password

1. `KeyringController:verifyPassword(newPassword)`.
2. `KeyringController:exportEncryptionKey`.
3. `storeKeyringEncryptionKey()`.
4. `markPasswordChangeKeySyncPending()`.
5. Synchronize and verify the current Keyring encryption key remotely.
6. `clearPasswordChangePhase()`.

- [ ] Treat a successful password verification as evidence for the new-Keyring
  branch only; still complete key export, storage, synchronization, and phase
  transitions.
- [ ] Make re-storing an already-current key safe to retry.

#### Resume `KEY_SYNC_PENDING`

- [ ] Unlock with the new password.
- [ ] Export and store the current Keyring encryption key again.
- [ ] Synchronize and verify it remotely.
- [ ] Clear the phase only after all required local state is persisted and
  synchronization is verified.

#### Failure behavior

- [ ] Lock before exposing an error, retry screen, or intermediary screen.
- [ ] If locking fails, keep the user in a recovery-blocked UI and do not
  expose the wallet.
- [ ] Preserve the phase on failure.
- [ ] Never retry `changePassword` / `changeEncKey` as a fresh transaction when
  the result is unresolved.
- [ ] Keep `unknown` distinct from an ordinary incorrect-password error.
- [ ] Offer wallet reset only as an explicit last resort for a confirmed,
  unrecoverable state.

### 4. Replace the old unlock and outdated-password flow

- [ ] Update `ui/store/actions.ts` so the Seedless unlock action consumes a
  recovery status rather than a boolean outdated flag.
- [ ] Keep passwords out of Redux state and action payloads that are persisted
  or logged.
- [ ] Update `ui/pages/unlock-page/unlock-page.container.ts` to expose the
  status resolve/recovery operations needed by the component.
- [ ] Update `ui/pages/unlock-page/unlock-page.component.tsx` so it:
  - resolves status on render/mount;
  - resolves again with cache bypass on password submit;
  - asks for the new password when recovery requires it;
  - does not classify the password as invalid before recovery routing;
  - keeps the wallet blocked for `unknown`;
  - only navigates after Keyring and Seedless recovery completes.
- [ ] Add recovery-specific loading, error, and recovery-blocked copy.
- [ ] Prevent passkey or other automatic unlock paths from bypassing an
  unfinished Seedless recovery state.
- [ ] Replace or remove `PasswordOutdatedModal` so it cannot leave the wallet
  usable while recovery is pending.
- [ ] Replace `passwordOutdatedCache`-based selectors and low-priority-modal
  gating with the recovery status, or document why the cache remains only as a
  non-authoritative display hint.
- [ ] Update the SRP import and other sensitive flows that currently render
  `PasswordOutdatedModal` so they are blocked by the same recovery decision.

### 5. Update background polling and lock behavior

- [ ] Replace the `checkIsSeedlessPasswordOutdated` call in `ui/index.js`
  with the new status resolver, or remove polling if recovery is intentionally
  checked only at unlock.
- [ ] If polling detects a remote password change while the wallet is
  unlocked, lock first and then route to recovery. Do not show an unlocked
  home-page modal as the recovery boundary.
- [ ] Ensure the existing `setLocked` mutex ordering is safe when invoked from
  a recovery operation.
- [ ] Force a state refresh after relevant phase/status changes without
  treating the refresh as durable lifecycle persistence.
- [ ] Confirm state sanitization and diagnostics expose only the phase/status,
  never passwords, raw encryption keys, SRPs, or decrypted backup data.

### 6. Tests

#### Unit and integration tests

- [ ] Update `legacy-background-api-service.test.ts` for the server-first
  happy path and remove rollback expectations.
- [ ] Test every controller status and phase transition.
- [ ] Test no phase with no remote change (`in-sync`).
- [ ] Test another-device password change, including the final
  `reconcile-keyring` behavior.
- [ ] Test `SEEDLESS_CHANGE_PENDING` with definitive remote old, remote new,
  and unknown results.
- [ ] Test `SEEDLESS_COMMITTED` and `LOCAL_KEYRING_PENDING`.
- [ ] Test old-Keyring and new-Keyring branches.
- [ ] Test resuming `KEY_SYNC_PENDING` after a restart/reload.
- [ ] Inject failures before and after remote commitment, local Keyring
  password change, key export, key storage, remote key synchronization,
  and phase clearing.
- [ ] Assert that every failure locks before the error is exposed.
- [ ] Assert that phase state is preserved on failure.
- [ ] Assert that no recovery path retries `changePassword` or `changeEncKey`.
- [ ] Assert that concurrent password changes are rejected.
- [ ] Assert that a missing or stale phase is resolved using authoritative
  remote checks and local cryptographic verification.
- [ ] Add a regression test for each high-severity core review finding.
- [ ] Update `ui/store/actions.test.js`, unlock-page tests, modal tests, and
  any home/import-flow tests affected by removal of the boolean cache.

#### End-to-end tests

- [ ] Update the existing social-login password-change test for the
  server-first flow and new-password unlock.
- [ ] Add an old-Keyring recovery test after a failure between remote commit
  and local Keyring change.
- [ ] Add a new-Keyring recovery test after key synchronization fails or its
  response is lost.
- [ ] Add a restart/reload test with each unfinished phase.
- [ ] Add another-device password-change test with stale/missing local
  phase state.
- [ ] Add an ambiguous remote-result test that remains locked and shows the
  recovery-blocked state.
- [ ] Verify the old password is not accepted after a completed change and the
  new password unlocks only after recovery completes.
- [ ] Add page objects and flows for recovery UI; keep locators out of spec
  files in accordance with `test/e2e/AGENTS.md`.

### 7. Telemetry, copy, and rollout

- [ ] Define non-sensitive metrics for recovery status, phase, success, and
  failure category. Never include passwords, keys, or raw server errors.
- [ ] Decide whether existing `PasswordOutdatedModalViewed` telemetry should
  be replaced, renamed, or retained for the new recovery screen.
- [ ] Add translations for remote-change, local-reconciliation,
  key-synchronization-pending, and recovery-blocked states.
- [ ] Document the user-visible behavior when recovery is `unknown`.
- [ ] Add a changelog entry only if the final behavior is considered
  end-user-facing by the release owner.

## Acceptance criteria

The extension integration is complete when:

- A normal Seedless password change commits the remote state first and never
  performs an automatic rollback.
- A failure after remote commitment leaves the wallet locked and recoverable
  on the next unlock.
- Both old-Keyring and already-new-Keyring states converge to the new
  password and the current encryption key is synchronized.
- The lifecycle is not cleared before key synchronization and required local
  persistence are verified.
- A lost response or ambiguous server result never triggers a second
  non-idempotent password change.
- Missing, stale, or delayed lifecycle state does not bypass remote and local
  verification.
- Another-device password changes return `reconcile-keyring` and do not take a
  false normal `in-sync`/old-password path.
- All password-change and recovery failures lock before any error or
  intermediary UI is shown.
- `unknown` keeps the wallet locked and preserves enough state for a later
  recovery attempt.
- The old `checkIsPasswordOutdated`, `submitGlobalPassword`, and
  `syncLatestGlobalPassword` messenger actions and boolean-only unlock routing
  are no longer used.

## Future Option B

PR #10148's Option B plan would move the KeyringController calls into
`SeedlessOnboardingController`. That is a separate core migration:

- Add the required KeyringController actions to the controller messenger.
- Move old/new Keyring branching into the controller.
- Change `reconcilePassword` to return only a final status.
- Remove the extension's cross-controller Keyring recovery sequence while
  retaining lock-before-error, unlock routing, and status-based UI.
- Reduce client tests to status routing, locking, and UI behavior.

Do not implement Option B in the extension until the corresponding core
contract is released and the lock-ordering implications are agreed.
