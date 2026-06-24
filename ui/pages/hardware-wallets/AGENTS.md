# Hardware Wallet Signing Flow (Batch + Sequential)

## Overview

Hardware wallet bridge/swap transactions use one of two tracking paths depending on whether Smart Transactions (STX) are enabled:

- **Batch path** (STX enabled): `addTransactionBatchWithHook` creates two transactions sharing a `batchId`, signed sequentially, submitted as a bundle via `sendBundle`.
- **Sequential path** (STX disabled): `addTransaction` creates approval and trade as independent transactions with no `batchId`, submitted sequentially via standard `eth_sendRawTransaction`.

The `hardware-wallet-signatures.tsx` component selects the appropriate tracker at render time using `getIsStxEnabled`.

## Path Selection

```
hardware-wallet-signatures.tsx
  │
  ├── useSelector(getIsStxEnabled) → isStxEnabled
  │
  └── useHwSignTracker({ isStxEnabled })
        │
        ├── isStxEnabled  → new BatchTrackingStrategy()      (tracks by batchId)
        └── !isStxEnabled → new SequentialTrackingStrategy() (tracks by tx ID)

        cancelCurrentBatch delegates to the active strategy
```

A single `useHwSignTracker` hook is called once. It instantiates `BatchTrackingStrategy` (STX enabled) or `SequentialTrackingStrategy` (STX disabled) based on `isStxEnabled`. Only the active strategy subscribes to `TransactionController` events; the other is unused.

## Full Submission Flow

```
User clicks swap (STX enabled, HW wallet, approval needed)
  │
  ▼
useHwSwapQuoteData
  Latches activeQuote → lockedQuoteRef (survives quote list clearing)
  All rendering and effects use lockedQuote
  │
  ▼
useHwSwapSubmission — Auto-submit effect
  New quote requestId → Reset state machine, clear hasStarted
  hasStarted=false && lockedQuote → submitActiveQuote()
  │
  ▼
useSubmitBridgeTransaction — submitBridgeTransaction(quote)
  │
  │  isHardwareWalletAccount && connectionState !== Ready?
  │    → ensureDeviceReady()
  │      • connect() if adapter not connected
  │      • getFeatures, checkApp, blindSigning preflight
  │    → FAILED? throw → return (no batch created)
  │
  │  Intent data + HW wallet? → onHardwareWalletFailed (intent not supported)
  │
  │  Not on signing page? → navigateToHwSigningPage()
  │
  │  dispatch(submitBridgeTx(...))
  │
  │  User rejection → onHardwareWalletRejected callback
  │  Other error → onHardwareWalletFailed callback
  │  Success → onHardwareWalletSubmitted callback
  │
  ▼
BridgeStatusController.submitTx (background)
  │
  ├─ STX enabled → batch path (see below)
  │
  └─ STX disabled → sequential path (see below)

### Batch Path (STX enabled)

handleEvmTransactionBatch → addTransactionBatch
  │
  ▼
bridge-status-controller-init.ts addTransactionBatchFn wrapper
  │  HW wallet → disable7702=true, clears gas sponsorship flags
  │
  ▼
TransactionController.addTransactionBatch → addTransactionBatchWithHook
  │  Creates TWO transactions individually via addTransaction:
  │    1. type=bridgeApproval/swapApproval (unapproved, with batchId)
  │    2. type=bridge/swap (unapproved, with batchId, held by publishHook)
  │
  ▼
┌─────────────────── SIGNING PAGE ───────────────────┐
│                                                     │
│  State Machine: AwaitingFirstSignature              │
│                                                     │
│  Hooks active simultaneously:                       │
│                                                     │
│  BatchTrackingStrategy (STX enabled)                │
│    Subscribes to TransactionController events       │
│    Filters by batchId                               │
│    Detects approval signed → FirstSignatureSubmitted│
│    cancelCurrentBatch() aborts tracked txs          │
│                                                     │
│  SequentialTrackingStrategy (STX disabled)          │
│    Subscribes to TransactionController events       │
│    Tracks by tx ID (no batchId)                     │
│    Detects approval signed → FirstSignatureSubmitted│
│    cancelCurrentBatch() aborts tracked txs          │
│    Clears tracked tx IDs on retry generation change │
│                                                     │
│  useHwSwapConnectionMonitoring                      │
│    Watches connectionState for disconnect/errors    │
│                                                     │
│  useHwSwapConfirmationMonitoring                    │
│    Watches confirmTransaction.txData for mid-sig    │
│    rejection                                        │
│                                                     │
│  useHwSwapQrState                                   │
│    QR wallet inline signing + scan/cancel           │
│                                                     │
│  useHwSwapNavigation                                │
│    Submitted → 1s delay → toast + navigate          │
│                                                     │
│  setSigningInProgress (Trezor WebUSB workaround)    │
│    true while awaiting signature, false on terminal │
│                                                     │
│  Signature stuck timeout (5s)                       │
│    After retry: shows "Resend transaction" button   │
│                                                     │
└─────────────────────────────────────────────────────┘
  │
  ▼
Confirmation system shows tx #1 for HW signing
  │  User signs approve on device → status changes to "signed"
  │
  ▼
BatchTrackingStrategy detects approval signed
  │  Filters: fromAddress match + approval type + status=signed
  │  Dispatches FirstSignatureSubmitted → AwaitingFirstSignature → AwaitingFinalSignature
  │
  ▼
Confirmation system shows tx #2 for HW signing
  │  User signs trade on device → status changes to "signed"
  │
  ▼
BatchTrackingStrategy detects trade signed → TransactionSubmitted
  │
  ▼
useHwSwapNavigation: 1s delay → toast + navigateToDefaultRoute
```

## Retry Flow (Unified)

All retry scenarios (Disconnected, Rejected, Failed) use a single `handleRetry` function with identical logic. There are no separate retry paths.

```
State = Rejected/Failed/Disconnected → User clicks retry button
  │
  ▼
handleRetry (unified):
  isRetryingRef = true           ← blocks stale HW callbacks from old batch
  hasRetriedRef = true           ← enables "Resend transaction" button later
  setIsRetrying(true)
  │
  retryGenerationRef += 1        ← signal BatchTrackingStrategy to stale old batch IDs
  │
  await cancelCurrentBatch()     ← aborts all tracked tx IDs via abortTransactionSigning RPC
  │                               ← waits up to 5s for abort events to settle
  │
  Check connection status:
    Allowed: Connected, Ready, AwaitingConfirmation, ErrorState
    If not allowed → return early (no state dispatch, no retry)
  │
  retryGenerationRef += 1        ← second increment for new batch tracking
  resetConnectionError()         ← clears handledConnectionErrorRef + isDeviceDisconnectedRef
  dispatch Reset(needsTwoConf)   → AwaitingFirst or AwaitingFinal (fresh state)
  │
  await retrySubmission()
    │
    ▼
  submitBridgeTransaction(lockedQuote, { rpcTimeoutMs: 120_000 })
    │  Extended RPC timeout for retries (120s vs default)
    │  ensureDeviceReady() called if connectionState !== Ready
    │
    │  dispatch(submitBridgeTx(...))
    │  → new batch created with new batchId
    │  → old batch events filtered by staleBatchIdsRef
    │
    ▼
  isRetryingRef = false
  setIsRetrying(false)
  │
  ▼
  User signs approve (if needed) → trade → Submitted
```

**Key behaviors:**
- **`cancelCurrentBatch()`** aborts all tracked transactions before retrying. This ensures the old batch is cleanly terminated in the background.
- **`isRetryingRef`** prevents stale HW callbacks (`onHardwareWalletSubmitted`/`Rejected`/`Failed`) from the old batch from transitioning the state machine during the retry.
- **Double `retryGenerationRef` increment**: First increment marks old batch IDs as stale before `cancelCurrentBatch`. Second increment after cancel ensures the new batch's events are correctly tracked.
- **Connection gating**: If the device is not connected (status is `Disconnected`), the retry returns early without dispatching any events. The user must reconnect first.
- **All retries use `Reset`** (not `Retry`). The state machine always returns to the initial state. The `Retry` event exists in the state machine but is **unused** by the current `handleRetry` implementation.

### Signature Stuck Timeout

After the user has retried at least once (`hasRetriedRef.current = true`), if the state machine remains in an awaiting-signature state for more than `SIGNATURE_STUCK_TIMEOUT_MS` (5 seconds), a "Resend transaction" button appears. This allows the user to retry again without waiting for an explicit failure.

The timeout resets when:
- The state leaves awaiting-signature (Submitted/Rejected/Failed/Disconnected)
- A retry is in flight (`isRetrying = true`)

### Cancel Button

The Cancel button always:
1. Calls `cancelCurrentBatch()` to abort tracked transactions
2. Calls `handleQrSignatureCancel()` to reject QR scan if active
3. Navigates back to the bridge page

## State Machine

```
needsTwoConfirmations=true (quote has approval):
  AwaitingFirstSignature ──FirstSignatureSubmitted──▶ AwaitingFinalSignature
                                                       │
                     TransactionSubmitted ◀─────────────┘
                     TransactionRejected → Rejected(rejectedSignature)
                     TransactionFailed → Failed(failedSignature)
                     DeviceDisconnected → Disconnected(disconnectedSignature)

needsTwoConfirmations=false (no approval):
  AwaitingFinalSignature
    TransactionSubmitted → Submitted
    TransactionRejected → Rejected(rejectedSignature)
    TransactionFailed → Failed(failedSignature)
    DeviceDisconnected → Disconnected(disconnectedSignature)

Terminal/resumable states:
  Reset → returns to initial state (AwaitingFirst or AwaitingFinal based on needsTwoConfirmations)
```

The state machine is a pure reducer (`hardwareWalletSignaturesReducer`) with no platform dependencies. See `STATE-MACHINE.md` for the full transition table and diagram.

## Hook Architecture

```
hardware-wallet-signatures.tsx (main component)
  │
  ├── useHwSwapQuoteData
  │     lockedQuote, fromToken, toToken, hardwareWalletType
  │
  ├── useReducer(hardwareWalletSignaturesReducer)
  │     signatureState, dispatchSignatureEvent
  │
  ├── useSubmitBridgeTransaction
  │     submitBridgeTransaction(quote, options?)
  │     options.rpcTimeoutMs: extended timeout for retries (120_000ms)
  │     Always calls ensureDeviceReady() if connectionState !== Ready
  │     Callbacks: onHardwareWalletSubmitted/Rejected/Failed
  │     submitOnHardwareWalletSigningPage=true → returns after callback (no navigation)
  │
  ├── useHwSwapSubmission
  │     Auto-submits on quote change (calls submitBridgeTransaction with no options)
  │     retrySubmission() calls submitBridgeTransaction with { rpcTimeoutMs: 120_000 }
  │     hasStartedSubmission ref prevents double-submission
  │     Resets hasStartedSubmission on error (allows retry)
  │
  ├── useHwSwapConnectionMonitoring
  │     Watches connectionState:
  │       Disconnected → DeviceDisconnected
  │       ErrorState + ConnectionClosed/DeviceDisconnected → DeviceDisconnected
  │       ErrorState + userRejection → TransactionRejected
  │       ErrorState + other → TransactionFailed
  │     isDeviceDisconnectedRef: shared with useHwSwapConfirmationMonitoring to skip events during disconnect
  │     resetConnectionError(): clears both refs for retry
  │
  ├── useHwSwapConfirmationMonitoring
  │     Watches confirmTransaction.txData:
  │       Cleared while signing → TransactionRejected (mid-signature rejection)
  │     Skips if isDeviceDisconnectedRef is true
  │     Resets previousTxId on retryGenerationRef change
  │
  ├── useHwSignTracker
  │     Called once with isStxEnabled; instantiates BatchTrackingStrategy or SequentialTrackingStrategy
  │     Owns cancelCurrentBatch(): aborts tracked txs, waits for settle (5s max)
  │     pendingAbortTxIdsRef: filters events from aborted txs (resolves abort promise)
  │     retryGenerationRef to reset tracking on retries
  │
  │   Active strategy subscribes to 3 TransactionController messenger events:
  │     BatchTrackingStrategy      → filters by batchId, 3-state currentBatchIdRef + staleBatchIdsRef
  │     SequentialTrackingStrategy → tracks tx IDs in a Set (cleared on retry)
  │
  ├── useHwSwapQrState
  │     QR hardware wallet: inline signing, scan/cancel handlers
  │     Resets isReadingQrSignature on requestId change
  │
  ├── useHwSwapNavigation
  │     Submitted → 1s delay → toast + navigateToDefaultRoute
  │     hasNavigatedAfterSubmission ref prevents double-navigation
  │
  ├── setSigningInProgress (Trezor WebUSB workaround)
  │     true while hasStartedSubmission && awaiting-signature
  │     false on terminal states (Submitted/Rejected/Failed/Disconnected)
  │     false on unmount
  │
  └── isRetryingRef + hasRetriedRef + SIGNATURE_STUCK_TIMEOUT_MS
        isRetryingRef: blocks stale HW callbacks during retry
        hasRetriedRef: enables "Resend transaction" button after first retry
        5s timeout: marks signature as stuck → shows resend button
```

## Stale Event Filtering

### Batch Path: `BatchTrackingStrategy`

Uses a 3-state `currentBatchIdRef` to prevent stale events from old batches (created before a retry) from causing false state transitions:

```
┌─────────────┐   first signed event   ┌─────────────┐
│ undefined   │ ──────────────────────▶ │ "batch-123" │
│ (accept all)│                         │ (match only)│
└─────────────┘                         └──────┬──────┘
      ▲                                        │
      │  retryGenerationRef changed             │
      │                                        │
┌─────┴───────┐◀───────────────────────────────┘
│ null        │  retry: reset to null,
│ (block all) │  block rejection/finished events
└─────────────┘  until new batch's first signed event
                  sets the new batchId
```

**State meanings:**
- `undefined` — Initial state, no batch seen yet. Accept all events (first submission). Rejection/finished events are blocked in this state (`shouldBlockPendingEvent` returns true).
- `null` — Retry triggered via `retryGenerationRef` change. Block all rejection/finished events to prevent stale batch events from causing false failures. Only `signed` events pass through (and they set the new batchId). Stale batch IDs from previous batches are tracked in `staleBatchIdsRef` Set.
- `"batch-xxx"` — Active batch identified. Only accept events matching this batchId.

**Why this matters:** When the user retries after rejection/failure/disconnect, a new batch is created. The old batch's `transactionRejected`/`transactionFinished` events may still arrive asynchronously. Without filtering, these stale events would immediately transition the state machine back to Rejected/Failed, preventing the retry from succeeding.

### Sequential Path: `SequentialTrackingStrategy`

Uses a `Set<string>` of tracked tx IDs to correlate events. Simpler than batch tracking:

1. When `transactionStatusUpdated` fires for a matching tx (fromAddress + type), the tx ID is added to `trackedTxIdsRef`
2. `transactionRejected` and `transactionFinished` events only dispatch if the tx ID is in `trackedTxIdsRef`
3. On retry (`retryGenerationRef` change), `trackedTxIdsRef` is cleared — old tx IDs become untracked, so stale events are silently ignored

**Key difference from batch tracker:** No initial blocking of rejection/finished events. Events dispatch if the tx ID was previously tracked via `transactionStatusUpdated`. This works because `transactionStatusUpdated` fires with `status: 'unapproved'` when a tx is created, which happens before the user can reject it.

## cancelCurrentBatch

Both trackers return a `cancelCurrentBatch` function with the same interface. The active one is selected based on `isStxEnabled`. The function:

Both trackers' `cancelCurrentBatch` works identically:

1. Collects all tracked tx IDs from `trackedTxIdsRef`
2. Clears the tracked set
3. Calls `abortTransactionSigning` RPC for each tx ID (via `submitRequestToBackground`)
4. Tracks pending abort IDs in `pendingAbortTxIdsRef`
5. Waits up to 5 seconds for abort events to settle (via `abortSettleResolveRef`)

**Event filtering during abort:** All three event subscriptions check `pendingAbortTxIdsRef`. If an event's tx ID is in the pending abort set:
- The tx ID is removed from the pending set
- If all pending aborts have settled, the abort promise is resolved
- The event is NOT dispatched to the state machine

This prevents abort-triggered events from causing false state transitions.

## isRetryingRef Guard

`handleRetry` sets `isRetryingRef.current = true` before starting the retry and `false` in the `finally` block. The HW callback handlers (`handleHardwareWalletSubmitted`, `handleHardwareWalletRejected`, `handleHardwareWalletFailed`) check this ref and return early if retrying:

```typescript
if (isRetryingRef.current) {
  return;
}
```

This prevents errors from the old batch's `submitBridgeTransaction` promise (which may still be in flight) from racing with the retry and prematurely transitioning the state machine.

## Trezor WebUSB Workaround

The component calls `setSigningInProgress(true)` from `useHardwareWalletActions()` while:
- `hasStartedSubmission.current` is true AND state is awaiting-signature

And `setSigningInProgress(false)` when:
- State is terminal (Submitted/Rejected/Failed/Disconnected)
- Component unmounts

This suppresses spurious WebUSB disconnect teardowns during Trezor signing sessions. See `isSigningInProgressRef` in `HardwareWalletStateManager` for details.

## Critical Details

**Why not Redux/polling for batch status:**
`TransactionController` is NOT in `memStore` (metamask-controller.js:1397+), so its state never arrives in Redux via the patch-store substream. The event-driven approach via `BatchTrackingStrategy` subscribing directly to `TransactionController` messenger events is more reliable and immediate than polling.

**Why not 7702 for HW wallets:**
`bridge-status-controller-init.ts:44-51` forces `disable7702=true` and clears gas sponsorship for non-7702 accounts (including HW wallets). This routes through `addTransactionBatchWithHook` instead of `addTransactionBatchWith7702`, creating separate transactions instead of a single batch tx.

**Controller-side batch failure cleanup:**
`@metamask/transaction-controller@65.0.0` fixes the orphaned publish-hook retry
case by waiting for each nested batch tx to reach `signed`/`submitted`/
`confirmed` before moving to the next one, and rejecting immediately when a
member reaches `failed` or `rejected`. This lets the controller reject held
publish promises and run `wipeTransactionBatchById(batchId)`, so the UI no
longer cancels stale `unapproved` batch txs before retrying.

**How the step-1→step-2 transition works:**

Batch path (`BatchTrackingStrategy`):
- Subscribes to three `TransactionController` messenger events
- Filters by `fromAddress` match + batch type (bridgeApproval/swapApproval/bridge/swap) + batch ID (when known)
- Stale batch filtering uses a `Set<string>` (`staleBatchIdsRef`) to track all seen batch IDs that become stale on retry
- `TransactionController:transactionStatusUpdated` — detects `status=signed` + approval type → `FirstSignatureSubmitted`. Also detects `status=failed` → `TransactionFailed`
- `TransactionController:transactionRejected` — detects tx rejection on batch txs → `TransactionRejected` (skipped if stale batch)
- `TransactionController:transactionFinished` — detects `status=rejected` or `status=failed` → `TransactionRejected` or `TransactionFailed` (skipped if stale batch)

Sequential path (`SequentialTrackingStrategy`):
- Subscribes to the same three `TransactionController` messenger events
- Filters by `fromAddress` match + batch type (same as batch tracker)
- Tracks tx IDs in `trackedTxIdsRef` Set — only dispatches rejection/finished events if the tx ID was previously tracked
- On retry (`retryGenerationRef` change), clears the tracked set to ignore stale events
- Same dispatch logic: approval signed → `FirstSignatureSubmitted`, trade signed → `TransactionSubmitted`

Note: `transactionStatusUpdated` does NOT fire for rejections with `status=rejected`. The controller emits `transactionRejected` and `transactionFinished` separately for those. `transactionStatusUpdated` with `status=failed` does fire for failures.

**Quote data preservation:**
`useHwSwapQuoteData` uses `lockedQuoteRef` (not `activeQuote`) to survive debounced `sendUpdate` clearing the quotes list mid-flow. All rendering and effects use `lockedQuote` instead of `activeQuote`.

**Background routing (line 656 of bridge-status-controller.mjs):**
1. `isStxEnabledOnClient` — Smart Transactions enabled (sendBundle) → batch path
2. `quoteResponse.quote.gasIncluded7702` — Gasless 7702 flow → batch path (always `false` for HW)
3. `isDelegatedAccount` — EIP-7702 delegated account → batch path

If none are true, falls through to sequential non-batch path (approve → trade as separate `addTransaction` calls), with NO `batchId`.

**Sequential path (STX disabled, non-batch):**
No `batchId` exists. The background handles approve + swap as separate sequential transactions via `submitEvmTransaction` → `addTransaction`. Both txs go through the confirmation system. The approval tx is fully processed (signed + published) before the trade tx is created (the RPC blocks on each `addTransaction` call). `SequentialTrackingStrategy` tracks these by tx ID instead of batch ID.

**ErrorCode import:**
`useHwSwapConnectionMonitoring` imports `ErrorCode` directly from `@metamask/hw-wallet-sdk`, NOT from the barrel export at `ui/contexts/hardware-wallets/index.ts` (which does not re-export it).

**Intent data not supported for HW wallets:**
If `quoteResponse.quote.intent` exists and `hardwareWalletUsed` is true, `submitBridgeTransaction` calls `onHardwareWalletFailed` and returns without submitting. Intent-based quotes require off-chain signing not supported by hardware wallets.

**RPC timeout for retries:**
`retrySubmission` passes `{ rpcTimeoutMs: 120_000 }` (120 seconds) to `submitBridgeTransaction`. The initial submission has no timeout. The timeout is implemented via `Promise.race` between the RPC call and a timeout promise.

**Error classification in submitBridgeTransaction:**
User rejections are detected via `isHardwareWalletUserRejection()` which checks:
- `isUserRejectedHardwareWalletError()` (standard error codes)
- Trezor: message includes "cancelled" or "rejected"
- Lattice: message includes "rejected"
- Generic: "user rejected" or "user cancelled"

User rejection → `onHardwareWalletRejected`. All other errors → `onHardwareWalletFailed`.

## Key Files

| File | Role |
|------|------|
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.tsx` | Main component, state machine via `useReducer`, unified `handleRetry`, `isRetryingRef` guard, `cancelCurrentBatch`, signature stuck timeout, Trezor workaround, analytics, JSX render |
| `ui/hooks/hardware-wallets/useHwSignTracker.ts` | Unified tracker hook (entrypoint used by `hardware-wallet-signatures.tsx`): selects `BatchTrackingStrategy` vs `SequentialTrackingStrategy` via `isStxEnabled`; owns `cancelCurrentBatch()` with abort settle tracking |
| `ui/hooks/hardware-wallets/hw-sign-tracker/batch-tracking-strategy.ts` | Batch strategy (STX-enabled path): subscribes to 3 `TransactionController` events, `batchId` filtering, `staleBatchIdsRef` + `pendingAbortTxIdsRef` filtering |
| `ui/hooks/hardware-wallets/hw-sign-tracker/sequential-tracking-strategy.ts` | Sequential strategy (STX-disabled path): subscribes to 3 `TransactionController` events, tracks by tx ID (no `batchId`), abort settle tracking |
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/hardware-wallet-signatures-state-machine.ts` | Pure reducer: AwaitingFirst → AwaitingFinal → Submitted/Rejected/Failed/Disconnected + Reset |
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.utils.ts` | `SignatureStepStatus`, `getStepStatus()`, `getTitle()`, label/description helpers, `getTransactionField()` |
| `ui/pages/hardware-wallets/swap/types.ts` | `BridgeStatusState`, `QrHardwareSignRequest` types |
| `ui/hooks/hardware-wallets/useHwSwapQuoteData.ts` | Hook: Redux selectors + `lockedQuoteRef` quote latching |
| `ui/hooks/hardware-wallets/useHwSwapSubmission.ts` | Hook: quote reset, auto-submission (`submitActiveQuote`), retry submission with `{ rpcTimeoutMs: 120_000 }`, `hasStartedSubmission` ref with error reset |
| `ui/hooks/hardware-wallets/useHwSwapConnectionMonitoring.ts` | Hook: device disconnect/error detection via `connectionState`, `resetConnectionError`, `isDeviceDisconnectedRef` |
| `ui/hooks/hardware-wallets/useHwSwapConfirmationMonitoring.ts` | Hook: `confirmationTxData` monitoring for mid-signature rejection, skips during disconnect |
| `ui/hooks/hardware-wallets/useHwSwapQrState.ts` | Hook: QR hardware wallet detection, inline signing state, QR scan/cancel handlers |
| `ui/hooks/hardware-wallets/useHwSwapNavigation.ts` | Hook: post-submission toast + navigation via `useBridgeNavigation` |
| `ui/hooks/bridge/useSubmitBridgeTransaction.ts` | Entry point, `ensureDeviceReady()`, dispatches `submitBridgeTx`, accepts `{ rpcTimeoutMs }` option, HW error classification |
| `ui/ducks/bridge-status/actions.ts` | `submitBridgeTx` → RPC call to background |
| `app/scripts/messenger-client-init/bridge-status-controller-init.ts` | `addTransactionBatchFn` wrapper — forces `disable7702=true` for HW wallets |
| `node_modules/@metamask/bridge-status-controller/dist/bridge-status-controller.mjs` | `submitTx` — routes to batch path when STX/7702/delegated |
| `node_modules/@metamask/transaction-controller/dist/utils/batch.mjs` | `addTransactionBatchWithHook` — creates individual txs with shared `batchId`, waits for each member status, and fails fast on rejected/failed members |

## Device Disconnect/Reconnect Scenario

```
1. Approval signing in progress
      │
      ▼
2. USB cable disconnected
      │
      ▼
3. useHwSwapConnectionMonitoring detects Disconnected
   → dispatches DeviceDisconnected
   → isDeviceDisconnectedRef = true (used by useHwSwapConfirmationMonitoring only)
   → BatchTrackingStrategy relies on stale batch filtering (staleBatchIdsRef) to ignore old batch events
      │
      ▼
4. UI shows "Reconnect your device and try again"
   + "Reconnect and try again" button
      │
      ▼
5. User reconnects cable, clicks "Reconnect and try again"
      │
      ▼
6. handleRetry (unified path):
    isRetryingRef = true
    retryGenerationRef += 1 (first increment, stales old batch IDs)
    await cancelCurrentBatch() → aborts tracked txs
    connectionState check → Connected/Ready → proceed
    retryGenerationRef += 1 (second increment for new batch)
    resetConnectionError() → clear handledConnectionErrorRef + isDeviceDisconnectedRef
    Reset → AwaitingFirst/Final
    retrySubmission() → submitBridgeTransaction with { rpcTimeoutMs: 120_000 }
       │
       ▼
7. submitBridgeTransaction calls ensureDeviceReady()
    → Sends preflight commands (getFeatures/checkApp/blindSigning)
    → dispatches submitBridgeTx → NEW batch created
      │
      ▼
8. BatchTrackingStrategy:
   retryGenerationRef changed → currentBatchIdRef = null
   Old batch events blocked (null = reject all)
   First signed event from new batch → sets new batchId
      │
      ▼
9. User signs approve → FirstSignatureSubmitted
   User signs trade → TransactionSubmitted → toast + navigate

Note: If device not actually reconnected at step 5-6, the connection
status check (Connected/Ready/AwaitingConfirmation/ErrorState) will fail
and handleRetry returns early without retrying.
```

## Maintenance

If any file in the Key Files table or the flow described above is modified, **update this AGENTS.md** to keep it accurate. Specifically:
- Changes to `useHwSignTracker.ts` or the tracking strategies in `ui/hooks/hardware-wallets/hw-sign-tracker/`, or the state machine
- Changes to any hook in `ui/hooks/hardware-wallets/` (`useHwSwapQuoteData`, `useHwSwapSubmission`, `useHwSwapConnectionMonitoring`, `useHwSwapConfirmationMonitoring`, `useHwSwapQrState`, `useHwSwapNavigation`)
- Changes to the batch path logic in `bridge-status-controller` or `transaction-controller`
- Changes to the sequential path logic (non-batch `addTransaction` flow)
- Changes to how the component selects between batch and sequential trackers (`getIsStxEnabled`)
- Changes to the `addTransactionBatchFn` wrapper in `bridge-status-controller-init.ts`
- New transaction types or status values that affect the approval/trade detection logic
- Changes to how STX/7702/delegation routing works in `BridgeStatusController.submitTx`
- Changes to `submitBridgeTransaction` options (e.g., `rpcTimeoutMs`)
- Changes to retry behavior in `handleRetry` or `retrySubmission`
- Changes to `cancelCurrentBatch` abort logic or timeout
- Changes to `SIGNATURE_STUCK_TIMEOUT_MS` or the stuck retry button behavior
- Changes to `isRetryingRef` guard logic
- Changes to Trezor `setSigningInProgress` workaround
- Re-introduction of a `Retry`/resume event to the state machine (currently removed)
