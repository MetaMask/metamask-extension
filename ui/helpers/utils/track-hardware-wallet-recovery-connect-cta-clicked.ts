import { ErrorCode } from '@metamask/hw-wallet-sdk';
import type { UITrackEventMethod } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  type MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../shared/constants/metametrics';
import {
  buildHardwareWalletRecoverySegmentProperties,
  getHardwareWalletMetricDeviceModel,
  mapHardwareWalletRecoveryErrorType,
  mapHardwareWalletTypeToMetricDeviceType,
  nextHardwareWalletRecoveryInlineCtaViewCount,
} from '../../../shared/lib/hardware-wallet-recovery-metrics';
import { createHardwareWalletError } from '../../contexts/hardware-wallets/errors';
import { getHardwareWalletErrorCode } from '../../contexts/hardware-wallets/rpcErrorUtils';
import {
  ConnectionStatus,
  HardwareWalletType,
  type HardwareWalletConnectionState,
} from '../../contexts/hardware-wallets/types';

/**
 * MetaMetrics: {@link MetaMetricsEventName.HardwareWalletRecoveryCtaClicked} when the user
 * uses a primary “Connect [device]” style CTA while the hardware wallet is not ready
 * (e.g. bridge submit, confirmation reconnect).
 *
 * No-ops when `walletType` is null/undefined or does not map to a Segment `device_type`
 * (required property). Synthetic errors are only built after those guards.
 *
 * `error_type_view_count` increments on each call for the same error identity (location,
 * wallet type, error code, normalized error type), matching the modal recovery pattern.
 * It resets when `resetHardwareWalletRecoveryInlineCtaViewCount` runs (e.g. device ready
 * or full disconnect).
 * Swallows tracking failures so callers are not blocked.
 *
 * @param trackEvent - UI `trackEvent` from {@link MetaMetricsContext}.
 * @param options - Connect-CTA recovery context.
 * @param options.location - Segment `location` for the current flow.
 * @param options.walletType - Active hardware wallet type key, if known.
 * @param options.connectionState - Current hardware wallet connection state from context.
 */
export function trackHardwareWalletRecoveryConnectCtaClicked(
  trackEvent: UITrackEventMethod,
  options: {
    location: MetaMetricsHardwareWalletRecoveryLocation;
    walletType: HardwareWalletType | null;
    connectionState: HardwareWalletConnectionState;
  },
): void {
  const { location, walletType, connectionState } = options;

  if (!walletType) {
    return;
  }

  const deviceType = mapHardwareWalletTypeToMetricDeviceType(walletType);
  if (!deviceType) {
    return;
  }

  const connectionError =
    connectionState.status === ConnectionStatus.ErrorState
      ? connectionState.error
      : undefined;
  const errorForMetrics =
    connectionError ??
    createHardwareWalletError(ErrorCode.DeviceDisconnected, walletType);

  const errorCode = getHardwareWalletErrorCode(errorForMetrics);
  const errorType = mapHardwareWalletRecoveryErrorType(errorForMetrics);
  const errorIdentityKey = `${location}:${walletType}:${String(errorCode)}:${errorType}`;
  const errorTypeViewCount =
    nextHardwareWalletRecoveryInlineCtaViewCount(errorIdentityKey);

  trackEvent({
    category: MetaMetricsEventCategory.Accounts,
    event: MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
    properties: buildHardwareWalletRecoverySegmentProperties({
      location,
      deviceType,
      deviceModel: getHardwareWalletMetricDeviceModel(errorForMetrics),
      errorType,
      errorTypeViewCount,
      error: errorForMetrics,
    }),
  }).catch(() => {
    // Analytics must not block or surface errors to the user.
  });
}
