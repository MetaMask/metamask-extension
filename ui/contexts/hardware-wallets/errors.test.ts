import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { getDeviceEventForError, parseErrorByType } from './errors';
import { DeviceEvent, HardwareWalletType } from './types';

describe('parseErrorByType', () => {
  describe('permission denied errors', () => {
    it('correctly identifies "WebHID permission denied" as AuthenticationSecurityCondition', () => {
      const permissionError = new Error('WebHID permission denied');
      const result = parseErrorByType(
        permissionError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationSecurityCondition);
    });

    it('correctly identifies "Permission denied" as AuthenticationSecurityCondition', () => {
      const permissionError = new Error('Permission denied');
      const result = parseErrorByType(
        permissionError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationSecurityCondition);
    });

    it('correctly identifies "HID permission denied" as AuthenticationSecurityCondition', () => {
      const permissionError = new Error('HID permission denied');
      const result = parseErrorByType(
        permissionError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationSecurityCondition);
    });

    it('correctly identifies "USB permission denied" as AuthenticationSecurityCondition', () => {
      const permissionError = new Error('USB permission denied');
      const result = parseErrorByType(
        permissionError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationSecurityCondition);
    });
  });

  describe('generic denied/rejected errors', () => {
    it('correctly identifies "User denied the request" as UserRejected', () => {
      const deniedError = new Error('User denied the request');
      const result = parseErrorByType(deniedError, HardwareWalletType.Ledger);

      expect(result.code).toBe(ErrorCode.UserRejected);
    });

    it('correctly identifies "Transaction rejected by user" as UserRejected', () => {
      const rejectedError = new Error('Transaction rejected by user');
      const result = parseErrorByType(rejectedError, HardwareWalletType.Ledger);

      expect(result.code).toBe(ErrorCode.UserRejected);
    });

    it('correctly identifies "Request cancelled" as UserRejected', () => {
      const cancelledError = new Error('Request cancelled');
      const result = parseErrorByType(
        cancelledError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.UserRejected);
    });
  });
});

describe('getDeviceEventForError', () => {
  it('returns DeviceLocked for AuthenticationDeviceLocked error code', () => {
    const result = getDeviceEventForError(ErrorCode.AuthenticationDeviceLocked);
    expect(result).toBe(DeviceEvent.DeviceLocked);
  });

  it('returns DeviceLocked for AuthenticationDeviceBlocked error code', () => {
    const result = getDeviceEventForError(
      ErrorCode.AuthenticationDeviceBlocked,
    );
    expect(result).toBe(DeviceEvent.DeviceLocked);
  });

  it('returns AppNotOpen for DeviceStateEthAppClosed error code', () => {
    const result = getDeviceEventForError(ErrorCode.DeviceStateEthAppClosed);
    expect(result).toBe(DeviceEvent.AppNotOpen);
  });

  it('returns Disconnected for DeviceDisconnected error code', () => {
    const result = getDeviceEventForError(ErrorCode.DeviceDisconnected);
    expect(result).toBe(DeviceEvent.Disconnected);
  });

  it('returns Disconnected for ConnectionClosed error code', () => {
    const result = getDeviceEventForError(ErrorCode.ConnectionClosed);
    expect(result).toBe(DeviceEvent.Disconnected);
  });

  it('returns OperationTimeout for ConnectionTimeout error code', () => {
    const result = getDeviceEventForError(ErrorCode.ConnectionTimeout);
    expect(result).toBe(DeviceEvent.OperationTimeout);
  });

  it('returns ConnectionFailed for ConnectionTransportMissing error code', () => {
    const result = getDeviceEventForError(ErrorCode.ConnectionTransportMissing);
    expect(result).toBe(DeviceEvent.ConnectionFailed);
  });

  it('returns default ConnectionFailed for unknown error codes', () => {
    const result = getDeviceEventForError(ErrorCode.Unknown);
    expect(result).toBe(DeviceEvent.ConnectionFailed);
  });

  it('returns custom default event when provided for unknown error codes', () => {
    const result = getDeviceEventForError(
      ErrorCode.Unknown,
      DeviceEvent.Disconnected,
    );
    expect(result).toBe(DeviceEvent.Disconnected);
  });

  it('ignores custom default for known error codes', () => {
    const result = getDeviceEventForError(
      ErrorCode.AuthenticationDeviceLocked,
      DeviceEvent.Disconnected,
    );
    expect(result).toBe(DeviceEvent.DeviceLocked);
  });
});
