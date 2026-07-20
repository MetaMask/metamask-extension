import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTimeout
 *
 * @param cb - callback function inside setTimeout
 * @param delay - delay in ms
 * @param immediate - determines whether the timeout is invoked immediately
 * @returns startTimeout function
 */
export function useTimeout(
  cb: () => void,
  delay: number,
  immediate = true,
): () => void {
  const saveCb = useRef<() => void>();
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | 'start' | null>(null);

  useEffect(() => {
    saveCb.current = cb;
  }, [cb]);

  useEffect(() => {
    if (timeoutId !== 'start') {
      return undefined;
    }

    const id = setTimeout(() => {
      saveCb.current?.();
    }, delay);

    setTimeoutId(id);

    return () => {
      clearTimeout(timeoutId as ReturnType<typeof setTimeout>);
    };
  }, [delay, timeoutId]);

  const startTimeout = useCallback(() => {
    clearTimeout(timeoutId as ReturnType<typeof setTimeout>);
    setTimeoutId('start');
  }, [timeoutId]);

  if (immediate) {
    startTimeout();
  }

  return startTimeout;
}
