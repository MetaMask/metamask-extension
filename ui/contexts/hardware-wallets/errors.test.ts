import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { parseErrorByType } from './errors';
import { HardwareWalletType } from './types';

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

  describe('pattern precedence', () => {
    it('prioritizes permission denied over generic denied patterns', () => {
      // This should match "permission.*denied" before "denied"
      const permissionError = new Error('WebHID permission denied by user');
      const result = parseErrorByType(
        permissionError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationSecurityCondition);
    });

    it('matches permission denied even with complex message', () => {
      const permissionError = new Error(
        'Failed to connect: WebHID permission denied due to security policy',
      );
      const result = parseErrorByType(
        permissionError,
        HardwareWalletType.Ledger,
      );

      expect(result.code).toBe(ErrorCode.AuthenticationSecurityCondition);
    });
  });
});
