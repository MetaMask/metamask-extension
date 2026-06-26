# HW Bridge Signatures: Polling → Event-Driven Step Tracking

## Problem

`HardwareWalletSignatures` used `forceUpdateMetamaskState()` polling (250ms interval) to detect when the approval tx was submitted on-chain, so the UI could transition from step 1 (approve) to step 2 (send). This polling approach had issues:

1. **Applied ALL pending controller patches** — including quote-clearing patches from an in-flight quote response racing with `stopPollingForQuotes`, making `activeQuote` null and causing the step UI to disappear.
2. **Wasteful polling** — continuously fetched the entire metamask state every 250ms.

## Solution

Replaced polling with the centralized `useHwBatchSignTracker` hook, which subscribes to three `TransactionController` messenger events via `subscribeToMessengerEvent`. The hook encapsulates all step-tracking logic in one place.

### All flows — `useHwBatchSignTracker`

The hook (`useHwBatchSignTracker.ts`) subscribes to three events regardless of gasless/non-gasless routing:

**1. `TransactionController:transactionStatusUpdated`** — Step completion detection:
- Detects when an approval-type tx (`bridgeApproval`/`swapApproval`) reaches `status=signed`
- Dispatches `FirstSignatureSubmitted` to transition AwaitingFirstSignature → AwaitingFinalSignature
- Also logs when trade-type txs are signed (for debugging)

**2. `TransactionController:transactionRejected`** — Rejection detection:
- Detects when any batch tx is rejected
- Dispatches `TransactionRejected` (skipped if device is already disconnected via `isDeviceDisconnectedRef`)

**3. `TransactionController:transactionFinished`** — Final outcome detection:
- Detects `status=rejected` → dispatches `TransactionRejected`
- Detects `status=failed` → dispatches `TransactionFailed`
- Skipped if device is already disconnected

All three subscriptions filter by `fromAddress` match (case-insensitive) + batch type (`bridgeApproval`/`swapApproval`/`bridge`/`swap`).

### Why this approach works for both gasless and non-gasless flows

- **Non-gasless (standard approval + trade):** The approval tx goes through the full `TransactionController` lifecycle, reaching `status=signed` after the user signs on the HW device. The hook detects this and dispatches `FirstSignatureSubmitted`.
- **Gasless (batched):** When STX/7702 routes through `handleEvmTransactionBatch`, the batch txs still go through `TransactionController` and emit `transactionStatusUpdated`. The hook detects approval-type txs reaching `signed` status the same way.

The hook is agnostic to which background path (batch vs sequential) is used — it only watches `TransactionController` events.

## Key implementation details

### Locked quote ref

The background's debounced `sendUpdate` (200ms debounce, 1s maxWait) can deliver quote-clearing patches at any time. To prevent the step UI from disappearing when `activeQuote` becomes null:

```typescript
const lockedQuoteRef = useRef(activeQuote);
if (activeQuote && !lockedQuoteRef.current) {
  lockedQuoteRef.current = activeQuote;
}
const lockedQuote = lockedQuoteRef.current;
```

All rendering and effects use `lockedQuote` instead of `activeQuote`.

### Reducer guards

Both `FirstSignatureSubmitted` and `TransactionSubmitted` are guarded in the reducer to only transition from valid states:

- `FirstSignatureSubmitted`: only from `AwaitingFirstSignature`
- `TransactionSubmitted`: only from `AwaitingFirstSignature` or `AwaitingFinalSignature`

This prevents late-arriving events from reverting terminal states (e.g., a late `transactionStatusUpdated` arriving after `Submitted`).

### Dispatch ref pattern

`useHwBatchSignTracker` uses a `dispatchRef` to always call the latest `dispatchSignatureEvent` without re-subscribing on every render:

```typescript
const dispatchRef = useRef(dispatchSignatureEvent);
dispatchRef.current = dispatchSignatureEvent;
```

This avoids the async gap problem: subscriptions are registered once and persist until dependencies change.

## Files modified

| File | Changes |
|------|---------|
| `hardware-wallet-signatures.tsx` | Replaced inline subscriptions with `useHwBatchSignTracker` hook call. Added `lockedQuoteRef`, `isDeviceDisconnectedRef`. Removed `forceUpdateMetamaskState` import and all inline messenger subscription effects. |
| `useHwBatchSignTracker.ts` | New file: centralized hook with three `TransactionController` event subscriptions. Uses `dispatchRef` pattern. |
| `hardware-wallet-signatures-state-machine.ts` | Added `Disconnected` state, `DeviceDisconnected` event. Added guards on transitions. |
| `hardware-wallet-signatures.utils.ts` | Added `Disconnected` to `SignatureStepStatus`, updated `getStepStatus()`, `getTitle()`, `getFirstStepDescription()`. |
| `hardware-wallet-signatures.test.tsx` | Updated tests for `useHwBatchSignTracker` hook. |
| `hardware-wallet-signatures-state-machine.test.ts` | Added tests for `DeviceDisconnected` transitions and reducer guards. |

## Event flow diagrams

### Non-gasless (separate approval + trade)

```
[UI: AwaitingFirstSignature]
         │
         ▼
  submitBridgeTransaction()
         │
         ▼
  Background: handleApprovalTx() → addTransaction → HW signing
         │
         ▼ (user signs approval on HW)
         │
  TransactionController emits: transactionStatusUpdated (status=signed, type=bridgeApproval)
         │
         ▼ (JSON-RPC notification to UI via useHwBatchSignTracker)
         │
[UI: FirstSignatureSubmitted → AwaitingFinalSignature]
         │
         ▼
  Background: submitEvmTransaction(trade) → HW signing
         │
         ▼ (user signs trade on HW)
         │
  Background: submitTx returns → onHardwareWalletSubmitted callback
         │
         ▼
[UI: TransactionSubmitted → Submitted]
```

### Gasless (batched approval + trade)

```
[UI: AwaitingFirstSignature]
         │
         ▼
  submitBridgeTransaction()
         │
         ▼
  Background: handleEvmTransactionBatch() → addTransactionBatch → batch created
         │
         ▼ (TransactionController: status = signed for approval tx)
         │
  [UI: FirstSignatureSubmitted → AwaitingFinalSignature]
         │
         ▼ (user signs batch on HW — single signing)
         │
  Background: batch submitted on-chain → submitTx returns → onHardwareWalletSubmitted callback
         │
         ▼
[UI: TransactionSubmitted → Submitted]
```
