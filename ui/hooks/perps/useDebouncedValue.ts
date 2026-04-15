import { useEffect, useState } from 'react';

/**
 * Debounce a value so downstream consumers only see the settled result.
 *
 * Designed for stream-activation parameters (symbol, interval) where rapid
 * changes should collapse into a single subscription swap. Falsy values
 * propagate immediately so stale subscriptions are never kept alive.
 *
 * @param value - The value to debounce
 * @param delayMs - Debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Propagate falsy values immediately to avoid stale subscriptions
    if (!value) {
      setDebounced(value);
      return undefined;
    }

    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
