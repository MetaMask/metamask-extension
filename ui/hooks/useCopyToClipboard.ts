import { useCallback, useState } from 'react';
import { SECOND } from '../../shared/constants/time';
import { useTimeout } from './useTimeout';

// This is exported for use by the unit tests
export const DEFAULT_UI_DELAY = 2 * SECOND;

/**
 * @returns [copied, handleCopy, resetState]
 */
export function useCopyToClipboard(): [
  boolean,
  (text: string) => Promise<boolean>,
  () => void,
] {
  const [copied, setCopied] = useState<boolean>(false);

  const startTimeout = useTimeout(
    () => {
      if (copied === true) {
        setCopied(false);
      }
    },
    DEFAULT_UI_DELAY,
    false,
  );

  const handleCopy = useCallback(
    (text: string) => {
      globalThis.navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          startTimeout?.();
          return true;
        })
        .catch(() => false);
    },
    [startTimeout],
  );

  const resetState = useCallback(() => {
    setCopied(false);
  }, []);

  return [copied, handleCopy, resetState];
}
