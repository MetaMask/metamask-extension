import { ErrorCode, type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import type { Json } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../../../shared/constants/metametrics';
import {
  createEventBuilder,
  type AnalyticsEvent,
} from '../../../../../shared/lib/analytics/create-event-builder';
import {
  buildHardwareWalletRecoverySegmentProperties,
  mapHardwareWalletRecoveryErrorType,
} from '../../../../../shared/lib/hardware-wallet-recovery-metrics';
import {
  createHardwareWalletError,
  HardwareWalletType,
} from '../../../../contexts/hardware-wallets';
import type { QrErrorFlowContext } from '../qr-error-content';
import {
  ScanErrorCategory,
  type ScanErrorClassification,
} from '../qr-utils/qr-utils';
import {
  CameraReadyState,
  type CameraReadyStateValue,
} from './base-qr-reader.types';

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
 * @returns A ready-to-use analytics event.
 */
export function buildQrCameraRecoveryTrackEventArgs(
  eventName: MetaMetricsEventName,
  errorCode: ErrorCode,
  errorTypeViewCount: number,
): AnalyticsEvent {
  const syntheticError = createQrCameraSyntheticError(errorCode);
  return createEventBuilder(eventName)
    .addCategory(MetaMetricsEventCategory.Accounts)
    .addProperties(
      buildHardwareWalletRecoverySegmentProperties({
        location: MetaMetricsHardwareWalletRecoveryLocation.Connection,
        deviceType: MetaMetricsHardwareWalletDeviceType.QrHardware,
        deviceModel: 'N/A',
        errorType: mapHardwareWalletRecoveryErrorType(syntheticError),
        errorTypeViewCount,
        error: syntheticError,
      }),
    )
    .build();
}

/**
 * Builds a complete `trackEvent` argument for a QR scan-failed event.
 *
 * Every category includes `error_category`, `is_ur_format`, and `flow`.
 * `received_ur_type` is added for `wrong_ur_type`; `raw_message` is added
 * for `scan_exception`.
 *
 * @param classification - The structured scan error from {@link classifyScanResult}.
 * @param flow - Whether the scan occurred during pairing or signing.
 * @returns A ready-to-use analytics event.
 */
export function buildQrScanFailedTrackEventArgs(
  classification: ScanErrorClassification,
  flow: QrErrorFlowContext,
): AnalyticsEvent {
  const properties: Record<string, Json> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
    device_type: MetaMetricsHardwareWalletDeviceType.QrHardware,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
    error_category: classification.category,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
    is_ur_format: classification.isUrFormat,
    flow,
  };

  if (classification.category === ScanErrorCategory.WrongUrType) {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
    properties.received_ur_type = classification.receivedUrType;
  }

  if (classification.category === ScanErrorCategory.ScanException) {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
    properties.raw_message = classification.rawMessage;
  }

  return createEventBuilder(MetaMetricsEventName.QrHardwareScanFailed)
    .addCategory(MetaMetricsEventCategory.Accounts)
    .addProperties(properties)
    .build();
}
