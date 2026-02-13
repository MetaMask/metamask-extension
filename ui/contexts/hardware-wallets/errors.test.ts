import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import { getConnectionStateFromError } from './errors';
import { ConnectionStatus } from './types';

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
