import { Category, ErrorCode, Severity } from '@metamask/hw-wallet-sdk';

import {
  createHardwareWalletError,
  LEDGER_WRONG_DEVICE_ERROR_CODE,
} from './errors';
import { HardwareWalletType } from './types';

describe('createHardwareWalletError', () => {
  describe('DeviceMultipleConnected (3011)', () => {
    it('carries the Ledger single-device copy instead of the unknown fallback', () => {
      const error = createHardwareWalletError(
        ErrorCode.DeviceMultipleConnected,
        HardwareWalletType.Ledger,
      );

      expect(error.userMessage).toBe(
        "You can only connect one Ledger at a time. To use a different Ledger, remove the connected Ledger's accounts from MetaMask first.",
      );
      expect(error.message).toBe(error.userMessage);
    });

    it('is severity Error, category Connection', () => {
      const error = createHardwareWalletError(
        ErrorCode.DeviceMultipleConnected,
        HardwareWalletType.Ledger,
      );

      expect(error.severity).toBe(Severity.Err);
      expect(error.severity).toBe('Error');
      expect(error.category).toBe(Category.Connection);
    });

    it('keeps code 3011 and the wallet type in metadata', () => {
      const error = createHardwareWalletError(
        ErrorCode.DeviceMultipleConnected,
        HardwareWalletType.Ledger,
      );

      expect(error.code).toBe(ErrorCode.DeviceMultipleConnected);
      expect(error.code).toBe(3011);
      expect(error.metadata?.walletType).toBe(HardwareWalletType.Ledger);
    });
  });

  describe('LEDGER_WRONG_DEVICE_ERROR_CODE (3012)', () => {
    it('carries the wrong-device copy', () => {
      const error = createHardwareWalletError(
        LEDGER_WRONG_DEVICE_ERROR_CODE,
        HardwareWalletType.Ledger,
      );

      expect(error.userMessage).toBe(
        "This Ledger doesn't hold the account you're trying to use. Connect the Ledger you used to add this account and try again.",
      );
      expect(error.message).toBe(error.userMessage);
    });

    it('is severity Error, category DeviceState', () => {
      const error = createHardwareWalletError(
        LEDGER_WRONG_DEVICE_ERROR_CODE,
        HardwareWalletType.Ledger,
      );

      expect(error.severity).toBe(Severity.Err);
      expect(error.severity).toBe('Error');
      expect(error.category).toBe(Category.DeviceState);
    });

    it('keeps code 3012 and the wallet type in metadata', () => {
      const error = createHardwareWalletError(
        LEDGER_WRONG_DEVICE_ERROR_CODE,
        HardwareWalletType.Ledger,
      );

      expect(error.code).toBe(LEDGER_WRONG_DEVICE_ERROR_CODE);
      expect(error.code).toBe(3012);
      expect(error.metadata?.walletType).toBe(HardwareWalletType.Ledger);
    });
  });
});
