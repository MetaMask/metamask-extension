# Merge HW Batch + Sequential Sign Trackers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `useHwBatchSignTracker.ts` (443 lines) and `useHwSequentialSignTracker.ts` (309 lines) into a single `useHwSignTracker.ts` with a `useBatchTracking: boolean` option, eliminating ~70% code duplication while preserving identical behavior.

**Architecture:** The merged hook declares all refs up front (some used only in batch mode), adopts the cleaner `handlePendingAbort` helper from the sequential tracker, and branches at three known divergence points: `checkGeneration`, `signed`-event validation in `transactionStatusUpdated`, and rejection/finished event gating. The call site in `hardware-wallet-signatures.tsx` collapses from two hook calls + a ternary to a single hook call.

**Tech Stack:** TypeScript, React hooks (`useCallback`, `useEffect`, `useRef`), Jest, MetaMask extension build/lint tooling (`yarn lint:changed:fix`, `yarn lint:tsc`).

**Spec:** `docs/superpowers/specs/2026-06-07-merge-hw-sign-trackers-design.md`

---

### Task 1: Verify baseline — existing tests pass

**Files:**
- Verify: `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx`

- [ ] **Step 1: Run the existing test suite to establish baseline**

Run:
```bash
yarn test:unit ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx
```

Expected: All tests pass. If any fail, stop and investigate before starting the refactor — the failures must not be caused by this work.

- [ ] **Step 2: Note the test count for later comparison**

Capture the test count from the output (e.g., "Tests: 28 passed, 28 total"). This number must remain identical after the merge.

---

### Task 2: Create the merged `useHwSignTracker.ts` file

**Files:**
- Create: `ui/pages/hardware-wallets/swap/useHwSignTracker.ts`
- Reference: `ui/pages/hardware-wallets/swap/useHwBatchSignTracker.ts` (source for batch-mode logic)
- Reference: `ui/pages/hardware-wallets/swap/useHwSequentialSignTracker.ts` (source for sequential-mode logic and `handlePendingAbort` helper)

- [ ] **Step 1: Create `useHwSignTracker.ts` with imports, constants, types, and helpers**

Create `ui/pages/hardware-wallets/swap/useHwSignTracker.ts`:

```typescript
import { useCallback, useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../../store/background-connection';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';

const APPROVAL_TYPES = new Set([
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
]);

const TRADE_TYPES = new Set([TransactionType.bridge, TransactionType.swap]);
const ALL_BATCH_TYPES = new Set([...APPROVAL_TYPES, ...TRADE_TYPES]);

export type HwSignTrackerAction =
  | { type: typeof HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionRejected }
  | { type: typeof HardwareWalletSignatureEvent.TransactionFailed };

export type UseHwSignTrackerOptions = {
  enabled?: boolean;
  useBatchTracking: boolean;
};

function matchesTx(
  transactionMeta: TransactionMeta,
  targetFrom: string | undefined,
): boolean {
  if (!targetFrom) {
    return false;
  }
  const normalizedFrom = transactionMeta.txParams.from?.toLowerCase();
  if (normalizedFrom !== targetFrom) {
    return false;
  }
  return ALL_BATCH_TYPES.has(transactionMeta.type as TransactionType);
}

function isFromCurrentBatch(
  transactionMeta: TransactionMeta,
  currentBatchId: string | null | undefined,
  staleBatchIds: Set<string>,
): boolean {
  const batchId = transactionMeta.batchId ?? 'batch-unknown';
  if (currentBatchId === undefined) {
    return true;
  }
  if (currentBatchId === null) {
    return !staleBatchIds.has(batchId);
  }
  return batchId === currentBatchId;
}

function shouldBlockPendingEvent(
  currentBatchId: string | null | undefined,
): boolean {
  return currentBatchId === undefined;
}
```

- [ ] **Step 2: Add the hook function with refs and `cancelCurrentBatch`**

Append to `useHwSignTracker.ts`:

```typescript
export function useHwSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  _needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: React.Dispatch<HwSignTrackerAction>,
  options: UseHwSignTrackerOptions,
  retryGenerationRef?: React.RefObject<number>,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  const enabled = options?.enabled ?? true;
  const useBatchTracking = options.useBatchTracking;

  // Shared refs (both modes)
  const trackedTxIdsRef = useRef<Set<string>>(new Set());
  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);
  const pendingAbortTxIdsRef = useRef<Set<string>>(new Set());
  const abortSettleResolveRef = useRef<((value: void) => void) | null>(null);

  // Batch-mode-only refs (unused in sequential mode)
  const currentBatchIdRef = useRef<string | null | undefined>();
  const staleBatchIdsRef = useRef<Set<string>>(new Set());
  const seenBatchIdsRef = useRef<Set<string>>(new Set());

  const cancelCurrentBatch = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const txIds = [...trackedTxIdsRef.current];
    trackedTxIdsRef.current = new Set();

    if (txIds.length === 0) {
      return;
    }

    pendingAbortTxIdsRef.current = new Set(txIds);

    const settlePromise = new Promise<void>((resolve) => {
      abortSettleResolveRef.current = resolve;
    });

    await Promise.all(
      txIds.map(async (txId) => {
        try {
          await submitRequestToBackground('abortTransactionSigning', [txId]);
        } catch {
          pendingAbortTxIdsRef.current.delete(txId);
        }
      }),
    );

    if (pendingAbortTxIdsRef.current.size === 0) {
      abortSettleResolveRef.current = null;
      return;
    }

    await Promise.race([
      settlePromise,
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);

    abortSettleResolveRef.current = null;
  }, [enabled]);

  // useEffect body continues in next step
```

- [ ] **Step 3: Add the `useEffect` with subscriptions and mode-branching handlers**

Append to `useHwSignTracker.ts` (inside the hook function, after `cancelCurrentBatch`):

```typescript
  useEffect(() => {
    if (!fromAddress || !hardwareWalletUsed || !enabled) {
      return undefined;
    }

    let cancelled = false;
    const targetFrom = fromAddress.toLowerCase();
    const logPrefix = useBatchTracking ? '[HW-Batch]' : '[HW-Sequential]';
    const unsubscribes: (() => Promise<void>)[] = [];

    const checkGeneration = () => {
      if (
        !retryGenerationRef ||
        retryGenerationRef.current === lastSeenGenerationRef.current
      ) {
        return;
      }
      lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;

      if (useBatchTracking) {
        for (const id of seenBatchIdsRef.current) {
          staleBatchIdsRef.current.add(id);
        }
        seenBatchIdsRef.current = new Set();
        currentBatchIdRef.current = null;
      } else {
        trackedTxIdsRef.current = new Set();
      }
    };

    const handlePendingAbort = (txId: string): boolean => {
      if (pendingAbortTxIdsRef.current.has(txId)) {
        pendingAbortTxIdsRef.current.delete(txId);
        if (
          pendingAbortTxIdsRef.current.size === 0 &&
          abortSettleResolveRef.current
        ) {
          abortSettleResolveRef.current();
        }
        return true;
      }
      return false;
    };

    const subscribeAll = async () => {
      const unsub1 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionStatusUpdated',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          const { status, type } = transactionMeta;

          console.log(
            `${logPrefix} transactionStatusUpdated`,
            JSON.stringify({
              id: transactionMeta.id,
              status,
              type,
              from: transactionMeta.txParams.from,
              batchId: transactionMeta.batchId,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          const batchId = transactionMeta.batchId ?? 'batch-unknown';
          if (useBatchTracking) {
            seenBatchIdsRef.current.add(batchId);
          }
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (status === 'signed') {
            if (useBatchTracking) {
              if (currentBatchIdRef.current === undefined) {
                currentBatchIdRef.current = batchId;
              } else if (currentBatchIdRef.current === null) {
                if (staleBatchIdsRef.current.has(batchId)) {
                  console.log(
                    `${logPrefix} skipping stale signed event after retry`,
                    JSON.stringify({
                      eventBatchId: batchId,
                      staleBatchIds: [...staleBatchIdsRef.current],
                    }),
                  );
                  return;
                }
                currentBatchIdRef.current = batchId;
              } else if (batchId !== currentBatchIdRef.current) {
                console.log(
                  `${logPrefix} skipping signed event from stale batch`,
                  JSON.stringify({
                    eventBatchId: batchId,
                    currentBatchId: currentBatchIdRef.current,
                  }),
                );
                return;
              }
            }

            if (APPROVAL_TYPES.has(type as TransactionType)) {
              console.log(
                `${logPrefix} approval signed → FirstSignatureSubmitted`,
              );
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
              });
            } else if (TRADE_TYPES.has(type as TransactionType)) {
              console.log(`${logPrefix} trade signed → TransactionSubmitted`);
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.TransactionSubmitted,
              });
            }
          } else if (status === 'failed') {
            if (useBatchTracking) {
              if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
                console.log(
                  `${logPrefix} skipping transactionStatusUpdated failed: no batch identified yet`,
                );
                return;
              }
              if (
                currentBatchIdRef.current !== undefined &&
                !isFromCurrentBatch(
                  transactionMeta,
                  currentBatchIdRef.current,
                  staleBatchIdsRef.current,
                )
              ) {
                console.log(
                  `${logPrefix} skipping transactionStatusUpdated failed from stale batch`,
                  JSON.stringify({
                    eventBatchId: transactionMeta.batchId,
                    currentBatchId: currentBatchIdRef.current,
                  }),
                );
                return;
              }
            }
            console.log(
              `${logPrefix} transactionStatusUpdated failed → TransactionFailed`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        },
      );
      unsubscribes.push(unsub1);

      const unsub2 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionRejected',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          console.log(
            `${logPrefix} transactionRejected`,
            JSON.stringify({
              id: transactionMeta.id,
              type: transactionMeta.type,
              from: transactionMeta.txParams.from,
              batchId: transactionMeta.batchId,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          if (useBatchTracking) {
            const batchId = transactionMeta.batchId ?? 'batch-unknown';
            seenBatchIdsRef.current.add(batchId);
          }
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (useBatchTracking) {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              console.log(
                `${logPrefix} skipping transactionRejected: no batch identified yet`,
              );
              return;
            }
            if (
              currentBatchIdRef.current !== undefined &&
              !isFromCurrentBatch(
                transactionMeta,
                currentBatchIdRef.current,
                staleBatchIdsRef.current,
              )
            ) {
              console.log(
                `${logPrefix} skipping transactionRejected from stale batch`,
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
          } else {
            if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
              return;
            }
          }

          console.log(`${logPrefix} tx rejected → TransactionRejected`);
          dispatchRef.current({
            type: HardwareWalletSignatureEvent.TransactionRejected,
          });
        },
      );
      unsubscribes.push(unsub2);

      const unsub3 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionFinished',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          const { status, type } = transactionMeta;

          console.log(
            `${logPrefix} transactionFinished`,
            JSON.stringify({
              id: transactionMeta.id,
              status,
              type,
              from: transactionMeta.txParams.from,
              batchId: transactionMeta.batchId,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          if (useBatchTracking) {
            const batchId = transactionMeta.batchId ?? 'batch-unknown';
            seenBatchIdsRef.current.add(batchId);
          }
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (useBatchTracking) {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              console.log(
                `${logPrefix} skipping transactionFinished: no batch identified yet`,
              );
              return;
            }
            if (
              currentBatchIdRef.current !== undefined &&
              !isFromCurrentBatch(
                transactionMeta,
                currentBatchIdRef.current,
                staleBatchIdsRef.current,
              )
            ) {
              console.log(
                `${logPrefix} skipping transactionFinished from stale batch`,
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
          } else {
            if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
              return;
            }
          }

          if (status === 'rejected') {
            console.log(
              `${logPrefix} transactionFinished rejected → TransactionRejected`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionRejected,
            });
          } else if (status === 'failed') {
            console.log(
              `${logPrefix} transactionFinished failed → TransactionFailed`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        },
      );
      unsubscribes.push(unsub3);
    };

    subscribeAll().catch((err: unknown) => {
      console.error(`${logPrefix} subscription error`, err);
    });

    return () => {
      cancelled = true;
      for (const unsub of unsubscribes) {
        unsub().catch(
          // eslint-disable-next-line no-empty-function
          () => {},
        );
      }
    };
  }, [
    fromAddress,
    hardwareWalletUsed,
    retryGenerationRef,
    enabled,
    useBatchTracking,
  ]);

  return { cancelCurrentBatch };
}
```

- [ ] **Step 4: Verify the new file compiles**

Run:
```bash
yarn lint:tsc
```

Expected: PASS. The new file should compile because no other file references it yet — it's purely additive.

- [ ] **Step 5: Commit the new file**

```bash
git add ui/pages/hardware-wallets/swap/useHwSignTracker.ts
git commit -m "refactor(swap): add merged useHwSignTracker hook

Pure addition — no callers yet. Next commit will swap the call site."
```

---

### Task 3: Update the call site in `hardware-wallet-signatures.tsx`

**Files:**
- Modify: `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.tsx:60-61` (imports)
- Modify: `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.tsx:195-213` (hook calls + ternary)

- [ ] **Step 1: Replace the two tracker imports with one**

In `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.tsx`, find lines 60-61:

```typescript
import { useHwBatchSignTracker } from './useHwBatchSignTracker';

import { useHwSequentialSignTracker } from './useHwSequentialSignTracker';
```

Replace with:

```typescript
import { useHwSignTracker } from './useHwSignTracker';
```

- [ ] **Step 2: Replace the two hook calls and the ternary with a single call**

In the same file, find lines 195-213:

```typescript
  const { cancelCurrentBatch: cancelBatch } = useHwBatchSignTracker(
    fromAddress,
    hardwareWalletUsed,
    needsTwoConfirmations,
    dispatchSignatureEvent,
    retryGenerationRef,
    { enabled: isStxEnabled },
  );

  const { cancelCurrentBatch: cancelSequential } = useHwSequentialSignTracker(
    fromAddress,
    hardwareWalletUsed,
    needsTwoConfirmations,
    dispatchSignatureEvent,
    retryGenerationRef,
    { enabled: !isStxEnabled },
  );

  const cancelCurrentBatch = isStxEnabled ? cancelBatch : cancelSequential;

  // WORKAROUND: Set the Trezor signing-in-progress flag to suppress
```

Replace with:

```typescript
  const { cancelCurrentBatch } = useHwSignTracker(
    fromAddress,
    hardwareWalletUsed,
    needsTwoConfirmations,
    dispatchSignatureEvent,
    { enabled: true, useBatchTracking: isStxEnabled },
    retryGenerationRef,
  );

  // WORKAROUND: Set the Trezor signing-in-progress flag to suppress
```

- [ ] **Step 3: Run TypeScript check to verify imports/usage compile**

Run:
```bash
yarn lint:tsc
```

Expected: PASS. The two deleted imports should not cause any errors because the call site no longer uses them.

- [ ] **Step 4: Run the unit tests to verify behavior is preserved**

Run:
```bash
yarn test:unit ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx
```

Expected: All tests pass with the **same test count** noted in Task 1, Step 2. The test on line 191 will still pass because it mocks `subscribeToMessengerEvent` at the module level (`../../../store/background-connection`), not at the hook level — the merged hook uses the same module path.

- [ ] **Step 5: Commit the call-site swap**

```bash
git add ui/pages/hardware-wallets/swap/hardware-wallet-signatures.tsx
git commit -m "refactor(swap): switch hardware-wallet-signatures to useHwSignTracker

Replaces two parallel hook calls + a ternary with a single call to the
merged tracker hook."
```

---

### Task 4: Update the test label and any references

**Files:**
- Modify: `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx:191` (test description string only — no mock changes needed)

- [ ] **Step 1: Update the test description string**

In `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx`, find line 191:

```typescript
  it('subscribes to TransactionController events via useHwBatchSignTracker', async () => {
```

Replace with:

```typescript
  it('subscribes to TransactionController events via useHwSignTracker', async () => {
```

The mock infrastructure (`mockSubscriptions` in `hardware-wallet-signatures.test.tsx:104-123`) does NOT need to change because it mocks `subscribeToMessengerEvent` from `../../../store/background-connection`, which is the same module the merged hook imports.

- [ ] **Step 2: Run the tests to verify they still pass**

Run:
```bash
yarn test:unit ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx
```

Expected: All tests pass with the same test count.

- [ ] **Step 3: Commit the test description update**

```bash
git add ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx
git commit -m "test(swap): rename useHwBatchSignTracker reference to useHwSignTracker

Test description label update only — no mock infrastructure changes
needed since the underlying module mock is unchanged."
```

---

### Task 5: Delete the old tracker files

**Files:**
- Delete: `ui/pages/hardware-wallets/swap/useHwBatchSignTracker.ts`
- Delete: `ui/pages/hardware-wallets/swap/useHwSequentialSignTracker.ts`

- [ ] **Step 1: Verify nothing else imports the deleted hooks**

Run:
```bash
grep -r "useHwBatchSignTracker\|useHwSequentialSignTracker" ui/ app/ shared/ test/ 2>/dev/null
```

Expected: Only the `.tsx.tsx` and `.test.tsx` files in the same `swap/` directory should appear, and those references should already be gone (after Task 3 and Task 4). If any other files import these names, stop and either delete those imports or revisit the merge.

- [ ] **Step 2: Delete both files**

Run:
```bash
rm ui/pages/hardware-wallets/swap/useHwBatchSignTracker.ts
rm ui/pages/hardware-wallets/swap/useHwSequentialSignTracker.ts
```

- [ ] **Step 3: Run TypeScript check to confirm no dangling references**

Run:
```bash
yarn lint:tsc
```

Expected: PASS.

- [ ] **Step 4: Commit the deletions**

```bash
git add -A ui/pages/hardware-wallets/swap/
git commit -m "refactor(swap): delete useHwBatchSignTracker and useHwSequentialSignTracker

Both files are fully replaced by useHwSignTracker.ts. No remaining
importers in ui/, app/, shared/, or test/."
```

---

### Task 6: Update `ui/pages/hardware-wallets/AGENTS.md`

**Files:**
- Modify: `ui/pages/hardware-wallets/AGENTS.md`

The AGENTS.md maintenance contract requires that any change to the tracker hooks be reflected in this file.

- [ ] **Step 1: Read the current AGENTS.md to identify all sections that need updates**

Run (mentally — no command needed):
- Path Selection diagram (`hardware-wallet-signatures.tsx` → `useHwBatchSignTracker` / `useHwSequentialSignTracker`)
- Hook Architecture block diagram (lists both hooks)
- Stale Event Filtering section (separate sub-sections per tracker)
- cancelCurrentBatch section (says "active one is selected based on `isStxEnabled`")
- Critical Details → "How the step-1→step-2 transition works" sub-section (describes both trackers)
- Key Files table (lists both tracker files)
- Device Disconnect/Reconnect Scenario (mentions `useHwBatchSignTracker`)
- Maintenance section (lists both tracker files)

- [ ] **Step 2: Update the Path Selection diagram**

Find:
```
hardware-wallet-signatures.tsx
  │
  ├── useSelector(getIsStxEnabled) → isStxEnabled
  │
  ├── useHwBatchSignTracker(..., { enabled: isStxEnabled })
  │     Active when STX is enabled
  │     Tracks events by batchId
  │
  ├── useHwSequentialSignTracker(..., { enabled: !isStxEnabled })
  │     Active when STX is disabled
  │     Tracks events by tx ID
  │
  └── cancelCurrentBatch = isStxEnabled ? cancelBatch : cancelSequential
```

Replace with:
```
hardware-wallet-signatures.tsx
  │
  ├── useSelector(getIsStxEnabled) → isStxEnabled
  │
  ├── useHwSignTracker(..., { enabled: true, useBatchTracking: isStxEnabled })
  │     Single hook with mode flag
  │     When useBatchTracking=true (STX enabled): tracks events by batchId
  │     When useBatchTracking=false (STX disabled): tracks events by tx ID
  │
  └── cancelCurrentBatch = useHwSignTracker returned value
```

- [ ] **Step 3: Update the Hook Architecture block diagram**

Find:
```
  ├── useHwBatchSignTracker
  │     Subscribes to 3 TransactionController messenger events
  │     Filters by fromAddress + batch type + batchId
  │     3-state currentBatchIdRef + staleBatchIdsRef Set for stale batch filtering
  │     retryGenerationRef to reset tracking on retries
  │     cancelCurrentBatch(): aborts tracked txs, waits for settle (5s max)
  │     pendingAbortTxIdsRef: filters events from aborted txs (resolves abort promise)
```

Replace with:
```
  ├── useHwSignTracker
  │     Single hook with useBatchTracking option (true = batch mode, false = sequential)
  │     Subscribes to 3 TransactionController messenger events
  │     Filters by fromAddress + batch type
  │     Batch mode: 3-state currentBatchIdRef + staleBatchIdsRef Set for stale batch filtering
  │     Sequential mode: trackedTxIdsRef Set for tx ID correlation
  │     retryGenerationRef to reset tracking on retries
  │     cancelCurrentBatch(): aborts tracked txs, waits for settle (5s max)
  │     pendingAbortTxIdsRef: filters events from aborted txs (resolves abort promise)
```

- [ ] **Step 4: Update the Stale Event Filtering section**

Replace the entire `### Batch Path: useHwBatchSignTracker` heading with `### Batch Mode (useBatchTracking=true)`.

Replace the entire `### Sequential Path: useHwSequentialSignTracker` heading with `### Sequential Mode (useBatchTracking=false)`.

Update any prose inside those sections that refers to the standalone hooks. For example: "uses a 3-state `currentBatchIdRef`" stays the same; "uses a `Set<string>` of tracked tx IDs" stays the same. The only change is the heading names.

- [ ] **Step 5: Update the cancelCurrentBatch section**

Find:
```
Both trackers return a `cancelCurrentBatch` function with the same interface. The active one is selected based on `isStxEnabled`. The function:
```

Replace with:
```
The merged hook returns a single `cancelCurrentBatch` function that handles both modes. The function:
```

- [ ] **Step 6: Update the Critical Details → step-1→step-2 transition section**

Find the sub-section labeled "Batch path (`useHwBatchSignTracker`):" and rename it to "Batch mode (`useBatchTracking=true`):".

Find the sub-section labeled "Sequential path (`useHwSequentialSignTracker`):" and rename it to "Sequential mode (`useBatchTracking=false`):".

No prose changes needed beyond the headings — the bullet points describe the tracking logic, which is unchanged.

- [ ] **Step 7: Update the Key Files table**

Find:
```
| `ui/pages/bridge/hardware-wallets/useHwBatchSignTracker.ts` | Centralized hook: subscribes to 3 `TransactionController` events, batch ID filtering, `cancelCurrentBatch()` with abort settle tracking, `pendingAbortTxIdsRef` filtering |
| `ui/pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine.ts` | Pure reducer: AwaitingFirst → AwaitingFinal → Submitted/Rejected/Failed/Disconnected + Reset |
| `ui/pages/bridge/hardware-wallets/hardware-wallet-signatures.utils.ts` | `SignatureStepStatus`, `getStepStatus()`, `getTitle()`, label/description helpers, `getTransactionField()` |
| `ui/pages/bridge/hardware-wallets/types.ts` | `BridgeStatusState`, `QrHardwareSignRequest` types |
| `ui/pages/bridge/hardware-wallets/useHwSequentialSignTracker.ts` | Sequential tracker: subscribes to 3 TransactionController events, tracks by tx ID (no batchId), `cancelCurrentBatch()` with abort settle tracking |
```

Replace with (note: also fixing `bridge/` → `hardware-wallets/` paths since the files live under `ui/pages/hardware-wallets/swap/`):
```
| `ui/pages/hardware-wallets/swap/useHwSignTracker.ts` | Merged hook: subscribes to 3 `TransactionController` events, branches by `useBatchTracking` option (batch ID filtering vs tx ID tracking), `cancelCurrentBatch()` with abort settle tracking, `pendingAbortTxIdsRef` filtering |
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine.ts` | Pure reducer: AwaitingFirst → AwaitingFinal → Submitted/Rejected/Failed/Disconnected + Reset |
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.utils.ts` | `SignatureStepStatus`, `getStepStatus()`, `getTitle()`, label/description helpers, `getTransactionField()` |
| `ui/pages/hardware-wallets/swap/types.ts` | `BridgeStatusState`, `QrHardwareSignRequest` types |
```

(Note: if the existing AGENTS.md already has `swap/` paths instead of `bridge/`, keep the existing paths and only change the hook file name. Verify by reading the file before editing.)

- [ ] **Step 8: Update the Device Disconnect/Reconnect Scenario**

Find references to `useHwBatchSignTracker` in this section and replace with `useHwSignTracker` (in batch mode).

- [ ] **Step 9: Update the Maintenance section**

Find:
```
- Changes to `useHwBatchSignTracker.ts`, `useHwSequentialSignTracker.ts`, or the state machine
```

Replace with:
```
- Changes to `useHwSignTracker.ts` or the state machine
```

- [ ] **Step 10: Verify the file still renders and all sections are consistent**

Run:
```bash
grep -n "useHwBatchSignTracker\|useHwSequentialSignTracker" ui/pages/hardware-wallets/AGENTS.md
```

Expected: no output (no remaining references to the old hook names). If any output appears, fix those references too.

- [ ] **Step 11: Commit the AGENTS.md update**

```bash
git add ui/pages/hardware-wallets/AGENTS.md
git commit -m "docs(hardware-wallets): update AGENTS.md for merged useHwSignTracker

Reflects the merge of useHwBatchSignTracker and useHwSequentialSignTracker
into a single useHwSignTracker hook with a useBatchTracking option."
```

---

### Task 7: Final verification

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run the changed-file linter with auto-fix**

Run:
```bash
yarn lint:changed:fix
```

Expected: completes without errors. If it modifies files (formatting), the changes are safe to keep — `yarn lint:changed:fix` is the repo-standard formatter.

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
yarn lint:tsc
```

Expected: PASS.

- [ ] **Step 3: Run the unit tests one more time**

Run:
```bash
yarn test:unit ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx
```

Expected: All tests pass with the **same test count** noted in Task 1, Step 2.

- [ ] **Step 4: Confirm no remaining references to deleted hooks anywhere**

Run:
```bash
grep -r "useHwBatchSignTracker\|useHwSequentialSignTracker" ui/ app/ shared/ test/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 5: If the linter modified files, commit those changes**

Check:
```bash
git status
```

If the linter changed any files (e.g., formatting tweaks), commit them:
```bash
git add -A
git commit -m "chore(swap): apply lint:changed:fix to merged tracker files"
```

If no files changed, skip this step.

- [ ] **Step 6: View the final commit log**

Run:
```bash
git log --oneline -10
```

Expected: 5-6 commits with the prefix `refactor(swap):` or `test(swap):` or `docs(hardware-wallets):`, all related to this merge.

---

## Self-Review

**1. Spec coverage:**
- ✅ Public API with `useBatchTracking` option → Task 2 Step 2
- ✅ Updated call site in `hardware-wallet-signatures.tsx` → Task 3
- ✅ Action type rename → Task 2 Step 1 (named `HwSignTrackerAction`)
- ✅ Refs declared upfront → Task 2 Step 2
- ✅ Shared `cancelCurrentBatch` → Task 2 Step 2
- ✅ Shared `handlePendingAbort` helper → Task 2 Step 3
- ✅ Mode-branching `checkGeneration` → Task 2 Step 3
- ✅ Mode-branching per-event handlers → Task 2 Step 3
- ✅ Per-mode log prefixes (`[HW-Batch]` / `[HW-Sequential]`) → Task 2 Step 3 (`logPrefix` variable)
- ✅ `useBatchTracking` in `useEffect` deps → Task 2 Step 3 (last lines of useEffect)
- ✅ Delete both old files → Task 5
- ✅ Update test label → Task 4
- ✅ Update AGENTS.md → Task 6
- ✅ Verification plan (lint, tsc, unit tests, grep for stale references) → Task 7
- ✅ Acceptance criteria — all checkable items covered

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "fill in details", "add appropriate error handling", "similar to Task N" patterns found. Every code-change step has full code.

**3. Type consistency:**
- `HwSignTrackerAction` used consistently across Tasks 2 and 3 ✓
- `UseHwSignTrackerOptions` used consistently ✓
- `useBatchTracking` parameter name used in spec, plan, and code ✓
- `cancelCurrentBatch` return name matches call site ✓
