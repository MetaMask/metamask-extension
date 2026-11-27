import { it as jestIt } from '@jest/globals';
import { Category, ErrorCode, Severity } from '@metamask/hw-wallet-sdk';

import { createHardwareWalletError } from './errors';
import { HardwareWalletType } from './types';

describe('createHardwareWalletError', () => {
  jestIt.each([
    [
      HardwareWalletType.Ledger,
      Category.Connection,
      "You can only connect one Ledger at a time. To use a different Ledger, remove the connected Ledger's accounts from MetaMask first.",
    ],
    [
      HardwareWalletType.Trezor,
      Category.DeviceState,
      'Multiple Trezor devices are connected. Keep one connected and retry.',
    ],
  ])('gives %s its own 3011 copy', (walletType, category, userMessage) => {
    // Regression guard: Trezor 3011 must not receive the Ledger copy.
    expect(
      createHardwareWalletError(ErrorCode.DeviceMultipleConnected, walletType),
    ).toMatchObject({
      code: ErrorCode.DeviceMultipleConnected,
      severity: Severity.Err,
      category,
      userMessage,
    });
  });
});
