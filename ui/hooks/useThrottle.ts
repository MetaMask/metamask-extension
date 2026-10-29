import { useState, useEffect, useRef } from 'react';

export function useThrottle<ValueType>(value: ValueType, interval = 500) {
  const [throttledValue, setThrottledValue] = useState<ValueType>(value);
  const lastUpdated = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (lastUpdated.current && now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
      return;
    }

    const id = window.setTimeout(() => {
      lastUpdated.current = Date.now();
      setThrottledValue(value);
    }, interval);

    return () => window.clearTimeout(id);
  }, [value, interval]);

  return throttledValue;
}
