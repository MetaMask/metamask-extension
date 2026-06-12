import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserQRCodeReader } from '@zxing/browser';
import log from 'loglevel';
import { MILLISECOND } from '../../../../../shared/constants/time';
import Spinner from '../../../ui/spinner';
import type { EnhancedQrReaderProps } from './enhanced-qr-reader.types';

// Delay after a failed decode attempt. Kept moderate to prevent CPU
// thrashing while still retrying promptly.
const SCAN_ATTEMPT_DELAY_MS = MILLISECOND * 80;

// Delay after a successful decoding. Lower than the attempt delay so
// animated multi-part UR QR codes are captured faster.
const SCAN_SUCCESS_DELAY_MS = MILLISECOND * 50;

// Request HD resolution for clearer QR detection. Uses `ideal` rather
// than `min` so cameras that cannot deliver 720p still work.
const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

/**
 * Continuous QR code scanner using ZXing.
 *
 * Renders a `<video>` element backed by `BrowserQRCodeReader` and calls
 * `onFrame` with the decoded text on each successful scan. Shows a spinner
 * until the camera stream fires `canplay`. The camera stream and decode
 * loop are stopped automatically when the component unmounts.
 *
 * @param props - Component props.
 * @param props.onFrame - Callback receiving the decoded QR text per frame.
 */
const EnhancedQrReader = ({ onFrame }: EnhancedQrReaderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);

  const codeReader = useMemo(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    // Multi-pass detection for blurry or angled frames.
    hints.set(DecodeHintType.TRY_HARDER, true);
    // Explicit encoding to avoid heuristic guessing across platforms.
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    return new BrowserQRCodeReader(hints, {
      delayBetweenScanAttempts: SCAN_ATTEMPT_DELAY_MS,
      delayBetweenScanSuccess: SCAN_SUCCESS_DELAY_MS,
    });
  }, []);

  // Listens for the video element's canplay event to hide the spinner
  // once the camera stream has buffered enough data to start rendering.
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) {
      return undefined;
    }

    const handleCanPlay = () => setCanPlay(true);
    videoElem.addEventListener('canplay', handleCanPlay);

    return () => {
      videoElem.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Starts the camera stream with explicit resolution constraints and
  // continuous QR decoding. Cleanup stops the stream on unmounting.
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) {
      return undefined;
    }

    const promise = codeReader.decodeFromConstraints(
      VIDEO_CONSTRAINTS,
      videoElem,
      (result) => {
        if (result) {
          onFrame(result.getText());
        }
      },
    );

    // Prevent unhandled rejection if the stream fails to start (e.g.
    // camera disconnected between the permission probe and here).
    promise.catch(log.debug);

    return () => {
      promise.then((controls) => controls?.stop()).catch(log.debug);
    };
  }, [codeReader, onFrame]);

  return (
    <div className="qr-scanner__content__video-wrapper">
      <video
        ref={videoRef}
        style={{
          display: canPlay ? 'block' : 'none',
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
          filter: 'blur(4px)',
        }}
      />
      {canPlay ? null : <Spinner />}
    </div>
  );
};

export default EnhancedQrReader;
