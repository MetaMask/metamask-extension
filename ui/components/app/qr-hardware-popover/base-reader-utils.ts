import { ErrorCode, type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import type { Json } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../../shared/constants/metametrics';
import {
  buildHardwareWalletRecoverySegmentProperties,
  mapHardwareWalletRecoveryErrorType,
} from '../../../../shared/lib/hardware-wallet-recovery-metrics';
import {
  createHardwareWalletError,
  HardwareWalletType,
} from '../../../contexts/hardware-wallets';
import {
  CameraReadyState,
  type CameraReadyStateValue,
} from './base-reader.types';

/**
 * Maps a {@link CameraReadyState} error state to the corresponding
 * {@link ErrorCode} for MetaMetrics tracking.
 *
 * @param state - The current camera readiness state.
 * @returns The matching {@link ErrorCode}, or `null` for non-error states.
 */
export function cameraReadyStateToErrorCode(
  state: CameraReadyStateValue,
): ErrorCode | null {
  switch (state) {
    case CameraReadyState.CameraAccessBlocked:
      return ErrorCode.PermissionCameraDenied;
    case CameraReadyState.CameraAccessNeeded:
      return ErrorCode.PermissionCameraPromptDismissed;
    default:
      return null;
  }
}

/**
 * Creates a synthetic {@link HardwareWalletError} for a QR camera error state.
 *
 * @param errorCode - The SDK error code representing the camera permission issue.
 * @returns A `HardwareWalletError` instance with QR wallet metadata.
 */
export function createQrCameraSyntheticError(
  errorCode: ErrorCode,
): HardwareWalletError {
  return createHardwareWalletError(errorCode, HardwareWalletType.Qr);
}

/**
 * Builds a complete `trackEvent` argument for a QR camera recovery event.
 *
 * Encapsulates all the QR-specific constants (`device_type`, `device_model`,
 * `location`) and the synthetic error construction, so callers only need to
 * supply the event name, the camera error code, and the current view count.
 *
 * @param eventName - The Segment event name to fire.
 * @param errorCode - The SDK error code representing the camera permission issue.
 * @param errorTypeViewCount - The current monotonic view count for this error type.
 * @returns A ready-to-use `trackEvent` argument.
 */
export function buildQrCameraRecoveryTrackEventArgs(
  eventName: MetaMetricsEventName,
  errorCode: ErrorCode,
  errorTypeViewCount: number,
): {
  category: string;
  event: MetaMetricsEventName;
  properties: Record<string, Json>;
} {
  const syntheticError = createQrCameraSyntheticError(errorCode);
  return {
    category: MetaMetricsEventCategory.Accounts,
    event: eventName,
    properties: buildHardwareWalletRecoverySegmentProperties({
      location: MetaMetricsHardwareWalletRecoveryLocation.Connection,
      deviceType: MetaMetricsHardwareWalletDeviceType.QrHardware,
      deviceModel: 'N/A',
      errorType: mapHardwareWalletRecoveryErrorType(syntheticError),
      errorTypeViewCount,
      error: syntheticError,
    }),
  };
}
