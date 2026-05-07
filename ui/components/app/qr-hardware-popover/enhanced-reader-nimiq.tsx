/**
 * `EnhancedReaderNimiq` — QR camera scanner component powered by `qr-scanner`
 * (nimiq). Used inside `BaseReader` for hardware-wallet QR flows (PAIR/SIGN).
 *
 * Features:
 * - Uses the native BarcodeDetector API when available (Chrome MV3), avoiding
 * the need to spawn a Web Worker entirely.
 * - In Firefox MV2 (no native BarcodeDetector), the `barcode-detector`
 * polyfill provides a WASM-based implementation so `qr-scanner` never
 * attempts to spawn a Blob-URL Worker (which extension CSP blocks).
 * - Manages the camera stream internally via `start()`/`destroy()` which
 * guarantees all MediaStreamTracks are ended on unmount.
 */
import React, { useEffect, useRef, useState } from 'react';
import 'barcode-detector/polyfill';
import QrScanner from 'qr-scanner';
import log from 'loglevel';
import Spinner from '../../ui/spinner';

type EnhancedReaderNimiqProps = {
  handleScan: (data: string) => void;
};

const EnhancedReaderNimiq: React.FC<EnhancedReaderNimiqProps> = ({
  handleScan,
}) => {
  const [canplay, setCanplay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleScanRef = useRef(handleScan);
  handleScanRef.current = handleScan;

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) {
      return undefined;
    }

    const scanner = new QrScanner(
      videoElem,
      (result) => {
        handleScanRef.current(result.data);
      },
      {
        returnDetailedScanResult: true,
        maxScansPerSecond: 25,
        preferredCamera: 'environment',
        // Scans the full frame at 600px resolution so large/close-up QR codes
        // are decoded reliably (the default crops to center and downscales to 400px).
        calculateScanRegion: (video) => ({
          x: 0,
          y: 0,
          width: video.videoWidth,
          height: video.videoHeight,
          downScaledWidth: 600,
          downScaledHeight: 600,
        }),
      },
    );

    const canplayListener = () => {
      setCanplay(true);
    };
    videoElem.addEventListener('canplay', canplayListener);

    scanner.start().catch((startError) => {
      log.error('QR scanner (nimiq): failed to start camera', startError);
    });

    // Cleanup: React calls this when the component unmounts.
    return () => {
      videoElem.removeEventListener('canplay', canplayListener);
      scanner.destroy();

      if (videoElem.srcObject instanceof MediaStream) {
        const activeTracks = videoElem.srcObject
          .getTracks()
          .filter((t) => t.readyState !== 'ended');
        if (activeTracks.length > 0) {
          log.warn(
            'QR scanner (nimiq): leaked tracks detected after destroy',
            activeTracks,
          );
          activeTracks.forEach((t) => t.stop());
        }
      }
    };
  }, []);

  return (
    <div
      className="qr-scanner__content__video-wrapper"
      style={{ position: 'relative' }}
    >
      <video
        ref={videoRef}
        id="video"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(4px)',
        }}
      />
      {canplay ? null : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-background-default)',
          }}
        >
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default EnhancedReaderNimiq;
