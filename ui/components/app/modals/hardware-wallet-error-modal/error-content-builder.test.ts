import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { createHardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { buildErrorContent } from './error-content-builder';

describe('buildErrorContent', () => {
  it('passes the wallet type substitution for ConnectionClosed recovery copy', () => {
    const t = jest.fn((key: string, substitutions?: string[]) => {
      if (key === HardwareWalletType.Ledger) {
        return 'Ledger';
      }

      return substitutions ? `${key}:${substitutions.join(',')}` : key;
    });

    const error = createHardwareWalletError(
      ErrorCode.ConnectionClosed,
      HardwareWalletType.Ledger,
    );

    const content = buildErrorContent(error, HardwareWalletType.Ledger, t);

    expect(content).toMatchObject({
      variant: 'recovery',
      recoveryInstructions: [
        'hardwareWalletErrorRecoveryUnlock1:Ledger',
        'hardwareWalletErrorRecoveryUnlock2',
      ],
    });
    expect(t).toHaveBeenCalledWith('hardwareWalletErrorRecoveryUnlock1', [
      'Ledger',
    ]);
    expect(t).toHaveBeenCalledWith('hardwareWalletErrorRecoveryUnlock2');
  });

  describe('showRepairLink flag', () => {
    const t = jest.fn((key: string) => key);

    it('returns showRepairLink true for DeviceDisconnected', () => {
      const error = createHardwareWalletError(
        ErrorCode.DeviceDisconnected,
        HardwareWalletType.Ledger,
      );
      const content = buildErrorContent(error, HardwareWalletType.Ledger, t);
      expect(content).toMatchObject({ showRepairLink: true });
    });

    it('returns showRepairLink true for ConnectionClosed', () => {
      const error = createHardwareWalletError(
        ErrorCode.ConnectionClosed,
        HardwareWalletType.Ledger,
      );
      const content = buildErrorContent(error, HardwareWalletType.Ledger, t);
      expect(content).toMatchObject({ showRepairLink: true });
    });

    it('returns showRepairLink true for ConnectionTransportMissing', () => {
      const error = createHardwareWalletError(
        ErrorCode.ConnectionTransportMissing,
        HardwareWalletType.Ledger,
      );
      const content = buildErrorContent(error, HardwareWalletType.Ledger, t);
      expect(content).toMatchObject({
        variant: 'recovery',
        showRepairLink: true,
      });
    });

    it('returns showRepairLink false for AuthenticationDeviceLocked', () => {
      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
      );
      const content = buildErrorContent(error, HardwareWalletType.Ledger, t);
      expect(content).toMatchObject({ showRepairLink: false });
    });

    it('returns showRepairLink false for unknown error codes', () => {
      const error = createHardwareWalletError(
        ErrorCode.Unknown,
        HardwareWalletType.Ledger,
      );
      const content = buildErrorContent(error, HardwareWalletType.Ledger, t);
      expect(content).toMatchObject({ showRepairLink: false });
    });
  });
});
