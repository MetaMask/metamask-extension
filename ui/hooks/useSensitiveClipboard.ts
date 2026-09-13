import { useCallback, useState } from 'react';
import { useCopyToClipboard } from './useCopyToClipboard';

export type SensitiveClipboardState = 'idle' | 'ready' | 'cleared' | 'error';

export function useSensitiveClipboard() {
  const [, copyToClipboard] = useCopyToClipboard();
  const [state, setState] = useState<SensitiveClipboardState>('idle');

  const copySensitiveValue = useCallback(
    async (text: string) => {
      const copied = await copyToClipboard(text);
      if (copied) {
        setState('ready');
      }
      return copied;
    },
    [copyToClipboard],
  );

  const clearSensitiveValue = useCallback(async () => {
    try {
      await globalThis.navigator.clipboard.writeText('');
      setState('cleared');
      return true;
    } catch {
      setState('error');
      return false;
    }
  }, []);

  return { state, copySensitiveValue, clearSensitiveValue };
}
