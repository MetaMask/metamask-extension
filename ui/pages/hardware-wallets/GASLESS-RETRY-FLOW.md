# Gasless Flows & Retry Handling for Hardware Wallets

This document explains how gasless (sponsor-paid) bridge/swap transactions work in the context of hardware wallets, and how the signing UI handles retries when something goes wrong.

---

## Table of Contents

1. [Gasless Paths Overview](#gasless-paths-overview)
2. [Why Hardware Wallets Cannot Use EIP-7702](#why-hardware-wallets-cannot-use-eip-7702)
3. [Hardware Wallet Gasless Path: Smart Transactions (STX)](#hardware-wallet-gasless-path-smart-transactions-stx)
4. [The Publish Hook Cascade](#the-publish-hook-cascade)
5. [Batch Signing Flow](#batch-signing-flow)
6. [State Machine](#state-machine)
7. [Retry Handling](#retry-handling)
8. [Stale Batch Event Filtering](#stale-batch-event-filtering)
9. [Signature Stuck Timeout](#signature-stuck-timeout)
10. [Key Files](#key-files)

---

## Gasless Paths Overview

MetaMask supports three gasless submission paths, checked in priority order inside the `publishHook` defined in `transaction-controller-init.ts`:

| Priority | Path | Mechanism | HW Wallet Support |
|----------|------|-----------|-------------------|
| 1st | **TransactionPay** (Subscription-sponsored) | Active subscription (e.g., MetaMask Shield) sponsors gas | Supported |
| 2nd | **EIP-7702 Sentinel Relay** | Wraps tx as `redeemDelegations`, relay sponsor pays gas | **Excluded** |
| 3rd | **Smart Transactions (STX/sendBundle)** | Bundles txs, submits to Sentinel, sponsor pays via STX | **Supported (primary path)** |
| Fallback | Standard `eth_sendRawTransaction` | User pays gas normally | Supported |

For hardware wallets, the gasless path is exclusively through **TransactionPay** or **Smart Transactions (STX)**. EIP-7702 is explicitly excluded.

---

## Why Hardware Wallets Cannot Use EIP-7702

EIP-7702 requires signing two EIP-712/EIP-7702 structures that hardware wallets do not support:

1. **Delegation signature** — an EIP-712 typed-data signature for the `redeemDelegations` call
2. **Authorization signature** — `signEip7702Authorization` to upgrade the account via `setCode`

The constant `KEYRING_TYPES_SUPPORTING_7702` in `shared/constants/keyring.ts` only includes `HD Key Tree` and `Simple Key Pair` — hardware wallet keyrings are excluded.

At the **quote level**, `useGasIncluded7702.ts` returns `false` for hardware wallets, so `gasIncluded7702=true` is never included in quote requests.

At the **submission level**, `bridge-status-controller-init.ts` wraps `addTransactionBatchFn` and forces:
```
disable7702: true
isGasFeeSponsored: false
isGasFeeIncluded: false
```
for any account that doesn't support 7702 (hardware wallets, snaps).

---

## Hardware Wallet Gasless Path: Smart Transactions (STX)

When STX is enabled and `sendBundle` is supported for the chain, hardware wallet transactions are submitted via `SmartTransactionsController`:

```
User clicks swap/bridge (STX enabled, HW wallet, approval needed)
  │
  ▼
submitBridgeTransaction(quote)
  │
  ▼
BridgeStatusController.submitTx
  │  isStxEnabledOnClient=true → batch path
  │
  ▼
bridge-status-controller-init.ts: addTransactionBatchFn
  │  HW wallet → disable7702=true, clears sponsorship flags
  │
  ▼
TransactionController.addTransactionBatch → addTransactionBatchWithHook
  │  Creates TWO transactions with shared batchId:
  │    1. approval tx (type=bridgeApproval/swapApproval)
  │    2. trade tx (type=bridge/swap)
  │
  ▼
User signs both on device (sequentially)
  │
  ▼
Publish hook → Step 3: Smart Transactions
  │  submitSmartTransactionHook()
  │  → SmartTransactionsController submits bundle to Sentinel
  │  → Returns transactionHash
  │
  ▼
TransactionController:transactionStatusUpdated event fires
  → BridgeStatusController tracks completion
```

**Key characteristics:**
- No EIP-7702 delegation required
- Standard EIP-1559 signing only (compatible with all HW devices)
- `sendBundle` bundles both approval + trade into a single atomic submission
- Gas is sponsored by the Sentinel STX service

---

## The Publish Hook Cascade

The `publishHook` in `transaction-controller-init.ts:406-528` is a cascading priority chain. For hardware wallets, the flow is:

```
publishHook(transactionMeta, signedTx)
  │
  ├─ Step 1: TransactionPayPublishHook
  │   └─ Active subscription? → RETURN (sponsored by subscription)
  │
  ├─ Step 2: Delegation7702PublishHook
  │   └─ SKIPPED (disable7702=true for HW wallets)
  │
  ├─ Step 3: Smart Transactions (STX / sendBundle)
  │   └─ STX enabled + sendBundle supported? → RETURN (sponsored via Sentinel)
  │
  └─ Step 4: Fallback → { transactionHash: undefined }
      → TransactionController submits via eth_sendRawTransaction (user pays gas)
```

---

## Batch Signing Flow

When STX is enabled with a hardware wallet and the trade requires token approval, the UI shows a two-step signing page:

```
┌─────────────────── SIGNING PAGE ───────────────────┐
│                                                      │
│  State: AwaitingFirstSignature                       │
│                                                      │
│  Step 1: "Approve [amount] [token]"                  │
│    → User signs approval on device                   │
│    → useHwBatchSignTracker detects signed status     │
│    → dispatches FirstSignatureSubmitted              │
│                                                      │
│  State: AwaitingFinalSignature                       │
│                                                      │
│  Step 2: "Send [amount] [token]"                     │
│    → User signs trade on device                      │
│    → useHwBatchSignTracker detects signed status     │
│    → dispatches TransactionSubmitted                 │
│                                                      │
│  State: Submitted                                    │
│    → 1s delay → toast → navigate away                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

If no approval is needed (`needsTwoConfirmations=false`), the state starts at `AwaitingFinalSignature` directly.

### Monitoring Hooks

Multiple hooks run simultaneously during signing:

| Hook | Role |
|------|------|
| `useHwBatchSignTracker` | Subscribes to TransactionController events, detects signed/rejected/failed status changes |
| `useHwSwapConnectionMonitoring` | Watches for device disconnect/error via `connectionState` |
| `useHwSwapConfirmationMonitoring` | Detects mid-signature rejection (tx data cleared) |
| `useHwSwapQrState` | QR wallet inline signing + scan/cancel |
| `useHwSwapNavigation` | Post-submission toast + navigation |

---

## State Machine

The signing page uses a pure reducer (`hardwareWalletSignaturesReducer`) with these states and transitions:

```
States:
  AwaitingFirstSignature  — waiting for approval signature
  AwaitingFinalSignature  — waiting for trade signature (or starting state if no approval)
  Submitted               — both signed, tx submitted successfully
  Rejected                — user rejected signing on device
  Failed                  — signing or submission failed
  Disconnected            — device disconnected during signing

Events:
  FirstSignatureSubmitted  — approval tx signed
  TransactionSubmitted     — trade tx signed
  TransactionRejected      — user rejected on device
  TransactionFailed        — error occurred
  DeviceDisconnected       — device lost connection
  Reset                    — return to initial state (used by retry)
  Retry                    — resume from saved state (unused by current implementation)
```

The `Rejected`, `Failed`, and `Disconnected` states remember *which signing step* failed (via `rejectedSignature`, `failedSignature`, `disconnectedSignature`). This enables showing the correct step as failed/rejected in the UI.

Transition diagram for `needsTwoConfirmations=true`:

```
AwaitingFirstSignature
  │
  ├─ FirstSignatureSubmitted ──▶ AwaitingFinalSignature
  │                                │
  │                                ├─ TransactionSubmitted ──▶ Submitted ✓
  │                                ├─ TransactionRejected ──▶ Rejected(rejectedSignature=AwaitingFinal)
  │                                ├─ TransactionFailed ──▶ Failed(failedSignature=AwaitingFinal)
  │                                └─ DeviceDisconnected ──▶ Disconnected(disconnectedSignature=AwaitingFinal)
  │
  ├─ TransactionRejected ──▶ Rejected(rejectedSignature=AwaitingFirst)
  ├─ TransactionFailed ──▶ Failed(failedSignature=AwaitingFirst)
  └─ DeviceDisconnected ──▶ Disconnected(disconnectedSignature=AwaitingFirst)
```

---

## Retry Handling

All retry scenarios (Disconnected, Rejected, Failed) use a **single unified `handleRetry` function**. There are no separate retry paths per error type.

### The `handleRetry` Function

Located in `hardware-wallet-signatures.tsx:356-417`:

```typescript
const handleRetry = useCallback(async () => {
  // 1. Guard against concurrent retries
  if (isRetryingRef.current) return;

  // 2. Set guards
  isRetryingRef.current = true;   // blocks stale HW callbacks
  hasRetriedRef.current = true;   // enables "Resend" button later
  setIsRetrying(true);            // disables retry button in UI

  try {
    // 3. First generation increment — marks old batch IDs as stale
    retryGenerationRef.current += 1;

    // 4. Cancel the old batch — aborts all tracked tx IDs
    await cancelCurrentBatch();

    // 5. Connection gating — device must be in an allowed state
    const canRetry =
      connectionState.status === ConnectionStatus.Connected ||
      connectionState.status === ConnectionStatus.Ready ||
      connectionState.status === ConnectionStatus.AwaitingConfirmation ||
      connectionState.status === ConnectionStatus.ErrorState;
    if (!canRetry) return;

    // 6. Second generation increment — for new batch tracking
    retryGenerationRef.current += 1;

    // 7. Clear error state
    resetConnectionError();

    // 8. Reset state machine to initial state
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });

    // 9. Submit a new transaction batch
    await retrySubmission();
    // retrySubmission calls:
    //   submitBridgeTransaction(lockedQuote, { rpcTimeoutMs: 120_000 })
  } finally {
    // 10. Clear retry guard
    isRetryingRef.current = false;
    setIsRetrying(false);
  }
}, [/* deps */]);
```

### Step-by-Step Retry Sequence

```
State = Rejected/Failed/Disconnected → User clicks retry button
  │
  ▼
1. isRetryingRef = true       ← blocks stale HW callbacks from old batch
   hasRetriedRef = true       ← enables "Resend transaction" button later
   setIsRetrying(true)        ← disables button in UI
  │
  ▼
2. retryGenerationRef += 1    ← FIRST increment: stale old batch IDs
  │                             useHwBatchSignTracker moves all seen
  │                             batch IDs into staleBatchIdsRef Set
  │
  ▼
3. await cancelCurrentBatch() ← aborts tracked tx IDs via RPC
  │                             waits up to 5s for abort events to settle
  │
  ▼
4. Connection check           ← if device not connected, return early
  │
  ▼
5. retryGenerationRef += 1    ← SECOND increment: new batch tracking
  │
  ▼
6. resetConnectionError()     ← clears handledConnectionErrorRef
  │                             clears isDeviceDisconnectedRef
  │
  ▼
7. dispatch Reset             → AwaitingFirst or AwaitingFinal (fresh state)
  │
  ▼
8. await retrySubmission()
  │  → submitBridgeTransaction(lockedQuote, { rpcTimeoutMs: 120_000 })
  │    → ensureDeviceReady() if needed
  │    → dispatch(submitBridgeTx(...))
  │    → NEW batch created with new batchId
  │
  ▼
9. isRetryingRef = false
   setIsRetrying(false)
  │
  ▼
User signs approve → FirstSignatureSubmitted → signs trade → TransactionSubmitted
```

### Why Double `retryGenerationRef` Increment?

The two increments serve different purposes:

- **First increment** (before `cancelCurrentBatch`): Triggers `checkGeneration()` in `useHwBatchSignTracker`, which moves all seen batch IDs into the `staleBatchIdsRef` Set. This ensures any events from the old batch arriving during/after cancellation are filtered out.

- **Second increment** (after `cancelCurrentBatch`): Ensures a clean separation. After cancellation settles, a new generation starts for tracking the new batch. The `currentBatchIdRef` is reset to `null` (block-all mode), and only the first `signed` event from the new batch sets the new batch ID.

### Why `Reset` Instead of `Retry`?

The state machine has both `Retry` and `Reset` events, but `handleRetry` uses **only `Reset`**:

- `Retry` would resume from the remembered signing step (e.g., if failed at step 2, resume at step 2). However, since `cancelCurrentBatch` aborts all tracked transactions and `retrySubmission` creates a completely new batch, resuming mid-flow is incorrect — both steps must be signed again for the new batch.

- `Reset` returns to the initial state (`AwaitingFirst` or `AwaitingFinal`), which correctly reflects that both signatures are needed for the new batch.

### `isRetryingRef` Guard

The ref blocks stale hardware wallet callbacks (`onHardwareWalletSubmitted`, `onHardwareWalletRejected`, `onHardwareWalletFailed`) from the old `submitBridgeTransaction` promise. Without this guard, errors from the old batch could race with the retry and prematurely transition the state machine:

```typescript
const handleHardwareWalletSubmitted = useCallback(() => {
  if (isRetryingRef.current) return;  // ← guard
  dispatchSignatureEvent({ type: TransactionSubmitted });
}, []);
```

### `cancelCurrentBatch`

Returned by `useHwBatchSignTracker`, this function:

1. Collects all tracked tx IDs from `trackedTxIdsRef`
2. Clears the tracked set
3. Calls `abortTransactionSigning` RPC for each tx ID
4. Tracks pending abort IDs in `pendingAbortTxIdsRef`
5. Waits up to **5 seconds** for abort events to settle

**Event filtering during abort:** All three event subscriptions check `pendingAbortTxIdsRef`. If an event's tx ID is in the pending abort set, the tx ID is removed from the set and the event is **NOT dispatched** to the state machine. This prevents abort-triggered events from causing false transitions.

---

## Stale Batch Event Filtering

`useHwBatchSignTracker` uses a **3-state `currentBatchIdRef`** to prevent stale events from old batches from causing false state transitions:

```
┌───────────────┐   first signed event   ┌─────────────────┐
│  undefined    │ ─────────────────────▶  │  "batch-123"    │
│  (accept all) │                         │  (match only)   │
└───────────────┘                         └────────┬────────┘
       ▲                                           │
       │  retryGenerationRef changed                │
       │                                           │
┌──────┴────────┐◀─────────────────────────────────┘
│  null         │  retry: reset to null,
│  (block all)  │  only signed events pass through
└───────────────┘  (and set new batchId)
```

| State | Meaning | Events Accepted |
|-------|---------|-----------------|
| `undefined` | Initial state, no batch seen yet | `signed` events only (sets batchId); rejection/finished events blocked |
| `null` | Retry triggered, old batch stale | `signed` events only (sets new batchId); rejection/finished events from old batch blocked |
| `"batch-xxx"` | Active batch identified | Only events matching this batchId |

Additionally, a `staleBatchIdsRef` Set tracks all batch IDs from previous retries. Events with batch IDs in this set are always filtered out.

**Why this matters:** When the user retries, a new batch is created. The old batch's `transactionRejected`/`transactionFinished` events may still arrive asynchronously. Without filtering, these would immediately transition the state machine back to Rejected/Failed, making retries impossible.

---

## Signature Stuck Timeout

After the user has retried at least once (`hasRetriedRef.current = true`), if the state machine remains in an awaiting-signature state for more than **5 seconds** (`SIGNATURE_STUCK_TIMEOUT_MS`), a "Resend transaction" button appears. This allows the user to retry again without waiting for an explicit failure.

The timeout resets when:
- The state leaves awaiting-signature (Submitted/Rejected/Failed/Disconnected)
- A retry is in flight (`isRetrying = true`)

This handles edge cases where the transaction is submitted to the background but the HW device never receives the signing request (e.g., due to a transport issue).

---

## Key Files

| File | Role |
|------|------|
| `hardware-wallet-signatures.tsx` | Main component: state machine, unified `handleRetry`, `isRetryingRef` guard, stuck timeout |
| `hardware-wallet-signatures-state-machine.ts` | Pure reducer: state transitions and event definitions |
| `useHwBatchSignTracker.ts` | Batch event tracking, stale filtering, `cancelCurrentBatch` |
| `hardware-wallet-signatures.utils.ts` | UI helpers: step status, labels, descriptions |
| `types.ts` | TypeScript types for bridge status and QR signing |
| `useHwSwapSubmission.ts` | Hook: auto-submission, `retrySubmission` with extended RPC timeout |
| `useHwSwapConnectionMonitoring.ts` | Hook: device disconnect/error detection |
| `useSubmitBridgeTransaction.ts` | Entry point: `ensureDeviceReady()`, dispatches `submitBridgeTx`, HW error classification |
| `bridge-status-controller-init.ts` | Background: `addTransactionBatchFn` wrapper (forces `disable7702` for HW) |
| `transaction-controller-init.ts` | Background: publish hook cascade (TransactionPay → 7702 → STX → fallback) |
| `useGasIncluded7702.ts` | Quote-time 7702 gating (returns `false` for HW wallets) |
