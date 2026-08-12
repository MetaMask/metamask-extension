# Passkey UI Messenger Migration Plan

## Status

Steps 1 and 2 are complete: the global blocked list and enrollment route
migrations are implemented and tested. Steps 2.5 and 2.6 consolidate both the
enrollment transport and WebAuthn ceremony orchestration in a reusable hook.
Step 3 migrates both passkey-removal settings routes. Step 4 migrates passkey
unlock across the standard and onboarding unlock routes. Work is paused for
review before Step 5.

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
3. A focused reusable hook when the same messenger actions are called by
   multiple consumers; otherwise, a typed `useMessenger` call in the consumer.
4. Tests for the hook/action call and route wiring.
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

Put reusable messenger-action hooks under `ui/hooks/passkey/`. Hooks define only
the minimum `RouteMessenger<...>` action union they need; they do not define or
grant route capabilities. Every parent route must still explicitly delegate the
actions used by its hooks.

Hooks should:

- Wrap repeated action names and parameter-shape conversion.
- Return stable callbacks using `useCallback`.
- Preserve controller error propagation.
- Contain transport-level preparation shared by every caller, such as the PRF
  support check before generating registration options.
- Avoid metrics, navigation, toasts, loading presentation, and WebAuthn ceremony
  sequencing when those differ between product flows.

Do not create one broad `usePasskeyController` hook containing every action.
Use focused hooks so a component cannot accidentally appear to have
capabilities its route did not delegate.

### Enrollment hook

Before Step 3, extract the messenger calls currently duplicated by
`SetupPasskeyContent` and `PasskeyRegisterSubPage` into:

```text
ui/hooks/passkey/usePasskeyEnrollment.ts
ui/hooks/passkey/usePasskeyEnrollment.test.ts
```

The hook should expose stable callbacks equivalent to:

- `generateRegistrationOptions()`
  - Checks `isPasskeyPRFSupported`.
  - Calls `PasskeyController:generateRegistrationOptions` with
    `{ prfAvailable }`.
- `generatePostRegistrationAuthenticationOptions(registrationResponse)`
  - Calls the controller with `{ registrationResponse }`.
- `protectVaultKeyWithPasskey(params)`
  - Calls the controller with the existing object-shaped registration,
    authentication, and optional-password parameters.

The components continue to own:

- Enrollment-step UI state.
- Metrics and Sentry context.
- `forceUpdateMetamaskState`.
- Toasts and navigation.

### Future hooks added just in time

Add these only when their migration step begins:

- Step 3: focused authentication-option and passkey-removal hooks.
- Step 4: unlock hook that calls
  `LegacyBackgroundApiService:unlockWithPasskey`.
- Step 5: password-change hook that calls the mutex-protected legacy service.
- Step 6: private-key export hook.
- Step 7: JSON-safe seed-phrase export hook.

If a future action has only one caller and a hook adds no meaningful
abstraction, keep a typed `useMessenger` call in that route instead.

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

### 2.5. Refactor enrollment messenger calls into a reusable hook

- Add `usePasskeyEnrollment` and its colocated unit test.
- Move the three repeated enrollment messenger calls and PRF capability check
  into the hook.
- Update `SetupPasskeyContent` and `PasskeyRegisterSubPage` to use the hook.
- Keep route-local capability declarations unchanged.
- Keep ceremony sequencing, metrics, Sentry handling, state refresh, toasts,
  and navigation in the components.
- Verify the hook uses exact action names and object-shaped parameters.
- Verify PRF-supported, PRF-unsupported, success, and error propagation cases.

Review checkpoint: confirm the hook removes transport duplication without
broadening any route's capabilities or changing enrollment behavior.

### 2.6. Consolidate enrollment ceremony orchestration

- Expand `usePasskeyEnrollment` with one `enrollWithPasskey` operation.
- Move registration, post-registration authentication, vault protection, and
  WebAuthn ceremony sequencing into the hook.
- Report `register`, `verify`, and `enroll` stage changes to callers so they
  retain control of UI state, metrics, and error context.
- Cancel an active ceremony when the hook unmounts.
- Mock the enrollment hook—not route messenger internals—in component tests.
- Keep route capability allowlists explicit and route-local.
- Keep state refresh, metrics, Sentry reporting, toasts, and navigation in the
  components.

Review checkpoint: confirm ceremony sequencing has one implementation while
flow-specific behavior remains in each component.

### 3. Migrate passkey removal routes

- Migrate passkey-verified removal on the main security page.
- Migrate password-verified removal on the turn-off subpage.
- Preserve `forceUpdateMetamaskState` and existing pending-state UX.
- Remove the passkey-verified legacy wrapper after its final caller migrates.
- Keep the password-verified legacy wrapper temporarily because the
  change-password flow still uses it; remove it in Step 5 after that caller
  migrates.

Review checkpoint: validate successful removal, fallback to password, errors,
toasts, and metrics.

### 4. Migrate unlock

- Add `ui/pages/unlock-page/messenger.ts`.
- Wire `UNLOCK_ROUTE` with `createRouteWithMessenger` and wrap the onboarding
  unlock route with the same narrowly scoped capabilities.
- Add `usePasskeyUnlock` to own authentication-option generation, WebAuthn,
  the legacy-service unlock call, loading state, and background-state refresh.
- Keep the legacy-service action, loading dispatches, state refresh, and
  navigation sequence.
- Remove the obsolete `tryUnlockMetamaskWithPasskey` Redux thunk.

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

### Reusable hook tests

- Mock `useMessenger` or use `createMockRouteMessenger`.
- Assert exact action names and parameter objects.
- Assert callbacks remain stable across rerenders.
- Cover shared preparation logic such as PRF support detection.
- Assert controller errors are not swallowed or translated by transport hooks.
- Keep route-capability assertions in route tests, not hook tests.

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
- Repeated messenger action calls use focused hooks without owning route
  capabilities.
- No route receives passkey actions it does not use.
- No plaintext vault-key primitive is exposed to the UI.
- Unlock and password change retain extension orchestration.
- Redux remains the source for controller state reads.
- Obsolete background API bindings and Redux wrappers are removed only after
  their final callers migrate.
