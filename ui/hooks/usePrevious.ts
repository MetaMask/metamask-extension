import { useEffect, useRef } from 'react';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function usePrevious<T>(value: T): T | undefined {
  // Deliberate opt-out: this hook's contract IS returns the previous render's value by reading a ref during render — auto-memoization
  // would freeze its output. Do not remove without redesigning the hook.
  // See MetaMask-planning#6551 (root-cause cluster A).
  'use no memo';

  const ref = useRef<T | undefined>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
