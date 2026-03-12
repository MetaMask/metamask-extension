import React, { useEffect, useRef, useState, useCallback } from 'react';
import log from 'loglevel';
import { URDecoder } from '@ngraveio/bc-ur';
import PropTypes from 'prop-types';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  PLATFORM_BRAVE,
  PLATFORM_FIREFOX,
  PLATFORM_EDGE,
} from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/lib/browser-runtime.utils';
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

  const mounted = useRef(false);
  const permissionStatusRef = useRef(null);

  const reset = () => {
    setReady(READY_STATE.ACCESSING_CAMERA);
    setError(null);
    setURDecoder(new URDecoder());
    setProgress(0);
  };

  const getBrowserInstructions = useCallback(() => {
    const browser = getBrowserName();
    if (browser === PLATFORM_BRAVE) {
      return t('qrHardwareCameraPermissionInstructionsBrave');
    }
    if (browser === PLATFORM_FIREFOX) {
      return t('qrHardwareCameraPermissionInstructionsFirefox');
    }
    if (browser === PLATFORM_EDGE) {
      return t('qrHardwareCameraPermissionInstructionsEdge');
    }
    return t('qrHardwareCameraPermissionInstructionsChrome');
  }, [t]);

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

  const handleScan = (data) => {
    try {
      if (!data || urDecoder.isComplete()) {
        return;
      }
      urDecoder.receivePart(data);
      setProgress(urDecoder.estimatedPercentComplete());
      if (urDecoder.isComplete()) {
        const result = urDecoder.resultUR();
        handleSuccess(result).catch(setError);
      }
    } catch (e) {
      if (isReadingWallet) {
        setErrorTitle(t('QRHardwareUnknownQRCodeTitle'));
      } else {
        setErrorTitle(t('QRHardwareInvalidTransactionTitle'));
      }
      setError(new Error(t('unknownQrCode')));
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
    } else if (error.message === t('unknownQrCode')) {
      if (isReadingWallet) {
        msg = t('QRHardwareUnknownWalletQRCode');
      } else {
        msg = t('unknownQrCode');
      }
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
        <div className="qr-scanner__status">{getBrowserInstructions()}</div>
        <div className="qr-scanner__status">
          {t('qrHardwareCameraPermissionAutoRecover')}
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
