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
} from '../../../shared/lib/hardware-wallet-recovery-metrics';
import {
  ConnectionStatus,
  createHardwareWalletError,
  HardwareWalletType,
  type HardwareWalletConnectionState,
} from '../../contexts/hardware-wallets';

/**
 * MetaMetrics: {@link MetaMetricsEventName.HardwareWalletRecoveryCtaClicked} when the user
 * uses a primary “Connect [device]” style CTA while the hardware wallet is not ready
 * (e.g. bridge submit, confirmation reconnect).
 *
 * No-ops when `walletType` does not map to a Segment `device_type` (required property).
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
  const connectionError =
    connectionState.status === ConnectionStatus.ErrorState
      ? connectionState.error
      : undefined;
  const walletTypeForMetrics = walletType ?? HardwareWalletType.Ledger;
  const errorForMetrics =
    connectionError ??
    createHardwareWalletError(
      ErrorCode.DeviceDisconnected,
      walletTypeForMetrics,
    );
  const deviceType = mapHardwareWalletTypeToMetricDeviceType(walletType);
  if (!deviceType) {
    return;
  }

  trackEvent({
    category: MetaMetricsEventCategory.Accounts,
    event: MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
    properties: buildHardwareWalletRecoverySegmentProperties({
      location,
      deviceType,
      deviceModel: getHardwareWalletMetricDeviceModel(errorForMetrics),
      errorType: mapHardwareWalletRecoveryErrorType(errorForMetrics),
      errorTypeViewCount: 1,
      error: errorForMetrics,
    }),
  }).catch(() => {
    // Analytics must not block or surface errors to the user.
  });
}
