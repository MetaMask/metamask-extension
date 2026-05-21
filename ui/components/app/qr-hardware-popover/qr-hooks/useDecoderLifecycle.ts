import { useCallback, useRef } from 'react';
import { URDecoder } from '@ngraveio/bc-ur';
import type { useI18nContext } from '../../../../hooks/useI18nContext';
import type { BaseReaderProps, WebcamError } from '../base-reader.types';
import type { DecoderCallbacks } from './qr-hooks.types';

/**
 * Manages the URDecoder lifecycle: creating, receiving parts, tracking
 * progress, and forwarding complete URs to the parent handler.
 *
 * The decoder is stored in a ref rather than state because its internal
 * mutation (receivePart) shouldn't trigger re-renders — only the derived
 * `scanProgress` needs to update the UI.
 *
 * @param props - Subset of BaseReader props needed for decoding:
 * `handleSuccess`, `isReadingWallet`, and `setErrorTitle`.
 * @param callbacks - State dispatchers: `setScanProgress` and `setError`.
 * @param t - i18n translation function used for error messages.
 * @returns An object with `handleScan` (feed QR frames) and `resetDecoder`
 * (reinitialize the decoder for retry flows).
 */
export function useDecoderLifecycle(
  props: Pick<
    BaseReaderProps,
    'handleSuccess' | 'isReadingWallet' | 'setErrorTitle'
  >,
  callbacks: DecoderCallbacks,
  t: ReturnType<typeof useI18nContext>,
) {
  const { handleSuccess, isReadingWallet, setErrorTitle } = props;
  const { setScanProgress, setError } = callbacks;
  const decoderRef = useRef<URDecoder | null>(null);

  /**
   * Lazy-init accessor for the URDecoder ref.
   *
   * Constructs the decoder on first access and returns the same instance on
   * subsequent calls, avoiding wasteful instantiation on every render while
   * providing a guaranteed non-null return type to callers.
   *
   * @returns The current URDecoder instance (created if not yet initialized).
   */
  function getDecoder(): URDecoder {
    if (decoderRef.current === null) {
      decoderRef.current = new URDecoder();
    }
    return decoderRef.current;
  }

  /**
   * Resets the decoder to a fresh instance and clears scan progress.
   * Used when retrying after an error.
   */
  const resetDecoder = useCallback(() => {
    decoderRef.current = new URDecoder();
    setScanProgress(0);
  }, [setScanProgress]);

  /**
   * Feeds a scanned QR payload into the URDecoder. When the UR is fully
   * assembled, invokes `handleSuccess` with the decoded result.
   *
   * @param data - Raw text content of a single scanned QR frame, or null.
   */
  const handleScan = useCallback(
    (data: string | null) => {
      try {
        const decoder = getDecoder();
        if (!data || decoder.isComplete()) {
          return;
        }
        decoder.receivePart(data);
        setScanProgress(decoder.estimatedPercentComplete());
        if (decoder.isComplete()) {
          const result = decoder.resultUR();
          handleSuccess(result).catch((successError: WebcamError) =>
            setError(successError),
          );
        }
      } catch {
        if (isReadingWallet) {
          setErrorTitle(t('QRHardwareUnknownQRCodeTitle'));
        } else {
          setErrorTitle(t('QRHardwareInvalidTransactionTitle'));
        }
        setError(new Error(t('unknownQrCode')));
      }
    },
    [
      handleSuccess,
      isReadingWallet,
      setErrorTitle,
      t,
      setScanProgress,
      setError,
    ],
  );

  return { handleScan, resetDecoder } as const;
}
