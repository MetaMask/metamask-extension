import { JsonRpcError } from '@metamask/rpc-errors';
import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
} from '@metamask/hw-wallet-sdk';
import { KeyringControllerError } from '@metamask/keyring-controller';
import { HardwareWalletType } from './types';
import {
  isJsonRpcHardwareWalletError,
  getHardwareWalletErrorCode,
  toHardwareWalletError,
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
  extractTrezorCodeFromMessage,
  extractMessageFromUnknownError,
  hasUserRejectedMessage,
} from './rpcErrorUtils';

describe('rpcErrorUtils', () => {
  const mockWalletType = HardwareWalletType.Ledger;
  const trezorWalletType = HardwareWalletType.Trezor;

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

    it('extracts code from plain object with Trezor SDK string code', () => {
      const error = {
        code: 'Method_Cancel',
        message: 'Canceled',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.UserCancelled);
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

    it('prefers raw hardware-wallet code 4001 over the EIP-1193 collision', () => {
      const error = {
        code: 4001,
        message: 'Connection closed',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.ConnectionClosed);
    });

    it('extracts code from serialized RPC error with hardware wallet cause', () => {
      const error = {
        code: -32603,
        data: {
          cause: {
            name: 'HardwareWalletError',
            message: 'Serialized hardware wallet error',
            code: ErrorCode.DeviceDisconnected,
            stack: 'stack trace',
          },
        },
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.DeviceDisconnected);
    });

    it('returns Unknown for plain object with non-numeric, invalid string code', () => {
      const error = {
        code: 'NotARealErrorCode',
        message: 'Invalid string code',
      };

      const result = getHardwareWalletErrorCode(error);

      expect(result).toBe(ErrorCode.Unknown);
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
        metadata: { transport: 'usb' },
      });

      const result = toHardwareWalletError(jsonRpcError, mockWalletType);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.DeviceDisconnected);
      expect(result.severity).toBe(Severity.Err);
      expect(result.category).toBe(Category.Connection);
      expect(result.userMessage).toBe('Device disconnected');
      expect(result.metadata).toEqual({
        transport: 'usb',
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

    it('maps Trezor cancellation code to UserCancelled', () => {
      const result = toHardwareWalletError(
        new Error('TrezorError (code: Method_Cancel): Canceled'),
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.UserCancelled);
    });

    it('maps Trezor rejection code to UserRejected', () => {
      const result = toHardwareWalletError(
        new Error(
          'TrezorError (code: Method_PermissionsNotGranted): Permissions not granted',
        ),
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.UserRejected);
    });

    it('maps Trezor SDK error.code to the SDK ErrorCode', () => {
      const result = toHardwareWalletError(
        {
          code: 'Method_Cancel',
          message: 'Canceled',
        },
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.UserCancelled);
    });

    it('maps direct Trezor interrupted code to the SDK ErrorCode', () => {
      const result = toHardwareWalletError(
        {
          code: 'Method_Interrupted',
          message: 'Interrupted',
        },
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.ConnectionClosed);
    });

    it('returns Unknown for unmapped Trezor codes extracted from message', () => {
      const result = toHardwareWalletError(
        new Error(
          'TrezorError (code: Method_DataOverflowModelOne): Message too large',
        ),
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.Unknown);
    });

    it('returns Unknown for wrapped Trezor messages without explicit code format', () => {
      const result = toHardwareWalletError(
        new Error('Wrapped failure: Method_Interrupted while signing'),
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.Unknown);
    });

    it('maps Trezor device disconnect to DeviceDisconnected', () => {
      const result = toHardwareWalletError(
        new Error('Device disconnected'),
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.DeviceDisconnected);
    });

    it('maps Trezor missing transport to ConnectionTransportMissing', () => {
      const result = toHardwareWalletError(
        new Error('Transport is missing'),
        trezorWalletType,
      );

      expect(result.code).toBe(ErrorCode.ConnectionTransportMissing);
    });

    it('reconstructs from top-level serialized HardwareWalletError shape', () => {
      const serializedError = {
        id: 'err_abc',
        name: 'HardwareWalletError',
        message: 'Ledger: User rejected action on device',
        code: ErrorCode.UserRejected,
        severity: Severity.Warning,
        category: Category.UserAction,
        userMessage:
          'Transaction was rejected. Please approve on your device to continue.',
        timestamp: '2026-03-03T09:56:15.151Z',
      };

      const result = toHardwareWalletError(
        serializedError,
        HardwareWalletType.Ledger,
      );

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.UserRejected);
      expect(result.message).toBe('Ledger: User rejected action on device');
      expect(result.userMessage).toBe(
        'Transaction was rejected. Please approve on your device to continue.',
      );
      expect(result.metadata).toEqual({
        walletType: HardwareWalletType.Ledger,
      });
    });

    it('does not treat generic provider errors as top-level serialized hardware wallet errors', () => {
      const providerError = {
        code: 4001,
        message: 'User rejected',
      };

      const result = toHardwareWalletError(
        providerError,
        HardwareWalletType.Ledger,
      );

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('User rejected');
      expect(result.metadata).toEqual({
        walletType: HardwareWalletType.Ledger,
      });
    });

    it('does not treat generic RPC errors as top-level serialized hardware wallet errors', () => {
      const rpcError = {
        code: -32603,
        message: 'Internal error',
      };

      const result = toHardwareWalletError(rpcError, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('Internal error');
      expect(result.metadata).toEqual({
        walletType: HardwareWalletType.Ledger,
      });
    });

    it('returns Unknown for KeyringControllerError serialized cause without explicit code', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message:
            'Keyring Controller signTypedMessage: HardwareWalletError: Ledger: User rejected action on device',
          cause: {
            name: 'HardwareWalletError',
            message: 'Ledger: User rejected action on device',
            stack:
              'HardwareWalletError [UserRejected:2000]: Ledger: User rejected action on device',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe(
        'Keyring Controller signTypedMessage: HardwareWalletError: Ledger: User rejected action on device',
      );
      expect(result.metadata).toEqual({
        walletType: HardwareWalletType.Ledger,
      });
    });

    it('returns Unknown for serialized cause stack enum when code is missing', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed',
          cause: {
            name: 'HardwareWalletError',
            message: 'opaque serialized cause',
            stack:
              'HardwareWalletError [UserRejected:2000]: Ledger: User rejected action on device',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('sign operation failed');
    });

    it('returns Unknown for conflicting serialized stack and cause message without explicit code', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed',
          cause: {
            name: 'HardwareWalletError',
            message: 'Wrapped failure: Method_Interrupted while signing',
            stack:
              'HardwareWalletError [ConnectionClosed:4001]: Trezor connection closed',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Trezor);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('sign operation failed');
    });

    it('returns Unknown for opaque serialized stack and message without explicit code format', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'Trezor sign operation failed',
          cause: {
            name: 'HardwareWalletError',
            message: 'Wrapped failure: Method_Interrupted while signing',
            stack: 'opaque serialized stack',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Trezor);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('Trezor sign operation failed');
    });

    it('maps Trezor wrapped unknown cancellation from KeyringControllerError', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message:
            'Keyring Controller signTypedMessage: HardwareWalletError: Cancelled',
          cause: {
            name: 'HardwareWalletError',
            code: ErrorCode.Unknown,
            message: 'Cancelled',
            stack: 'HardwareWalletError [Unknown:99999]: Cancelled',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Trezor);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.UserCancelled);
      expect(result.message).toBe('Cancelled');
    });

    it('maps Trezor wrapped cancellation without cause code from KeyringControllerError', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message:
            'Keyring Controller signTypedMessage: HardwareWalletError: Cancelled',
          cause: {
            name: 'HardwareWalletError',
            message: 'Cancelled',
            stack: 'HardwareWalletError: Cancelled',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Trezor);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.UserCancelled);
      expect(result.message).toBe('Cancelled');
    });

    it('reconstructs from serialized RPC cause and preserves stack/metadata', () => {
      const serializedRpcError = {
        code: -32603,
        data: {
          cause: {
            name: 'HardwareWalletError',
            message: 'Serialized cause message',
            code: ErrorCode.DeviceDisconnected,
            stack: 'serialized stack trace',
          },
          metadata: { recreatedTxId: 'tx-123' },
        },
      };

      const result = toHardwareWalletError(
        serializedRpcError,
        HardwareWalletType.Ledger,
      );

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.DeviceDisconnected);
      expect(result.message).toBe('Serialized cause message');
      expect(result.stack).toBe('serialized stack trace');
      expect(result.metadata).toEqual({
        recreatedTxId: 'tx-123',
        walletType: HardwareWalletType.Ledger,
      });
    });

    it('uses explicit code from KeyringControllerError cause when available', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed',
          cause: {
            code: ErrorCode.UserCancelled,
            message: 'User cancelled on device',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.UserCancelled);
      expect(result.message).toBe('User cancelled on device');
    });

    it('maps Trezor SDK cause.code from KeyringControllerError', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'Trezor sign operation failed',
          cause: {
            code: 'Method_Cancel',
            message: 'Canceled',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Trezor);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.UserCancelled);
      expect(result.message).toBe('Canceled');
    });

    it('returns Unknown for serialized Trezor cause message without explicit code format', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'Trezor sign operation failed',
          cause: {
            name: 'HardwareWalletError',
            message: 'Wrapped failure: Method_Interrupted while signing',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Trezor);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('Trezor sign operation failed');
    });

    it('returns Unknown for KeyringControllerError cause text without explicit code', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed',
          cause: {
            name: 'HardwareWalletError',
            message: 'Ledger: User canceled action on device',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('sign operation failed');
    });

    it('returns Unknown for KeyringControllerError rejected cause text without explicit code', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed',
          cause: {
            name: 'HardwareWalletError',
            message: 'Ledger: User rejected action on device',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('sign operation failed');
    });

    it('uses keyring error code when cause cannot be interpreted', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          code: 'UserRejected',
          message: 'User rejected in keyring',
          cause: {
            name: 'SomeOtherError',
            message: 'Unknown inner error',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.UserRejected);
      expect(result.message).toBe('User rejected in keyring');
    });

    it('does not infer hardware-wallet code from non-hardware cause text', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed',
          cause: {
            name: 'SomeOtherError',
            message: 'User rejected the request',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('sign operation failed');
    });

    it('falls back to Unknown when keyring text inference does not match', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message: 'sign operation failed for unknown reason',
          cause: {
            name: 'HardwareWalletError',
            message: 'inner error without user-action marker',
            stack: 'opaque stack trace',
          },
        },
      );

      const result = toHardwareWalletError(error, HardwareWalletType.Ledger);

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.Unknown);
      expect(result.message).toBe('sign operation failed for unknown reason');
    });

    it('maps Ledger hex status code from fallback error message', () => {
      const result = toHardwareWalletError(
        new Error('Device is locked (Ledger device: Locked device (0x5515))'),
        HardwareWalletType.Ledger,
      );

      expect(result).toBeInstanceOf(HardwareWalletError);
      expect(result.code).toBe(ErrorCode.AuthenticationDeviceLocked);
      expect(result.message).toContain('0x5515');
    });
  });

  describe('isHardwareWalletError', () => {
    it('returns true for HardwareWalletError instance', () => {
      const error = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      expect(isHardwareWalletError(error)).toBe(true);
    });

    it('returns true for JsonRpcError with valid HardwareWalletError data', () => {
      const error = new JsonRpcError(1234, 'Hardware wallet error', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      expect(isHardwareWalletError(error)).toBe(true);
    });

    it('returns true for error with name HardwareWalletError', () => {
      const error = {
        name: 'HardwareWalletError',
        message: 'some error',
      };

      expect(isHardwareWalletError(error)).toBe(true);
    });

    it('returns true for error with data.cause.name HardwareWalletError', () => {
      const error = {
        message: 'some error',
        data: {
          cause: {
            name: 'HardwareWalletError',
          },
        },
      };

      expect(isHardwareWalletError(error)).toBe(true);
    });

    it('returns true for plain object with Trezor SDK string code', () => {
      const error = {
        code: 'Method_Cancel',
        message: 'Canceled',
      };

      expect(isHardwareWalletError(error)).toBe(true);
    });

    it('returns true for serialized RPC error with hardware wallet cause', () => {
      const error = {
        code: -32603,
        data: {
          cause: {
            name: 'HardwareWalletError',
            message: 'serialized',
            code: ErrorCode.DeviceDisconnected,
            stack: 'trace',
          },
        },
      };

      expect(isHardwareWalletError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Some error');

      expect(isHardwareWalletError(error)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isHardwareWalletError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isHardwareWalletError(undefined)).toBe(false);
    });

    it('returns false for string', () => {
      expect(isHardwareWalletError('some error')).toBe(false);
    });

    it('returns false for JsonRpcError without HardwareWalletError data', () => {
      const error = new JsonRpcError(1234, 'Some error', {
        someOtherField: 'value',
      });

      expect(isHardwareWalletError(error)).toBe(false);
    });

    it('returns false for plain object without HW error indicators', () => {
      const error = {
        message: 'some error',
        code: 500,
      };

      expect(isHardwareWalletError(error)).toBe(false);
    });
  });

  describe('isUserRejectedHardwareWalletError', () => {
    it('returns true for UserRejected error code', () => {
      const error = new HardwareWalletError('User rejected', {
        code: ErrorCode.UserRejected,
        severity: Severity.Warning,
        category: Category.UserAction,
        userMessage: 'User rejected the transaction',
      });

      expect(isUserRejectedHardwareWalletError(error)).toBe(true);
    });

    it('returns true for UserCancelled error code', () => {
      const error = new HardwareWalletError('User cancelled', {
        code: ErrorCode.UserCancelled,
        severity: Severity.Warning,
        category: Category.UserAction,
        userMessage: 'User cancelled the transaction',
      });

      expect(isUserRejectedHardwareWalletError(error)).toBe(true);
    });

    it('returns false for non-rejection hardware wallet error', () => {
      const error = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Device disconnected',
      });

      expect(isUserRejectedHardwareWalletError(error)).toBe(false);
    });

    it('returns false for non-hardware wallet error', () => {
      const error = new Error('Some random error');

      expect(isUserRejectedHardwareWalletError(error)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isUserRejectedHardwareWalletError(null)).toBe(false);
    });

    it('returns true for JsonRpcError with UserRejected code', () => {
      const error = new JsonRpcError(1234, 'User rejected', {
        code: ErrorCode.UserRejected,
        severity: Severity.Warning,
        category: Category.UserAction,
        userMessage: 'User rejected',
      });

      expect(isUserRejectedHardwareWalletError(error)).toBe(true);
    });

    it('returns true for EIP-1193 userRejectedRequest code', () => {
      const error = {
        code: 4001,
        message: 'User rejected the request.',
      };

      expect(isUserRejectedHardwareWalletError(error)).toBe(true);
    });

    it('treats plain Trezor code strings as hardware wallet rejections', () => {
      const error = {
        code: 'Method_Cancel',
        message: 'Canceled',
      };

      expect(isUserRejectedHardwareWalletError(error)).toBe(true);
    });

    it('returns true for KeyringControllerError wrapping unknown hardware wallet cancellation', () => {
      const error = Object.assign(
        Object.create(KeyringControllerError.prototype),
        {
          name: 'KeyringControllerError',
          message:
            'Keyring Controller signTypedMessage: HardwareWalletError: Cancelled',
          cause: {
            name: 'HardwareWalletError',
            code: ErrorCode.Unknown,
            message: 'Cancelled',
            stack: 'HardwareWalletError [Unknown:99999]: Cancelled',
          },
        },
      );

      expect(isHardwareWalletError(error)).toBe(true);
      expect(isUserRejectedHardwareWalletError(error)).toBe(true);
    });

    it('returns false for hardware wallet errors whose numeric code collides with EIP-1193 4001', () => {
      const error = {
        name: 'HardwareWalletError',
        code: ErrorCode.ConnectionClosed,
        message: 'Connection closed',
      };

      expect(isUserRejectedHardwareWalletError(error)).toBe(false);
    });
  });

  describe('extractTrezorCodeFromMessage', () => {
    it('extracts code from "code: ErrorCode" format', () => {
      expect(
        extractTrezorCodeFromMessage(
          'TrezorError: code: Failure_AppNotInstalled',
        ),
      ).toBe('Failure_AppNotInstalled');
    });

    it('extracts code from message with surrounding text', () => {
      expect(
        extractTrezorCodeFromMessage(
          'Device error: code: Connection_ChannelDisconnected, please reconnect',
        ),
      ).toBe('Connection_ChannelDisconnected');
    });

    it('returns null when no code pattern is found', () => {
      expect(
        extractTrezorCodeFromMessage('some random error message'),
      ).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractTrezorCodeFromMessage('')).toBeNull();
    });

    it('extracts multi-segment underscore code', () => {
      expect(
        extractTrezorCodeFromMessage(
          'error code: Some_Long_Error_Code happened',
        ),
      ).toBe('Some_Long_Error_Code');
    });

    it('does not match code without underscore', () => {
      expect(extractTrezorCodeFromMessage('code: InvalidCode')).toBeNull();
    });
  });

  describe('extractMessageFromUnknownError', () => {
    it('extracts message from Error instances', () => {
      expect(extractMessageFromUnknownError(new Error('test error'))).toBe(
        'test error',
      );
    });

    it('extracts message from objects with message property', () => {
      expect(
        extractMessageFromUnknownError({ message: 'plain object error' }),
      ).toBe('plain object error');
    });

    it('returns string representation for primitives', () => {
      expect(extractMessageFromUnknownError(42)).toBe('42');
      expect(extractMessageFromUnknownError(null)).toBe('null');
      expect(extractMessageFromUnknownError(undefined)).toBe('undefined');
    });

    it('stringifies numeric message property', () => {
      expect(extractMessageFromUnknownError({ message: 123 })).toBe('123');
    });

    it('serializes plain objects without string message as JSON', () => {
      expect(extractMessageFromUnknownError({ code: 'Device_NotFound' })).toBe(
        '{"code":"Device_NotFound"}',
      );
    });
  });

  describe('hasUserRejectedMessage', () => {
    it('detects "popup closed" in message', () => {
      expect(hasUserRejectedMessage(new Error('popup closed by user'))).toBe(
        true,
      );
    });

    it('detects "user rejected" in message', () => {
      expect(
        hasUserRejectedMessage(new Error('user rejected the request')),
      ).toBe(true);
    });

    it('detects "cancelled" in message', () => {
      expect(hasUserRejectedMessage(new Error('operation cancelled'))).toBe(
        true,
      );
    });

    it('detects "canceled" (US spelling) in message', () => {
      expect(hasUserRejectedMessage(new Error('operation canceled'))).toBe(
        true,
      );
    });

    it('detects rejection text in stack trace', () => {
      const error = new Error('something went wrong');
      error.stack = 'Error: something went wrong\n    at popup closed handler';
      expect(hasUserRejectedMessage(error)).toBe(true);
    });

    it('handles non-string stack values without default object stringification', () => {
      expect(
        hasUserRejectedMessage({
          message: 'device disconnected',
          stack: { reason: 'popup closed' },
        }),
      ).toBe(true);
    });

    it('honors custom stack stringification when provided', () => {
      expect(
        hasUserRejectedMessage({
          message: 'device disconnected',
          stack: {
            toString: () => 'user rejected the request',
          },
        }),
      ).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(hasUserRejectedMessage(new Error('device disconnected'))).toBe(
        false,
      );
    });

    it('handles plain objects', () => {
      expect(hasUserRejectedMessage({ message: 'user rejected action' })).toBe(
        true,
      );
    });

    it('is case insensitive', () => {
      expect(hasUserRejectedMessage(new Error('User Rejected'))).toBe(true);
      expect(hasUserRejectedMessage(new Error('CANCELLED'))).toBe(true);
    });
  });
});
