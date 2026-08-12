# Passkey UI Messenger Migration Plan

## Status

Steps 1 and 2 are complete: the global blocked list and enrollment route
migrations are implemented and tested. Work is paused for review before Step 3.

This plan follows the existing route-messenger patterns used by:

- `ui/pages/snaps/snap-view/messenger.ts`
- `ui/pages/defi/messenger.ts`
- `ui/pages/routes/routes.component.tsx`
- `ui/pages/defi/pages/defi-tab.tsx`
- `ui/pages/defi/components/defi-details-page.tsx`

## Corrected design

UI route capabilities are not declared in a central per-controller registry.
They are declared beside the route or feature that consumes them, then passed
to `createRouteWithMessenger` or `RouteWithMessenger`.

Each passkey migration unit must therefore add all of the following together:

1. A colocated `messenger.ts` describing one real route's capabilities.
2. Route or feature-subtree wiring with those capabilities.
3. A typed `useMessenger` call in the consumer.
4. Tests for the action call and route wiring.
5. Removal of the corresponding legacy UI wrapper only when all of its callers
   have migrated.

Do not add:

- A global `passkey-controller-capabilities.ts`.
- Capability groups that are not wired to a route in the same change.
- One application-wide passkey messenger with every passkey action.
- Messenger calls for reading controller state already synchronized to Redux.

## Existing behavior that must be preserved

### State reads remain in Redux

Continue using the existing selectors for `passkeyRecord`, enrollment status,
derivation method, and side-panel compatibility. Do not replace these reads
with `PasskeyController:getState`, `isPasskeyEnrolled`, or `stateChanged`.

### Unlock remains extension-orchestrated

The UI must call:

```text
LegacyBackgroundApiService:unlockWithPasskey
```

It must not call `PasskeyController:unlockWithPasskey` directly. The legacy
service waits for the offscreen document and initializes accounts, multichain
accounts, and the account tree after unlock.

### Password change remains mutex-protected

The UI must call:

```text
LegacyBackgroundApiService:changePasswordWithPasskeyVerification
```

It must not call the equivalent PasskeyController action directly. The service
uses the shared seedless-operation mutex to prevent overlapping keyring
encryption-key mutations.

### Redux UI behavior remains

`showLoadingIndication`, `hideLoadingIndication`, and
`forceUpdateMetamaskState` are not automatically redundant when the transport
changes. Preserve them until a separate test proves they are unnecessary.

## Security boundary

### Globally excluded from the UI messenger

Add a PasskeyController exclusion config under `ui/messengers/configs/` for:

- `PasskeyController:retrieveVaultKeyWithPasskey`
  - Returns the plaintext vault encryption key.
- `PasskeyController:renewVaultKeyProtection`
  - Accepts plaintext old and new vault keys and assumes prior authentication.
- `PasskeyController:unlockWithPasskey`
  - Bypasses extension post-unlock orchestration.
- `PasskeyController:changePasswordWithPasskeyVerification`
  - Bypasses the extension-level seedless-operation mutex.
- `PasskeyController:exportSeedPhraseWithPasskey`
  - Returns raw bytes and bypasses the extension's seed-phrase encoding adapter.
- `PasskeyController:clearState`
  - Wallet-reset lifecycle operation, not a product UI action.
- `PasskeyController:destroy`
  - Controller teardown operation.

Register this config in `ui/messengers/configs/index.ts`. Add a UI-messenger
test proving excluded calls throw before reaching `submitRequestToBackground`.

### Not route-allowed unless a product flow needs them

Do not place these in any route capability list:

- `PasskeyController:getState`
- `PasskeyController:isPasskeyEnrolled`
- `PasskeyController:verifyPasskeyAuthentication`
- `PasskeyController:stateChanged`

## Route capability map

Capabilities below are targets for the route-specific migrations. Each row gets
its own colocated `messenger.ts` or an equivalent capability declaration beside
the route entry.

### Onboarding passkey setup

Route: `ONBOARDING_SETUP_PASSKEY_ROUTE`

Location: `ui/pages/onboarding-flow/setup-passkey/`

Actions:

- `PasskeyController:generateRegistrationOptions`
- `PasskeyController:generatePostRegistrationAuthenticationOptions`
- `PasskeyController:protectVaultKeyWithPasskey`

Wire the nested onboarding route element with `RouteWithMessenger`.

### Restore-vault passkey setup

Route: `RESTORE_VAULT_ROUTE`

Location: `ui/pages/keychains/restore-vault.tsx`

Actions:

- `PasskeyController:generateRegistrationOptions`
- `PasskeyController:generatePostRegistrationAuthenticationOptions`
- `PasskeyController:protectVaultKeyWithPasskey`

Wrap only the conditional `SetupPasskeyContent` subtree, matching the DeFi
feature-subtree pattern. Do not grant passkey actions to the password restore
steps.

### Settings passkey registration

Route: `SECURITY_REGISTER_PASSKEY_ROUTE`

Location: `ui/pages/settings/security-and-password-tab/`

Actions:

- `PasskeyController:generateRegistrationOptions`
- `PasskeyController:generatePostRegistrationAuthenticationOptions`
- `PasskeyController:protectVaultKeyWithPasskey`

### Settings passkey removal with passkey verification

Route: `SECURITY_AND_PASSWORD_ROUTE`

Location: `ui/pages/settings/security-and-password-tab/`

Actions:

- `PasskeyController:generateAuthenticationOptions`
- `PasskeyController:removePasskeyWithPasskeyVerification`

This supports the passkey toggle on the main Security and Password page.

### Settings passkey removal with password verification

Route: `SECURITY_TURN_OFF_PASSKEY_ROUTE`

Location: `ui/pages/settings/security-and-password-tab/`

Action:

- `PasskeyController:removePasskeyWithPasswordVerification`

### Settings password change

Route: `SECURITY_PASSWORD_CHANGE_V2_ROUTE`

Location: `ui/pages/settings/security-and-password-tab/`

Actions:

- `PasskeyController:generateAuthenticationOptions`
- `PasskeyController:removePasskeyWithPasswordVerification`
- `LegacyBackgroundApiService:changePasswordWithPasskeyVerification`

### Unlock

Route: `UNLOCK_ROUTE`

Location: `ui/pages/unlock-page/`

Actions:

- `PasskeyController:generateAuthenticationOptions`
- `LegacyBackgroundApiService:unlockWithPasskey`

Wire this top-level route with `createRouteWithMessenger`, matching the Snap
route pattern.

### Private-key export

Route: `MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE`

Location:
`ui/pages/multichain-accounts/multichain-account-private-key-list-page/`

Actions:

- `PasskeyController:generateAuthenticationOptions`
- `PasskeyController:exportAccountsWithPasskey`

Wire this top-level route with `createRouteWithMessenger`.

### Seed-phrase export

Routes:

- `REVEAL_SEED_ROUTE`
- `ONBOARDING_REVEAL_SRP_ROUTE`

Actions:

- `PasskeyController:generateAuthenticationOptions`
- A new JSON-safe extension orchestration action for seed-phrase export

Do not route-allow the raw
`PasskeyController:exportSeedPhraseWithPasskey` action. First move the existing
wordlist-index/codepoint conversion into a typed background service action that
returns a JSON-safe representation. Add that service action to these route
capabilities only after it exists.

## Settings router integration

Settings routes are generated from `settings-registry.ts`, rather than the
top-level route array. Preserve that architecture.

Preferred implementation:

1. Add an optional route-capabilities field to `SettingsRouteMeta`.
2. Set it only on the four passkey-related settings entries.
3. In `settings.tsx`, wrap the registry component with `RouteWithMessenger`
   only when capabilities are present.
4. Keep capability declarations colocated under
   `security-and-password-tab/`; import them into the relevant registry entries.

This avoids wrapping all of `/settings/*` in a broad passkey messenger and
provides a reusable route-level mechanism for future settings migrations.

## Shared passkey UI

`SetupPasskeyContent` and `PasskeyVerification` are shared by multiple routes.
They must not import one route's capability constant.

Use one of these patterns:

- Define the minimum `RouteMessenger<...>` type needed by the shared component,
  then call `useMessenger` inside it. Every parent route must delegate that
  action.
- For enrollment, pass typed action callbacks from each route adapter into
  `SetupPasskeyContent` if direct messenger use would couple the shared
  component to route concerns.

Prefer the first pattern for `PasskeyVerification`, which only needs
`PasskeyController:generateAuthenticationOptions`. Use the callback-adapter
pattern for `SetupPasskeyContent` if it keeps onboarding and restore-vault route
ownership clearer.

## Incremental implementation sequence

### 1. Add the global PasskeyController blocked list

- Add and register the exclusion config.
- Add UI-messenger exclusion tests.
- Do not add route capabilities yet.

Review checkpoint: confirm the hard security boundary.

### 2. Migrate enrollment routes

- Add onboarding setup `messenger.ts`, route wiring, messenger calls, and tests.
- Add restore-vault subtree capabilities and tests.
- Add settings registration capabilities through the settings registry.
- Replace the three legacy enrollment wrappers only after every enrollment
  caller is migrated.

Review checkpoint: validate registration, post-registration authentication,
PRF selection, state refresh, and metrics.

### 3. Migrate passkey removal routes

- Migrate passkey-verified removal on the main security page.
- Migrate password-verified removal on the turn-off subpage.
- Preserve `forceUpdateMetamaskState` and existing pending-state UX.
- Remove the two legacy removal wrappers after both routes are migrated.

Review checkpoint: validate successful removal, fallback to password, errors,
toasts, and metrics.

### 4. Migrate unlock

- Add `ui/pages/unlock-page/messenger.ts`.
- Wire `UNLOCK_ROUTE` with `createRouteWithMessenger`.
- Migrate option generation and unlock to messenger calls.
- Keep the legacy-service action, loading dispatches, state refresh, and
  navigation sequence.

Review checkpoint: verify account initialization and all unlock surfaces.

### 5. Migrate password change

- Add settings password-route capabilities.
- Call the legacy-service password-change action.
- Remove the thin `dispatch(changePasswordWithPasskeyVerification(...))`
  wrapper.
- Preserve the state refresh and vault-key-renewal error handling.

Review checkpoint: verify mutex-backed delegation and renewal enabled/disabled.

### 6. Migrate private-key export

- Add route-local capabilities and top-level route wiring.
- Migrate authentication option generation and account export.
- Keep loading dispatches or move equivalent loading state into the route hook.

Review checkpoint: verify address ordering and secret-handling behavior.

### 7. Add and migrate the seed-phrase export adapter

- Add a typed background service action that preserves current encoding.
- Add capabilities to both seed-reveal routes.
- Migrate the shared verification flow and export calls.
- Keep the raw PasskeyController export action globally excluded.

Review checkpoint: verify primary and non-primary keyrings and decoding.

### 8. Remove legacy transport plumbing

After all call sites are migrated:

- Remove obsolete passkey exports from `ui/store/actions.ts`.
- Remove their tests from `ui/store/actions.test.js`.
- Remove obsolete passkey API bindings from
  `app/scripts/metamask-controller.js`.
- Remove obsolete delegation tests from
  `app/scripts/metamask-controller.actions.test.js`.
- Retain `LegacyBackgroundApiService` unlock and password-change actions.
- Retain Redux selectors and required loading/state-refresh dispatches.

## Test plan

### Per-route unit tests

For each migration:

- Assert the colocated capability list contains exactly the route's actions.
- Mock `useMessenger` or use `createMockRouteMessenger`.
- Assert action name and object-shaped parameters.
- Assert errors propagate through the existing UI error handling.
- Assert loading, metrics, toasts, and navigation remain unchanged.

### Route wiring tests

- Top-level routes: assert `createRouteWithMessenger` receives the correct path,
  element, and capabilities.
- Onboarding nested route: render with a mock UI messenger and verify delegation.
- Settings registry: verify only configured entries receive
  `RouteWithMessenger`.
- Feature subtrees: verify legacy/non-passkey branches render without requiring
  passkey capabilities.

### Background tests

- Keep and extend `legacy-background-api-service.test.ts` for unlock and password
  change.
- Add tests for the JSON-safe seed export adapter.
- Remove `metamask-controller.actions.test.js` coverage only when the
  corresponding legacy API binding is deleted.

### Existing regression suites

Run affected unit tests for:

- Setup passkey and restore vault
- Passkey settings registration/removal
- Unlock page and passkey unlock section
- Change password
- Reveal recovery phrase and reveal seed
- Multichain private-key list
- UI messenger and route messenger

Run relevant E2E coverage:

- `test/e2e/tests/settings/passkey-settings.spec.ts`
- `test/e2e/tests/settings/change-password.spec.ts`
- Passkey wallet unlock coverage

## Completion criteria

- Every migrated call uses a route-scoped messenger.
- Every capability declaration is colocated with and wired to a real route.
- No route receives passkey actions it does not use.
- No plaintext vault-key primitive is exposed to the UI.
- Unlock and password change retain extension orchestration.
- Redux remains the source for controller state reads.
- Obsolete background API bindings and Redux wrappers are removed only after
  their final callers migrate.
