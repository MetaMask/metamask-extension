# Temporary passkey derivation migration plan

> Working note for migrating existing passkey users from `userHandle` vault-key
> derivation to PRF. This document is intentionally temporary and should be
> replaced or removed when the migration design is finalized.

## Background

New passkey registration only supports authenticators that provide PRF. Users
who registered before that change can still have a passkey record with
`keyDerivation.method === 'userHandle'`.

The migration should be offered after an existing `userHandle`-based passkey
user successfully unlocks the wallet.

## Current implementation

The Redux selector surface now exposes:

- `getPasskeyDerivationMethod` — returns `prf`, `userHandle`, or `undefined`.
- `getIsPasskeyUserHandleBased` — identifies users who are candidates for
  migration.
- `getIsPasskeyPRFBased` — identifies users who have already migrated or
  registered with PRF.

The selectors are covered by `ui/selectors/passkey.test.ts`.

The passkey unlock completion callback now receives
`isPasskeyMigrationEligible` after a successful unlock. The default unlock
navigation is deferred for eligible legacy users while the migration modal is
shown.

## Migration checklist

### Detect migration opportunity during unlock

- [x] Detect the derivation method after a successful passkey unlock and state
  refresh.
- [x] Only offer migration to a `userHandle`-based passkey user.
- [x] Do not invalidate a successful unlock when migration is postponed.
- [ ] Decide whether the prompt should be shown after automatic unlock, manual
  passkey unlock, or both.

### Add the migration modal

- [x] Add a modal visually similar to the passkey setup screen.
- [x] Add the two CTAs: `Replace passkey` and `Remind me later`.
- [x] Show it after the `userHandle`-based passkey unlock succeeds.
- [x] Add temporary UI copy and visual details.
- [ ] Track CTA, success, failure, and dismissal metrics if required.

### Decide reminder behavior

- [ ] Decide whether `Remind me later` is session-only or persisted.
- [ ] Define when the prompt can be shown again.
- [ ] Prevent the prompt from appearing for PRF-based records.

## Tests to add with the implementation

- [ ] Selector tests for legacy, PRF, missing, and malformed records.
- [x] Unlock-flow tests proving the prompt is only eligible after a successful
  legacy passkey unlock.
- [ ] Migration success, cancellation, unsupported-PRF, and retry tests.
- [x] Modal tests for both CTA paths and reminder behavior.

## Open decisions

- What existing passkey-controller API should own the re-wrap operation?
- Does migration require a second explicit passkey ceremony after unlock?
- What should happen when a legacy authenticator cannot produce a PRF result?
- Should migration be mandatory eventually, or remain an optional upgrade?

## Final step: passkey-controller replacement operation

The installed `@metamask/passkey-controller` API can re-wrap a vault key, but
`renewVaultKeyProtection` derives the wrapping key from the existing
`keyDerivation` record and does not change `userHandle` to `prf`. The final
migration step therefore needs a passkey-controller API (or version) that can
create and persist a PRF-based replacement record.

- [ ] Run a PRF-capable authentication ceremony using the replacement flow.
- [ ] Derive a new vault wrapping key from the PRF output.
- [ ] Re-wrap the existing vault key and persist the updated passkey record.
- [ ] Ensure the update is atomic and safe to retry.
- [ ] Refresh Redux state after the migration completes.
- [ ] Define behavior when the authenticator or browser no longer supports PRF.

## Controller changes required for new PRF passkey replacement

### Context

Option 2 replaces the legacy credential with a newly registered PRF-capable
credential. The existing controller rejects registration while a passkey record
exists, so removing the old record first would create a passkey-unprotected gap.

### Description

Add a controller-owned replacement flow that:

- Stages a new PRF registration while retaining the existing record.
- Verifies the new registration and post-registration authentication responses.
- Wraps the existing vault key with the new PRF-derived key.
- Atomically replaces the old `passkeyRecord` with the new PRF record.
- Clears temporary ceremony data after success or failure.
- Preserves the old record when registration, verification, cancellation, or
  persistence fails.

The flow should expose dedicated controller actions for generating replacement
registration options and completing the replacement. It should not reuse
`removePasskeyWithPasskeyVerification` followed by
`protectVaultKeyWithPasskey`.

### Goal

After a successful migration, MetaMask has exactly one PRF-backed passkey
record and no active vault binding for the old credential. If migration does
not complete, the existing `userHandle` passkey remains usable without
interruption.
