import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserQRCodeReader } from '@zxing/browser';
import log from 'loglevel';
import { MILLISECOND } from '../../../../../shared/constants/time';
import Spinner from '../../../ui/spinner';
import type { EnhancedReaderProps } from './enhanced-reader.types';

// Delay between ZXing scan attempts and successes to avoid CPU thrashing.
const SCAN_INTERVAL_MS = MILLISECOND * 100;

/**
 * `EnhancedReader` — continuous QR code scanner using ZXing.
 *
 * Renders a `<video>` element backed by `BrowserQRCodeReader` and invokes
 * {@link EnhancedReaderProps.onFrame} with the decoded text on each
 * successful scan. A spinner is shown until the camera stream fires
 * `canplay`, at which point the video becomes visible.
 *
 * The component handles its own cleanup: the camera stream and ZXing
 * decode loop are stopped when the component unmounts.
 *
 * @param props - Component props.
 * @param props.onFrame - Callback receiving the decoded QR text per frame.
 */
const EnhancedReader: React.FC<EnhancedReaderProps> = ({ onFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);

  const codeReader = useMemo(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    return new BrowserQRCodeReader(hints, {
      delayBetweenScanAttempts: SCAN_INTERVAL_MS,
      delayBetweenScanSuccess: SCAN_INTERVAL_MS,
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

  // Starts the camera stream and continuous QR decoding.
  // Cleanup stops the stream when the component unmounts or deps change.
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) {
      return undefined;
    }

    const promise = codeReader.decodeFromVideoDevice(
      undefined,
      videoElem,
      (result) => {
        if (result) {
          onFrame(result.getText());
        }
      },
    );

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
          filter: 'blur(4px)',
        }}
      />
      {canPlay ? null : <Spinner />}
    </div>
  );
};

export default EnhancedReader;
