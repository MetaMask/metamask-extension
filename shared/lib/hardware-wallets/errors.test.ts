import { it as jestIt } from '@jest/globals';
import { Category, ErrorCode, Severity } from '@metamask/hw-wallet-sdk';

import {
  createHardwareWalletError,
  HardwareWalletErrorCode,
  isLedgerAccountPathMissingError,
  isLedgerSeedMismatchMessage,
} from './errors';
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

  it('gives 3012 the wrong-device copy and matches Ledger seed error predicates', () => {
    const error = createHardwareWalletError(
      HardwareWalletErrorCode.DeviceSeedMismatch,
      HardwareWalletType.Ledger,
    );
    expect(error).toMatchObject({ code: 3012, category: Category.DeviceState });
    expect(error.userMessage).toContain("doesn't hold the account");

    for (const msg of [
      'does not belong to the connected device',
      'doesnt match the right address',
      'does not match the right address',
    ]) {
      expect(isLedgerSeedMismatchMessage(`LEDGER: ${msg.toUpperCase()}`)).toBe(
        true,
      );
    }
    expect(isLedgerSeedMismatchMessage('User rejected on device')).toBe(false);
    expect(
      isLedgerAccountPathMissingError(new Error('Ledger: account not found')),
    ).toBe(true);
    expect(isLedgerAccountPathMissingError(new Error('Device locked'))).toBe(
      false,
    );
    expect(isLedgerAccountPathMissingError('Ledger: not found')).toBe(false);
  });
});
