import copyToClipboard from 'copy-to-clipboard';
import { useCallback, useState } from 'react';
import { COPY_OPTIONS } from '../../shared/constants/copy';
import { SECOND } from '../../shared/constants/time';
import { useTimeout } from './useTimeout';

// This is exported for use by the unit tests
export const DEFAULT_UI_DELAY = 2 * SECOND;

// This is "static" across all instances of the hook
let lastCopiedText = '';

/**
 * @param clearDelay - Delay before clearing the clipboard in ms. If set to -1, the clipboard will not be cleared automatically.
 * @returns [copied, handleCopy, resetState]
 */
export function useCopyToClipboard(
  clearDelay: number,
): [boolean, (text: string) => void, () => void] {
  const [copied, setCopied] = useState<boolean>(false);

  const startTimeout = useTimeout(
    () => {
      if (copied === true) {
        // Clear the clipboard if there's a positive delay
        if (clearDelay !== -1) {
          copyToClipboard(' ', COPY_OPTIONS);
        }

        lastCopiedText = '';
        setCopied(false);
      }
    },
    clearDelay === -1 ? DEFAULT_UI_DELAY : clearDelay, // Use the provided clearDelay, or if it's -1, the DEFAULT_UI_DELAY
    false,
  );

  const handleCopy = useCallback(
    (text: string) => {
      // eslint-disable-next-line react-compiler/react-compiler -- deliberate use of static variable
      lastCopiedText = text; // update the "static" lastCopiedText

      setCopied(true);
      startTimeout?.();
      copyToClipboard(text, COPY_OPTIONS);
    },
    [startTimeout],
  );

  const resetState = useCallback(() => {
    lastCopiedText = '';
    setCopied(false);
  }, []);

  return [copied, handleCopy, resetState];
}
