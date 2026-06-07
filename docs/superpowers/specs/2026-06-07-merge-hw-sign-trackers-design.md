# Merge HW Batch + Sequential Sign Trackers

**Date:** 2026-06-07
**Status:** Approved (verbal)
**Scope:** Refactor — pure behavior-preserving merge of two React hooks into one.

## Context

The hardware wallet signing flow in `ui/pages/hardware-wallets/swap/` currently has two parallel tracker hooks:

- `useHwBatchSignTracker.ts` (443 lines) — active when Smart Transactions (STX) is enabled; tracks events by `batchId`.
- `useHwSequentialSignTracker.ts` (309 lines) — active when STX is disabled; tracks events by tx ID.

The component `hardware-wallet-signatures.tsx` always calls both (rules of hooks), gates each with a complementary `enabled` flag, and picks the active `cancelCurrentBatch` at the call site via a ternary on `isStxEnabled`.

The two hooks share ~70% of their code: identical imports, constants, helpers (`matchesTx`), action type, options type, `cancelCurrentBatch` implementation, subscription orchestration, and abort-settle tracking. The divergence is concentrated in:

1. **`checkGeneration` (retry handling)** — batch mode marks seen batch IDs as stale and resets `currentBatchIdRef` to `null`; sequential mode simply clears `trackedTxIdsRef`.
2. **Per-event rejection/finished filtering** — batch mode validates against the 3-state `currentBatchIdRef` (undefined/null/string) plus `staleBatchIdsRef`; sequential mode checks tx ID membership in `trackedTxIdsRef`.
3. **Initial-event blocking** — batch mode blocks rejection/finished events until a `signed` event identifies the current batch (`shouldBlockPendingEvent`); sequential mode dispatches immediately for tracked tx IDs.

## Problem

The current split has three costs:

1. **Maintenance drift** — any change to shared logic (subscription setup, abort handling, event payloads, log format) must be made in two places.
2. **Call-site ceremony** — the component must call both hooks, destructure both, and pick the active `cancelCurrentBatch`.
3. **Inconsistent ergonomics** — the sequential tracker has a cleaner `handlePendingAbort` helper; the batch tracker inlines the same logic three times.

## Solution

Merge both hooks into a single `useHwSignTracker` hook with a `useBatchTracking: boolean` option.

### Public API

```typescript
type UseHwSignTrackerOptions = {
  enabled?: boolean;
  useBatchTracking: boolean;
};

function useHwSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: React.Dispatch<HwSignTrackerAction>,
  options: UseHwSignTrackerOptions,
  retryGenerationRef?: React.RefObject<number>,
): { cancelCurrentBatch: () => Promise<void> };
```

Note: parameter order is `options` then `retryGenerationRef?` (not the reverse) so the required `options` doesn't follow an optional param (TS1016).

### Updated call site (`hardware-wallet-signatures.tsx`)

Before (18 lines, two hook calls, one ternary):

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
```

After (8 lines, one hook call, no ternary):

```typescript
const { cancelCurrentBatch } = useHwSignTracker(
  fromAddress,
  hardwareWalletUsed,
  needsTwoConfirmations,
  dispatchSignatureEvent,
  retryGenerationRef,
  { enabled: true, useBatchTracking: isStxEnabled },
);
```

`enabled` is now always `true` since exactly one of the two trackers was always enabled. We keep the `enabled` flag for completeness (defensive option), but the call site does not gate on `isStxEnabled`.

### Action type rename

The action type is renamed from `HwBatchSignTrackerAction` / `HwSequentialSignTrackerAction` to `HwSignTrackerAction`. The union members are unchanged — they all dispatch values from `HardwareWalletSignatureEvent`, which is shared.

## Internal Structure of the Merged Hook

### Refs (declared upfront; some only used in batch mode)

| Ref | Used by | Purpose |
|-----|---------|---------|
| `dispatchRef` | both | Stable dispatch reference |
| `trackedTxIdsRef: Set<string>` | both | All tx IDs seen for the current address + batch type |
| `pendingAbortTxIdsRef: Set<string>` | both | Tracks in-flight aborts to suppress their events |
| `abortSettleResolveRef: (() => void) \| null` | both | Resolves the abort-settle promise |
| `lastSeenGenerationRef: number` | both | Detects retry generation changes |
| `currentBatchIdRef: string \| null \| undefined` | batch only | 3-state batch tracking (undefined=initial, null=post-retry, string=active) |
| `staleBatchIdsRef: Set<string>` | batch only | All batch IDs from prior generations |
| `seenBatchIdsRef: Set<string>` | batch only | All batch IDs seen in the current generation |

### `cancelCurrentBatch` (shared logic)

Identical between the two implementations. Unified verbatim.

### `handlePendingAbort` helper (shared)

Adopt the sequential tracker's cleaner helper, used in all three event handlers:

```typescript
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
```

### `checkGeneration` (mode-branching)

```typescript
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
```

### Per-event handlers (mode-branching at the few divergence points)

The `transactionStatusUpdated`, `transactionRejected`, and `transactionFinished` handlers share:

1. `cancelled` check
2. `checkGeneration()` call
3. log line (per-mode prefix)
4. `matchesTx` filter
5. Add tx ID to `trackedTxIdsRef`
6. (Batch mode only) add batch ID to `seenBatchIdsRef`
7. `handlePendingAbort` short-circuit

After the shared prologue, the handlers branch:

**`transactionStatusUpdated`**:
- `signed`:
  - Batch mode: validate/lock `currentBatchIdRef`, skip stale batches, then dispatch `FirstSignatureSubmitted` (approval) or `TransactionSubmitted` (trade)
  - Sequential mode: dispatch `FirstSignatureSubmitted` or `TransactionSubmitted` directly
- `failed`:
  - Batch mode: block if `currentBatchIdRef === undefined` (no batch identified yet) or if event is from a stale batch; otherwise dispatch `TransactionFailed`
  - Sequential mode: dispatch `TransactionFailed` directly

**`transactionRejected`**:
- Batch mode: block if no batch identified yet, or stale batch; otherwise dispatch `TransactionRejected`
- Sequential mode: only dispatch if tx ID is in `trackedTxIdsRef`

**`transactionFinished`**:
- Batch mode: block if no batch identified yet, or stale batch; on `status === 'rejected'` dispatch `TransactionRejected`, on `status === 'failed'` dispatch `TransactionFailed`
- Sequential mode: only dispatch if tx ID is in `trackedTxIdsRef`; same status dispatch logic

### Log prefixes

Per-mode prefixes are kept (`[HW-Batch]` / `[HW-Sequential]`) for log readability. They're selected at handler-invocation time based on the captured `useBatchTracking` flag, so logs identify which tracking path fired without requiring a debugger.

### Effect dependencies

The `useEffect` dependency array becomes: `[fromAddress, hardwareWalletUsed, retryGenerationRef, enabled, useBatchTracking]`.

`useBatchTracking` is intentionally included in the deps array to preserve today's behavior: if `isStxEnabled` toggles mid-session (e.g., via LaunchDarkly remote config update), the effect re-subscribes with the new mode. This matches today's behavior where both trackers' `enabled` flags are in their respective deps arrays, so a toggle triggers cleanup + resubscribe on the active tracker.

No `react-hooks/exhaustive-deps` suppression is needed.

## Files Affected

| File | Action | Notes |
|------|--------|-------|
| `ui/pages/hardware-wallets/swap/useHwSignTracker.ts` | **Create** | Merged hook |
| `ui/pages/hardware-wallets/swap/useHwBatchSignTracker.ts` | **Delete** | Replaced by merged hook |
| `ui/pages/hardware-wallets/swap/useHwSequentialSignTracker.ts` | **Delete** | Replaced by merged hook |
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.tsx` | **Update** | Replace both hook calls with single `useHwSignTracker` call; remove `cancelCurrentBatch` ternary |
| `ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx` | **Update** | Update any test references to `useHwBatchSignTracker` (line 191 mentions it by name) |
| `ui/pages/hardware-wallets/AGENTS.md` | **Update** | Replace dual-tracker documentation with single-hook documentation; update Key Files table; update Hook Architecture diagram |

## What Stays Unchanged

- **Behavior** — no semantic changes; the same events dispatch the same state machine actions under the same conditions.
- **State machine** — `hardwareWalletSignaturesReducer` is untouched.
- **`cancelCurrentBatch` interface** — same return type `() => Promise<void>`, same abort logic, same 5-second settle timeout.
- **Test coverage** — existing unit tests in `hardware-wallet-signatures.test.tsx` continue to pass unchanged (the test that mocks the tracker will need its mock target updated).
- **Subscription wiring** — same three `TransactionController` events (`transactionStatusUpdated`, `transactionRejected`, `transactionFinished`), same `subscribeToMessengerEvent` calls, same cleanup.
- **Retry semantics** — the retry generation ref, stale event filtering, abort-settle tracking, and 5-second timeout all behave identically.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Mode-branching inside handlers makes the merged hook harder to read than two focused hooks | The branches are short (5-10 lines each) and concentrated at known divergence points. Shared prologue remains DRY. Net readability win because readers no longer have to mentally diff two 400-line files. |
| `useBatchTracking` toggling mid-session (LaunchDarkly update) could cause stale state | Included in `useEffect` deps, so toggling triggers proper cleanup + resubscribe — same behavior as today's dual-tracker setup. |
| Test mock target changes | Update `hardware-wallet-signatures.test.tsx` to mock `useHwSignTracker` instead of `useHwBatchSignTracker`. Trivial single-line change. |
| AGENTS.md documentation drift | Update AGENTS.md in the same commit. Required by the maintenance section of the existing AGENTS.md. |

## Out of Scope

- No change to the state machine (`hardwareWalletSignaturesReducer`).
- No change to the retry flow (`handleRetry` in `hardware-wallet-signatures.tsx`).
- No change to `cancelCurrentBatch` semantics.
- No change to subscription events or background RPCs.
- No change to other HW swap hooks (`useHwSwapQuoteData`, `useHwSwapSubmission`, `useHwSwapConnectionMonitoring`, `useHwSwapConfirmationMonitoring`, `useHwSwapQrState`, `useHwSwapNavigation`).

## Verification Plan

1. Run unit tests: `yarn test:unit ui/pages/hardware-wallets/swap/hardware-wallet-signatures.test.tsx`
2. Run linter: `yarn lint:changed:fix`
3. Run TypeScript check: `yarn lint:tsc`
4. Manual visual QA via the metamask-visual-testing skill (optional — not required for a pure refactor).
5. Confirm both deleted files have no remaining imports: `grep -r "useHwBatchSignTracker\|useHwSequentialSignTracker" ui/`

## Acceptance Criteria

- [ ] Single file `useHwSignTracker.ts` exists in `ui/pages/hardware-wallets/swap/`
- [ ] Both `useHwBatchSignTracker.ts` and `useHwSequentialSignTracker.ts` are deleted
- [ ] `hardware-wallet-signatures.tsx` makes a single `useHwSignTracker` call with `{ enabled: true, useBatchTracking: isStxEnabled }`
- [ ] No `cancelCurrentBatch` ternary at the call site
- [ ] `hardware-wallet-signatures.test.tsx` passes with updated mock target
- [ ] `ui/pages/hardware-wallets/AGENTS.md` reflects the merged architecture
- [ ] `yarn lint:changed:fix` succeeds
- [ ] `yarn lint:tsc` succeeds
- [ ] No remaining references to the deleted hook names anywhere in `ui/`
