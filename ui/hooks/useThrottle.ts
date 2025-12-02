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

    // eslint-disable-next-line consistent-return
    return () => window.clearTimeout(id);
  }, [value, interval]);

  return throttledValue;
}
