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
  extractHardwareWalletErrorCode,
  reconstructHardwareWalletError,
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

    it('returns false for JsonRpcError with string code (should be number)', () => {
      const error = new JsonRpcError(1234, 'Some error', {
        code: '3003', // String instead of number
        severity: Severity.Err,
        category: Category.Connection,
      });

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });

    it('returns false for non-JsonRpcError', () => {
      const error = new Error('Some error');

      expect(isJsonRpcHardwareWalletError(error)).toBe(false);
    });
  });

  describe('extractHardwareWalletErrorCode', () => {
    it('extracts code from JsonRpcError with HardwareWalletError data', () => {
      const error = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = extractHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('extracts code from HardwareWalletError instance', () => {
      const error = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = extractHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('extracts code from plain object with numeric code', () => {
      const error = {
        code: ErrorCode.DeviceDisconnected,
        message: 'Device disconnected',
      };

      const result = extractHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('returns null for plain object with string code', () => {
      const error = {
        code: '3003', // String instead of number
        message: 'Device disconnected',
      };

      const result = extractHardwareWalletErrorCode(error);

      expect(result).toBe(null);
    });

    it('returns null for object without code property', () => {
      const error = {
        message: 'Some error',
      };

      const result = extractHardwareWalletErrorCode(error);

      expect(result).toBe(null);
    });

    it('returns null for plain object with invalid numeric code', () => {
      const error = {
        code: 12345, // Invalid ErrorCode value (not in VALID_ERROR_CODES)
        message: 'Invalid error code',
      };

      const result = extractHardwareWalletErrorCode(error);

      expect(result).toBe(null);
    });

    it('returns null for non-object error', () => {
      const result = extractHardwareWalletErrorCode('string error');

      expect(result).toBe(null);
    });

    it('returns null for null/undefined', () => {
      expect(extractHardwareWalletErrorCode(null)).toBe(null);
      expect(extractHardwareWalletErrorCode(undefined)).toBe(null);
    });
  });

  describe('reconstructHardwareWalletError', () => {
    it('returns original HardwareWalletError instance unchanged', () => {
      const originalError = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = reconstructHardwareWalletError(
        originalError,
        mockWalletType,
      );

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

      const result = reconstructHardwareWalletError(
        jsonRpcError,
        mockWalletType,
      );

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

    it('preserves stack trace from JsonRpcError', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });
      jsonRpcError.stack = 'mock stack trace';

      const result = reconstructHardwareWalletError(
        jsonRpcError,
        mockWalletType,
      );

      expect(result.stack).toBe('mock stack trace');
    });

    it('uses userMessage as fallback for message when message is empty', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      const result = reconstructHardwareWalletError(
        jsonRpcError,
        mockWalletType,
      );

      expect(result.message).toBe('Error');
    });

    it('provides fallback values for missing severity and category', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        userMessage: 'Device disconnected',
        // severity and category intentionally omitted
      });

      const result = reconstructHardwareWalletError(
        jsonRpcError,
        mockWalletType,
      );

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.DeviceDisconnected);
      expect(result.severity).toBe(Severity.Err);
      expect(result.category).toBe(Category.Unknown);
      expect(result.userMessage).toBe('Device disconnected');
    });

    it('falls back to generic error when data is not HardwareWalletError format', () => {
      const jsonRpcError = new JsonRpcError(1234, 'Some other error', {
        someOtherField: 'value',
      });

      const result = reconstructHardwareWalletError(
        jsonRpcError,
        mockWalletType,
      );

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('Some other error');
      expect(result.metadata).toEqual({ walletType: mockWalletType });
    });

    it('handles non-Error input by converting to string', () => {
      const result = reconstructHardwareWalletError(42, mockWalletType);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('42');
    });
  });
});
