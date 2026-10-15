import { useCallback, useEffect, useRef, useState } from 'react';
import { SECOND } from '../../shared/constants/time';
import { useTimeout } from './useTimeout';

// This is exported for use by the unit tests
export const DEFAULT_UI_DELAY = 2 * SECOND;

export type SensitiveClipboardState = 'idle' | 'ready' | 'cleared' | 'error';

type SensitiveClipboard = {
  state: SensitiveClipboardState;
  clear: () => Promise<boolean>;
};

type UseCopyToClipboardOptions = {
  sensitive: true;
};

type CopyToClipboard = (text: string) => Promise<boolean>;

type StandardCopyToClipboardResult = [boolean, CopyToClipboard, () => void];

type SensitiveCopyToClipboardResult = [
  boolean,
  CopyToClipboard,
  () => void,
  SensitiveClipboard,
];

/**
 * @param options
 * @returns [copied, handleCopy, resetState]
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions,
): SensitiveCopyToClipboardResult;
export function useCopyToClipboard(): StandardCopyToClipboardResult;
export function useCopyToClipboard(
  options?: UseCopyToClipboardOptions,
): StandardCopyToClipboardResult | SensitiveCopyToClipboardResult {
  const [copied, setCopied] = useState<boolean>(false);
  const [sensitiveClipboardState, setSensitiveClipboardState] =
    useState<SensitiveClipboardState>('idle');
  const sensitiveClipboardTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isSensitive = options?.sensitive === true;

  const clearSensitiveClipboardTimeout = useCallback(() => {
    if (sensitiveClipboardTimeoutRef.current) {
      clearTimeout(sensitiveClipboardTimeoutRef.current);
      sensitiveClipboardTimeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => clearSensitiveClipboardTimeout(),
    [clearSensitiveClipboardTimeout],
  );

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
    async (text: string) => {
      try {
        await globalThis.navigator.clipboard.writeText(text);
        setCopied(true);
        if (isSensitive) {
          clearSensitiveClipboardTimeout();
          setSensitiveClipboardState('ready');
        }
        startTimeout?.();
        return true;
      } catch {
        return false;
      }
    },
    [clearSensitiveClipboardTimeout, isSensitive, startTimeout],
  );

  const resetState = useCallback(() => {
    setCopied(false);
  }, []);

  const clearSensitiveClipboard = useCallback(async () => {
    try {
      await globalThis.navigator.clipboard.writeText('');
      clearSensitiveClipboardTimeout();
      setSensitiveClipboardState('cleared');
      sensitiveClipboardTimeoutRef.current = setTimeout(() => {
        setSensitiveClipboardState('idle');
        sensitiveClipboardTimeoutRef.current = null;
      }, DEFAULT_UI_DELAY);
      return true;
    } catch {
      setSensitiveClipboardState('error');
      return false;
    }
  }, [clearSensitiveClipboardTimeout]);

  if (isSensitive) {
    return [
      copied,
      handleCopy,
      resetState,
      {
        state: sensitiveClipboardState,
        clear: clearSensitiveClipboard,
      },
    ];
  }

  return [copied, handleCopy, resetState];
}
