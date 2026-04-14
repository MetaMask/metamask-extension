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
});
