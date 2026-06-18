# Ledger DMK Rollout — Reviewer Knowledge Document

> **Scope:** PRs #43487, #43488, #43489 — a stacked 3-PR series that replaces
> MetaMask's legacy Ledger transport with Ledger's **Device Management Kit
> (DMK)** behind a remote feature flag, with zero behavior change when the flag
> is off.
>
> **Status:** All three PRs are **OPEN** and **stacked**. Review bottom-up.
> Merge bottom-up.

---

## 1. What is this feature, and why?

MetaMask talks to Ledger hardware wallets from the **offscreen document** (MV3
service workers cannot use WebHID). Today that path is the *legacy* handler in
`app/offscreen/hardware-wallets/ledger.ts`, built on
`@ledgerhq/hw-transport-webhid` + `@ledgerhq/hw-app-eth`.

Ledger is deprecating those libraries in favor of the **Device Management Kit**
(DMK) — a new transport layer with better session management, secure-channel
support, and structured error handling. This series swaps the offscreen handler
to a DMK-backed implementation (`LedgerDMKBridgeHandler`) while keeping the
legacy handler as a runtime fallback, **selected by a remote feature flag** so
the rollout is reversible without a ship.

The split into three PRs exists to isolate three independent concerns:

| PR | Concern | Ships user-visible behavior? | Brings new deps? |
|----|---------|------------------------------|------------------|
| #43487 | Router architecture + legacy refactor | **No** (pure refactor; legacy still wired) | No |
| #43488 | Feature flag + runtime mode switching | No (DMK is still a stub) | No |
| #43489 | Real DMK handler + dependencies + EIP-7702 | **Yes** (when flag on) | **Yes** |

---

## 2. How the PRs connect (the stack)

```
main
 └── #43487  feat/ledger-offscreen-router   ← base: main            (merge 1st)
      └── #43488  feat/ledger-dmk-flag       ← base: #43487          (merge 2nd)
           └── #43489  feat/ledger-dmk-real   ← base: #43488          (merge 3rd)
```

- **#43487** stands alone on `main`. It can merge independently and changes no
  Ledger behavior (the DMK handler it adds is a stub that delegates to legacy).
- **#43488** depends on #43487's router. It adds the `ledgerDmk` flag and the
  hot-swap wiring, but with the flag **off by default** the offscreen still
  runs legacy end-to-end.
- **#43489** depends on #43488. It replaces the stub with the real DMK handler,
  bumps `@metamask/eth-ledger-bridge-keyring` to a preview build, and adds the
  `@ledgerhq/*` + `rxjs` dependencies.

**Practical implication for review:** review in stack order. If you want to see
the *final* shape of any one file, check it out from the top of the stack
(`feat/ledger-dmk-real`), because earlier PRs touch the same files and the
later PRs finish them.

---

## 3. Architecture & message flow (final state, top of stack)

### 3.1 The central router (introduced in #43487)

Before this series, the legacy handler registered its own
`chrome.runtime.onMessage` listener. Now there is **one** listener, owned by
`ledger-router.ts`, which dispatches every `ledger-offscreen` action to
whatever handler is currently "active":

```
  UI / keyring                       background (service worker)
     │                                          │
     │   LedgerOffscreenBridge.#sendMessage()   │
     ▼                                          │
  chrome.runtime.sendMessage({target:'ledger-offscreen', action, params})
     │                                          │
     └────────────► OFFSCREEN DOCUMENT ◄────────┘
                        │
            ┌───────────┴────────────┐
            │  ledger-router.ts      │   <-- single onMessage listener (owns it)
            │  (activeHandler)       │
            └───────────┬────────────┘
                        │ handleAction(action, params)
           ┌────────────┴─────────────┐
           ▼                          ▼
   LedgerLegacyHandler         LedgerDMKBridgeHandler
   (ledger.ts)                 (ledger-dmk.ts)
```

Both handlers implement the same `LedgerHandler` interface:

```ts
type LedgerHandler = {
  init(skipMessageListener?: boolean): Promise<void>;
  destroy(): Promise<void>;
  handleAction(action: LedgerAction, params?): Promise<unknown>;
};
```

Key contract: a handler is constructed with `skipMessageListener = true` so it
does **not** register its own listener — the router owns the single listener and
calls `handleAction` directly. (The handlers still keep their own
`setupMessageListener` for the non-router / direct-init path.)

### 3.2 Mode selection & hot-swap (introduced in #43488)

The offscreen always **boots as Legacy**. The background decides the real mode
and pushes a `switchLedgerMode` event:

1. **Controller resolves mode** — `MetaMaskController.getLedgerMode()` reads the
   `ledgerDmk` remote feature flag (merging manifest overrides on top) and
   returns `LedgerHandlerMode.DMK` or `.Legacy`.
2. **Background pushes initial mode** — after setup, `background.js` sends one
   `switchLedgerMode` message with the current mode.
3. **Background subscribes to flag changes** —
   `RemoteFeatureFlagController:stateChange` → re-evaluates → sends
   `switchLedgerMode` if it flipped.
4. **Offscreen hot-swaps** — `listenForModeSwitches()` in the router calls
   `switchLedgerHandler(mode)`, which creates the new handler first, **atomically
   swaps** `activeHandler`, re-registers the single listener, then lazily
   destroys the old handler. Switching to the same mode is a no-op.

### 3.3 The flag

- Constant: `ENABLE_DMK_FEATURE_FLAG = 'ledgerDmk'`
  (`shared/lib/hardware-wallets/feature-flags.ts`).
- Shape is **version-gated**:
  `{ enabled, featureVersion, minimumVersion }`. `getBooleanFeatureFlag` returns
  `true` only when `enabled: true` **and** the current extension version is
  `>= minimumVersion`. Production default is the disabled variant.
- Registered with the CI feature-flag analyzer in
  `.github/scripts/known-feature-flag-constants.mts` and in the E2E registry
  (`test/e2e/feature-flags/feature-flag-registry.ts`).
- UI selector `getIsDmkEnabled` (`ui/selectors/hardware-wallets/feature-flags.ts`)
  for components that need to know the active mode.

---

## 4. PR-by-PR breakdown

### PR #43487 — `refactor(ledger): add offscreen router and refactor legacy handler`

**Goal:** Introduce the router and refactor legacy to the `init/destroy/handleAction` contract. **No behavior change.**

Files:
- `app/offscreen/hardware-wallets/ledger-router.ts` (**new**, ~203 LOC) — central
  listener, `initLedger`, `switchLedgerHandler`, `bootstrapLedger`.
- `app/offscreen/hardware-wallets/ledger-router.test.ts` (**new**) — unit tests
  incl. race-condition coverage.
- `app/offscreen/hardware-wallets/ledger-dmk.ts` (**new stub**) —
  `LedgerDMKBridgeHandler` that **delegates to legacy** (so the router can be
  exercised in DMK mode without DMK deps). `serializeLedgerError` lives here and
  is the canonical error serializer for the whole stack.
- `app/offscreen/hardware-wallets/ledger.ts` — legacy handler refactored into the
  `LedgerLegacyHandler` class with `init/destroy/handleAction`.
- `app/offscreen/offscreen.ts` — entry point now calls `bootstrapLedger()` with a
  timeout (`OFFSCREEN_LEDGER_INIT_TIMEOUT`) so a hung Ledger init can't block the
  offscreen boot.
- `app/scripts/lib/offscreen-bridge/ledger-offscreen-bridge.ts` —
  response/error shape normalized to `{ success, payload }`.
- `shared/constants/offscreen-communication.ts` — adds `LedgerHandlerMode` and
  `signEip7702Authorization` action.
- LavaMoat webpack policy bumps.

**What to scrutinize:** the atomic-swap sequence in `switchLedgerHandler`
(create new → swap → destroy old) and the `initInProgress` race guard — these are
the load-bearing concurrency bits. Confirm **no double-listener** and **no message
loss window** during swap.

---

### PR #43488 — `feat(ledger): wire ledgerDmk flag to offscreen mode switching`

**Goal:** Wire the remote flag to runtime mode selection. **DMK is still the stub** from #43487, so even with the flag on, behavior is legacy. Off by default.

Files:
- `shared/lib/hardware-wallets/feature-flags.ts` (**new**) —
  `ENABLE_DMK_FEATURE_FLAG` constant + doc of the flag shape.
- `ui/selectors/hardware-wallets/feature-flags.ts` (**new**) — `getIsDmkEnabled`
  reselect selector (merges manifest overrides).
- `ui/selectors/hardware-wallets/feature-flags.test.ts` (**new**) — selector tests.
- `app/scripts/metamask-controller.js` — `getLedgerMode()` method + registers it
  on the controller API.
- `app/scripts/metamask-controller.test.js` — `getLedgerMode` tests.
- `app/scripts/background.js` — pushes initial `switchLedgerMode` and subscribes
  to `RemoteFeatureFlagController:stateChange`.
- `app/offscreen/hardware-wallets/ledger-router.ts` — `listenForModeSwitches()`
  + bootstrap-defaults-to-Legacy + race guards.
- `app/offscreen/hardware-wallets/ledger-router.test.ts` — mode-switch tests.
- `shared/constants/offscreen-communication.ts` — `switchLedgerMode` event +
  `OFFSCREEN_LEDGER_INIT_TIMEOUT`.
- `.github/scripts/known-feature-flag-constants.mts` — CI registry entry.
- `test/e2e/feature-flags/feature-flag-registry.ts` — E2E registry entry.

**What to scrutinize:** the bootstrap race — the offscreen registers
`listenForModeSwitches()` **before** `initLedger(Legacy)` so it can't miss a
`switchLedgerMode` that arrives during boot. Verify the `switchLedgerHandler`
guards (init-in-flight, "no active handler yet → default to Legacy") match the
documented Bug-1/timeout fallback comments.

---

### PR #43489 — `feat(ledger): implement DMK offscreen handler and dependencies`

**Goal:** Ship the real DMK handler. This is the only PR that changes Ledger
behavior (flag-gated) and the only one that touches dependencies.

Files:
- `app/offscreen/hardware-wallets/ledger-dmk.ts` — **stub replaced with the real
  `LedgerDMKBridgeHandler`** (~494 LOC): session lifecycle, device discovery via
  `listenToAvailableDevices`, secure-channel readiness wait, disconnect teardown,
  `handleAction` switch (makeApp/updateTransport/getPublicKey/sign*/EIP-7702).
- `app/offscreen/hardware-wallets/ledger-dmk.test.ts` (**new**) — unit tests with
  a Jest virtual mock for the ESM-only
  `@ledgerhq/device-transport-kit-web-hid`.
- `app/scripts/lib/offscreen-bridge/ledger-offscreen-bridge.ts` — wires the new
  EIP-7702 delegation action through the bridge.
- `ui/store/actions.ts` — `getLedgerMode()` UI action.
- `ui/contexts/hardware-wallets/adapters/LedgerAdapter.ts` — structured
  `console.error` diagnostics on connect/readiness failures.
- `ui/contexts/hardware-wallets/rpcErrorUtils.ts` — maps
  "receiving end does not exist" / offscreen-unavailable errors to a
  `ConnectionTransportMissing` hardware-wallet error.
- `shared/constants/keyring.ts` — **adds Ledger to
  `KEYRING_TYPES_SUPPORTING_7702`** (enables EIP-7702 delegation for Ledger).
- `shared/constants/offscreen-communication.ts` — minor additions.
- `package.json` + `yarn.lock` — dependency changes (see §5).

**What to scrutinize:** device discovery uses
`listenToAvailableDevices` (not `requestDevice`) because the offscreen has no
user gesture — make sure the 15s `DEVICE_DISCOVERY_TIMEOUT_MS` and
`normalizeDiscoveryError` path are sane. The session-readiness filter waits for
`ReadyWithoutSecureChannel`/`ReadyWithSecureChannel` + `currentApp` before
resolving — confirm this matches `@metamask/eth-ledger-bridge-keyring` preview
expectations. EIP-7702 keyring constant change is a behavior addition.

---

## 5. Dependency changes (only in #43489)

```diff
+ "@ledgerhq/context-module": "^2.0.0"
+ "@ledgerhq/device-management-kit": "^1.5.0"
+ "@ledgerhq/device-signer-kit-ethereum": "^1.16.0"
+ "@ledgerhq/device-transport-kit-web-hid": "^1.2.3"
+ "rxjs": "7.8.2"
- "@metamask/eth-ledger-bridge-keyring": "^12.1.0"
+ "@metamask/eth-ledger-bridge-keyring": "npm:@metamask-previews/eth-ledger-bridge-keyring@12.1.0-52bd218"
```

Notes for review:
- **`eth-ledger-bridge-keyring` is pinned to a `@metamask-previews` build.**
  This is intentional for the rollout; confirm the team has a plan to move it to
  a stable release before the flag goes GA.
- **`rxjs` is added as a top-level dependency** (DMK is observable-based).
  Pinned to an exact `7.8.2`.
- #43487 already bumps LavaMoat webpack policies; #43489 should also regenerate
  LavaMoat + attributions for the new `@ledgerhq/*` packages (verify they're in
  the diff before merge — AGENTS.md requires it for dep changes).

---

## 6. Cross-cutting risk areas (read these once, applies to whole stack)

1. **Concurrency in the router.** The atomic create→swap→destroy in
   `switchLedgerHandler` and `initLedger`, plus `initInProgress`, are the most
   subtle code in the series. Trace the bootstrap path: listener-first, then
   Legacy init, then background pushes real mode. Watch for double-Legacy-handler
   creation if a `switchLedgerMode` arrives mid-init.
2. **Single-listener ownership.** Make sure no path registers a second
   `chrome.runtime.onMessage` listener for `ledger-offscreen` (would cause
   duplicate action handling). Handlers must be constructed with
   `skipMessageListener = true` when owned by the router.
3. **Offscreen ↔ service-worker timing.** The `switchLedgerMode` push can race
   offscreen creation. The timeout-gated `bootstrapLedger()` and the
   pre-`initLedger` `listenForModeSwitches()` are the defenses — verify both.
4. **Error serialization across the message boundary.** `serializeLedgerError`
   converts known APDU status codes (e.g. `0x6985` user rejection) into a
   structured `HardwareWalletError` shape. Both handlers must round-trip errors
   through the same `{ success, payload: { error } }` envelope.
5. **LavaMoat + attributions.** New `@ledgerhq/*` deps require policy +
   attribution regeneration (AGENTS.md mandate). The preview keyring redirect
   (`npm:@metamask-previews/...`) can surprise LavaMoat — confirm policies
   resolved it.

---

## 7. Review & merge strategy

- **Review order:** #43487 → #43488 → #43489 (stack order).
- **Merge order:** same. Each PR rebases automatically onto the previous as it lands.
- **What "works" after each merge:**
  - After #43487: Ledger works exactly as before, via the new router → legacy handler.
  - After #43488: same, plus the flag plumbing exists (flag off → legacy).
  - After #43489: toggling `ledgerDmk` on (via `.manifest-overrides.json` or LaunchDarkly) routes through the real DMK handler.
- **Suggested manual verification (top of stack):** connect a Ledger, confirm
  unlock / get-public-key / sign-tx / sign-message / sign-typed-data under
  Legacy; flip the flag; repeat under DMK; flip back; confirm it returns to
  Legacy without an extension reload. If testing EIP-7702, confirm delegation
  authorization signs on-device.

---

## 8. Quick file index (top of stack)

| Area | File |
|------|------|
| Router (single listener, swap logic) | `app/offscreen/hardware-wallets/ledger-router.ts` |
| Legacy handler | `app/offscreen/hardware-wallets/ledger.ts` |
| DMK handler | `app/offscreen/hardware-wallets/ledger-dmk.ts` |
| Offscreen entry point | `app/offscreen/offscreen.ts` |
| Shared enums/modes/actions | `shared/constants/offscreen-communication.ts` |
| Flag constant | `shared/lib/hardware-wallets/feature-flags.ts` |
| UI flag selector | `ui/selectors/hardware-wallets/feature-flags.ts` |
| Controller mode resolver | `app/scripts/metamask-controller.js` (`getLedgerMode`) |
| Background push + subscribe | `app/scripts/background.js` |
| Message bridge (UI/keyring ↔ offscreen) | `app/scripts/lib/offscreen-bridge/ledger-offscreen-bridge.ts` |
| UI adapter diagnostics | `ui/contexts/hardware-wallets/adapters/LedgerAdapter.ts` |
| UI error mapping | `ui/contexts/hardware-wallets/rpcErrorUtils.ts` |
| EIP-7702 keyring gate | `shared/constants/keyring.ts` |
| CI flag registry | `.github/scripts/known-feature-flag-constants.mts` |
| E2E flag registry | `test/e2e/feature-flags/feature-flag-registry.ts` |
