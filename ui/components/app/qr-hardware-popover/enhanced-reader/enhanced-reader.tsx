import React, { useEffect, useMemo, useRef } from 'react';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserQRCodeReader } from '@zxing/browser';
import log from 'loglevel';
import { MILLISECOND } from '../../../../../shared/constants/time';
import Spinner from '../../../ui/spinner';
import type { EnhancedReaderProps } from './enhanced-reader.types';

// Delay between ZXing scan attempts and successes to avoid CPU thrashing.
const SCAN_INTERVAL_MS = MILLISECOND * 100;

/**
 * Stateless QR code reader that streams decoded frames to the parent.
 *
 * Visibility and lifecycle are driven externally via `isVisible`.
 * The component manages only the ZXing reader instance, and it's cleanup.
 * @param options0
 * @param options0.onFrame
 * @param options0.onCameraError
 * @param options0.isVisible
 */
const EnhancedReader: React.FC<EnhancedReaderProps> = ({
  onFrame,
  onCameraError,
  isVisible,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const codeReader = useMemo(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    return new BrowserQRCodeReader(hints, {
      delayBetweenScanAttempts: SCAN_INTERVAL_MS,
      delayBetweenScanSuccess: SCAN_INTERVAL_MS,
    });
  }, []);

  // Side-effect: starts the camera stream and continuous QR decoding.
  // Cleanup stops the stream when the component unmounts or deps change.
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) {
      return undefined;
    }

    const promise = codeReader.decodeFromVideoDevice(
      undefined,
      videoElem,
      (result, error) => {
        if (result) {
          onFrame(result.getText());
        }
        if (error && onCameraError) {
          onCameraError(error);
        }
      },
    );

    return () => {
      promise
        .then((controls) => controls?.stop())
        .catch(log.info);
    };
  }, [codeReader, onFrame, onCameraError]);

  return (
    <div className="qr-scanner__content__video-wrapper">
      <video
        ref={videoRef}
        style={{
          display: isVisible ? 'block' : 'none',
          width: '100%',
          filter: 'blur(4px)',
        }}
      />
      {isVisible ? null : <Spinner />}
    </div>
  );
};

export default EnhancedReader;
