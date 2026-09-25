/**
 * Whether the UI resolved a Money Account deposit Max as eligible for Core's
 * atomic quoting, keyed by transaction id.
 *
 * Eligibility comes from UI-side selectors (the `atomicMaxEnabled` gate and a
 * matching fixed-spread route). The background needs the same answer again
 * later, when clearing a payment override re-derives `atomic` for an armed
 * Max, so the UI's verdict is recorded here rather than recomputed.
 */
const hintByTransactionId = new Map<string, boolean>();

/**
 * Records whether an armed Max may be quoted atomically.
 *
 * @param transactionId - Confirmation transaction id.
 * @param isAllowed - UI-resolved eligibility.
 */
export function setAtomicMaxHint(
  transactionId: string,
  isAllowed: boolean,
): void {
  hintByTransactionId.set(transactionId, isAllowed);
}

/**
 * Drops any hint recorded for a transaction.
 *
 * @param transactionId - Confirmation transaction id.
 */
export function clearAtomicMaxHint(transactionId: string): void {
  hintByTransactionId.delete(transactionId);
}

/**
 * Returns the recorded eligibility, defaulting to `false` so an unknown
 * transaction keeps the existing non-atomic Max behaviour.
 *
 * @param transactionId - Confirmation transaction id.
 * @returns Whether Max may be quoted atomically.
 */
export function isAtomicMaxAllowed(transactionId: string): boolean {
  return hintByTransactionId.get(transactionId) ?? false;
}

/**
 * Clears every recorded hint. Only use from tests.
 */
export function resetAtomicMaxHintsForTests(): void {
  hintByTransactionId.clear();
}
