import { useState, useCallback } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { MINUTE } from '../../shared/constants/time';
import { useTimeout } from './useTimeout';

/**
 * useCopyToClipboard
 *
 * @param {number} [delay=3000] - delay in ms
 * @returns {[boolean, Function]}
 */
const DEFAULT_DELAY = MINUTE;

export function useCopyToClipboard(delay = DEFAULT_DELAY) {
  const [copied, setCopied] = useState(false);
  const startTimeout = useTimeout(
    () => {
      copyToClipboard(' ');
      setCopied(false);
    },
    delay,
    false,
  );

  const handleCopy = useCallback(
    (text) => {
      setCopied(true);
      startTimeout();
      copyToClipboard(text);
    },
    [startTimeout],
  );

  return [copied, handleCopy];
}
