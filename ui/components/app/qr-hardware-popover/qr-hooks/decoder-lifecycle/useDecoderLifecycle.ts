import { useCallback, useRef } from 'react';
import { URDecoder } from '@ngraveio/bc-ur';
import log from 'loglevel';
import type {
  BaseQrReaderProps,
  WebcamError,
} from '../../base-qr-reader/base-qr-reader.types';
import {
  classifyScanResult,
  isQrMismatchedTransactionError,
  ScanErrorCategory,
} from '../../qr-utils/qr-utils';
import type { DecoderCallbacks } from '../qr-hooks.types';

/**
 * Manages the URDecoder lifecycle: creating, receiving parts, tracking
 * progress, and forwarding complete URs to the parent handler.
 *
 * The decoder is stored in a ref rather than state because its internal
 * mutation (`receivePart`) should not trigger re-renders. Only the derived
 * `scanProgress` needs to update the UI.
 *
 * @param props - Subset of BaseQrReader props needed for decoding.
 * @param callbacks - State dispatchers for progress and errors.
 * @returns An object with `handleScan` (feed QR frames) and `resetDecoder`
 * (reinitialize the decoder for retry flows).
 */
export function useDecoderLifecycle(
  props: Pick<BaseQrReaderProps, 'handleSuccess' | 'expectedUrTypes'>,
  callbacks: DecoderCallbacks,
) {
  const { handleSuccess, expectedUrTypes } = props;
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
      try {
        const decoder = getDecoder();
        if (!data || decoder.isComplete()) {
          return;
        }

        // Between animation frame transitions the camera may decode the
        // same content multiple times. Skipping duplicates avoids
        // redundant fountain-code work and unnecessary state updates.
        if (data === lastScannedTextRef.current) {
          return;
        }
        lastScannedTextRef.current = data;

        decoder.receivePart(data);

        // Fountain decoding can fail silently (e.g. checksum mismatch) without
        // throwing. Detect this before checking isComplete so the error is surfaced.
        if (decoder.isError()) {
          const decoderFailure = classifyScanResult({
            decoderError: true,
            expectedTypes: expectedUrTypes,
          });
          if (decoderFailure) {
            setScanError(decoderFailure);
          }
          return;
        }

        if (decoder.isComplete()) {
          const result = decoder.resultUR();

          const detectedError = classifyScanResult({
            decodedType: result.type,
            expectedTypes: expectedUrTypes,
          });

          if (detectedError) {
            setScanError(detectedError);
            return;
          }

          handleSuccess(result).catch((successError: unknown) => {
            if (isQrMismatchedTransactionError(successError)) {
              setScanError({
                category: ScanErrorCategory.MismatchedSignId,
                isUrFormat: true,
              });
              return;
            }
            setError(successError as WebcamError);
          });
          return;
        }

        // Progress is only updated for incomplete multi-frame scans.
        // Single-frame QR codes complete immediately above, avoiding a
        // needless state update and React re-render.
        setScanProgress(decoder.estimatedPercentComplete());
      } catch (exception) {
        const detectedError = classifyScanResult({
          text: lastScannedTextRef.current ?? undefined,
          expectedTypes: expectedUrTypes,
          exception,
        });

        if (detectedError) {
          if (detectedError.category === ScanErrorCategory.ScanException) {
            log.warn('QR scan exception', exception);
          }
          setScanError(detectedError);
        }
      }
    },
    [handleSuccess, expectedUrTypes, setScanProgress, setScanError, setError],
  );

  return { handleScan, resetDecoder } as const;
}
