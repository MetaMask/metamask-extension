import { JsonRpcError } from '@metamask/rpc-errors';
import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
} from '@metamask/hw-wallet-sdk';
import { HardwareWalletType } from './types';
import {
  isJsonRpcHardwareWalletError,
  getHardwareWalletErrorCode,
  toHardwareWalletError,
} from './rpcErrorUtils';

describe('rpcErrorUtils', () => {
  const mockWalletType = HardwareWalletType.Ledger;

  describe('isJsonRpcHardwareWalletError', () => {
    it('returns true for JsonRpcError with valid HardwareWalletError data', () => {
      const error = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      expect(isJsonRpcHardwareWalletError(error)).toBe(true);
    });

    it('returns false for JsonRpcError without data', () => {
      const error = new JsonRpcError(1234, 'Some error');

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });

    it('returns false for JsonRpcError with null data', () => {
      const error = new JsonRpcError(1234, 'Some error', null);

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });

    it('returns false for JsonRpcError with non-object data', () => {
      const error = new JsonRpcError(1234, 'Some error', 'string data');

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });

    it('returns false for JsonRpcError data without code property', () => {
      const error = new JsonRpcError(1234, 'Some error', {
        severity: Severity.Err,
        category: Category.Connection,
      });

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });

    it('returns true for JsonRpcError with string code (code can be string or number)', () => {
      const error = new JsonRpcError(1234, 'Some error', {
        code: '3003', // String code is valid
        severity: Severity.Err,
        category: Category.Connection,
      });

      expect(isJsonRpcHardwareWalletError(error)).toBe(true);
    });

    it('returns false for non-JsonRpcError', () => {
      const error = new Error('Some error');

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });
  });

  describe('getHardwareWalletErrorCode', () => {
    it('extracts code from JsonRpcError with HardwareWalletError data', () => {
      const error = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('extracts code from HardwareWalletError instance', () => {
      const error = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('extracts code from plain object with numeric code', () => {
      const error = {
        code: ErrorCode.DeviceDisconnected,
        message: 'Device disconnected',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('extracts code from plain object with string code (maps to ErrorCode)', () => {
      const error = {
        code: '3003', // String code that maps to ErrorCode.DeviceDisconnected
        message: 'Device disconnected',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('returns null for object without code property', () => {
      const error = {
        message: 'Some error',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(null);
    });

    it('returns ErrorCode.Unknown for plain object with invalid numeric code', () => {
      const error = {
        code: 12345, // Invalid ErrorCode value (not in VALID_ERROR_CODES)
        message: 'Invalid error code',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.Unknown);
    });

    it('returns null for non-object error', () => {
      const result = getHardwareWalletErrorCode('string error');

      expect(result).toBe(null);
    });

    it('returns null for null/undefined', () => {
      expect(getHardwareWalletErrorCode(null)).toBe(null);
      expect(getHardwareWalletErrorCode(undefined)).toBe(null);
    });
  });

  describe('toHardwareWalletError', () => {
    it('returns original HardwareWalletError instance unchanged', () => {
      const originalError = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = toHardwareWalletError(originalError, mockWalletType);

      expect(result).toBe(originalError);
    });

    it('reconstructs HardwareWalletError from JsonRpcError with valid data', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
        metadata: { deviceId: 'test-device' },
      });

      const result = toHardwareWalletError(jsonRpcError, mockWalletType);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.DeviceDisconnected);
      expect(result.severity).toBe(Severity.Err);
      expect(result.category).toBe(Category.Connection);
      expect(result.userMessage).toBe('Device disconnected');
      expect(result.metadata).toEqual({
        deviceId: 'test-device',
        walletType: mockWalletType,
      });
      expect(result.message).toBe('Hardware wallet error');
    });

    it('maps Ledger status codes in JsonRpcError data to ErrorCode', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Ledger device error', {
        code: 21781,
      });

      const result = toHardwareWalletError(
        jsonRpcError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationDeviceLocked);
    });

    it('preserves stack trace from JsonRpcError', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });
      jsonRpcError.stack = 'mock stack trace';

      const result = toHardwareWalletError(jsonRpcError, mockWalletType);

      expect(result.stack).toBe('mock stack trace');
    });

    it('uses userMessage as fallback for message when message is empty', () => {
      const jsonRpcError = new JsonRpcError(1234, 'placeholder', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });
      // Simulate an empty message by setting it after construction
      jsonRpcError.message = '';

      const result = toHardwareWalletError(jsonRpcError, mockWalletType);

      expect(result.message).toBe('Device disconnected');
      expect(result.userMessage).toBe('Device disconnected');
    });

    it('passes undefined for missing severity and category', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        userMessage: 'Device disconnected',
        // severity and category intentionally omitted
      });

      const result = toHardwareWalletError(jsonRpcError, mockWalletType);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.DeviceDisconnected);
      expect(result.severity).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(result.userMessage).toBe('Device disconnected');
    });

    it('falls back to generic error when data is not HardwareWalletError format', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Some other error', {
        someOtherField: 'value',
      });

      const result = toHardwareWalletError(jsonRpcError, mockWalletType);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('Some other error');
      expect(result.metadata).toEqual({ walletType: mockWalletType });
    });

    it('handles non-Error input by converting to string', () => {
      const result = toHardwareWalletError(42, mockWalletType);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('42');
    });
  });
});
