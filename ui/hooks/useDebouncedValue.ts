import { useEffect, useState } from 'react';
import { usePrevious } from './usePrevious';

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Returns a debounced copy of `value` that updates only after `delayMs` has
 * elapsed without further changes. Useful for keeping expensive effects
 * (network calls, heavy filtering, etc.) off the critical typing path.
 *
 * When `delayMs <= 0` the debounced value tracks the source synchronously.
 *
 * @param value - The current source value.
 * @param delayMs - Debounce window in milliseconds. Defaults to 300.
 * @returns The debounced value.
 */
export const useDebouncedValue = <Value>(
  value: Value,
  delayMs: number = DEFAULT_DEBOUNCE_MS,
): Value => {
  const [debounced, setDebounced] = useState<Value>(value);
  const [immediateSnapshot, setImmediateSnapshot] = useState<Value>(value);
  const previousDelayMs = usePrevious(delayMs);

  useEffect(() => {
    if (delayMs <= 0) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) {
          setDebounced(value);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;

    const applyDebounced = (next: Value) => {
      if (!cancelled) {
        setDebounced(next);
      }
    };

    if (previousDelayMs !== undefined && previousDelayMs <= 0) {
      queueMicrotask(() => {
        setImmediateSnapshot(value);
        applyDebounced(value);
      });
    }

    const timer = setTimeout(() => applyDebounced(value), delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, delayMs, previousDelayMs]);

  if (delayMs <= 0) {
    return value;
  }

  const staleAfterImmediate =
    debounced !== value &&
    value === immediateSnapshot &&
    debounced !== immediateSnapshot;

  if (
    (previousDelayMs !== undefined &&
      previousDelayMs <= 0 &&
      debounced !== value) ||
    staleAfterImmediate
  ) {
    return value;
  }

  return debounced;
};
