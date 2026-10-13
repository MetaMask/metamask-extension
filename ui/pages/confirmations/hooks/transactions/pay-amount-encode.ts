import { useSyncExternalStore } from 'react';

const encodes = new Map<string, number>();
const listeners = new Set<() => void>();

// Never recycled. Deriving the next token from the map reuses `1` after a
// finished encode is deleted, so a late end can clear a newer encode.
let nextGeneration = 0;

function emitPayAmountEncodes(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribePayAmountEncodes(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether confirmation must wait for this Pay amount. True from the start of
 * calldata encoding until that update settles. The previous quote stays
 * executable until the encoded calls are written.
 *
 * @param transactionId - Id of the confirmation.
 * @returns Whether the latest amount is still encoding.
 */
export function isPayAmountEncodePending(transactionId: string): boolean {
  return encodes.has(transactionId);
}

/**
 * Marks a Pay amount update as encoding. A newer call for the same
 * transaction replaces the previous one. The returned generation is never
 * reused.
 *
 * @param transactionId - Id of the confirmation.
 * @returns Generation that {@link endPayAmountEncode} must present.
 */
export function beginPayAmountEncode(transactionId: string): number {
  nextGeneration += 1;
  const generation = nextGeneration;
  encodes.set(transactionId, generation);
  emitPayAmountEncodes();
  return generation;
}

/**
 * Drops this generation when encoding settled. A newer amount keeps its own
 * generation.
 *
 * @param transactionId - Id of the confirmation.
 * @param generation - Generation returned by {@link beginPayAmountEncode}.
 */
export function endPayAmountEncode(
  transactionId: string,
  generation: number,
): void {
  if (encodes.get(transactionId) !== generation) {
    return;
  }

  encodes.delete(transactionId);
  emitPayAmountEncodes();
}

/**
 * Clears every in-flight Pay amount encode. Test isolation only.
 */
export function resetPayAmountEncodes(): void {
  if (encodes.size === 0) {
    return;
  }

  encodes.clear();
  emitPayAmountEncodes();
}

/**
 * Subscribes the confirmation to the Pay amount encode gate.
 *
 * @param transactionId - Id of the confirmation on screen.
 * @returns Whether confirm must wait for the in-flight encode.
 */
export function useIsPayAmountEncodePending(transactionId: string): boolean {
  return useSyncExternalStore(
    subscribePayAmountEncodes,
    () => isPayAmountEncodePending(transactionId),
    () => false,
  );
}
