import { useCallback, useRef } from 'react';
import { URDecoder } from '@ngraveio/bc-ur';
import type { BaseReaderProps, WebcamError } from '../base-reader.types';
import { classifyScanResult } from '../qr-utils/qr-utils';
import type { DecoderCallbacks } from './qr-hooks.types';
import {
  PAIRING_EXPECTED_TYPES,
  SIGNING_EXPECTED_TYPES,
} from './qr-hooks-utils';

/**
 * Manages the URDecoder lifecycle: creating, receiving parts, tracking
 * progress, and forwarding complete URs to the parent handler.
 *
 * The decoder is stored in a ref rather than state because its internal
 * mutation (receivePart) shouldn't trigger re-renders — only the derived
 * `scanProgress` needs to update the UI.
 *
 * @param props - Subset of BaseReader props needed for decoding.
 * @param callbacks - State dispatchers for progress and errors.
 * @returns An object with `handleScan` (feed QR frames) and `resetDecoder`
 * (reinitialize the decoder for retry flows).
 */
export function useDecoderLifecycle(
  props: Pick<BaseReaderProps, 'handleSuccess' | 'isReadingWallet'>,
  callbacks: DecoderCallbacks,
) {
  const { handleSuccess, isReadingWallet } = props;
  const { setScanProgress, setScanError, setError } = callbacks;
  const decoderRef = useRef<URDecoder | null>(null);
  const lastScannedTextRef = useRef<string | null>(null);

  /**
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
    lastScannedTextRef.current = null;
    setScanProgress(0);
  }, [setScanProgress]);

  /**
   * Feeds a scanned QR payload into the URDecoder. When the UR is fully
   * assembled, invokes `handleSuccess` with the decoded result.
   *
   * On failure, classifies the error via {@link classifyScanResult} and
   * dispatches the result as a structured `scanError`.
   *
   * @param data - Raw text content of a single scanned QR frame, or null.
   */
  const handleScan = useCallback(
    (data: string | null) => {
      const expectedTypes = isReadingWallet
        ? PAIRING_EXPECTED_TYPES
        : SIGNING_EXPECTED_TYPES;

      try {
        const decoder = getDecoder();
        if (!data || decoder.isComplete()) {
          return;
        }
        lastScannedTextRef.current = data;
        decoder.receivePart(data);
        setScanProgress(decoder.estimatedPercentComplete());
        if (decoder.isComplete()) {
          const result = decoder.resultUR();

          const detectedError = classifyScanResult({
            decodedType: result.type,
            expectedTypes,
          });

          if (detectedError) {
            setScanError(detectedError);
            return;
          }

          handleSuccess(result).catch((successError: WebcamError) =>
            setError(successError),
          );
        }
      } catch (exception) {
        const detectedError = classifyScanResult({
          text: lastScannedTextRef.current ?? undefined,
          expectedTypes,
          exception,
        });

        if (detectedError) {
          setScanError(detectedError);
        }
      }
    },
    [handleSuccess, isReadingWallet, setScanProgress, setScanError, setError],
  );

  return { handleScan, resetDecoder } as const;
}
