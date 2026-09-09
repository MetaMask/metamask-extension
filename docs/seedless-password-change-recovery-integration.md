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

The coordinator refactor implements the server-first ordering, lifecycle
advancement, key synchronization persistence/verification, and failure
locking. The controller currently exposes no separate remote verification
action for the stored Keyring key, so the coordinator verifies the key by
loading it after persistence before clearing the lifecycle.

Specific work:

- [x] Remove the compensating Keyring rollback. A rejected Promise is not
  proof that the remote operation did not commit.
- [x] Preserve the existing non-Seedless password-change behavior.
- [x] Reuse `syncKeyringEncryptionKey` for Keyring encryption-key
  export/storage before lifecycle advancement.
- [x] Make the Keyring-key synchronization and verification step explicit. The
  coordinator exports and stores the key, marks `KEY_SYNC_PENDING`, loads the
  stored key to verify it can be decrypted with the current Seedless password,
  and only then clears the lifecycle. No separate remote verification action
  is exposed by the controller.
- [x] Lock the wallet before rethrowing any error from the remote operation,
  local Keyring operation, key export/storage, synchronization, lifecycle
  advance, or persistence-related step.
- [x] When already inside `#seedlessOperationMutex`, call the lock path with
  the equivalent of `skipSeedlessOperationLock: true` to avoid deadlock.
- [x] Do not clear the phase in a catch block. Preserve the last known phase so
  the next unlock can recover it.
- [ ] Map `PasswordChangeInProgress` to a recovery-blocked state rather than
  starting another transaction.
- [x] Keep passkey password changes serialized with this coordinator where they
  can touch the same Keyring or Seedless state.

The background coordinator and unlock-page boundary for Section 3, “Add the
Option A recovery orchestration,” are complete. Home-page polling and the
existing modal compatibility wiring are covered in Sections 4 and 5.

### 3. Add the Option A recovery orchestration

The extension's background service is the client-side coordinator. It should
own the cross-controller sequence while the UI supplies the password and
renders the status.

#### Resolve before normal unlock

- [x] Add `resolveSeedlessPasswordSyncState` as a status-returning
  background-service method that calls
  `SeedlessOnboardingController:resolvePasswordSyncState`.
- [x] Return `in-sync` for non-Seedless wallets and incomplete onboarding
  without calling the Seedless resolver.
- [x] Use `skipCache: false` when checking on unlock-page render.
- [x] Use `skipCache: true` when the user submits a password through
  `syncPasswordAndUnlockWallet`.
- [x] Force an authoritative remote check for
  `SEEDLESS_CHANGE_PENDING`, regardless of the cache option.
- [x] Treat `in-sync` as the normal unlock path in the background coordinator.
- [x] Route `password-outdated` and `enter-new-password` to the new-password
  recovery step.
- [x] Call `SeedlessOnboardingController:reconcilePassword` with the submitted
  new password. For a no-phase / another-device change, handle
  `reconcile-keyring` after the internal Seedless reconciliation.
- [x] Route `reconcile-keyring` and `sync-key` to Keyring reconciliation.
- [x] Route `sync-key` through key synchronization and then
  `clearPasswordChangePhase` before normal unlock.
- [x] Return or preserve `unknown` without attempting a normal unlock in the
  background coordinator; keep the wallet blocked in the recovery UI.

#### Reconcile an old local Keyring

After Seedless reconciliation and a new-password submission:

1. `loadKeyringEncryptionKey()`.
2. `KeyringController:submitEncryptionKey`.
3. `KeyringController:changePassword(newPassword)`.
4. `KeyringController:exportEncryptionKey`.
5. `storeKeyringEncryptionKey()`.
6. `markPasswordChangeKeySyncPending()`.
7. Load and verify the stored Keyring encryption key.
8. `clearPasswordChangePhase()`.

- [x] Detect the old-Keyring branch with
  `KeyringController:verifyPassword(newPassword)`; do not infer it from the
  lifecycle phase.
- [x] Regression-test that `loadKeyringEncryptionKey` succeeds after
  `reconcilePassword` re-wraps the stored key.
- [x] Do not ask the user for the old Keyring password when the stored
  encryption key can unlock it.

#### Reconcile a local Keyring already using the new password

1. `KeyringController:verifyPassword(newPassword)`.
2. `KeyringController:exportEncryptionKey`.
3. `storeKeyringEncryptionKey()`.
4. `markPasswordChangeKeySyncPending()`.
5. Load and verify the stored Keyring encryption key.
6. `clearPasswordChangePhase()`.

- [x] Treat a successful password verification as evidence for the new-Keyring
  branch only; still complete key export, storage, synchronization, and phase
  transitions.
- [x] Make re-storing an already-current key safe to retry.

#### Resume `KEY_SYNC_PENDING`

- [x] Unlock with the new password.
- [x] Export and store the current Keyring encryption key again.
- [x] Verify the stored key and clear the phase only after all required local
  state is persisted and the synchronization boundary is verified.

#### Failure behavior

- [x] Lock before exposing a recovery error or allowing the recovery flow to
  continue.
- [ ] If locking fails, keep the user in a recovery-blocked UI and do not
  expose the wallet.
- [x] Preserve the phase on failure.
- [x] Never retry `changePassword` / `changeEncKey` as a fresh transaction when
  the result is unresolved.
- [x] Keep `unknown` distinct from an ordinary incorrect-password error.
- [ ] Offer wallet reset only as an explicit last resort for a confirmed,
  unrecoverable state.

### 4. Replace the old unlock and outdated-password flow

- [x] Update `ui/store/actions.ts` so the Seedless unlock boundary consumes a
  recovery status rather than a boolean outdated flag.
- [x] Keep passwords out of Redux state and status action payloads that are
  persisted or logged.
- [x] Update `ui/pages/unlock-page/unlock-page.container.ts` to expose the
  status resolver needed by the component.
- [x] Update `ui/pages/unlock-page/unlock-page.component.tsx` so it:
  - resolves status on render/mount;
  - leaves authoritative cache-bypass resolution to the background unlock
    coordinator on password submit;
  - asks for the new password when recovery requires it;
  - does not classify the password as invalid before recovery routing;
  - keeps the wallet blocked for `unknown`;
  - only navigates after Keyring and Seedless recovery completes.
- [x] Add recovery-specific loading, error, and recovery-blocked copy.
- [x] Prevent passkey or other automatic unlock paths from bypassing an
  unfinished Seedless recovery state at the unlock boundary.
- [x] Keep the existing `PasswordOutdatedModal` and its existing modal-priority
  behavior; the controller API migration does not make a UX decision.
- [x] Keep `passwordOutdatedCache` as the non-authoritative compatibility and
  display value for the existing modal flow.
- [x] Replace deprecated boolean outdated checks at existing sensitive entry
  points with `resolveSeedlessPasswordSyncState`, mapping `in-sync` versus
  non-`in-sync` without adding new local recovery UI state.

### 5. Update background polling and lock behavior

- [x] Replace the `checkIsSeedlessPasswordOutdated` call in `ui/index.js` with
  the new status resolver.
- [x] If polling detects a remote password change while the wallet is unlocked,
  lock first and then route to recovery. Preserve the existing modal as a
  compatibility UX path rather than replacing it as part of this integration.
- [x] Ensure the existing `setLocked` mutex ordering is safe when invoked from
  a recovery operation. Recovery callers pass `skipSeedlessOperationLock` while
  holding the Seedless operation mutex, and regression coverage verifies the
  lock path does not reacquire it.
- [x] Force a state refresh after relevant phase/status changes without
  treating the refresh as durable lifecycle persistence. The UI status resolver
  flushes controller patches after resolution and treats a failed refresh as
  `unknown`.
- [x] Confirm state sanitization and diagnostics expose only the phase/status,
  never passwords, raw encryption keys, SRPs, or decrypted backup data. The
  Seedless diagnostic mask exposes only `passwordChangePhase` and the
  non-sensitive outdated-status flag; UI state sanitization continues to remove
  encryption keys, vault data, and token material.

### 6. Tests

#### Unit and integration tests

- [x] Update `legacy-background-api-service.test.ts` for the server-first
  happy path, remove rollback expectations, and cover locking after remote or
  local change failures.
- [x] Test every controller status and phase transition at the background
  service boundary, including status routing and phase-dependent cache
  behavior.
- [x] Test no phase with no remote change (`in-sync`).
- [x] Test another-device password change, including the final
  `reconcile-keyring` behavior.
- [x] Test `SEEDLESS_CHANGE_PENDING` with definitive remote old, remote new,
  and unknown results.
- [x] Test `SEEDLESS_COMMITTED` and `LOCAL_KEYRING_PENDING` status resolution.
- [x] Test old-Keyring and new-Keyring branches.
- [x] Test resuming `KEY_SYNC_PENDING` after a restart/reload.
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
