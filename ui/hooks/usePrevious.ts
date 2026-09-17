import { useRef } from 'react';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function usePrevious<T>(value: T): T | undefined {
  const stored = useRef<{ current: T; previous: T | undefined }>({
    current: value,
    previous: undefined,
  });

  if (!Object.is(stored.current.current, value)) {
    stored.current = {
      current: value,
      previous: stored.current.current,
    };
  }

  return stored.current.previous;
}
