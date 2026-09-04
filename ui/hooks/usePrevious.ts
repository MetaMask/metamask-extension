import { useState } from 'react';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function usePrevious<T>(value: T): T | undefined {
  const [state, setState] = useState<{ current: T; previous: T | undefined }>(
    () => ({
      current: value,
      previous: undefined,
    }),
  );

  if (state.current !== value) {
    setState({ current: value, previous: state.current });
  }

  return state.previous;
}
