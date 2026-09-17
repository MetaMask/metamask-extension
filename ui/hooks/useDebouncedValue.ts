import { useEffect, useRef, useState } from 'react';

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
  const prevDelayMsRef = useRef(delayMs);

  useEffect(() => {
    if (delayMs <= 0) {
      queueMicrotask(() => setDebounced(value));
      prevDelayMsRef.current = delayMs;
      return undefined;
    }

    if (prevDelayMsRef.current <= 0) {
      queueMicrotask(() => setDebounced(value));
    }
    prevDelayMsRef.current = delayMs;

    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  if (delayMs <= 0) {
    return value;
  }

  return debounced;
};
