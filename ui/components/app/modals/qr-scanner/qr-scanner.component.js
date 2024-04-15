import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import log from 'loglevel';
import { BrowserQRCodeReader } from '@zxing/browser';
import { usePrevious } from '../../../../hooks/usePrevious';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { getURL } from '../../../../helpers/utils/util';
import WebcamUtils from '../../../../helpers/utils/webcam-utils';
import PageContainerFooter from '../../../ui/page-container/page-container-footer/page-container-footer.component';
import Spinner from '../../../ui/spinner';

import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { SECOND } from '../../../../../shared/constants/time';

const READY_STATE = {
  ACCESSING_CAMERA: 'ACCESSING_CAMERA',
  NEED_TO_ALLOW_ACCESS: 'NEED_TO_ALLOW_ACCESS',
  READY: 'READY',
};

const parseContent = (content) => {
  let type = 'unknown';
  let values = {};

  // Here we could add more cases
  // To parse other type of links
  // For ex. EIP-681 (https://eips.ethereum.org/EIPS/eip-681)

  // Ethereum address links - fox ex. ethereum:0x.....1111
  if (content.split('ethereum:').length > 1) {
    type = 'address';
    values = { address: content.split('ethereum:')[1] };

    // Regular ethereum addresses - fox ex. 0x.....1111
  } else if (content.substring(0, 2).toLowerCase() === '0x') {
    type = 'address';
    values = { address: content };
  }
  return { type, values };
};

export default function QRCodeScanner({ hideModal, qrCodeDetected }) {
  const t = useI18nContext();
  const [isReady, setIsReady] = useState(READY_STATE.ACCESSING_CAMERA);
  const previousIsReady = usePrevious(isReady);

  const [errorData, setErrorData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [codeReader, setCodeReader] = useState(null);
  const [permissionChecker, setPermissionChecker] = useState(null);

  const checkPermissions = useCallback(async () => {
    try {
      const { permissions } = await WebcamUtils.checkStatus();
      if (permissions) {
        // Let the video stream load first...
        await new Promise((resolve) => setTimeout(resolve, SECOND * 2));
        if (!isMounted) {
          return;
        }
        setIsReady(READY_STATE.READY);
      } else if (isMounted) {
        // Keep checking for permissions
        setPermissionChecker(setTimeout(this.checkPermissions, SECOND));
      }
    } catch (error) {
      if (isMounted) {
        setErrorData({ error });
      }
    }
  }, [isMounted]);

  const teardownCodeReader = useCallback(() => {
    if (codeReader) {
      codeReader.constructor.cleanVideoSource();
      codeReader.constructor.releaseAllStreams();
      setCodeReader(null);
    }
  }, [codeReader]);

  const stopAndClose = useCallback(() => {
    if (codeReader) {
      teardownCodeReader(hideModal);
    }
    hideModal();
  }, [codeReader, hideModal, teardownCodeReader]);

  const initCamera = useCallback(async () => {
    // The `decodeFromInputVideoDevice` call prompts the browser to show
    // the user the camera permission request.  We must then call it again
    // once we receive permission so that the video displays.
    // It's important to prevent this codeReader from being created twice;
    // Firefox otherwise starts 2 video streams, one of which cannot be stopped
    if (!codeReader) {
      setCodeReader(new BrowserQRCodeReader());
    }
  }, [codeReader]);

  useEffect(() => {
    (async () => {
      if (codeReader) {
        try {
          await checkPermissions();
          await codeReader.constructor.listVideoInputDevices();
          const content = await codeReader.decodeOnceFromVideoDevice(
            undefined,
            'video',
          );
          const result = parseContent(content.text);
          if (isMounted) {
            if (result.type === 'unknown') {
              setErrorData(new Error(t('unknownQrCode')));
            } else {
              qrCodeDetected(result);
              stopAndClose();
            }
          }
        } catch (error) {
          if (isMounted) {
            return;
          }
          if (error.name === 'NotAllowedError') {
            log.info(`Permission denied: '${error}'`);
            setIsReady(READY_STATE.NEED_TO_ALLOW_ACCESS);
          } else {
            setErrorData(error);
          }
        }
      }
    })();
  }, [
    checkPermissions,
    codeReader,
    isMounted,
    qrCodeDetected,
    stopAndClose,
    t,
  ]);

  const checkEnvironment = async () => {
    try {
      const { environmentReady } = await WebcamUtils.checkStatus();
      if (
        !environmentReady &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN
      ) {
        const currentUrl = getURL(window.location.href);
        const currentHash = currentUrl?.hash;
        const currentRoute = currentHash ? currentHash.substring(1) : null;
        global.platform.openExtensionInBrowser(currentRoute);
      }
    } catch (error) {
      if (isMounted) {
        setErrorData({ error });
      }
    }
    // initial attempt is required to trigger permission prompt
    await initCamera();
  };

  useEffect(() => {
    // Anything in here is fired on component mount.
    setIsMounted(true);
    (async () => {
      await checkEnvironment();
    })();
    // only renders when component is mounted and unmounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (previousIsReady !== isReady) {
        if (isReady === READY_STATE.READY) {
          await initCamera();
        } else if (isReady === READY_STATE.NEED_TO_ALLOW_ACCESS) {
          await checkPermissions();
        }
      }
    })();
  }, [previousIsReady, isReady, initCamera, checkPermissions]);

  const tryAgain = async () => {
    clearTimeout(permissionChecker);
    if (codeReader) {
      teardownCodeReader();
    }
    setIsReady(READY_STATE.ACCESSING_CAMERA);
    setErrorData(null);

    await checkEnvironment();
  };

  const renderError = () => {
    let title, msg;
    if (errorData.type === 'NO_WEBCAM_FOUND') {
      title = t('noWebcamFoundTitle');
      msg = t('noWebcamFound');
    } else if (errorData.message === t('unknownQrCode')) {
      msg = t('unknownQrCode');
    } else {
      title = t('generalCameraErrorTitle');
      msg = t('generalCameraError');
    }

    return (
      <>
        <div className="qr-scanner__image">
          <img src="images/webcam.svg" width="70" height="70" alt="" />
        </div>
        {title && <div className="qr-scanner__title">{title}</div>}
        <div className="qr-scanner__error">{msg}</div>
        <PageContainerFooter
          onCancel={stopAndClose}
          onSubmit={tryAgain}
          cancelText={t('cancel')}
          submitText={t('tryAgain')}
        />
      </>
    );
  };

  const getQRScanMessage = (state) => {
    let message;
    switch (state) {
      case READY_STATE.ACCESSING_CAMERA:
        message = t('accessingYourCamera');
        break;
      case READY_STATE.READY:
        message = t('scanInstructions');
        break;
      case READY_STATE.NEED_TO_ALLOW_ACCESS:
        message = t('youNeedToAllowCameraAccess');
        break;
      default:
        message = t('accessingYourCamera');
    }
    return message;
  };

  const renderVideo = () => {
    return (
      <>
        <div className="qr-scanner__title">{`${t('scanQrCode')}`}</div>
        <div className="qr-scanner__content">
          <div className="qr-scanner__content__video-wrapper">
            <video
              id="video"
              style={{
                display: isReady === READY_STATE.READY ? 'block' : 'none',
              }}
            />
            {isReady !== READY_STATE.READY && (
              <Spinner color="var(--color-warning-default)" />
            )}
          </div>
        </div>
        <div className="qr-scanner__status">{getQRScanMessage(isReady)}</div>
      </>
    );
  };

  return (
    <div className="qr-scanner">
      <div className="qr-scanner__close" onClick={stopAndClose} />
      {errorData ? renderError() : renderVideo()}
    </div>
  );
}

QRCodeScanner.propTypes = {
  hideModal: PropTypes.func.isRequired,
  qrCodeDetected: PropTypes.func.isRequired,
};
