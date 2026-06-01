import { useCallback, useEffect, useRef } from 'react';
import log from 'loglevel';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { CameraPermissionState } from '../../../../contexts/hardware-wallets/constants';
import WebcamUtils from '../../../../helpers/utils/webcam-utils';
import type { WebcamError } from '../base-reader.types';
import type { StateDispatchers, TrackingCallbacks } from './qr-hooks.types';
import {
  shouldShowBlockedUi,
  isNotAllowedError,
  extractCurrentRoute,
} from './qr-hooks-utils';

/**
 * Manages the `PermissionStatus.change` subscription so the scanner can
 * transition to READY when the user grants camera access externally.
 *
 * @returns An object with `attach` (subscribe to permission changes) and
 * `cleanup` (unsubscribe and release references).
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

/**
 * Encapsulates the full camera permission lifecycle:
 * - Environment check (redirect to fullscreen if needed)
 * - Permission query and classification
 * - getUserMedia acquisition
 * - PermissionStatus change listener for auto-recovery
 * - Continue button handlers for blocked/needed states
 *
 * @param dispatchers - State transition dispatchers and current readyState.
 * @param tracking - MetaMetrics tracking callbacks for CTA click events.
 * @returns An object with `handleCameraAccessNeededContinue`,
 * `handleCameraAccessBlockedContinue`, `cleanupPermissionListener`,
 * and `checkEnvironment`.
 */
export function useCameraPermission(
  dispatchers: StateDispatchers,
  tracking: TrackingCallbacks,
) {
  const {
    setReady,
    setBlocked,
    setNeeded,
    setError,
    setPermissionActionLoading,
  } = dispatchers;

  const { trackCameraRecoveryCtaClicked } = tracking;

  const mountedRef = useRef(false);
  const {
    attach: attachPermissionListener,
    cleanup: cleanupPermissionListener,
  } = usePermissionChangeListener();

  /**
   * Probes the camera after an external permission grant, then transitions
   * to READY on success.
   *
   * Wired as the `PermissionStatus.onchange` callback, so the scanner can
   * auto-recover when the user grants camera access outside our UI
   * (e.g. browser settings, address-bar permission icon). Without this,
   * the user would be stuck on the blocked/needed screen even after
   * granting permission and would have to close and reopen the QR flow.
   *
   * A `granted` state alone does not guarantee the hardware is available
   * (exclusive lock, a device disconnected), so we do a short
   * `getUserMedia` / `stop` round-trip to confirm the camera can actually
   * be opened. The stream is released immediately because `EnhancedReader`
   * opens its own once READY renders.
   *
   * On failure the UI stays on the recovery screen and the user can retry.
   */
  const acquireCameraAndTransitionToReady = useCallback(async () => {
    try {
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReady();
      }
    } catch (cameraError) {
      log.info(
        'QR camera: could not acquire stream after permission grant',
        cameraError,
      );
    }
  }, [cleanupPermissionListener, setReady]);

  /**
   * Re-queries the permission state after a `NotAllowedError` and attaches
   * a change listener for auto-recovery.
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

  /**
   * Classifies a `NotAllowedError` after re-querying the permission state
   * and dispatches to the appropriate UI (blocked or needed).
   */
  const handleNotAllowedError = useCallback(async () => {
    const nextState = await reconcileNotAllowedPermission();
    if (!mountedRef.current) {
      return;
    }
    if (shouldShowBlockedUi(nextState)) {
      setBlocked();
    } else {
      setNeeded();
    }
  }, [reconcileNotAllowedPermission, setBlocked, setNeeded]);

  /**
   * Prompts the user for camera access via `getUserMedia`. On success
   * transitions to READY; on `NotAllowedError` classifies the denial.
   */
  const promptForCameraAccess = useCallback(async () => {
    try {
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReady();
      }
    } catch (cameraError) {
      if (isNotAllowedError(cameraError)) {
        await handleNotAllowedError();
      } else if (mountedRef.current) {
        setError(cameraError as WebcamError);
      }
    }
  }, [cleanupPermissionListener, setReady, handleNotAllowedError, setError]);

  /**
   * Initial permission flow. Queries the Permissions API, then dispatches
   * to the appropriate handler based on the current permission state.
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
        setBlocked();
      }
      return;
    }

    if (state === CameraPermissionState.Granted) {
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReady();
      }
      return;
    }

    await promptForCameraAccess();
  }, [
    attachPermissionListener,
    acquireCameraAndTransitionToReady,
    cleanupPermissionListener,
    setReady,
    setBlocked,
    promptForCameraAccess,
  ]);

  /**
   * Ensures the extension runs in a context capable of prompting for camera
   * access. Popup/side-panel environments redirect to a fullscreen tab.
   */
  const checkEnvironment = useCallback(async () => {
    try {
      const { environmentReady } = await WebcamUtils.checkStatus();
      if (
        !environmentReady &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN
      ) {
        globalThis.platform.openExtensionInBrowser(extractCurrentRoute());
        return;
      }
    } catch (environmentError) {
      if (mountedRef.current) {
        setError(environmentError as WebcamError);
      }
      return;
    }
    await startCameraPermissionFlow();
  }, [startCameraPermissionFlow, setError]);

  /**
   * Handler for the "needed" (prompt-dismissed) Continue button.
   * Re-requests camera access via `getUserMedia`.
   */
  const handleCameraAccessNeededContinue = useCallback(async () => {
    trackCameraRecoveryCtaClicked();
    setPermissionActionLoading(true);
    try {
      const stream = await WebcamUtils.requestVideoStream();
      WebcamUtils.stopVideoStream(stream);
      if (mountedRef.current) {
        cleanupPermissionListener();
        setReady();
      }
    } catch (cameraError) {
      if (isNotAllowedError(cameraError)) {
        const nextState = await reconcileNotAllowedPermission();
        if (mountedRef.current && shouldShowBlockedUi(nextState)) {
          setBlocked();
        }
      } else if (mountedRef.current) {
        setError(cameraError as WebcamError);
      }
    } finally {
      if (mountedRef.current) {
        setPermissionActionLoading(false);
      }
    }
  }, [
    trackCameraRecoveryCtaClicked,
    setPermissionActionLoading,
    cleanupPermissionListener,
    setReady,
    reconcileNotAllowedPermission,
    setBlocked,
    setError,
  ]);

  /**
   * Handler for the "blocked" Continue button. Re-checks the permission
   * state; if no longer denied, acquires the camera.
   */
  const handleCameraAccessBlockedContinue = useCallback(async () => {
    trackCameraRecoveryCtaClicked();
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
        setReady();
      }
    } catch (cameraError) {
      if (isNotAllowedError(cameraError)) {
        await reconcileNotAllowedPermission();
      } else if (mountedRef.current) {
        setError(cameraError as WebcamError);
      }
    } finally {
      if (mountedRef.current) {
        setPermissionActionLoading(false);
      }
    }
  }, [
    trackCameraRecoveryCtaClicked,
    setPermissionActionLoading,
    cleanupPermissionListener,
    setReady,
    reconcileNotAllowedPermission,
    setError,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    checkEnvironment();
    return () => {
      mountedRef.current = false;
      cleanupPermissionListener();
    };
  }, [checkEnvironment, cleanupPermissionListener]);

  return {
    handleCameraAccessNeededContinue,
    handleCameraAccessBlockedContinue,
    cleanupPermissionListener,
    checkEnvironment,
  } as const;
}
