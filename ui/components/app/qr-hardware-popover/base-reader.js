import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import log from 'loglevel';
import { URDecoder } from '@ngraveio/bc-ur';
import PropTypes from 'prop-types';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import WebcamUtils from '../../../helpers/utils/webcam-utils';
import PageContainerFooter from '../../ui/page-container/page-container-footer/page-container-footer.component';
import { useI18nContext } from '../../../hooks/useI18nContext';
import EnhancedReader from './enhanced-reader';

const READY_STATE = {
  ACCESSING_CAMERA: 'ACCESSING_CAMERA',
  PERMISSION_DISMISSED: 'PERMISSION_DISMISSED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  READY: 'READY',
};

export const SCAN_ERROR_TYPE = {
  NON_UR: 'NON_UR', // State 3
  WRONG_UR_TYPE: 'WRONG_UR_TYPE', // State 4
  UR_DECODE_ERROR: 'UR_DECODE_ERROR', // State 5
};

// Expected UR types per context
const PAIRING_UR_TYPES = ['crypto-hdkey', 'crypto-account'];
const SIGNING_UR_TYPES = ['eth-signature'];

/**
 * Extract the UR type from a ur: URI string.
 * Handles both single-part (`ur:type/data`) and multi-part (`ur:type/seq-of-total/data`).
 * Returns the type in lowercase, or null if unparseable.
 */
function extractUrType(data) {
  const match = data.match(/^ur:([a-z0-9-]+)\//i);
  return match ? match[1].toLowerCase() : null;
}

const BaseReader = ({
  isReadingWallet,
  handleCancel,
  handleSuccess,
  setErrorTitle,
}) => {
  const t = useI18nContext();
  const [ready, setReady] = useState(READY_STATE.ACCESSING_CAMERA);
  const [error, setError] = useState(null);
  const [urDecoder, setURDecoder] = useState(new URDecoder());
  const [progress, setProgress] = useState(0);
  // Content-level scan errors — scanner stays active behind the overlay
  const [scanError, setScanError] = useState(null);

  const mounted = useRef(false);
  const permissionStatusRef = useRef(null);

  const reset = () => {
    setReady(READY_STATE.ACCESSING_CAMERA);
    setError(null);
    setScanError(null);
    setURDecoder(new URDecoder());
    setProgress(0);
  };

  const settingsUrl = useMemo(() => WebcamUtils.getCameraSettingsUrl(), []);

  const attachPermissionChangeListener = useCallback((permissionStatus) => {
    permissionStatus.onchange = () => {
      if (permissionStatus.state === 'granted' && mounted.current) {
        setReady(READY_STATE.READY);
      }
    };
  }, []);

  const initCamera = useCallback(async () => {
    try {
      const permissionStatus = await WebcamUtils.getPermissionState();
      permissionStatusRef.current = permissionStatus;

      if (permissionStatus?.state === 'denied') {
        if (mounted.current) {
          setReady(READY_STATE.PERMISSION_DENIED);
        }
        attachPermissionChangeListener(permissionStatus);
        return;
      }

      // state is 'prompt' or 'granted' (or null on unsupported browsers) —
      // render EnhancedReader which will call getUserMedia internally.
      if (mounted.current) {
        setReady(READY_STATE.READY);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e);
      }
    }
  }, [attachPermissionChangeListener]);

  // Called by EnhancedReader when getUserMedia throws (e.g. user dismissed
  // or denied the browser permission dialog).
  const handleCameraError = useCallback(
    async (e) => {
      if (!mounted.current) {
        return;
      }
      if (e.name !== 'NotAllowedError') {
        setError(e);
        return;
      }
      log.info(`Camera permission error: '${e}'`);

      // Re-query to distinguish a browser-level persistent block ('denied')
      // from a one-time dismissal (state still 'prompt').
      const permissionStatus = await WebcamUtils.getPermissionState();
      permissionStatusRef.current = permissionStatus;

      if (permissionStatus?.state === 'denied') {
        setReady(READY_STATE.PERMISSION_DENIED);
        attachPermissionChangeListener(permissionStatus);
      } else {
        // state is 'prompt' — dialog was dismissed, can be re-triggered
        setReady(READY_STATE.PERMISSION_DISMISSED);
      }
    },
    [attachPermissionChangeListener],
  );

  const checkEnvironment = useCallback(async () => {
    try {
      const { environmentReady } = await WebcamUtils.checkStatus();
      if (
        !environmentReady &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN
      ) {
        const currentUrl = new URL(window.location.href);
        const currentHash = currentUrl.hash;
        const currentRoute = currentHash ? currentHash.substring(1) : null;
        global.platform.openExtensionInBrowser(currentRoute);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e);
      }
    }
    return initCamera();
  }, [initCamera]);

  const onContinue = useCallback(async () => {
    if (ready === READY_STATE.PERMISSION_DISMISSED) {
      // Re-trigger getUserMedia by cycling back through initCamera.
      // Since permissions.state is still 'prompt', EnhancedReader will
      // re-render and the browser dialog will appear again.
      reset();
      await checkEnvironment();
    } else if (ready === READY_STATE.PERMISSION_DENIED) {
      // Manual re-check — handles the case where onchange didn't fire
      // (e.g. some browsers) after the user fixed it in settings.
      const permissionStatus = await WebcamUtils.getPermissionState();
      if (permissionStatus?.state === 'granted') {
        setReady(READY_STATE.READY);
      }
    }
  }, [ready, checkEnvironment]);

  const handleScanError = (e) => {
    if (e.scanErrorType === SCAN_ERROR_TYPE.WRONG_UR_TYPE) {
      console.log(
        `[QR Scan] Wrong UR type from handleSuccess: received "${e.urType}", context=${isReadingWallet ? 'pairing' : 'signing'}`,
      );
      setScanError({
        type: SCAN_ERROR_TYPE.WRONG_UR_TYPE,
        urType: e.urType,
      });
      // Reset decoder so scanner can process new QR codes
      setURDecoder(new URDecoder());
      setProgress(0);
      return;
    }
    // Other errors (e.g. mismatched sign ID) — use legacy error flow
    console.warn('[QR Scan] handleSuccess error (legacy path):', e.message, e);
    setError(e);
  };

  const handleScan = (data) => {
    try {
      if (!data || urDecoder.isComplete()) {
        return;
      }

      // State 3: Non-UR QR code scanned
      if (!data.toLowerCase().startsWith('ur:')) {
        console.log(
          `[QR Scan] Non-UR QR code detected: "${data.substring(0, 80)}"`,
        );
        setScanError({ type: SCAN_ERROR_TYPE.NON_UR });
        return;
      }

      // Early type detection — extract UR type from the URI before feeding
      // to the decoder. This catches wrong-type animated QR codes immediately
      // instead of waiting for the full multi-part decode to complete.
      const urType = extractUrType(data);
      const expectedTypes = isReadingWallet
        ? PAIRING_UR_TYPES
        : SIGNING_UR_TYPES;

      console.log(
        `[QR Scan] UR part scanned — type="${urType}", expected=[${expectedTypes}], data="${data.substring(0, 80)}..."`,
      );

      if (urType && !expectedTypes.includes(urType)) {
        console.log(
          `[QR Scan] Wrong UR type detected early: "${urType}" not in [${expectedTypes}]`,
        );
        setScanError({
          type: SCAN_ERROR_TYPE.WRONG_UR_TYPE,
          urType,
        });
        // Don't feed this to the decoder — it's the wrong type entirely
        return;
      }

      urDecoder.receivePart(data);

      // Valid UR part received — auto-dismiss any content error overlay
      setScanError(null);

      const currentProgress = urDecoder.estimatedPercentComplete();
      setProgress(currentProgress);
      console.log(
        `[QR Scan] Progress: ${Math.floor(currentProgress * 100)}%`,
      );

      if (urDecoder.isComplete()) {
        const result = urDecoder.resultUR();
        console.log(
          `[QR Scan] UR decode complete — type="${result.type}", context=${isReadingWallet ? 'pairing' : 'signing'}`,
        );

        // Wrap in Promise.resolve to handle both sync throws and async rejections
        Promise.resolve()
          .then(() => handleSuccess(result))
          .catch(handleScanError);
      }
    } catch (e) {
      // State 5: UR decode error — data started with ur: but decode failed
      console.warn('[QR Scan] UR decode error:', e.message, e);
      setScanError({ type: SCAN_ERROR_TYPE.UR_DECODE_ERROR });
      // Reset decoder so scanner can retry
      setURDecoder(new URDecoder());
      setProgress(0);
    }
  };

  useEffect(() => {
    mounted.current = true;
    checkEnvironment();
    return () => {
      mounted.current = false;
      // Remove the onchange listener so it doesn't fire after unmount
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
      }
    };
  }, []);

  const tryAgain = () => {
    reset();
    checkEnvironment();
  };

  const renderError = () => {
    let title, msg;
    if (error.type === 'NO_WEBCAM_FOUND') {
      title = t('noWebcamFoundTitle');
      msg = t('noWebcamFound');
    } else if (error.message === t('QRHardwareMismatchedSignId')) {
      msg = t('QRHardwareMismatchedSignId');
    } else {
      title = t('generalCameraErrorTitle');
      msg = t('generalCameraError');
    }

    return (
      <>
        <div className="qr-scanner__image">
          <img src="images/webcam.svg" width="70" height="70" alt="" />
        </div>
        {title ? <div className="qr-scanner__title">{title}</div> : null}
        <div className="qr-scanner__error" data-testid="qr-scanner__error">
          {msg}
        </div>
        <PageContainerFooter
          onCancel={() => {
            setErrorTitle('');
            handleCancel();
          }}
          onSubmit={() => {
            setErrorTitle('');
            tryAgain();
          }}
          cancelText={t('cancel')}
          submitText={t('tryAgain')}
          submitButtonType="confirm"
        />
      </>
    );
  };

  const getScanErrorContent = () => {
    switch (scanError.type) {
      case SCAN_ERROR_TYPE.NON_UR:
        return {
          title: isReadingWallet
            ? t('qrHardwareNonUrPairingTitle')
            : t('qrHardwareNonUrSigningTitle'),
          description: isReadingWallet
            ? t('qrHardwareNonUrPairingDescription')
            : t('qrHardwareNonUrSigningDescription'),
        };
      case SCAN_ERROR_TYPE.WRONG_UR_TYPE:
        return {
          title: isReadingWallet
            ? t('qrHardwareWrongUrTypePairingTitle')
            : t('qrHardwareWrongUrTypeSigningTitle'),
          description: isReadingWallet
            ? t('qrHardwareWrongUrTypePairingDescription')
            : t('qrHardwareWrongUrTypeSigningDescription'),
        };
      case SCAN_ERROR_TYPE.UR_DECODE_ERROR:
        return {
          title: t('qrHardwareUrDecodeErrorTitle'),
          description: t('qrHardwareUrDecodeErrorDescription'),
        };
      default:
        return { title: '', description: '' };
    }
  };

  const dismissScanError = () => {
    setScanError(null);
    // Reset decoder in case it completed with wrong data
    setURDecoder(new URDecoder());
    setProgress(0);
  };

  const renderScanErrorOverlay = () => {
    if (!scanError) {
      return null;
    }
    const { title, description } = getScanErrorContent();
    return (
      <div
        className="qr-scanner__scan-error-overlay"
        data-testid="qr-scanner__scan-error-overlay"
      >
        <div className="qr-scanner__scan-error-overlay__title">{title}</div>
        <div className="qr-scanner__scan-error-overlay__description">
          {description}
        </div>
        <button
          className="qr-scanner__scan-error-overlay__retry-button"
          onClick={dismissScanError}
          data-testid="qr-scanner__scan-error-retry"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  };

  const renderPermissionDismissed = () => {
    return (
      <>
        <div className="qr-scanner__title">
          {t('qrHardwareCameraPermissionDismissedTitle')}
        </div>
        <div className="qr-scanner__status">
          {t('qrHardwareCameraPermissionDismissedDescription')}
        </div>
        <PageContainerFooter
          onSubmit={onContinue}
          submitText={t('continue')}
          submitButtonType="confirm"
          hideCancel
        />
      </>
    );
  };

  const renderPermissionDenied = () => {
    return (
      <>
        <div className="qr-scanner__title">
          {t('qrHardwareCameraPermissionBlockedTitle')}
        </div>
        <div className="qr-scanner__status">
          {t('qrHardwareCameraPermissionBlockedDescription')}
        </div>
        {!settingsUrl && (
          <div className="qr-scanner__settings-card">
            <span>{t('qrHardwareCameraPermissionFirefoxInstruction')}</span>
          </div>
        )}
        <PageContainerFooter
          onSubmit={
            settingsUrl
              ? () => WebcamUtils.openCameraSettings()
              : onContinue
          }
          submitText={
            settingsUrl
              ? t('qrHardwareCameraPermissionOpenSettingsButton')
              : t('continue')
          }
          submitButtonType="confirm"
          onCancel={settingsUrl ? onContinue : undefined}
          cancelText={settingsUrl ? t('continue') : undefined}
          hideCancel={!settingsUrl}
        />
      </>
    );
  };

  const renderVideo = () => {
    if (ready === READY_STATE.PERMISSION_DISMISSED) {
      return renderPermissionDismissed();
    }
    if (ready === READY_STATE.PERMISSION_DENIED) {
      return renderPermissionDenied();
    }

    const message =
      ready === READY_STATE.READY
        ? t('QRHardwareScanInstructions')
        : t('accessingYourCamera');

    return (
      <>
        <div className="qr-scanner__content">
          {ready === READY_STATE.READY && (
            <EnhancedReader
              handleScan={handleScan}
              onError={handleCameraError}
            />
          )}
          {renderScanErrorOverlay()}
        </div>
        {progress > 0 && (
          <div
            className="qr-scanner__progress"
            data-testid="qr-reader-progress-bar"
            style={{ '--progress': `${Math.floor(progress * 100)}%` }}
          ></div>
        )}
        <div className="qr-scanner__status">{message}</div>
      </>
    );
  };

  return (
    <div className="qr-scanner">{error ? renderError() : renderVideo()}</div>
  );
};

BaseReader.propTypes = {
  isReadingWallet: PropTypes.bool.isRequired,
  handleCancel: PropTypes.func.isRequired,
  handleSuccess: PropTypes.func.isRequired,
  setErrorTitle: PropTypes.func.isRequired,
};

export default BaseReader;
