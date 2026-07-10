# QrSync E2E — Mock transport design

> **Status:** ✅ Complete (Phase 0.2)  
> **Parent plan:** [E2E_SETUP_PLAN.md](./E2E_SETUP_PLAN.md)  
> **Next phase:** [Phase 1 — Build & feature flags](./E2E_SETUP_PLAN.md#phase-1--build--feature-flags)

---

## Plain-language summary

**Problem:** E2E tests run in Node on your machine; the extension runs in Chrome. They
cannot share memory. We need a fake “mobile phone” that sends the right signals to
the extension during a test.

**Solution:** In **test builds only**, replace the real internet relay connection with
a **fake MWP client** inside the extension. A **mobile simulator** (also inside the
extension) pretends to be MetaMask Mobile. The E2E test tells the simulator what to
do next over an existing test WebSocket (port 8111).

**What stays real:** Extension UI, `QrSyncController`, password export, phase
transitions, timers (shortened in test builds).

**What is fake:** Network relay, phone app, encryption over the wire.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│  E2E test (Node / Mocha)                                        │
│    driver → clicks UI                                           │
│    QrSyncE2eBridge.send({ action: 'deliverSyncOffer' })         │
└────────────────────────────┬────────────────────────────────────┘
                             │  ws://localhost:8111
                             │  (existing background-socket)
┌────────────────────────────▼────────────────────────────────────┐
│  Extension background (test build only, IN_TEST)              │
│                                                                 │
│  QrSyncController  →  E2eMwpMockClient  ←  MobileWalletSimulator│
│       (real)            (fake MWP)              (scripts mobile) │
└─────────────────────────────────────────────────────────────────┘
```

### Why not a shared `MockQrSyncTransport` in the E2E folder only?

`QrSyncController` runs in the **browser background**, not in Node. A transport
object created in `test/e2e/` never reaches the controller. The mock must be
**bundled into the test build** and controlled via the **background socket bridge**
(pattern already used for tab queries in `test/e2e/background-socket/`).

### Why not keep the real `DappClient`?

The real client expects encrypted handshake traffic over Centrifuge. Faking that
without a real relay means reimplementing wallet-side crypto. Unit tests already
avoid this by mocking `DappClient` events directly. E2E uses the same idea, but
through a **test-only client** with the same public surface `QrSyncController`
uses — so the controller and UI stay production-faithful.

We still call this the **“mock transport layer”** in planning docs because it
replaces the relay; the implementation is an **`E2eMwpMockClient`** plus simulator.

---

## Components

### 1. `E2eMwpMockClient` (extension, test build only)

**Location:** `app/scripts/controllers/qr-sync/e2e/e2e-mwp-mock-client.ts`

**Role:** Drop-in stand-in for `DappClient` with the subset of API used by
`QrSyncController`:

| Method / event | Used for |
|----------------|----------|
| `connect({ mode, initialPayload })` | `createSession()` |
| `sendRequest(payload)` | `sync-ready`, `sync-cancel`, `sync-error` |
| `on('session_request', …)` | QR payload |
| `on('otp_required', …)` | OTP screen |
| `on('message', …)` | `sync-offer`, `sync-completed`, `sync-cancel`, `sync-error` |
| `on('connected' / 'disconnected' / 'error', …)` | Connection lifecycle |
| `off` / `removeListener` | `#unregisterClientEventHandlers` |

**Behaviour:** Thin `EventEmitter` — no WebSocket, no encryption. Delegates
scenario timing to `MobileWalletSimulator`.

**Reference implementation:** Mock helpers in
`app/scripts/controllers/qr-sync/qr-sync-controller.test.ts`:
`mockEmitSessionRequest`, `mockEmitOtpRequired`, `mockEmitSyncOffer`,
`mockEmitSyncCompleted`.

---

### 2. `MobileWalletSimulator` (extension, test build only)

**Location:** `app/scripts/controllers/qr-sync/e2e/mobile-wallet-simulator.ts`

**Role:** Scripts “what mobile does next” by driving `E2eMwpMockClient` events.

**State it tracks:**

- `sessionId` — from last `session_request`
- `otp` — default `123456` (configurable per scenario)
- `otpDeadline` — `Date.now() + OTP_TTL_MS`
- `isConnected` — after OTP handshake completes
- `lastSyncReadyPayload` — optional, for assertions when extension sends export

**Core methods:**

```ts
type QrSyncSimulatorAction =
  | 'mobileScanned'      // → session_request already fired by connect; emit otp_required
  | 'deliverSyncOffer'
  | 'deliverSyncCompleted'
  | 'deliverSyncCancel'
  | 'deliverSyncError'
  | 'reset';

class MobileWalletSimulator {
  constructor(client: E2eMwpMockClient);

  /** Attach to client; called once from factory. */
  bind(): void;

  /** Run a named scenario step (invoked from E2E bridge). */
  runAction(action: QrSyncSimulatorAction, params?: SimulatorParams): void;

  /** Read-only snapshot for debugging / assertions in background. */
  getState(): SimulatorState;
}
```

**`SimulatorParams` (per action):**

```ts
type SimulatorParams = {
  otp?: string;                    // default '123456'
  isOnboardingCompleted?: boolean; // sync-offer, default true
  sessionId?: string;
  errorMessage?: string;           // sync-error
};
```

---

### 3. `QrSyncE2eBridge` (split: extension + Node)

**Extension handler** — `app/scripts/controllers/qr-sync/e2e/qr-sync-e2e-bridge.ts`

- Registered when `process.env.IN_TEST === 'true'`
- Extends `SocketBackgroundToMocha.receivedMessage` with `command: 'qrSyncSimulate'`
- Forwards `{ action, params }` to singleton `MobileWalletSimulator`

**Node helper** — `test/e2e/tests/qr-sync/qr-sync-e2e-bridge.ts`

```ts
export async function qrSyncSimulate(
  action: QrSyncSimulatorAction,
  params?: SimulatorParams,
): Promise<void> {
  getServerMochaToBackground().send({
    command: 'qrSyncSimulate',
    action,
    params,
  });
}
```

**Type extension** — `test/e2e/background-socket/types.ts`:

```ts
command: ... | 'qrSyncSimulate';
action?: QrSyncSimulatorAction;
params?: SimulatorParams;
```

---

### 4. Factory & injection

**Location:** `app/scripts/controllers/qr-sync/e2e/create-e2e-mwp-stack.ts`

```ts
export async function createE2eMwpStack(): Promise<{
  transport: null;
  sessionStore: null;
  dappClient: E2eMwpMockClient;
}> {
  const client = new E2eMwpMockClient();
  const simulator = new MobileWalletSimulator(client);
  simulator.bind();
  registerQrSyncE2eBridge(simulator);
  return { transport: null, sessionStore: null, dappClient: client };
}
```

**Controller change (Phase 3):** Extract `#initialize()` MWP construction behind
`#createMwpStack()`:

```ts
// qr-sync-controller.ts — new optional constructor bag
type QrSyncControllerInitOptions = {
  // ...existing
  createMwpStack?: () => Promise<{
    transport: WebSocketTransport | null;
    sessionStore: ISessionStore | null;
    dappClient: DappClient | E2eMwpMockClient;
  }>;
};
```

**Init wiring** — `qr-sync-controller-init.ts`:

```ts
import { createE2eMwpStack } from '../controllers/qr-sync/e2e/create-e2e-mwp-stack';

const messengerClient = new QrSyncController({
  messenger: controllerMessenger,
  keyManager: new KeyManager(),
  relayUrl: RELAY_URL,
  state: persistedState.QrSyncController,
  ...(process.env.IN_TEST === 'true'
    ? { createMwpStack: createE2eMwpStack }
    : {}),
});
```

Production builds: unchanged — real `WebSocketTransport` + `DappClient`.

---

## Happy path — step by step

| # | Extension phase | User / driver | E2E `qrSyncSimulate` | Simulator / client behaviour |
|---|-----------------|---------------|----------------------|------------------------------|
| 1 | `idle` → `displaying-qr` | Open Add device | — | `connect()` → emit `session_request` (QR payload) |
| 2 | `displaying-qr` | — | `mobileScanned` | Emit `otp_required` with `submit` that resolves on correct OTP |
| 3 | `awaiting-otp-input` | Type `123456` | — | `submitOtp` → `submit('123456')` → phase → `awaiting-sync-offer` |
| 4 | `awaiting-sync-offer` | — | `deliverSyncOffer` | Emit `connected` if needed, then `message` sync-offer |
| 5 | `reviewing-sync-offer` | Enter password, confirm wallet | — | `syncAccounts` → `sendRequest` sync-ready (assert optional) |
| 6 | `awaiting-sync-completion` | — | `deliverSyncCompleted` | Emit `message` sync-completed |
| 7 | `completed` | See success, click Done | — | — |

**Default OTP:** `123456` (`test/e2e/tests/qr-sync/constants.ts`).

**Session ID:** Generated per `connect()`; sync-offer uses same id (mirrors unit test
`TEST_SESSION_ID` pattern).

---

## `E2eMwpMockClient.connect()` sequence (happy path)

Mirrors unit test `mockStartSession` + `mockEmitOtpRequired` without waiting for
real wallet:

```text
1. emit session_request { id, channel, mode: 'untrusted', publicKeyB64, expiresAt }
2. resolve connect() promise when simulator runs mobileScanned:
   a. emit otp_required { submit, cancel, deadline }
3. submit(otp) called from controller submitOtp:
   a. validate otp === expected (timing-safe compare)
   b. resolve submit promise
4. (after deliverSyncOffer) consider client connected
```

**Note:** Real `DappClient.connect()` only resolves after full handshake. Mock should
resolve `connect()` after OTP submit succeeds (when `#registerClientEventHandlers`
expects connected flow). Align with when controller calls `createSession` finally block
— see unit test `mockStartSession` which resolves createSession after session_request
only; OTP happens later. **Match unit test behaviour exactly** during Phase 3
implementation.

---

## Scenario catalogue

### v1 (first E2E spec)

| Scenario ID | Actions | Expected end phase |
|-------------|---------|-------------------|
| `happy-path-single-wallet` | connect → mobileScanned → deliverSyncOffer → deliverSyncCompleted | `completed` |

### v2 (later specs — simulator already supports via actions)

| Scenario ID | Key actions | Expected |
|-------------|-------------|----------|
| `otp-invalid` | mobileScanned, user enters wrong OTP | `awaiting-otp-input` + error |
| `sync-offer-timeout` | mobileScanned, OTP ok, **no** deliverSyncOffer, wait | `failed` / `SESSION_EXPIRED` |
| `sync-completion-timeout` | … deliverSyncOffer, sync, **no** deliverSyncCompleted | `failed` |
| `peer-cancel` | deliverSyncCancel after offer | `cancelled` |
| `premature-sync-offer` | deliverSyncOffer before OTP | ignored / error per controller |

---

## Test constants

**File:** `test/e2e/tests/qr-sync/constants.ts`

```ts
export const QR_SYNC_E2E_OTP = '123456';
export const QR_SYNC_E2E_SESSION_TTL_MS = 60_000; // overridden when Phase 2 shortens IN_TEST timeouts
```

---

## File map (Phase 3 targets)

```text
app/scripts/controllers/qr-sync/e2e/
├── e2e-mwp-mock-client.ts          # E2eMwpMockClient
├── mobile-wallet-simulator.ts      # MobileWalletSimulator
├── create-e2e-mwp-stack.ts         # factory + simulator singleton
├── qr-sync-e2e-bridge.ts           # background socket handler (extension)
└── types.ts                        # QrSyncSimulatorAction, SimulatorParams

test/e2e/tests/qr-sync/
├── constants.ts
├── qr-sync-e2e-bridge.ts           # Node-side qrSyncSimulate() helper
└── scenarios/
    └── happy-path.ts               # ordered action list (documentation + helper)

test/e2e/background-socket/
├── types.ts                        # extend MessageType
└── socket-background-to-mocha.ts   # route qrSyncSimulate command
```

---

## Implementation checklist (Phase 3 — do not start until Phase 1–2 done)

- [ ] 3.1 `E2eMwpMockClient` + unit tests (colocated `.test.ts`)
- [ ] 3.2 `MobileWalletSimulator` + unit tests
- [ ] 3.3 `createE2eMwpStack` + bridge registration
- [ ] 3.4 Extend background socket types + handler
- [ ] 3.5 `QrSyncController` `#createMwpStack` injection
- [ ] 3.6 `qr-sync-controller-init.ts` IN_TEST wiring
- [ ] 3.7 Node `qrSyncSimulate` helper
- [ ] 3.8 Smoke: manual `qrSyncSimulate` sequence in test build (no UI yet)

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Mock client drifts from real `DappClient` | Keep method list synced with `QrSyncController`; copy event shapes from unit test mocks |
| `connect()` resolve timing differs from production | Document and match unit test ordering; add controller integration test |
| Background socket not connected when test runs | Wait for socket in `withFixtures` or retry `qrSyncSimulate` (pattern from snap tests) |
| `IN_TEST` code in production bundle | Tree-shake / dead-code eliminate in prod builds; files under `e2e/` subfolder |

---

## Out of scope for this design

- Real `WebSocketTransport` / Centrifugo (see [PHASE_0_PROTOCOL_NOTES.md](./PHASE_0_PROTOCOL_NOTES.md))
- Asserting encrypted payload contents in `sync-ready`
- MetaMask Mobile app UI

---

## References

- Unit test mocks: `app/scripts/controllers/qr-sync/qr-sync-controller.test.ts`
- Controller: `app/scripts/controllers/qr-sync/qr-sync-controller.ts`
- Background socket: `test/e2e/background-socket/`
- QrSync message types: `app/scripts/controllers/qr-sync/constants.ts`
