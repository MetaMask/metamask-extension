import copyToClipboard from 'copy-to-clipboard';
import { useCallback, useState } from 'react';
import { COPY_OPTIONS } from '../../shared/constants/copy';
import { SECOND } from '../../shared/constants/time';
import { useTimeout } from './useTimeout';

// This is exported for use by the unit tests
export const DEFAULT_UI_DELAY = 2 * SECOND;

export type UseCopyToClipboardOptions = {
  /**
   * Delay before clearing the clipboard.
   * - `number`: clear the clipboard after this many ms
   * - `null`: never clear the clipboard automatically (UI state still resets after `DEFAULT_UI_DELAY`)
   */
  clearDelayMs: number | null;
};

/**
 * @param options0
 * @param options0.clearDelayMs
 * @returns [copied, handleCopy, resetState]
 */
export function useCopyToClipboard({
  clearDelayMs,
}: UseCopyToClipboardOptions): [boolean, (text: string) => void, () => void] {
  const [copied, setCopied] = useState<boolean>(false);

  if (clearDelayMs !== null && clearDelayMs <= 0) {
    throw new Error(
      'useCopyToClipboard: clearDelayMs must be a positive number or null',
    );
  }

  const shouldClearClipboard = clearDelayMs !== null;
  const timeoutDelayMs = shouldClearClipboard ? clearDelayMs : DEFAULT_UI_DELAY;

  const startTimeout = useTimeout(
    () => {
      if (copied === true) {
        if (shouldClearClipboard) {
          copyToClipboard(' ', COPY_OPTIONS);
        }

        setCopied(false);
      }
    },
    timeoutDelayMs,
    false,
  );

  const handleCopy = useCallback(
    (text: string) => {
      setCopied(true);
      startTimeout?.();
      copyToClipboard(text, COPY_OPTIONS);
    },
    [startTimeout],
  );

  const resetState = useCallback(() => {
    setCopied(false);
  }, []);

  return [copied, handleCopy, resetState];
}
