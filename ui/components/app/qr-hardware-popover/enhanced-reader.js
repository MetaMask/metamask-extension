import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../ui/spinner';

const NATIVE_SCAN_INTERVAL_MS = 50;

/**
 * Returns true if the browser supports the native BarcodeDetector API with
 * QR code support. Chrome 83+ and Edge 83+ support this — Firefox does not.
 */
let nativeSupported = null;
async function isNativeBarcodeDetectorSupported() {
  if (nativeSupported !== null) {
    return nativeSupported;
  }
  try {
    if (!('BarcodeDetector' in window)) {
      nativeSupported = false;
      return false;
    }
    const formats = await window.BarcodeDetector.getSupportedFormats();
    nativeSupported = formats.includes('qr_code');
    return nativeSupported;
  } catch {
    nativeSupported = false;
    return false;
  }
}

/**
 * Scans video frames using the native BarcodeDetector API.
 * Returns an abort function.
 *
 * @param {HTMLVideoElement} videoElem - the video element to scan
 * @param {Function} handleScan - callback receiving the decoded QR string
 * @returns {Function} stop function
 */
function startNativeScanner(videoElem, handleScan) {
  const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
  let stopped = false;
  let timeoutId;

  const scan = async () => {
    if (stopped || videoElem.readyState < videoElem.HAVE_CURRENT_DATA) {
      timeoutId = setTimeout(scan, NATIVE_SCAN_INTERVAL_MS);
      return;
    }
    try {
      const barcodes = await detector.detect(videoElem);
      if (!stopped && barcodes.length > 0) {
        handleScan(barcodes[0].rawValue);
      }
    } catch {
      // detect() can throw if the video frame is not available yet
    }
    if (!stopped) {
      timeoutId = setTimeout(scan, NATIVE_SCAN_INTERVAL_MS);
    }
  };

  scan();

  return () => {
    stopped = true;
    clearTimeout(timeoutId);
  };
}

/**
 * Lazily loads @zxing/browser + @zxing/library and starts a scanner.
 * Returns a promise that resolves to an abort function.
 *
 * @param {HTMLVideoElement} videoElem - the video element to scan
 * @param {Function} handleScan - callback receiving the decoded QR string
 * @param {Function} onError - callback for camera/decode errors
 * @returns {Promise<Function>} stop function
 */
async function startZxingScanner(videoElem, handleScan, onError) {
  const [{ BrowserQRCodeReader }, { BarcodeFormat, DecodeHintType }] =
    await Promise.all([import('@zxing/browser'), import('@zxing/library')]);

  const hint = new Map();
  hint.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  const codeReader = new BrowserQRCodeReader(hint, {
    delayBetweenScanAttempts: 50,
    delayBetweenScanSuccess: 30,
  });

  let controls;
  try {
    controls = await codeReader.decodeFromVideoDevice(
      undefined,
      videoElem.id,
      (result) => {
        if (result) {
          handleScan(result.getText());
        }
      },
    );
  } catch (e) {
    if (onError) {
      onError(e);
    }
  }

  return () => {
    if (controls) {
      controls.stop();
    }
  };
}

const EnhancedReader = ({ handleScan, onError }) => {
  const [canplay, setCanplay] = useState(false);
  const videoRef = useRef(null);
  const stopScannerRef = useRef(null);
  const handleScanRef = useRef(handleScan);
  const onErrorRef = useRef(onError);
  handleScanRef.current = handleScan;
  onErrorRef.current = onError;

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) {
      return undefined;
    }

    const canplayListener = () => setCanplay(true);
    videoElem.addEventListener('canplay', canplayListener);

    let unmounted = false;

    (async () => {
      const useNative = await isNativeBarcodeDetectorSupported();

      if (useNative) {
        // Native path: we need to acquire the camera stream ourselves since
        // BarcodeDetector only does image analysis, not camera management.
        try {
          // eslint-disable-next-line no-undef
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (unmounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          videoElem.srcObject = stream;
          videoElem.setAttribute('autoplay', '');
          videoElem.setAttribute('playsinline', '');
          await videoElem.play();

          const stopScanner = startNativeScanner(videoElem, (data) =>
            handleScanRef.current(data),
          );
          stopScannerRef.current = () => {
            stopScanner();
            stream.getTracks().forEach((track) => track.stop());
          };
        } catch (e) {
          if (onErrorRef.current && !unmounted) {
            onErrorRef.current(e);
          }
        }
      } else {
        // Fallback: use @zxing/browser which handles both camera and decoding
        const stop = await startZxingScanner(
          videoElem,
          (data) => handleScanRef.current(data),
          (e) => onErrorRef.current?.(e),
        );
        if (unmounted) {
          stop();
        } else {
          stopScannerRef.current = stop;
        }
      }
    })();

    return () => {
      unmounted = true;
      videoElem.removeEventListener('canplay', canplayListener);
      if (stopScannerRef.current) {
        stopScannerRef.current();
      }
    };
  }, []);

  return (
    <div className="qr-scanner__content__video-wrapper">
      <video
        id="video"
        ref={videoRef}
        style={{
          display: canplay ? 'block' : 'none',
          width: '100%',
          filter: 'blur(4px)',
        }}
      />
      {canplay ? null : <Spinner />}
    </div>
  );
};

EnhancedReader.propTypes = {
  handleScan: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default EnhancedReader;
