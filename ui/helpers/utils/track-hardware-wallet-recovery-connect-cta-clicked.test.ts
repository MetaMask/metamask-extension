/* eslint-disable @typescript-eslint/naming-convention, camelcase -- Segment analytics payload keys */
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryErrorType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../shared/constants/metametrics';
import {
  ConnectionStatus,
  HardwareWalletType,
} from '../../contexts/hardware-wallets';
import { resetHardwareWalletRecoveryInlineCtaViewCount } from '../../../shared/lib/hardware-wallet-recovery-metrics';
import { trackHardwareWalletRecoveryConnectCtaClicked } from './track-hardware-wallet-recovery-connect-cta-clicked';

describe('trackHardwareWalletRecoveryConnectCtaClicked', () => {
  const disconnectedState = { status: ConnectionStatus.Disconnected as const };

  beforeEach(() => {
    resetHardwareWalletRecoveryInlineCtaViewCount();
  });

  it('fires HardwareWalletRecoveryCtaClicked with full Segment properties when device is disconnected', () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
      location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
      walletType: HardwareWalletType.Ledger,
      connectionState: disconnectedState,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      properties: expect.objectContaining({
        location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
        device_type: MetaMetricsHardwareWalletDeviceType.Ledger,
        device_model: 'N/A',
        error_type:
          MetaMetricsHardwareWalletRecoveryErrorType.DeviceDisconnected,
        error_type_view_count: 1,
        error_code: 'DeviceDisconnected',
      }),
    });
  });

  it('passes the given recovery location into properties', () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
      location: MetaMetricsHardwareWalletRecoveryLocation.Send,
      walletType: HardwareWalletType.Trezor,
      connectionState: disconnectedState,
    });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          location: MetaMetricsHardwareWalletRecoveryLocation.Send,
          device_type: MetaMetricsHardwareWalletDeviceType.Trezor,
        }),
      }),
    );
  });

  it('uses the connection error when state is ErrorState', () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);
    const connectionError = new HardwareWalletError('Device disconnected', {
      code: ErrorCode.DeviceDisconnected,
      severity: Severity.Err,
      category: Category.Connection,
      userMessage: 'Device disconnected',
    });

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
      location: MetaMetricsHardwareWalletRecoveryLocation.Message,
      walletType: HardwareWalletType.Ledger,
      connectionState: {
        status: ConnectionStatus.ErrorState,
        error: connectionError,
      },
    });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          location: MetaMetricsHardwareWalletRecoveryLocation.Message,
          error_type:
            MetaMetricsHardwareWalletRecoveryErrorType.DeviceDisconnected,
          error_code: 'DeviceDisconnected',
          error_message: 'Device disconnected',
        }),
      }),
    );
  });

  it('does not call trackEvent when walletType does not map to a Segment device_type', () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
      location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
      walletType: null,
      connectionState: disconnectedState,
    });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('increments error_type_view_count on repeated CTA for the same error identity', () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);
    const options = {
      location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
      walletType: HardwareWalletType.Ledger,
      connectionState: disconnectedState,
    };

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, options);
    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, options);

    expect(trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        properties: expect.objectContaining({
          error_type_view_count: 1,
        }),
      }),
    );
    expect(trackEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        properties: expect.objectContaining({
          error_type_view_count: 2,
        }),
      }),
    );
  });

  it('starts error_type_view_count at 1 again after reset for the same identity', () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);
    const options = {
      location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
      walletType: HardwareWalletType.Ledger,
      connectionState: disconnectedState,
    };

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, options);
    resetHardwareWalletRecoveryInlineCtaViewCount();
    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, options);

    expect(trackEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        properties: expect.objectContaining({
          error_type_view_count: 1,
        }),
      }),
    );
  });

  it('does not surface errors when trackEvent rejects', async () => {
    const trackEvent = jest
      .fn()
      .mockRejectedValue(new Error('segment unavailable'));

    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
      location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
      walletType: HardwareWalletType.Ledger,
      connectionState: disconnectedState,
    });

    await Promise.resolve();
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});
