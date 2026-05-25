import React, { useContext, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  getChromiumExtensionCameraSiteSettingsUrl,
  getMozExtensionOriginForDisplay,
  isFirefoxBrowser,
} from '../../../../shared/lib/browser-runtime.utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import PageContainerFooter from '../../ui/page-container/page-container-footer/page-container-footer.component';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  CameraAccessErrorContent,
  CameraAccessErrorContentVariant,
} from '../camera-access-error-content';
import {
  CameraReadyState,
  WebcamErrorType,
  type BaseReaderProps,
} from './base-reader.types';
import {
  cameraReadyStateToErrorCode,
  buildQrCameraRecoveryTrackEventArgs,
} from './base-reader-utils';
import {
  useBaseReaderReducer,
  useDecoderLifecycle,
  useCameraPermission,
} from './qr-hooks';
import { QrErrorContent, QrErrorFlowContext } from './qr-error-content';
import { scanCategoryToQrErrorType } from './qr-utils/qr-utils';
import EnhancedReader from './enhanced-reader';

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
 * 3. **QR decoding** — once the camera is ready, renders `EnhancedReader`,
 * which continuously feeds scanned payloads into a `URDecoder` until a full
 * UR is assembled and forwarded to `handleSuccess`.
 * 4. **Error UI** — displays recoverable camera / scan errors with retry.
 *
 * The component never polls for permission changes. Instead, it subscribes to
 * the `PermissionStatus.change` event so the scanner transitions to READY
 * automatically when the user grants camera access in browser settings.
 *
 * @param options0 - Component props.
 * @param options0.isReadingWallet - True when scanning a wallet sync QR code;
 * false for transaction signing.
 * @param options0.handleCancel - Called when the user cancels the QR scan flow.
 * @param options0.handleSuccess - Called when a complete UR payload has been
 * decoded from the QR code stream.
 * @param options0.setErrorTitle - Sets the popover title to an error-specific
 * heading.
 * @see CameraReadyState for the state machine definition.
 */
const BaseReader = ({
  isReadingWallet,
  handleCancel,
  handleSuccess,
  setErrorTitle,
}: BaseReaderProps) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const {
    state: {
      readyState,
      error,
      scanError,
      scanProgress,
      permissionActionLoading,
    },
    setReady,
    setBlocked,
    setNeeded,
    setError,
    setScanError,
    setScanProgress,
    setPermissionActionLoading,
    reset,
  } = useBaseReaderReducer();

  // ---- MetaMetrics tracking -----------------------------------------------

  const errorTypeViewCountRef = useRef(0);
  const lastTrackedReadyStateRef = useRef<typeof readyState | null>(null);
  const prevErrorReadyStateRef = useRef<typeof readyState | null>(null);

  useEffect(() => {
    const errorCode = cameraReadyStateToErrorCode(readyState);

    if (errorCode === null) {
      if (
        readyState === CameraReadyState.Ready &&
        prevErrorReadyStateRef.current !== null
      ) {
        const prevErrorCode = cameraReadyStateToErrorCode(
          prevErrorReadyStateRef.current,
        );
        if (prevErrorCode !== null) {
          trackEvent(
            buildQrCameraRecoveryTrackEventArgs(
              MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
              prevErrorCode,
              errorTypeViewCountRef.current,
            ),
          );
        }
        prevErrorReadyStateRef.current = null;
        errorTypeViewCountRef.current = 0;
        lastTrackedReadyStateRef.current = null;
      }
      return;
    }

    prevErrorReadyStateRef.current = readyState;

    if (lastTrackedReadyStateRef.current === readyState) {
      return;
    }
    lastTrackedReadyStateRef.current = readyState;
    errorTypeViewCountRef.current += 1;

    trackEvent(
      buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        errorCode,
        errorTypeViewCountRef.current,
      ),
    );
  }, [readyState, trackEvent]);

  /** Fires a MetaMetrics event when the user clicks a recovery CTA button. */
  const trackCameraRecoveryCtaClicked = useCallback(() => {
    const errorCode = cameraReadyStateToErrorCode(readyState);
    if (errorCode === null) {
      return;
    }
    trackEvent(
      buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
        errorCode,
        errorTypeViewCountRef.current,
      ),
    );
  }, [readyState, trackEvent]);

  // ---- Decoder lifecycle --------------------------------------------------

  const { handleScan, resetDecoder } = useDecoderLifecycle(
    { handleSuccess, isReadingWallet },
    { setScanProgress, setScanError, setError },
  );

  // ---- Camera permission lifecycle ----------------------------------------

  const {
    handleCameraAccessNeededContinue,
    handleCameraAccessBlockedContinue,
    cleanupPermissionListener,
    checkEnvironment,
  } = useCameraPermission(
    {
      setReady,
      setBlocked,
      setNeeded,
      setError,
      setPermissionActionLoading,
    },
    { trackCameraRecoveryCtaClicked },
  );

  // ---- tryAgain -----------------------------------------------------------

  /** Resets all scanner state and re-enters the environment check. */
  const tryAgain = useCallback(() => {
    cleanupPermissionListener();
    reset();
    resetDecoder();
    checkEnvironment();
  }, [cleanupPermissionListener, reset, resetDecoder, checkEnvironment]);

  // ---- Chromium settings --------------------------------------------------

  /** Opens the Chromium camera site-settings page in a new tab. */
  const handleOpenChromiumCameraSettings = useCallback(() => {
    globalThis.platform.openTab({
      url: getChromiumExtensionCameraSiteSettingsUrl(),
    });
  }, []);

  // ---- Render: classified scan error UI ------------------------------------

  if (scanError) {
    const flowContext = isReadingWallet
      ? QrErrorFlowContext.Pairing
      : QrErrorFlowContext.Signing;

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="qr-scanner"
      >
        <QrErrorContent
          errorType={scanCategoryToQrErrorType(scanError.category)}
          flowContext={flowContext}
          onTryAgain={tryAgain}
        />
      </Box>
    );
  }

  // ---- Render: legacy error UI (webcam / handleSuccess rejection) ---------

  if (error) {
    let title: string | undefined;
    let message: string;

    if (error.type === WebcamErrorType.NoWebcamFound) {
      title = t('noWebcamFoundTitle');
      message = t('noWebcamFound');
    } else if (error.message === t('QRHardwareMismatchedSignId')) {
      message = t('QRHardwareMismatchedSignId');
    } else {
      title = t('generalCameraErrorTitle');
      message = t('generalCameraError');
    }

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="qr-scanner"
      >
        <Box paddingTop={4} className="text-center">
          <img src="images/webcam.svg" width="70" height="70" alt="" />
        </Box>
        {title ? (
          <Box paddingTop={4} paddingBottom={4}>
            <Text
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Medium}
              textAlign={TextAlign.Center}
            >
              {title}
            </Text>
          </Box>
        ) : null}
        <Box padding={4}>
          <Text
            variant={TextVariant.BodyMd}
            textAlign={TextAlign.Center}
            data-testid="qr-scanner__error"
          >
            {message}
          </Text>
        </Box>
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
      </Box>
    );
  }

  // ---- Render: camera-access error states ---------------------------------

  if (readyState === CameraReadyState.CameraAccessNeeded) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="qr-scanner"
      >
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Needed}
          onContinue={handleCameraAccessNeededContinue}
          continueLoading={permissionActionLoading}
        />
      </Box>
    );
  }

  if (readyState === CameraReadyState.CameraAccessBlocked) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="qr-scanner"
      >
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Blocked}
          isFirefox={isFirefoxBrowser()}
          mozExtensionDisplay={getMozExtensionOriginForDisplay()}
          onOpenSettings={handleOpenChromiumCameraSettings}
          onContinue={handleCameraAccessBlockedContinue}
          continueLoading={permissionActionLoading}
        />
      </Box>
    );
  }

  // ---- Render: scanner / loading ------------------------------------------

  let statusMessage: string | undefined;
  if (readyState === CameraReadyState.AccessingCamera) {
    statusMessage = t('accessingYourCamera');
  } else if (readyState === CameraReadyState.Ready) {
    statusMessage = t('QRHardwareScanInstructions');
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      className="qr-scanner"
    >
      <Box paddingLeft={5} paddingRight={5} className="qr-scanner__content">
        {readyState === CameraReadyState.Ready ? (
          <EnhancedReader onFrame={handleScan} />
        ) : null}
      </Box>
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
        <Box padding={4}>
          <Text variant={TextVariant.BodySm} textAlign={TextAlign.Center}>
            {statusMessage}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default BaseReader;
