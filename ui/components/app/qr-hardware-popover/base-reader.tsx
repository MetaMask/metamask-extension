/**
 * `BaseReader` — low-level QR camera scanner component.
 *
 * Used inside `QRHardwarePopover` for both wallet-import (PAIR) and
 * transaction-signing (SIGN) flows. It manages the full camera lifecycle:
 *
 * 1. **Environment check** — redirects to fullscreen if the current context
 * (popup / side panel) cannot prompt for camera access.
 * 2. **Permission flow** — queries the Permissions API, calls `getUserMedia`,
 * and classifies the result into one of four {@link CameraReadyState} values.
 * 3. **QR decoding** — once the camera is ready, renders `EnhancedReader,`
 * which continuously feeds scanned payloads into a `URDecoder` until a full
 * UR is assembled and forwarded to `handleSuccess`.
 * 4. **Error UI** — displays recoverable camera / scan errors with retry.
 *
 * The component never polls for permission changes. Instead, it subscribes to
 * the `PermissionStatus.change` event so the scanner transitions to READY
 * automatically when the user grants camera access in browser settings.
 *
 * @see CameraReadyState for the state machine definition.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import log from 'loglevel';
import { URDecoder } from '@ngraveio/bc-ur';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  getChromiumExtensionCameraSiteSettingsUrl,
  getMozExtensionOriginForDisplay,
  isFirefoxBrowser,
} from '../../../../shared/lib/browser-runtime.utils';
import WebcamUtils from '../../../helpers/utils/webcam-utils';
import PageContainerFooter from '../../ui/page-container/page-container-footer/page-container-footer.component';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  CameraAccessErrorContent,
  CameraAccessErrorContentVariant,
} from '../camera-access-error-content';
import { CameraPermissionState } from '../../../contexts/hardware-wallets/constants';
import {
  CameraReadyState,
  type BaseReaderProps,
  type CameraReadyStateValue,
  type WebcamError,
} from './base-reader.types';
import EnhancedReader from './enhanced-reader';

// ---------------------------------------------------------------------------
// Hooks – camera permission lifecycle
// ---------------------------------------------------------------------------

/**
 * Manages the `PermissionStatus.change` subscription so the scanner can
 * transition to READY when the user grants camera access externally.
 *
 * @returns Ref-backed helpers to attach, clean up, and access the listener.
 */
function usePermissionChangeListener() {
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const handlerRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    const status = permissionStatusRef.current;
    const handler = handlerRef.current;
    if (status && handler) {
      if (typeof status.removeEventListener === 'function') {
        status.removeEventListener('change', handler);
      } else {
        status.onchange = null;
      }
    }
    permissionStatusRef.current = null;
    handlerRef.current = null;
  }, []);

  const attach = useCallback(
    (permissionStatus: PermissionStatus | null, onGranted: () => void) => {
      cleanup();
      if (!permissionStatus) {
        return;
      }
      permissionStatusRef.current = permissionStatus;
      const handler = () => {
        if (permissionStatus.state === CameraPermissionState.Granted) {
          onGranted();
        }
      };
      handlerRef.current = handler;
      if (typeof permissionStatus.addEventListener === 'function') {
        permissionStatus.addEventListener('change', handler);
      } else {
        permissionStatus.onchange = handler;
      }
    },
    [cleanup],
  );

  return { attach, cleanup } as const;
}

const BaseReader = ({
  isReadingWallet,
  handleCancel,
  handleSuccess,
  setErrorTitle,
}: BaseReaderProps) => {
  const t = useI18nContext();

  const [readyState, setReadyState] = useState<CameraReadyStateValue>(
    CameraReadyState.AccessingCamera,
  );
  const [error, setError] = useState<WebcamError | null>(null);
  const [urDecoder, setUrDecoder] = useState(() => new URDecoder());
  const [scanProgress, setScanProgress] = useState(0);
  const [permissionActionLoading, setPermissionActionLoading] = useState(false);

  const mountedRef = useRef(false);
  const {
    attach: attachPermissionListener,
    cleanup: cleanupPermissionListener,
  } = usePermissionChangeListener();

  // ---- camera helpers -----------------------------------------------------

  /**
   * Auto-recovery callback for the `PermissionStatus.change` event.
   * Proves the camera works by briefly acquiring and releasing a stream,
   * then transitions to READY. Errors are logged silently — the user
   * remains on the instructional UI and can retry manually via Continue button.
   */
  const acquireCameraAndTransitionToReady = useCallback(async () => {
    try {
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReadyState(CameraReadyState.Ready);
      }
    } catch (cameraError) {
      log.info(
        'QR camera: could not acquire stream after permission grant',
        cameraError,
      );
    }
  }, [cleanupPermissionListener]);

  /**
   * After `getUserMedia` throws `NotAllowedError`, re-queries the permission
   * and attaches a change listener so the component recovers automatically.
   *
   * @returns The current permission state after re-querying.
   */
  const reconcileNotAllowedPermission =
    useCallback(async (): Promise<PermissionState> => {
      const { state, permissionStatus } =
        await WebcamUtils.queryCameraPermission();
      attachPermissionListener(
        permissionStatus,
        acquireCameraAndTransitionToReady,
      );
      return state;
    }, [attachPermissionListener, acquireCameraAndTransitionToReady]);

  // ---- permission flow entry points ---------------------------------------

  /**
   * Classifies a `NotAllowedError` after re-querying the permission state
   * and updates the UI to the appropriate error screen.
   */
  const handleNotAllowedError = useCallback(async () => {
    const nextState = await reconcileNotAllowedPermission();
    if (!mountedRef.current) {
      return;
    }
    const useBlockedUi =
      nextState === CameraPermissionState.Denied ||
      (nextState === CameraPermissionState.Prompt && isFirefoxBrowser());
    setReadyState(
      useBlockedUi
        ? CameraReadyState.CameraAccessBlocked
        : CameraReadyState.CameraAccessNeeded,
    );
  }, [reconcileNotAllowedPermission]);

  /**
   * Prompts the user for camera access via `getUserMedia` (used when the
   * Permissions API returns `'prompt'`). On success transitions to READY;
   * on `NotAllowedError` classifies the denial; other errors bubble up.
   */
  const promptForCameraAccess = useCallback(async () => {
    try {
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReadyState(CameraReadyState.Ready);
      }
    } catch (cameraError) {
      if ((cameraError as { name?: string }).name === 'NotAllowedError') {
        await handleNotAllowedError();
      } else if (mountedRef.current) {
        setError(cameraError as WebcamError);
      }
    }
  }, [cleanupPermissionListener, handleNotAllowedError]);

  /**
   * Initial permission flow executed once the environment check passes.
   * Queries the permission API, then dispatches to the appropriate handler
   * based on the current permission state.
   */
  const startCameraPermissionFlow = useCallback(async () => {
    const { state, permissionStatus } =
      await WebcamUtils.queryCameraPermission();

    if (state === CameraPermissionState.Denied) {
      attachPermissionListener(
        permissionStatus,
        acquireCameraAndTransitionToReady,
      );
      if (mountedRef.current) {
        setReadyState(CameraReadyState.CameraAccessBlocked);
      }
      return;
    }

    // Skip getUserMedia when already granted — EnhancedReader will open the
    // camera once, avoiding a redundant open/close cycle that slows scanning.
    if (state === CameraPermissionState.Granted) {
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReadyState(CameraReadyState.Ready);
      }
      return;
    }

    await promptForCameraAccess();
  }, [
    attachPermissionListener,
    acquireCameraAndTransitionToReady,
    cleanupPermissionListener,
    promptForCameraAccess,
  ]);

  // ---- environment check --------------------------------------------------

  /**
   * Ensures the extension runs in a context capable of prompting for camera
   * access. Popup / side panel environments redirect to a fullscreen tab.
   */
  const checkEnvironment = useCallback(async () => {
    try {
      const { environmentReady } = await WebcamUtils.checkStatus();
      if (
        !environmentReady &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN
      ) {
        const currentUrl = new URL(globalThis.location.href);
        const currentHash = currentUrl.hash;
        const currentRoute = currentHash ? currentHash.substring(1) : null;
        globalThis.platform.openExtensionInBrowser(currentRoute);
        return;
      }
    } catch (environmentError) {
      if (mountedRef.current) {
        setError(environmentError as WebcamError);
      }
      return;
    }
    await startCameraPermissionFlow();
  }, [startCameraPermissionFlow]);

  // ---- "Continue" handlers for camera-access error states -----------------

  /**
   * Handler for the "needed" (prompt-dismissed) Continue button.
   * Re-requests camera access via `getUserMedia`.
   */
  const handleCameraAccessNeededContinue = useCallback(async () => {
    setPermissionActionLoading(true);
    try {
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReadyState(CameraReadyState.Ready);
      }
    } catch (cameraError) {
      const domError = cameraError as { name?: string };
      if (domError.name === 'NotAllowedError') {
        const nextState = await reconcileNotAllowedPermission();
        if (
          mountedRef.current &&
          (nextState === CameraPermissionState.Denied ||
            (nextState === CameraPermissionState.Prompt && isFirefoxBrowser()))
        ) {
          setReadyState(CameraReadyState.CameraAccessBlocked);
        }
      } else if (mountedRef.current) {
        setError(cameraError as WebcamError);
      }
    } finally {
      if (mountedRef.current) {
        setPermissionActionLoading(false);
      }
    }
  }, [cleanupPermissionListener, reconcileNotAllowedPermission]);

  /**
   * Handler for the "blocked" Continue button.
   * Re-checks the permission state; if no longer denied, acquires the camera.
   */
  const handleCameraAccessBlockedContinue = useCallback(async () => {
    setPermissionActionLoading(true);
    try {
      const { state } = await WebcamUtils.queryCameraPermission();
      if (state === CameraPermissionState.Denied) {
        return;
      }
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReadyState(CameraReadyState.Ready);
      }
    } catch (cameraError) {
      const domError = cameraError as { name?: string };
      if (domError.name === 'NotAllowedError') {
        await reconcileNotAllowedPermission();
      } else if (mountedRef.current) {
        setError(cameraError as WebcamError);
      }
    } finally {
      if (mountedRef.current) {
        setPermissionActionLoading(false);
      }
    }
  }, [cleanupPermissionListener, reconcileNotAllowedPermission]);

  /**
   * Opens the Chromium camera site-settings page in a new tab.
   */
  const handleOpenChromiumCameraSettings = useCallback(() => {
    globalThis.platform.openTab({
      url: getChromiumExtensionCameraSiteSettingsUrl(),
    });
  }, []);

  // ---- QR scan callback ---------------------------------------------------

  /**
   * Feeds a scanned QR payload into the `URDecoder`. When the UR is fully
   * assembled, invokes `handleSuccess` with the decoded result.
   *
   * @param data - Raw text content of a single scanned QR frame.
   */
  const handleScan = useCallback(
    (data: string | null) => {
      try {
        if (!data || urDecoder.isComplete()) {
          return;
        }
        urDecoder.receivePart(data);
        setScanProgress(urDecoder.estimatedPercentComplete());
        if (urDecoder.isComplete()) {
          const result = urDecoder.resultUR();
          handleSuccess(result).catch((successError: WebcamError) =>
            setError(successError),
          );
        }
      } catch {
        if (isReadingWallet) {
          setErrorTitle(t('QRHardwareUnknownQRCodeTitle'));
        } else {
          setErrorTitle(t('QRHardwareInvalidTransactionTitle'));
        }
        setError(new Error(t('unknownQrCode')) as WebcamError);
      }
    },
    [handleSuccess, isReadingWallet, setErrorTitle, t, urDecoder],
  );

  // ---- lifecycle ----------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;
    checkEnvironment();
    return () => {
      mountedRef.current = false;
      cleanupPermissionListener();
    };
  }, [checkEnvironment, cleanupPermissionListener]);

  /**
   * Resets all scanner state and re-enters the environment check.
   */
  const tryAgain = () => {
    cleanupPermissionListener();
    setReadyState(CameraReadyState.AccessingCamera);
    setError(null);
    setUrDecoder(new URDecoder());
    setScanProgress(0);
    setPermissionActionLoading(false);
    checkEnvironment();
  };

  // ---- render helpers -----------------------------------------------------

  /**
   * Renders the error overlay (no-webcam, unknown QR, mismatched sign-id, or
   * generic camera error) with Cancel / Try Again footer buttons.
   */
  const renderError = () => {
    let title: string | undefined;
    let message: string;

    if (error?.type === 'NO_WEBCAM_FOUND') {
      title = t('noWebcamFoundTitle');
      message = t('noWebcamFound');
    } else if (error?.message === t('unknownQrCode')) {
      message = isReadingWallet
        ? t('QRHardwareUnknownWalletQRCode')
        : t('unknownQrCode');
    } else if (error?.message === t('QRHardwareMismatchedSignId')) {
      message = t('QRHardwareMismatchedSignId');
    } else {
      title = t('generalCameraErrorTitle');
      message = t('generalCameraError');
    }

    return (
      <>
        <div className="qr-scanner__image">
          <img src="images/webcam.svg" width="70" height="70" alt="" />
        </div>
        {title ? <div className="qr-scanner__title">{title}</div> : null}
        <div className="qr-scanner__error" data-testid="qr-scanner__error">
          {message}
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

  /**
   * Renders the main scanner area: one of the camera-access error states,
   * the "accessing camera" loading message, or the live QR scanner.
   */
  const renderVideo = () => {
    if (readyState === CameraReadyState.CameraAccessNeeded) {
      return (
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Needed}
          onContinue={handleCameraAccessNeededContinue}
          continueLoading={permissionActionLoading}
        />
      );
    }
    if (readyState === CameraReadyState.CameraAccessBlocked) {
      return (
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Blocked}
          isFirefox={isFirefoxBrowser()}
          mozExtensionDisplay={getMozExtensionOriginForDisplay()}
          onOpenSettings={handleOpenChromiumCameraSettings}
          onContinue={handleCameraAccessBlockedContinue}
          continueLoading={permissionActionLoading}
        />
      );
    }

    let statusMessage: string | undefined;
    if (readyState === CameraReadyState.AccessingCamera) {
      statusMessage = t('accessingYourCamera');
    } else if (readyState === CameraReadyState.Ready) {
      statusMessage = t('QRHardwareScanInstructions');
    }

    return (
      <>
        <div className="qr-scanner__content">
          {readyState === CameraReadyState.Ready ? (
            <EnhancedReader handleScan={handleScan} />
          ) : null}
        </div>
        {scanProgress > 0 && (
          <div
            className="qr-scanner__progress"
            data-testid="qr-reader-progress-bar"
            style={
              {
                '--progress': `${Math.floor(scanProgress * 100)}%`,
              } as React.CSSProperties
            }
          />
        )}
        {statusMessage && (
          <div className="qr-scanner__status">{statusMessage}</div>
        )}
      </>
    );
  };

  return (
    <div className="qr-scanner">{error ? renderError() : renderVideo()}</div>
  );
};

export default BaseReader;
