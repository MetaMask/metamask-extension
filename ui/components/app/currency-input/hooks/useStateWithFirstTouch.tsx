import { useState } from 'react';

// symbol to cover edge case where initial value is literally 'INITIAL_VALUE'
const INITIAL_VALUE = Symbol('INITIAL_VALUE');

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function useStateWithFirstTouch<T>(
  initialValue: T,
): [value: T, setValue: (value: T) => void, isChanged: boolean] {
  const [rawValue, setValue] = useState<T | typeof INITIAL_VALUE>(
    INITIAL_VALUE,
  );
  const value = rawValue === INITIAL_VALUE ? initialValue : rawValue;
  const isUnchanged = rawValue === INITIAL_VALUE;

  return [value, setValue, isUnchanged];
}
