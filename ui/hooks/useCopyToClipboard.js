import { useState, useCallback } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { MINUTE } from '../../shared/constants/time';
import { COPY_OPTIONS } from '../../shared/constants/copy';
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
      copyToClipboard(' ', COPY_OPTIONS);
      setCopied(false);
    },
    delay,
    false,
  );

  const handleCopy = useCallback(
    (text) => {
      setCopied(true);
      startTimeout();
      copyToClipboard(text, COPY_OPTIONS);
    },
    [startTimeout],
  );

  return [copied, handleCopy];
}
