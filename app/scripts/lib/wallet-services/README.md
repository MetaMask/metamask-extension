# wallet-services/

Cross-client wallet logic extracted from `MetamaskController`.

## Boundary rule

Modules in this directory **must not** import or reference `chrome.*` or
`browser.*` APIs. All controller access goes through the `controllerMessenger`
(messenger actions and events). Direct controller references are forbidden.

This constraint is what makes these modules portable — they can run in the
extension background, a mobile engine, or a future shared runtime without
modification.

## Dependency pattern

Each module receives its dependencies at call time:

```ts
type ModuleDependencies = {
  registry: ControllerRegistry;
  messenger: RootMessenger;
};
```

Functions are exported at the module level (no classes) so they compose
easily and are trivial to unit-test with injected fakes.

## Promotion path

Once a module stabilises it can be extracted to a `@metamask/*` package and
shared with `metamask-mobile` directly. The boundary rule is what makes that
extraction safe — there are no platform APIs to untangle.

## Modules

| Module | Responsibility |
|---|---|
| `vault-management/` | Keyring unlock, vault creation/restore, password verification |
| `account-management/` | Account selection, labelling, removal |
| `permission-management/` | Approval resolution, permission grants/revocations |
| `transaction-lifecycle/` | Transaction submission, cancellation, speed-up |
| `token-resolution/` | Token standard detection, symbol/decimal lookup |
| `snap-management/` | Snap install, enable/disable, request handling |

## Extension-specific modules (sibling directories)

| Module | Responsibility |
|---|---|
| `../connection-manager/` | Active port/stream lifecycle (holds `chrome.runtime.Port` refs) |
| `../session-manager/` | Login token storage via `chrome.storage.session` |
| `../controller-subscriptions/` | UI-sync subscription wiring |
