import {
  Category,
  ErrorCode,
  HardwareWalletError,
  LEDGER_ERROR_MAPPINGS,
  Severity,
} from '@metamask/hw-wallet-sdk';
import { parseErrorByType, getConnectionStateFromError } from './errors';
import { HardwareWalletType, ConnectionStatus } from './types';

describe('parseErrorByType', () => {
  describe('HardwareWalletError passthrough', () => {
    it('returns HardwareWalletError as-is when already a HardwareWalletError', () => {
      const hwError = new HardwareWalletError('Test error', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Test message',
      });
      const result = parseErrorByType(hwError, HardwareWalletType.Ledger);

      expect(result).toBe(hwError);
      expect(result.code).toBe(ErrorCode.AuthenticationDeviceLocked);
    });
  });

  describe('Ledger error mappings', () => {
    it('parses Ledger error codes from LEDGER_ERROR_MAPPINGS', () => {
      // Get a sample error mapping from LEDGER_ERROR_MAPPINGS
      const sampleMapping = Object.entries(LEDGER_ERROR_MAPPINGS).find(
        ([, mapping]) => mapping.code !== undefined,
      );

      if (sampleMapping) {
        const [errorCode, mapping] = sampleMapping;
        const error = new Error(`Error: ${errorCode}`);
        const result = parseErrorByType(error, HardwareWalletType.Ledger);

        expect(result.code).toBe(mapping.code);
      }
    });

    it('parses "0x6982" error (Security condition not satisfied)', () => {
      const error = new Error('Error: 0x6982');
      const result = parseErrorByType(error, HardwareWalletType.Ledger);

      const mapping = LEDGER_ERROR_MAPPINGS['0x6982'];
      expect(result.code).toBe(mapping.code);
    });

    it('parses "0x6985" error (Conditions of use not satisfied)', () => {
      const error = new Error('Error: 0x6985');
      const result = parseErrorByType(error, HardwareWalletType.Ledger);

      const mapping = LEDGER_ERROR_MAPPINGS['0x6985'];
      expect(result.code).toBe(mapping.code);
    });

    it('does not parse Ledger errors for non-Ledger wallets', () => {
      const error = new Error('Error: 0x6982');
      const result = parseErrorByType(error, HardwareWalletType.Trezor);

      // Should default to Unknown since Ledger mappings are not checked for Trezor
      expect(result.code).toBe(ErrorCode.Unknown);
    });

    it('parses Ledger errors only for Ledger wallets', () => {
      const error = new Error('Error: 0x6982');
      const ledgerResult = parseErrorByType(error, HardwareWalletType.Ledger);
      const trezorResult = parseErrorByType(error, HardwareWalletType.Trezor);

      const mapping = LEDGER_ERROR_MAPPINGS['0x6982'];
      expect(ledgerResult.code).toBe(mapping.code);
      expect(trezorResult.code).toBe(ErrorCode.Unknown);
    });
  });

  describe('unknown errors', () => {
    it('defaults to ErrorCode.Unknown for unrecognized errors', () => {
      const unknownError = new Error('Some unknown error occurred');
      const result = parseErrorByType(unknownError, HardwareWalletType.Ledger);

      expect(result.code).toBe(ErrorCode.Unknown);
    });

    it('handles non-Error objects by converting to string', () => {
      const nonError = 'String error message';
      const result = parseErrorByType(nonError, HardwareWalletType.Ledger);

      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('String error message');
    });

    it('handles null input', () => {
      const result = parseErrorByType(null, HardwareWalletType.Ledger);

      expect(result.code).toBe(ErrorCode.Unknown);
    });

    it('handles undefined input', () => {
      const result = parseErrorByType(undefined, HardwareWalletType.Ledger);

      expect(result.code).toBe(ErrorCode.Unknown);
    });
  });

  describe('error properties', () => {
    it('includes walletType in metadata', () => {
      const error = new Error('Test error');
      const result = parseErrorByType(error, HardwareWalletType.Trezor);

      expect(result.metadata?.walletType).toBe(HardwareWalletType.Trezor);
    });

    it('includes cause when error is an Error instance', () => {
      const originalError = new Error('Original error');
      const result = parseErrorByType(originalError, HardwareWalletType.Ledger);

      expect(result.cause).toBe(originalError);
    });

    it('does not include cause when error is not an Error instance', () => {
      const nonError = 'String error';
      const result = parseErrorByType(nonError, HardwareWalletType.Ledger);

      expect(result.cause).toBeUndefined();
    });
  });
});

describe('getConnectionStateFromError', () => {
  describe('authentication errors', () => {
    it('returns error state for AuthenticationDeviceLocked', () => {
      const error = new HardwareWalletError('Device locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is locked',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });

    it('returns error state for AuthenticationDeviceBlocked', () => {
      const error = new HardwareWalletError('Device blocked', {
        code: ErrorCode.AuthenticationDeviceBlocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is blocked',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });

    it('returns error state for AuthenticationSecurityCondition', () => {
      const error = new HardwareWalletError('Permission denied', {
        code: ErrorCode.AuthenticationSecurityCondition,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Permission denied',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });
  });

  describe('device state errors', () => {
    it('returns awaitingApp state for DeviceStateEthAppClosed', () => {
      const error = new HardwareWalletError('Ethereum app closed', {
        code: ErrorCode.DeviceStateEthAppClosed,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Ethereum app is closed',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.AwaitingApp);
    });
  });

  describe('connection errors', () => {
    it('returns error state for ConnectionTransportMissing', () => {
      const error = new HardwareWalletError('Transport missing', {
        code: ErrorCode.ConnectionTransportMissing,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Transport is missing',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });

    it('returns error state for ConnectionClosed', () => {
      const error = new HardwareWalletError('Connection closed', {
        code: ErrorCode.ConnectionClosed,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Connection closed',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });

    it('returns error state for DeviceDisconnected', () => {
      const error = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });

    it('returns error state for ConnectionTimeout', () => {
      const error = new HardwareWalletError('Connection timeout', {
        code: ErrorCode.ConnectionTimeout,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Connection timed out',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });
  });

  describe('user action errors', () => {
    it('returns error state for UserRejected', () => {
      const error = new HardwareWalletError('User rejected', {
        code: ErrorCode.UserRejected,
        severity: Severity.Warning,
        category: Category.UserAction,
        userMessage: 'User rejected the operation',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });

    it('returns error state for UserCancelled', () => {
      const error = new HardwareWalletError('User cancelled', {
        code: ErrorCode.UserCancelled,
        severity: Severity.Warning,
        category: Category.UserAction,
        userMessage: 'User cancelled the operation',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });
  });

  describe('unknown errors', () => {
    it('returns error state for unknown error codes', () => {
      const error = new HardwareWalletError('Unknown error', {
        code: ErrorCode.Unknown,
        severity: Severity.Err,
        category: Category.Unknown,
        userMessage: 'An unknown error occurred',
      });
      const result = getConnectionStateFromError(error);

      expect(result.status).toBe(ConnectionStatus.ErrorState);
    });
  });
});
